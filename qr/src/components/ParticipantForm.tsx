import React, { useState } from 'react';
import { User, Phone, QrCode, Play, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

interface ParticipantFormProps {
  initialQrCode?: string;
  isSpinning: boolean;
  onSubmit: (formData: { firstName: string; lastName: string; phone: string; qrCodeId?: string }) => void;
  serverError?: string | null;
}

export const ParticipantForm: React.FC<ParticipantFormProps> = ({
  initialQrCode,
  isSpinning,
  onSubmit,
  serverError,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [qrCodeId, setQrCodeId] = useState(initialQrCode || '');
  const [localError, setLocalError] = useState<string | null>(null);

  // Auto-format phone input while typing
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setPhone(val);
    if (localError) setLocalError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirst) {
      setLocalError('Iltimos, ismingizni kiriting.');
      return;
    }
    if (!cleanLast) {
      setLocalError('Iltimos, familiyangizni kiriting.');
      return;
    }
    if (!cleanPhone) {
      setLocalError('Iltimos, telefon raqamingizni kiriting.');
      return;
    }

    // Basic digits check
    const digits = cleanPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      setLocalError('Telefon raqami kamida 9 ta raqamdan iborat bo‘lishi kerak (masalan: 90 123 45 67).');
      return;
    }

    onSubmit({
      firstName: cleanFirst,
      lastName: cleanLast,
      phone: cleanPhone,
      qrCodeId: qrCodeId ? qrCodeId.trim().toUpperCase() : undefined,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#0C142B]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-blue-950/40 relative overflow-hidden">
      {/* Decorative top gold hairline */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      {/* QR Banner if present */}
      {initialQrCode ? (
        <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300 text-xs">
          <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-emerald-200">Mahsulot QR-kodi tasdiqlandi:</span>{' '}
            <span className="font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-100 font-bold">
              #{initialQrCode}
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center gap-2.5 text-blue-200 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Telegram kanal / Umumiy havola orqali ishtirok etmoqdasiz.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* First Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ismingiz <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={isSpinning}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alisher"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors disabled:opacity-50"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Familiyangiz <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={isSpinning}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Usmonov"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors disabled:opacity-50"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Telefon raqamingiz <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              disabled={isSpinning}
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+998 90 123 45 67"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors disabled:opacity-50 font-medium"
            />
            <Phone className="w-4 h-4 text-amber-400/80 absolute left-3 top-2.5" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Faqat administrator ro‘yxatiga kiritilgan raqamlar qatnasha oladi.
          </p>
        </div>

        {/* Optional Manual Product QR input if not in URL */}
        {!initialQrCode && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Mahsulot QR-kodi (agar mavjud bo‘lsa)
              </label>
              <span className="text-[10px] text-slate-400">Ixtiyoriy</span>
            </div>
            <div className="relative">
              <input
                type="text"
                disabled={isSpinning}
                value={qrCodeId}
                onChange={(e) => setQrCodeId(e.target.value)}
                placeholder="PROD-XXXX-YYYY"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/60 border border-slate-700/60 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors disabled:opacity-50"
              />
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        )}

        {/* Local Validation Error */}
        {localError && (
          <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {/* Spin Submit Button */}
        <button
          type="submit"
          disabled={isSpinning}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${
            isSpinning
              ? 'bg-amber-600/40 text-amber-200/60 cursor-not-allowed border border-amber-500/20'
              : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 hover:brightness-110 active:scale-[0.98] shadow-amber-500/25 border border-amber-300'
          }`}
        >
          {isSpinning ? (
            <>
              <div className="w-4 h-4 border-2 border-amber-950 border-t-transparent rounded-full animate-spin" />
              <span>Baraban aylanmoqda...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-amber-950" />
              <span>Barabanni Aylantirish</span>
            </>
          )}
        </button>

        {/* Security Rule Note */}
        <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400/70" />
          <span>Har bir telefon raqami butun tizimda faqat 1 marta yutishi mumkin</span>
        </div>
      </form>
    </div>
  );
};
