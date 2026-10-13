import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PhoneCall, Sparkles, CheckCircle, Ticket } from 'lucide-react';
import { PrizeIcon } from './PrizeIcon.js';

interface WinnerCelebrationStepProps {
  participantName: string;
  phone: string;
  prizeName: string;
  prizeIcon?: string;
  ticketId: string;
  timestamp: string;
}

export const WinnerCelebrationStep: React.FC<WinnerCelebrationStepProps> = ({
  participantName,
  phone,
  prizeName,
  prizeIcon,
  ticketId,
  timestamp,
}) => {
  // Fire festive confetti cannon on page load
  useEffect(() => {
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ['#D4AF37', '#F59E0B', '#1E3A8A', '#38BDF8', '#FFFFFF'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ['#D4AF37', '#F59E0B', '#1E3A8A', '#38BDF8', '#FFFFFF'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto py-4 sm:py-8 px-4 flex flex-col items-center text-center animate-fadeIn">
      {/* Festive Trophy Badge */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-1 mb-5 shadow-2xl shadow-amber-500/40">
        <div className="w-full h-full bg-[#0B132B] rounded-full flex items-center justify-center text-amber-400">
          <PrizeIcon name={prizeIcon || 'gift'} className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" />
        </div>
      </div>

      {/* Main Required Greeting Headlines */}
      <h2 className="text-2xl sm:text-3xl font-black text-amber-300 font-serif mb-2">
        🎉 TABRIKLAYMIZ, {participantName.toUpperCase()}!
      </h2>

      <p className="text-base sm:text-lg font-bold text-white mb-6">
        Siz sovg‘a yutib oldingiz!
      </p>

      {/* Prize Announcement Card */}
      <div className="w-full bg-[#0C142B]/95 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>RASMIY TASDIQLANGAN YUTUQ</span>
        </div>

        <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-1">
          🎁 Sizning sovg‘angiz:
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 font-serif mb-4">
          {prizeName}
        </div>

        {/* Ticket Reference */}
        <div className="bg-[#070B19] rounded-2xl p-3 border border-amber-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>Yutuq kodi:</span>
          </div>
          <span className="font-mono font-bold text-amber-300 text-sm">{ticketId}</span>
        </div>
      </div>

      {/* Claim Instruction */}
      <p className="text-xs sm:text-sm text-slate-300 mb-5 max-w-md font-medium">
        Sovg‘angizni olish uchun operatorimiz bilan bog‘laning.
      </p>

      {/* Prominent "Sovg‘ani olish" Button linking to tel:+998959090875 */}
      <a
        href="tel:+998959090875"
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-base uppercase tracking-wider shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition-all mb-4"
      >
        <PhoneCall className="w-5 h-5 text-slate-950 shrink-0" />
        <span>Sovg‘ani olish (+998 95 909 08 75)</span>
      </a>

      {/* Clear instruction text */}
      <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-left text-xs text-blue-200 space-y-1.5 w-full">
        <div className="font-bold flex items-center gap-1.5 text-blue-300">
          <CheckCircle className="w-4 h-4" /> Yutuqni rasmiylashtirish tartibi:
        </div>
        <p className="text-slate-300 leading-relaxed">
          Tugmani bosib operatorga qo‘ng‘iroq qiling va o‘zingizning telefon raqamingiz hamda yutuq kodi (<b>{ticketId}</b>)ni ayting. Sovg‘a tez orada sizga yetkazib beriladi!
        </p>
      </div>
    </div>
  );
};
