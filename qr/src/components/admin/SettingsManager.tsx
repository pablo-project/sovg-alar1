import React, { useState, useEffect } from 'react';
import {
  Save,
  Key,
  Flame,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Server,
  Globe,
  DollarSign,
  ShieldCheck,
  Send,
  Phone,
} from 'lucide-react';

interface SettingsManagerProps {
  token: string;
  onRefreshStats: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ token, onRefreshStats }) => {
  const [telegramChannelUrl, setTelegramChannelUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [operatorPhone, setOperatorPhone] = useState('');
  const [operatorTelegram, setOperatorTelegram] = useState('');
  const [isGameActive, setIsGameActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [defaultGlobalPrizeId, setDefaultGlobalPrizeId] = useState('');
  const [prizesList, setPrizesList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTelegramChannelUrl(data.telegramChannelUrl || '');
        setBrandName(data.brandName || '');
        setOperatorPhone(data.operatorPhone || '');
        setOperatorTelegram(data.operatorTelegram || '');
        setIsGameActive(data.isGameActive ?? true);
        setDefaultGlobalPrizeId(data.defaultGlobalPrizeId || '');
      }

      // Fetch prizes for dropdown
      const pRes = await fetch('/api/admin/prizes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setPrizesList(pData.filter((p: any) => p.isActive));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telegramChannelUrl,
          brandName,
          operatorPhone,
          operatorTelegram,
          isGameActive,
          defaultGlobalPrizeId,
          newPassword: newPassword.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Xatolik yuz berdi');
      }

      setSaveSuccess(true);
      setNewPassword('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWinners = async () => {
    if (
      !confirm(
        'Diqqat! Sinov yutuqlari tozalanadi va barcha sovg‘alar zaxirasi boshlang‘ich holatiga qaytariladi. Davom etasizmi?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: 'clear_winners' }),
      });
      if (res.ok) {
        alert('Sinov yutuqlari tozalandi va zaxira qayta tiklandi!');
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white font-serif">
          Tizim Sozlamalari va Joylashtirish Qo‘llanmasi
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Aksiya parametrlari, kontaktlar, parollar va Firebase/server qo‘llanmasi.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-2 text-emerald-200 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-[#0C142B] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white font-serif border-b border-slate-800 pb-2">
          Asosiy Tizim Parametrlari
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Brend / Kompaniya Nomi
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Telegram Kanal Havolasi
            </label>
            <div className="relative">
              <input
                type="text"
                value={telegramChannelUrl}
                onChange={(e) => setTelegramChannelUrl(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
              <Send className="w-3.5 h-3.5 text-blue-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operator Telefon Raqami (Qo‘llab-quvvatlash)
            </label>
            <div className="relative">
              <input
                type="text"
                value={operatorPhone}
                onChange={(e) => setOperatorPhone(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
              <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operator Telegram Foydalanuvchi Nomi
            </label>
            <div className="relative">
              <input
                type="text"
                value={operatorTelegram}
                onChange={(e) => setOperatorTelegram(e.target.value)}
                placeholder="@operator_nomi"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
              <Send className="w-3.5 h-3.5 text-sky-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Barcha ishtirokchilar uchun umumiy yagona sovg'a belgilash */}
        <div className="pt-3 border-t border-slate-800 bg-[#070E24] p-4 rounded-2xl border border-amber-500/20">
          <label className="block text-xs font-bold text-amber-300 mb-1">
            Barcha Ishtirokchilar Uchun Yagona Sovg‘a Belgilash (Global Rejim)
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Agar bu yerdan sovg‘a tanlasangiz, butun o‘yindagi barcha ishtirokchilarga (o‘ziga alohida sovg‘a belgilanmagan bo‘lsa) aynan shu sovg‘a aylanib tushadi!
          </p>
          <select
            value={defaultGlobalPrizeId}
            onChange={(e) => setDefaultGlobalPrizeId(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-300 font-semibold focus:outline-none"
          >
            <option value="">🎲 O‘chirilgan (Har bir kishiga o‘ziga belgilangan yoki tasodifiy sovg‘a)</option>
            {prizesList.map((p) => (
              <option key={p.id} value={p.id}>
                🎁 Barchaga FAQAT: {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Change Admin Password */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Yangi Administrator Parolini O‘rnatish (Ixtiyoriy)
          </label>
          <div className="relative max-w-sm">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="O‘zgartirmaslik uchun bo‘sh qoldiring"
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <Key className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Toggle Game Active */}
        <div className="pt-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="isGameActive"
            checked={isGameActive}
            onChange={(e) => setIsGameActive(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
          />
          <label htmlFor="isGameActive" className="text-xs font-semibold text-white cursor-pointer">
            Sovg‘alar o‘yini faol holatda (Aksiya ochiq)
          </label>
        </div>

        <div className="pt-3 flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saqlanmoqda...' : 'Sozlamalarni Saqlash'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset test data */}
      <div className="bg-[#0C142B] border border-red-950 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-red-300 font-serif flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>Sinov Yutuqlarini Tozalash (Test Reset)</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Agar sinov paytida g‘oliblar yozilgan bo‘lsa va haqiqiy aksiya oldidan sovg‘alar zaxirasini boshlang‘ich soniga qaytarmoqchi bo‘lsangiz, ushbu tugmani bosing. Ruxsat berilgan raqamlar o‘chmaydi, faqat ularning "Yutgan" holati bekor bo‘ladi.
        </p>
        <button
          type="button"
          onClick={handleResetWinners}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/50 hover:bg-red-800/80 text-red-200 border border-red-700/50 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sinov Yutuqlarini Tozalash va Zaxirani Qaytarish</span>
        </button>
      </div>

      {/* PRODUCTION & FIREBASE INTEGRATION GUIDE */}
      <div className="bg-[#0C142B] border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base border-b border-slate-800 pb-3">
          <Flame className="w-5 h-5 text-amber-400" />
          <span>Firebase va Serverni Sozlash Bo‘yicha To‘liq Qo‘llanma</span>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <span>1. Hozirgi Tizimning Ishlash Mexanizmi</span>
            </h4>
            <p>
              Tizim to‘liq avtonom <b>Node.js / Express</b> serverida <code>withLock()</code> atomar tranzaksiyalari asosida ishlamoqda. Ma’lumotlar serverdagi <code>data/db.json</code> faylida saqlanadi. Har bir so‘rov kelganda server xotiradagi tranzaksiya navbati (mutex) orqali tekshiradi: bir telefon raqami bir vaqtning o‘zida 10 ta parallel so‘rov yuborsa ham faqat 1 tasi yutadi, qolganlari rad etiladi. Sahifani yangilash orqali qayta yutib bo‘lmaydi.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>2. Cloud Firestore (Firebase) ga Ulash Tartibi</span>
            </h4>
            <p className="mb-2">
              Agar ma’lumotlarni to‘g‘ridan-to‘g‘ri Google Cloud Firestore bazasida saqlashni xohlasangiz:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>
                <span className="text-white">console.firebase.google.com</span> saytiga kiring va yangi loyiha yarating (masalan: <code>omadli-sovgala</code>).
              </li>
              <li>
                <b>Build → Firestore Database</b> bo‘limiga o‘tib, "Create database" tugmasini bosing.
              </li>
              <li>
                Firestore kolleksiyalarini yarating:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-amber-300/90 font-mono">
                  <li><code>allowed_phones</code> — Ruxsat etilgan raqamlar (doc ID: telefon raqami)</li>
                  <li><code>product_qrs</code> — Mahsulot QR-kodlari (doc ID: kod)</li>
                  <li><code>prizes</code> — Sovg‘alar zaxirasi</li>
                  <li><code>winners</code> — G‘oliblar va chiptalar</li>
                  <li><code>settings</code> — Tizim sozlamalari</li>
                </ul>
              </li>
              <li>
                <b>Project Settings → Service Accounts</b> bo‘limidan <code>firebase-admin-sdk.json</code> kalitini yuklab oling va server muhitiga qo‘shing.
              </li>
            </ol>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>3. Xavfsizlik Qoidalari (Firestore Security Rules)</span>
            </h4>
            <p className="mb-2">
              Barcha muhim operatsiyalar (spin va yutuqni yozish) faqat backend server orqali bajarilishi shart. Mijozlar to‘g‘ridan-to‘g‘ri bazani o‘zgartira olmasligi uchun Firebase Rules quyidagicha o‘rnatiladi:
            </p>
            <pre className="p-3 bg-black/60 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Faqat o'qish mumkin bo'lgan sovg'alar vitrinasi
    match /prizes/{prizeId} {
      allow read: if true;
      allow write: if false; // Faqat Server Admin yozadi
    }
    // Ruxsat etilgan raqamlar va g'oliblar butunlay maxfiy
    match /allowed_phones/{phoneId} {
      allow read, write: if false; // Faqat Server API orqali
    }
    match /product_qrs/{qrId} {
      allow read, write: if false; // Faqat Server API orqali
    }
    match /winners/{winnerId} {
      allow read, write: if false; // Faqat Server API orqali
    }
  }
}`}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>4. Bepul Tariflar va Limitlar (Pricing & Quotas)</span>
            </h4>
            <ul className="space-y-1 text-slate-400">
              <li>
                <b>Firebase Spark Plan:</b> Butunlay 100% BEPUL (Kuniga 50,000 ta o‘qish, 20,000 ta yozish bepul). Kichik va o‘rta aksiyalar uchun bu limit mutlaqo yetarli.
              </li>
              <li>
                <b>Server Joylashtirish:</b> Google Cloud Run, Render.com yoki Railway bepul yoki oyiga ~$5 gacha arzon server taqdim etadi.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
