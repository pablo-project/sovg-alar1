import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Prize, AllowedPhone, ProductQR, Winner, SystemSettings, DashboardStats } from '../src/types/index.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  settings: SystemSettings;
  prizes: Prize[];
  allowedPhones: AllowedPhone[];
  productQrs: ProductQR[];
  winners: Winner[];
}

// In-memory mutex for safe atomic transactions
let lockPromise = Promise.resolve();

export async function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const currentLock = lockPromise;
  lockPromise = nextLock;

  await currentLock;
  try {
    return await fn();
  } finally {
    release!();
  }
}

export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove spaces, dashes, parentheses
  let digits = rawPhone.replace(/\D/g, '');
  
  // If starts with 8 and length 10 or 11 in CIS
  if (digits.startsWith('8') && digits.length === 10) {
    digits = '998' + digits.slice(1);
  }
  
  // If 9 digits (standard Uzbek mobile: 901234567)
  if (digits.length === 9) {
    digits = '998' + digits;
  }
  
  // If starts with 998 and 12 digits
  if (digits.startsWith('998') && digits.length === 12) {
    return '+' + digits;
  }
  
  // For other international formats
  return '+' + digits;
}

const defaultInitialData: DatabaseSchema = {
  settings: {
    adminPasswordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
    telegramChannelUrl: 'https://t.me/omadli_sovgala_official',
    brandName: 'Omadli Sovg‘a',
    operatorPhone: '+998 95 909 08 75',
    operatorTelegram: '@omadli_operator',
    isGameActive: true,
  },
  prizes: [
    {
      id: 'prize-1',
      name: 'iPhone 16 Pro (128GB)',
      description: 'Eng so‘nggi avlod smartfoni',
      icon: 'smartphone',
      color: '#D4AF37', // Gold
      totalCount: 3,
      wonCount: 0,
      remainingCount: 3,
      probabilityWeight: 5,
      isActive: true,
    },
    {
      id: 'prize-2',
      name: 'Smart Watch Ultra',
      description: 'Aqlli soat va fitnes treker',
      icon: 'watch',
      color: '#1E3A8A', // Deep Blue
      totalCount: 8,
      wonCount: 0,
      remainingCount: 8,
      probabilityWeight: 15,
      isActive: true,
    },
    {
      id: 'prize-3',
      name: 'Simsiz Quloqchin (AirPods)',
      description: 'Shovqinsiz yuqori sifatli ovoz',
      icon: 'headphones',
      color: '#0284C7', // Sky Blue
      totalCount: 15,
      wonCount: 0,
      remainingCount: 15,
      probabilityWeight: 25,
      isActive: true,
    },
    {
      id: 'prize-4',
      name: 'Powerbank 20,000 mAh',
      description: 'Tezkor quvvatlash xususiyatiga ega',
      icon: 'battery-charging',
      color: '#F59E0B', // Amber
      totalCount: 20,
      wonCount: 0,
      remainingCount: 20,
      probabilityWeight: 30,
      isActive: true,
    },
    {
      id: 'prize-5',
      name: 'Brendli Termos va Krujka',
      description: 'Issiq va sovuqni 24 soat saqlovchi termos',
      icon: 'coffee',
      color: '#0F172A', // Dark Navy
      totalCount: 30,
      wonCount: 0,
      remainingCount: 30,
      probabilityWeight: 40,
      isActive: true,
    },
    {
      id: 'prize-6',
      name: '100,000 so‘m Xarid Cheki',
      description: 'Istalgan filialda xarid qilish vaucheri',
      icon: 'ticket',
      color: '#059669', // Emerald
      totalCount: 50,
      wonCount: 0,
      remainingCount: 50,
      probabilityWeight: 50,
      isActive: true,
    },
    {
      id: 'prize-7',
      name: 'Brendli Ryukzak',
      description: 'Qulay va mustahkam sayohat sumkasi',
      icon: 'backpack',
      color: '#7C3AED', // Purple
      totalCount: 25,
      wonCount: 0,
      remainingCount: 25,
      probabilityWeight: 35,
      isActive: true,
    },
    {
      id: 'prize-8',
      name: 'Brendli Futbolka va Kepka',
      description: '100% paxtadan tayyorlangan to‘plam',
      icon: 'shirt',
      color: '#EAB308', // Yellow Gold
      totalCount: 40,
      wonCount: 0,
      remainingCount: 40,
      probabilityWeight: 45,
      isActive: true,
    },
  ],
  allowedPhones: [
    {
      id: 'phone-1',
      phone: '+998901234567',
      name: 'Alisher Usmonov',
      note: 'Sinov ishtirokchisi #1',
      addedAt: new Date().toISOString(),
      hasWon: false,
    },
    {
      id: 'phone-2',
      phone: '+998912345678',
      name: 'Madina Karimova',
      note: 'Sinov ishtirokchisi #2',
      addedAt: new Date().toISOString(),
      hasWon: false,
    },
    {
      id: 'phone-3',
      phone: '+998933456789',
      name: 'Jahongir Po‘latov',
      note: 'Sinov ishtirokchisi #3',
      addedAt: new Date().toISOString(),
      hasWon: false,
    },
    {
      id: 'phone-4',
      phone: '+998977654321',
      name: 'Zulayho Rustamova',
      note: 'Sinov ishtirokchisi #4',
      addedAt: new Date().toISOString(),
      hasWon: false,
    },
    {
      id: 'phone-5',
      phone: '+998998887766',
      name: 'Bobur Mirzayev',
      note: 'Sinov ishtirokchisi #5',
      addedAt: new Date().toISOString(),
      hasWon: false,
    },
  ],
  productQrs: [
    {
      id: 'PROD-GOLD-001',
      code: 'PROD-GOLD-001',
      batchName: 'Prevyu Partiyasi 1',
      createdAt: new Date().toISOString(),
      isUsed: false,
    },
    {
      id: 'PROD-GOLD-002',
      code: 'PROD-GOLD-002',
      batchName: 'Prevyu Partiyasi 1',
      createdAt: new Date().toISOString(),
      isUsed: false,
    },
    {
      id: 'PROD-GOLD-003',
      code: 'PROD-GOLD-003',
      batchName: 'Prevyu Partiyasi 1',
      createdAt: new Date().toISOString(),
      isUsed: false,
    },
    {
      id: 'PROD-GOLD-004',
      code: 'PROD-GOLD-004',
      batchName: 'Prevyu Partiyasi 1',
      createdAt: new Date().toISOString(),
      isUsed: false,
    },
    {
      id: 'PROD-GOLD-005',
      code: 'PROD-GOLD-005',
      batchName: 'Prevyu Partiyasi 1',
      createdAt: new Date().toISOString(),
      isUsed: false,
    },
  ],
  winners: [],
};

export function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(defaultInitialData);
    return JSON.parse(JSON.stringify(defaultInitialData));
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, falling back to default:', err);
    saveDatabase(defaultInitialData);
    return JSON.parse(JSON.stringify(defaultInitialData));
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export function getStats(): DashboardStats {
  const db = getDatabase();
  const totalAllowed = db.allowedPhones.length;
  const totalWinners = db.winners.length;
  const remainingChances = db.allowedPhones.filter((p) => !p.hasWon).length;
  const totalProductQRs = db.productQrs.length;
  const usedProductQRs = db.productQrs.filter((q) => q.isUsed).length;
  const unusedProductQRs = totalProductQRs - usedProductQRs;
  const totalPrizes = db.prizes.length;
  const remainingPrizesCount = db.prizes.reduce((acc, p) => acc + (p.remainingCount || 0), 0);

  return {
    totalAllowedPhones: totalAllowed,
    totalWinners,
    remainingChances,
    totalProductQRs,
    usedProductQRs,
    unusedProductQRs,
    totalPrizes,
    remainingPrizesCount,
  };
}
