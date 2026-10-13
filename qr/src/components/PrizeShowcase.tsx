import React from 'react';
import { Prize } from '../types/index.js';
import { PrizeIcon } from './PrizeIcon.js';
import { Gift } from 'lucide-react';

interface PrizeShowcaseProps {
  prizes: Prize[];
}

export const PrizeShowcase: React.FC<PrizeShowcaseProps> = ({ prizes }) => {
  const activePrizes = prizes.filter((p) => p.isActive);

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
          <Gift className="w-3.5 h-3.5" />
          <span>YUTUQLAR RO‘YXATI</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
          Sizni Kutayotgan Qimmatbaho Sovg‘alar
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          Har bir sovg‘aning soni cheklangan bo‘lib, barabanda faqat mavjud sovg‘alar o‘ynaladi.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {activePrizes.map((prize) => {
          const isOutOfStock = prize.remainingCount <= 0;
          return (
            <div
              key={prize.id}
              className={`relative rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between ${
                isOutOfStock
                  ? 'bg-slate-900/40 border-slate-800 opacity-60'
                  : 'bg-[#0B1226]/80 hover:bg-[#0E1730] border-amber-500/20 hover:border-amber-400/50 shadow-lg hover:shadow-amber-500/10'
              }`}
            >
              <div>
                <div
                  className="w-11 h-11 rounded-xl mb-3 flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: isOutOfStock ? '#1E293B' : `${prize.color}25`,
                    color: isOutOfStock ? '#94A3B8' : prize.color || '#F59E0B',
                    border: `1px solid ${isOutOfStock ? '#334155' : `${prize.color}40`}`,
                  }}
                >
                  <PrizeIcon name={prize.icon} className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1 line-clamp-1">
                  {prize.name}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                  {prize.description || 'Haqiqiy sovrin'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Qoldi:</span>
                <span
                  className={`font-bold ${
                    isOutOfStock ? 'text-red-400' : 'text-amber-300'
                  }`}
                >
                  {isOutOfStock ? 'Tugagan' : `${prize.remainingCount} dona`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
