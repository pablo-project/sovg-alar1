import React, { useState } from 'react';
import { User, Phone, Sparkles, AlertCircle, ArrowRight, PhoneCall } from 'lucide-react';

interface ParticipantEntryStepProps {
  initialQrCode?: string;
  onSuccess: (data: { firstName: string; lastName: string; phone: string; qrCodeId?: string }) => void;
  brandName?: string;
}

export const ParticipantEntryStep: React.FC<ParticipantEntryStepProps> = ({
  initialQrCode,
  onSuccess,
  brandName = 'Omadli Sovg‘a',
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNotWhitelisted, setIsNotWhitelisted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsNotWhitelisted(false);

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirst) {
      setErrorMsg('Iltimos, ismingizni kiriting.');
      return;
    }
    if (!cleanLast) {
      setErrorMsg('Iltimos, familiyangizni kiriting.');
      return;
    }
    if (!cleanPhone) {
      setErrorMsg('Iltimos, telefon raqamingizni kiriting.');
      return;
    }

    const digits = cleanPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      setErrorMsg('Telefon raqami kamida 9 ta raqamdan iborat bo‘lishi kerak (masalan: 90 123 45 67).');
      return;
    }

    setLoading(true);
    try {
      // Pre-check phone on server
      const res = await fetch('/api/check-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          qrCodeId: initialQrCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const text = data.message || data.error || 'Xatolik yuz berdi.';
        if (data.code === 'NOT_WHITELISTED' || text.includes('ro‘yxatda mavjud emas')) {
          setIsNotWhitelisted(true);
          setErrorMsg('Sizning raqamingiz o‘yinda qatnashish uchun ro‘yxatda mavjud emas. Iltimos, operatorga murojaat qiling.');
        } else {
          setErrorMsg(text);
        }
        return;
      }

      // Eligible: proceed directly to step 2 (wheel spin) without re-entering info!
      onSuccess({
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: data.normalizedPhone || cleanPhone,
        qrCodeId: initialQrCode,
      });
    } catch (err) {
      setErrorMsg('Tarmoqda xatolik yuz berdi. Iltimos, internet aloqasini tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Brand Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>RASMIY YUTUQLI AKSIYA</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 font-serif tracking-tight">
          {brandName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-sm mx-auto">
          O‘yinda qatnashish uchun ma’lumotlaringizni kiriting va omadingizni sinab ko‘ring!
        </p>
      </div>

      {/* Main Entry Card */}
      <div className="w-full bg-[#0C142B]/95 backdrop-blur-2xl border border-amber-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* QR Indicator if scanned */}
        {initialQrCode && (
          <div className="mb-5 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <span className="font-medium">Mahsulot QR-kodi:</span>
            <span className="font-mono font-bold bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-100">
              #{initialQrCode}
            </span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMsg}</span>
            </div>

            {/* If not in whitelist, show prominent direct call button */}
            {isNotWhitelisted && (
              <div className="pt-2 border-t border-red-800/60 flex items-center justify-between">
                <span className="text-[11px] text-red-300">Operator bilan bog‘lanish:</span>
                <a
                  href="tel:+998959090875"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>+998 95 909 08 75</span>
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Ismingiz <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={loading}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ismingizni kiriting"
                className="w-full pl-10 pr-3 py-3 text-sm bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Familiyangiz <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={loading}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Familiyangizni kiriting"
                className="w-full pl-10 pr-3 py-3 text-sm bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Telefon raqamingiz <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                disabled={loading}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full pl-10 pr-3 py-3 text-sm bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors font-medium"
              />
              <Phone className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Start Game Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 active:scale-[0.98] text-amber-950 font-bold text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 border border-amber-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-950 border-t-transparent rounded-full animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <span>O‘yinni boshlash</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
