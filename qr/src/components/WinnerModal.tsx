import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle, Send, Printer, X, Sparkles } from 'lucide-react';
import { Prize } from '../types/index.js';
import { PrizeIcon } from './PrizeIcon.js';

interface WinnerModalProps {
  prize: Prize;
  ticketId: string;
  participantName: string;
  phone: string;
  timestamp: string;
  operatorTelegram?: string;
  onClose: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  prize,
  ticketId,
  participantName,
  phone,
  timestamp,
  operatorTelegram = '@omadli_operator',
  onClose,
}) => {
  // Fire festive confetti cannon on modal open
  useEffect(() => {
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#F59E0B', '#1E3A8A', '#38BDF8', '#FFFFFF'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4AF37', '#F59E0B', '#1E3A8A', '#38BDF8', '#FFFFFF'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const telegramClaimText = encodeURIComponent(
    `Assalomu alaykum! Men Omadli Sovg'a o'yinida yutdim!\n\n` +
      `🎁 Sovg'a: ${prize.name}\n` +
      `🎟 Chipta ID: ${ticketId}\n` +
      `👤 Ismim: ${participantName}\n` +
      `📞 Tel: ${phone}\n` +
      `📅 Vaqt: ${new Date(timestamp).toLocaleString('uz-UZ')}\n\n` +
      `Yutuqni olish bo'yicha ma'lumot bersangiz.`
  );

  const telegramUrl = `https://t.me/${operatorTelegram.replace('@', '')}?text=${telegramClaimText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#0F172A] to-[#070B19] border border-amber-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-1 mb-4 shadow-xl shadow-amber-500/30">
          <div className="w-full h-full bg-[#0B132B] rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TABRIKLAYMIZ! SIZ G‘OLIB BO‘LDINGIZ!</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif mb-1">
          {prize.name}
        </h2>
        <p className="text-sm text-slate-300 mb-6 font-medium">
          {prize.description || 'Siz ushbu ajoyib sovg‘ani qo‘lga kiritdingiz!'}
        </p>

        {/* Printable Certificate / Ticket Card */}
        <div className="bg-[#0A1024] border-2 border-dashed border-amber-500/40 rounded-2xl p-4 sm:p-5 mb-6 text-left relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
            <div>
              <span className="text-[10px] text-amber-400/80 uppercase tracking-widest font-bold">
                YUTUQ CHIPTASI
              </span>
              <div className="text-lg font-mono font-extrabold text-amber-300">
                {ticketId}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
              <PrizeIcon name={prize.icon} className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Ishtirokchi:</span>
              <span className="font-semibold text-white">{participantName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Telefon:</span>
              <span className="font-semibold text-white">{phone}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Sana va vaqt:</span>
              <span className="font-medium text-slate-300">
                {new Date(timestamp).toLocaleDateString('uz-UZ')}{' '}
                {new Date(timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Holat:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                <CheckCircle className="w-3 h-3" /> Tasdiqlangan
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <Send className="w-4 h-4" />
            <span>Yutuqni Olish (Telegram Operatorga Yuborish)</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Chiptani Chop Etish</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
