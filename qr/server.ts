import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import {
  getDatabase,
  saveDatabase,
  withLock,
  normalizePhone,
  getStats,
  DatabaseSchema,
} from './server/db.js';
import { Prize, AllowedPhone, ProductQR, Winner } from './src/types/index.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Secret for persistent HMAC admin tokens (survives restarts)
const ADMIN_HMAC_SECRET = 'fortune_admin_secure_signature_v2026';
const activeAdminTokens = new Set<string>();

export function generateAdminToken(): string {
  const payload = `admin:${Date.now()}`;
  const sig = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  if (activeAdminTokens.has(token)) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payloadB64, sig] = parts;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const expectedSig = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(payload).digest('hex');
    if (sig !== expectedSig) return false;
    const [user, timeStr] = payload.split(':');
    const tokenTime = parseInt(timeStr, 10);
    // Valid for 30 days
    return Date.now() - tokenTime < 30 * 24 * 3600 * 1000;
  } catch (e) {
    return false;
  }
}

// Middleware to authenticate admin requests
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Avtorizatsiyadan o‘tilmagan. Iltimos, qayta kiring.' });
  }

  const token = authHeader.split(' ')[1];
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Sessiya muddati tugagan yoki token noto‘g‘ri.' });
  }

  next();
}

// ---------------------------------------------
// PUBLIC APIS
// ---------------------------------------------

// 1. System Public Info
app.get('/api/public/info', (req: Request, res: Response) => {
  const db = getDatabase();
  const host = req.get('host') || '';
  const computedUrl =
    db.settings.customSiteUrl ||
    process.env.APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (host.includes('onrender.com') ? `https://${host}` : '') ||
    (host.includes('run.app') ? `https://${host}` : 'https://ais-pre-vckafpntoi4jnvqukk5ldl-733255150384.asia-southeast1.run.app');

  res.json({
    brandName: db.settings.brandName,
    telegramChannelUrl: db.settings.telegramChannelUrl,
    operatorPhone: db.settings.operatorPhone,
    operatorTelegram: db.settings.operatorTelegram,
    isGameActive: db.settings.isGameActive,
    publicAppUrl: computedUrl,
    customSiteUrl: db.settings.customSiteUrl || '',
    sharedAppUrl: 'https://ais-pre-vckafpntoi4jnvqukk5ldl-733255150384.asia-southeast1.run.app',
  });
});

// 2. Wheel segments configuration (names, counts, and probabilities are strictly hidden from participants)
app.get('/api/wheel-segments', (req: Request, res: Response) => {
  const db = getDatabase();
  const activePrizes = db.prizes.filter((p) => p.isActive);
  const total = activePrizes.length > 0 ? activePrizes.length : 8;
  const segments = (activePrizes.length > 0 ? activePrizes : Array.from({ length: 8 })).map((p: any, idx) => ({
    id: `seg-${idx + 1}`,
    label: `★ OMAD ★`,
    subLabel: `№ ${idx + 1}`,
    color: p?.color || (idx % 2 === 0 ? '#D4AF37' : '#1E293B'),
  }));
  res.json({
    totalSegments: total,
    segments,
  });
});

// 3. Pre-check participant eligibility
app.post('/api/check-participant', (req: Request, res: Response) => {
  const { phone, qrCodeId } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Telefon raqamini kiritish shart.' });
  }

  const normalized = normalizePhone(phone);
  const db = getDatabase();

  // Check Whitelist
  const participant = db.allowedPhones.find((p) => p.phone === normalized);
  if (!participant) {
    return res.status(403).json({
      eligible: false,
      code: 'NOT_WHITELISTED',
      message: 'Sizning raqamingiz o‘yinda qatnashish uchun ro‘yxatda mavjud emas. Iltimos, operatorga murojaat qiling.',
    });
  }

  // Check if phone has already won
  if (participant.hasWon) {
    return res.status(400).json({
      eligible: false,
      code: 'ALREADY_WON',
      message: 'Siz ushbu raqam orqali avval sovg‘a yutib olgansiz! Qayta aylantirish uchun yana mahsulotimizdan xarid qiling.',
      wonAt: participant.wonAt,
    });
  }

  // Check product QR code if provided
  if (qrCodeId) {
    const cleanQr = qrCodeId.trim().toUpperCase();
    const qrDoc = db.productQrs.find((q) => q.code.toUpperCase() === cleanQr);

    if (!qrDoc) {
      return res.status(400).json({
        eligible: false,
        code: 'QR_INVALID',
        message: 'Kiritilgan mahsulot QR-kodi tizimda topilmadi. Kodni qayta tekshiring.',
      });
    }

    if (qrDoc.isUsed) {
      return res.status(400).json({
        eligible: false,
        code: 'QR_USED',
        message: 'Ushbu mahsulot QR-kodi avval ishlatilgan! Har bir mahsulot kodi faqat bir marta ishlatilishi mumkin.',
        usedAt: qrDoc.usedAt,
      });
    }
  }

  res.json({
    eligible: true,
    code: 'OK',
    message: 'Ishtirok etishingiz mumkin! Omad yor bo‘lsin.',
    participantName: participant.name,
    normalizedPhone: normalized,
  });
});

// 4. SPIN THE WHEEL (Atomic Transaction & Server Authoritative)
app.post('/api/spin', async (req: Request, res: Response) => {
  const { firstName, lastName, phone, qrCodeId } = req.body;

  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'Ism, familiya va telefon raqami to‘liq kiritilishi shart.' });
  }

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  const normalized = normalizePhone(phone);

  try {
    const result = await withLock(async () => {
      const db = getDatabase();

      if (!db.settings.isGameActive) {
        throw { status: 403, message: 'Sovg‘alar o‘yini vaqtincha to‘xtatilgan.' };
      }

      // 1. Verify Whitelist
      const participantIndex = db.allowedPhones.findIndex((p) => p.phone === normalized);
      if (participantIndex === -1) {
        throw {
          status: 403,
          message: 'Sizning raqamingiz o‘yinda qatnashish uchun ro‘yxatda mavjud emas. Iltimos, operatorga murojaat qiling.',
        };
      }

      const participant = db.allowedPhones[participantIndex];

      // 2. Double check if already won
      if (participant.hasWon) {
        throw {
          status: 400,
          message: 'Siz ushbu raqam orqali avval sovg‘a yutib olgansiz! Qayta aylantirish uchun yana mahsulotimizdan xarid qiling.',
        };
      }

      // Also check winners list by phone if not reactivated
      const alreadyWonInList = db.winners.some((w) => w.phone === normalized);
      if (alreadyWonInList && participant.hasWon) {
        throw {
          status: 400,
          message: 'Siz ushbu raqam orqali avval sovg‘a yutib olgansiz! Qayta aylantirish uchun yana mahsulotimizdan xarid qiling.',
        };
      }

      // 3. Verify Product QR if present
      let productQrIndex = -1;
      let cleanQr = '';
      if (qrCodeId) {
        cleanQr = qrCodeId.trim().toUpperCase();
        productQrIndex = db.productQrs.findIndex((q) => q.code.toUpperCase() === cleanQr);

        if (productQrIndex === -1) {
          throw {
            status: 400,
            message: 'Kiritilgan mahsulot QR-kodi tizimda topilmadi.',
          };
        }

        if (db.productQrs[productQrIndex].isUsed) {
          throw {
            status: 400,
            message: 'Ushbu mahsulot QR-kodi avval ishlatilgan! Har bir mahsulot kodi faqat bir marta ishlatilishi mumkin.',
          };
        }
      }

      // 4. Select Prize based on Admin Pre-assignment, Global Setting, or Stock
      const activePrizes = db.prizes.filter((p) => p.isActive);
      const availablePrizes = activePrizes.filter((p) => p.remainingCount > 0);

      if (activePrizes.length === 0) {
        throw {
          status: 400,
          message: 'Afsuski, barcha sovg‘alar tugagan. Yangi partiyani kuting!',
        };
      }

      let selectedPrize: Prize | undefined;

      // Priority 1: Check if admin assigned a specific prize to this exact participant
      if (participant.assignedPrizeId) {
        selectedPrize = activePrizes.find((p) => p.id === participant.assignedPrizeId);
      }

      // Priority 2: Check if admin set a system-wide global fixed prize for all participants
      if (!selectedPrize && db.settings.defaultGlobalPrizeId) {
        selectedPrize = activePrizes.find((p) => p.id === db.settings.defaultGlobalPrizeId);
      }

      // Priority 3: Fallback to Weighted random selection from available prizes
      if (!selectedPrize) {
        const pool = availablePrizes.length > 0 ? availablePrizes : activePrizes;
        const totalWeight = pool.reduce((sum, p) => sum + Math.max(1, p.probabilityWeight || 10), 0);
        let randomVal = Math.random() * totalWeight;
        selectedPrize = pool[0];

        for (const prize of pool) {
          const weight = Math.max(1, prize.probabilityWeight || 10);
          if (randomVal <= weight) {
            selectedPrize = prize;
            break;
          }
          randomVal -= weight;
        }
      }

      // Find original prize index in db
      const dbPrizeIndex = db.prizes.findIndex((p) => p.id === selectedPrize!.id);
      if (dbPrizeIndex === -1) {
        throw { status: 500, message: 'Sovg‘ani tanlashda kutilmagan xatolik yuz berdi.' };
      }

      // Update prize stock
      db.prizes[dbPrizeIndex].wonCount = (db.prizes[dbPrizeIndex].wonCount || 0) + 1;
      db.prizes[dbPrizeIndex].remainingCount = Math.max(0, db.prizes[dbPrizeIndex].totalCount - db.prizes[dbPrizeIndex].wonCount);

      const nowIso = new Date().toISOString();
      const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

      // Update Participant record
      db.allowedPhones[participantIndex].hasWon = true;
      db.allowedPhones[participantIndex].wonAt = nowIso;
      db.allowedPhones[participantIndex].prizeId = selectedPrize.id;
      db.allowedPhones[participantIndex].prizeName = selectedPrize.name;
      db.allowedPhones[participantIndex].source = qrCodeId ? 'product_qr' : 'telegram';
      db.allowedPhones[participantIndex].qrCodeId = qrCodeId ? cleanQr : undefined;
      if (!db.allowedPhones[participantIndex].name) {
        db.allowedPhones[participantIndex].name = `${cleanFirstName} ${cleanLastName}`;
      }

      // Update Product QR if used
      if (productQrIndex !== -1) {
        db.productQrs[productQrIndex].isUsed = true;
        db.productQrs[productQrIndex].usedAt = nowIso;
        db.productQrs[productQrIndex].usedByPhone = normalized;
        db.productQrs[productQrIndex].usedByName = `${cleanFirstName} ${cleanLastName}`;
        db.productQrs[productQrIndex].prizeName = selectedPrize.name;
      }

      // Create Winner record
      const newWinner: Winner = {
        id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ticketId,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        phone: normalized,
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.name,
        prizeIcon: selectedPrize.icon,
        timestamp: nowIso,
        source: qrCodeId ? 'product_qr' : 'telegram',
        qrCodeId: qrCodeId ? cleanQr : undefined,
        status: 'claimed',
      };

      db.winners.unshift(newWinner);

      // Save database atomically
      saveDatabase(db);

      // Return prize index in active prizes for wheel animation
      const activePrizeIndex = activePrizes.findIndex((p) => p.id === selectedPrize.id);

      return {
        success: true,
        winningPrize: selectedPrize,
        prizeIndex: activePrizeIndex >= 0 ? activePrizeIndex : 0,
        totalSegments: activePrizes.length,
        ticketId,
        timestamp: nowIso,
        participantName: `${cleanFirstName} ${cleanLastName}`,
      };
    });

    res.json(result);
  } catch (err: any) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Error during spin execution:', err);
    return res.status(500).json({ error: 'Tizimda xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.' });
  }
});

// ---------------------------------------------
// ADMIN APIS (Protected by requireAdmin)
// ---------------------------------------------

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Parolni kiritish shart.' });
  }

  const db = getDatabase();
  const inputHash = crypto.createHash('sha256').update(password.trim()).digest('hex');

  // Check password hash or default password
  if (inputHash === db.settings.adminPasswordHash || password.trim() === 'admin123') {
    const token = generateAdminToken();
    activeAdminTokens.add(token);
    return res.json({
      success: true,
      token,
      brandName: db.settings.brandName,
    });
  }

  return res.status(401).json({ error: 'Kiritilgan parol noto‘g‘ri!' });
});

// Admin Logout
app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    activeAdminTokens.delete(token);
  }
  res.json({ success: true });
});

// Admin Dashboard Stats
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  res.json(getStats());
});

// Admin - Allowed Phones List
app.get('/api/admin/phones', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const search = (req.query.search as string || '').toLowerCase().trim();
  const filter = (req.query.filter as string || 'all').toLowerCase().trim();

  let list = db.allowedPhones;

  if (filter === 'won') {
    list = list.filter((p) => p.hasWon);
  } else if (filter === 'not_won') {
    list = list.filter((p) => !p.hasWon);
  }

  if (search) {
    list = list.filter(
      (p) =>
        p.phone.toLowerCase().includes(search) ||
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.note && p.note.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

// Admin - Add Single Phone (or reactivate if customer purchased again, with optional assigned prize)
app.post('/api/admin/phones', requireAdmin, (req: Request, res: Response) => {
  const { phone, assignedPrizeId } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Telefon raqamini kiritish shart.' });
  }

  const normalized = normalizePhone(phone);
  if (normalized.length < 9) {
    return res.status(400).json({ error: 'Telefon raqami noto‘g‘ri formatda.' });
  }

  const db = getDatabase();
  let assignedPrizeName: string | undefined;
  if (assignedPrizeId) {
    const p = db.prizes.find((pr) => pr.id === assignedPrizeId);
    if (p) assignedPrizeName = p.name;
  }

  const existingIndex = db.allowedPhones.findIndex((p) => p.phone === normalized);

  // If phone exists and already won -> Reactivate for new purchase!
  if (existingIndex !== -1) {
    const existing = db.allowedPhones[existingIndex];
    if (existing.hasWon) {
      existing.hasWon = false;
      existing.wonAt = undefined;
      existing.prizeId = undefined;
      existing.prizeName = undefined;
      existing.assignedPrizeId = assignedPrizeId || undefined;
      existing.assignedPrizeName = assignedPrizeName || undefined;
      existing.note = 'Yangi mahsulot xaridi uchun qayta aktivlashtirildi';
      saveDatabase(db);
      return res.json({
        success: true,
        reactivated: true,
        message: 'Mijoz yangi mahsulot sotib olgani sababli qayta o‘ynash imkoniyati faollashtirildi!',
        record: existing,
      });
    } else {
      // If still hasn't won, update assigned prize if provided
      if (assignedPrizeId !== undefined) {
        existing.assignedPrizeId = assignedPrizeId || undefined;
        existing.assignedPrizeName = assignedPrizeName || undefined;
        saveDatabase(db);
      }
      return res.status(400).json({ error: 'Bu telefon raqami allaqachon ro‘yxatda mavjud va hali o‘ynamagan.' });
    }
  }

  const newRecord: AllowedPhone = {
    id: `phone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    phone: normalized,
    name: '',
    note: 'Mahsulot xaridi',
    assignedPrizeId: assignedPrizeId || undefined,
    assignedPrizeName: assignedPrizeName || undefined,
    addedAt: new Date().toISOString(),
    hasWon: false,
  };

  db.allowedPhones.unshift(newRecord);
  saveDatabase(db);

  res.json({ success: true, record: newRecord });
});

// Admin - Update Assigned Prize for specific phone
app.put('/api/admin/phones/:id/assigned-prize', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignedPrizeId } = req.body;
  const db = getDatabase();

  const idx = db.allowedPhones.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Raqam topilmadi.' });
  }

  if (assignedPrizeId) {
    const p = db.prizes.find((pr) => pr.id === assignedPrizeId);
    db.allowedPhones[idx].assignedPrizeId = assignedPrizeId;
    db.allowedPhones[idx].assignedPrizeName = p ? p.name : undefined;
  } else {
    db.allowedPhones[idx].assignedPrizeId = undefined;
    db.allowedPhones[idx].assignedPrizeName = undefined;
  }

  saveDatabase(db);
  res.json({ success: true, record: db.allowedPhones[idx] });
});

// Admin - Direct Reactivate Phone (+1 chance on new purchase)
app.post('/api/admin/phones/:id/reactivate', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignedPrizeId } = req.body || {};
  const db = getDatabase();

  const idx = db.allowedPhones.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Raqam topilmadi.' });
  }

  db.allowedPhones[idx].hasWon = false;
  db.allowedPhones[idx].wonAt = undefined;
  db.allowedPhones[idx].prizeId = undefined;
  db.allowedPhones[idx].prizeName = undefined;
  if (assignedPrizeId !== undefined) {
    const p = db.prizes.find((pr) => pr.id === assignedPrizeId);
    db.allowedPhones[idx].assignedPrizeId = assignedPrizeId || undefined;
    db.allowedPhones[idx].assignedPrizeName = p ? p.name : undefined;
  }
  db.allowedPhones[idx].note = 'Yangi xarid uchun faollashtirildi';

  saveDatabase(db);
  res.json({ success: true, message: 'Yangi xarid uchun qayta imkoniyat berildi!' });
});

// Admin - Bulk Upload Phones (CSV / Text / Excel Paste)
app.post('/api/admin/phones/bulk', requireAdmin, (req: Request, res: Response) => {
  const { lines, textData } = req.body;
  const rawInput: string = textData || (Array.isArray(lines) ? lines.join('\n') : '');

  if (!rawInput.trim()) {
    return res.status(400).json({ error: 'Hech qanday ma’lumot berilmadi.' });
  }

  const db = getDatabase();
  const existingPhones = new Set(db.allowedPhones.map((p) => p.phone));

  let addedCount = 0;
  let skippedCount = 0;
  const addedList: AllowedPhone[] = [];

  const rawLines = rawInput.split(/\r?\n/);

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains comma or semicolon or tab: name, phone or phone, name
    const parts = trimmed.split(/[,;\t]/).map((p) => p.trim());
    let rawPhone = '';
    let name = '';
    let note = '';

    if (parts.length >= 2) {
      // Check which part has digits
      const digits0 = parts[0].replace(/\D/g, '');
      const digits1 = parts[1].replace(/\D/g, '');

      if (digits0.length >= 9 && digits1.length < 9) {
        rawPhone = parts[0];
        name = parts[1];
        note = parts[2] || '';
      } else {
        name = parts[0];
        rawPhone = parts[1];
        note = parts[2] || '';
      }
    } else {
      rawPhone = parts[0];
    }

    const normalized = normalizePhone(rawPhone);
    if (!normalized || normalized.length < 9 || existingPhones.has(normalized)) {
      skippedCount++;
      continue;
    }

    existingPhones.add(normalized);
    const newRecord: AllowedPhone = {
      id: `phone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${addedCount}`,
      phone: normalized,
      name,
      note,
      addedAt: new Date().toISOString(),
      hasWon: false,
    };

    db.allowedPhones.push(newRecord);
    addedList.push(newRecord);
    addedCount++;
  }

  saveDatabase(db);

  res.json({
    success: true,
    addedCount,
    skippedCount,
    totalRecords: db.allowedPhones.length,
  });
});

// Admin - Delete Phone
app.delete('/api/admin/phones/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const idx = db.allowedPhones.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Raqam topilmadi.' });
  }

  db.allowedPhones.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true });
});

// Admin - Prizes List
app.get('/api/admin/prizes', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.prizes);
});

// Admin - Add Prize
app.post('/api/admin/prizes', requireAdmin, (req: Request, res: Response) => {
  const { name, description, icon, color, totalCount, probabilityWeight } = req.body;

  if (!name || totalCount === undefined) {
    return res.status(400).json({ error: 'Sovg‘a nomi va umumiy soni kiritilishi shart.' });
  }

  const db = getDatabase();
  const count = Math.max(1, parseInt(totalCount, 10));

  const newPrize: Prize = {
    id: `prize-${Date.now()}`,
    name: name.trim(),
    description: description?.trim() || '',
    icon: icon || 'gift',
    color: color || '#D4AF37',
    totalCount: count,
    wonCount: 0,
    remainingCount: count,
    probabilityWeight: Math.max(1, parseInt(probabilityWeight, 10) || 10),
    isActive: true,
  };

  db.prizes.push(newPrize);
  saveDatabase(db);
  res.json({ success: true, prize: newPrize });
});

// Admin - Update Prize
app.put('/api/admin/prizes/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, icon, color, totalCount, probabilityWeight, isActive } = req.body;

  const db = getDatabase();
  const idx = db.prizes.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Sovg‘a topilmadi.' });
  }

  const existing = db.prizes[idx];
  const newTotal = totalCount !== undefined ? Math.max(existing.wonCount, parseInt(totalCount, 10)) : existing.totalCount;

  db.prizes[idx] = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    description: description !== undefined ? description.trim() : existing.description,
    icon: icon !== undefined ? icon : existing.icon,
    color: color !== undefined ? color : existing.color,
    totalCount: newTotal,
    remainingCount: Math.max(0, newTotal - existing.wonCount),
    probabilityWeight: probabilityWeight !== undefined ? Math.max(1, parseInt(probabilityWeight, 10)) : existing.probabilityWeight,
    isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
  };

  saveDatabase(db);
  res.json({ success: true, prize: db.prizes[idx] });
});

// Admin - Delete Prize
app.delete('/api/admin/prizes/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const idx = db.prizes.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Sovg‘a topilmadi.' });
  }

  // Check if won
  if (db.prizes[idx].wonCount > 0) {
    // Instead of deleting, deactivate
    db.prizes[idx].isActive = false;
    saveDatabase(db);
    return res.json({ success: true, message: 'Sovg‘a allaqachon yutib olinganligi sababli faolsizlantirildi.' });
  }

  db.prizes.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true });
});

// Admin - Product QRs List
app.get('/api/admin/qrs', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const search = (req.query.search as string || '').toLowerCase().trim();
  const filter = (req.query.filter as string || 'all').toLowerCase().trim();

  let list = db.productQrs;

  if (filter === 'used') {
    list = list.filter((q) => q.isUsed);
  } else if (filter === 'unused') {
    list = list.filter((q) => !q.isUsed);
  }

  if (search) {
    list = list.filter(
      (q) =>
        q.code.toLowerCase().includes(search) ||
        q.batchName.toLowerCase().includes(search) ||
        (q.usedByPhone && q.usedByPhone.includes(search))
    );
  }

  res.json(list);
});

// Admin - Batch Generate Product QR codes
app.post('/api/admin/qrs/generate', requireAdmin, (req: Request, res: Response) => {
  const { count, batchName, prefix } = req.body;
  const qty = Math.min(500, Math.max(1, parseInt(count, 10) || 10));
  const batch = batchName?.trim() || `Partiya ${new Date().toLocaleDateString('uz-UZ')}`;
  const codePrefix = (prefix?.trim() || 'PROD').toUpperCase();

  const db = getDatabase();
  const existingCodes = new Set(db.productQrs.map((q) => q.code));
  const createdList: ProductQR[] = [];

  for (let i = 0; i < qty; i++) {
    let uniqueCode = '';
    let attempts = 0;
    while (!uniqueCode || existingCodes.has(uniqueCode)) {
      attempts++;
      const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
      uniqueCode = `${codePrefix}-${randomPart}`;
      if (attempts > 100) {
        uniqueCode = `${codePrefix}-${Date.now().toString(36).toUpperCase()}-${i}`;
        break;
      }
    }

    existingCodes.add(uniqueCode);
    const newQR: ProductQR = {
      id: uniqueCode,
      code: uniqueCode,
      batchName: batch,
      createdAt: new Date().toISOString(),
      isUsed: false,
    };

    db.productQrs.unshift(newQR);
    createdList.push(newQR);
  }

  saveDatabase(db);

  res.json({
    success: true,
    generatedCount: createdList.length,
    batchName: batch,
    items: createdList,
  });
});

// Admin - Delete QR code
app.delete('/api/admin/qrs/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const idx = db.productQrs.findIndex((q) => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'QR kod topilmadi.' });
  }

  db.productQrs.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true });
});

// Admin - Winners List
app.get('/api/admin/winners', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.winners);
});

// Admin - Export Winners CSV
app.get('/api/admin/export/winners', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const headers = ['Chipta ID', 'Ism', 'Familiya', 'Telefon', 'Yutgan Sovg‘a', 'Vaqti', 'Manba', 'QR Kod'];
  const rows = db.winners.map((w) => [
    w.ticketId,
    `"${w.firstName}"`,
    `"${w.lastName}"`,
    `"${w.phone}"`,
    `"${w.prizeName}"`,
    `"${new Date(w.timestamp).toLocaleString('uz-UZ')}"`,
    `"${w.source === 'product_qr' ? 'Mahsulot QR' : 'Telegram Havola'}"`,
    `"${w.qrCodeId || '-'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="goliblar_royxati.csv"');
  res.send(csvContent);
});

// Admin - Export Allowed Phones CSV
app.get('/api/admin/export/phones', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const headers = ['Telefon Raqami', 'Ism', 'Eslatma', 'Qo‘shilgan Sana', 'Yutganmi', 'Yutuq Nomi', 'Yutgan Sana'];
  const rows = db.allowedPhones.map((p) => [
    `"${p.phone}"`,
    `"${p.name || ''}"`,
    `"${p.note || ''}"`,
    `"${new Date(p.addedAt).toLocaleString('uz-UZ')}"`,
    `"${p.hasWon ? 'HA' : 'YO‘Q'}"`,
    `"${p.prizeName || '-'}"`,
    `"${p.wonAt ? new Date(p.wonAt).toLocaleString('uz-UZ') : '-'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ruxsat_etilgan_raqamlar.csv"');
  res.send(csvContent);
});

// Admin - Settings
app.get('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({
    telegramChannelUrl: db.settings.telegramChannelUrl,
    brandName: db.settings.brandName,
    operatorPhone: db.settings.operatorPhone,
    operatorTelegram: db.settings.operatorTelegram,
    isGameActive: db.settings.isGameActive,
    defaultGlobalPrizeId: db.settings.defaultGlobalPrizeId || '',
    customSiteUrl: db.settings.customSiteUrl || '',
  });
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const { telegramChannelUrl, brandName, operatorPhone, operatorTelegram, isGameActive, newPassword, defaultGlobalPrizeId, customSiteUrl } = req.body;
  const db = getDatabase();

  if (telegramChannelUrl !== undefined) db.settings.telegramChannelUrl = telegramChannelUrl.trim();
  if (brandName !== undefined) db.settings.brandName = brandName.trim();
  if (operatorPhone !== undefined) db.settings.operatorPhone = operatorPhone.trim();
  if (operatorTelegram !== undefined) db.settings.operatorTelegram = operatorTelegram.trim();
  if (isGameActive !== undefined) db.settings.isGameActive = Boolean(isGameActive);
  if (defaultGlobalPrizeId !== undefined) db.settings.defaultGlobalPrizeId = defaultGlobalPrizeId.trim() || undefined;
  if (customSiteUrl !== undefined) db.settings.customSiteUrl = customSiteUrl.trim();

  if (newPassword && newPassword.trim().length >= 4) {
    db.settings.adminPasswordHash = crypto.createHash('sha256').update(newPassword.trim()).digest('hex');
  }

  saveDatabase(db);
  res.json({ success: true, settings: db.settings });
});

// Admin - Reset / Re-seed Data
app.post('/api/admin/reset-data', requireAdmin, (req: Request, res: Response) => {
  const { mode } = req.body; // 'clear_winners' | 'full_reset'
  const db = getDatabase();

  if (mode === 'clear_winners') {
    db.winners = [];
    db.allowedPhones.forEach((p) => {
      p.hasWon = false;
      p.wonAt = undefined;
      p.prizeId = undefined;
      p.prizeName = undefined;
      p.source = undefined;
      p.qrCodeId = undefined;
    });
    db.productQrs.forEach((q) => {
      q.isUsed = false;
      q.usedAt = undefined;
      q.usedByPhone = undefined;
      q.usedByName = undefined;
      q.prizeName = undefined;
    });
    db.prizes.forEach((p) => {
      p.wonCount = 0;
      p.remainingCount = p.totalCount;
    });
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Ma’lumotlar yangilandi.' });
});

// ---------------------------------------------
// VITE DEV & PROD SERVING
// ---------------------------------------------
async function setupServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sovg'a Barabani Server is running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
