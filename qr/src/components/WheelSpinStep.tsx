import React, { useState } from 'react';
import { FortuneWheel } from './FortuneWheel.js';
import { Play, AlertCircle } from 'lucide-react';

interface WheelSpinStepProps {
  participantData: {
    firstName: string;
    lastName: string;
    phone: string;
    qrCodeId?: string;
  };
  totalSegments?: number;
  onSpinSuccess: (result: {
    winningPrize: { name: string; description?: string; icon?: string };
    ticketId: string;
    timestamp: string;
  }) => void;
}

export const WheelSpinStep: React.FC<WheelSpinStepProps> = ({
  participantData,
  totalSegments = 8,
  onSpinSuccess,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPrizeIndex, setTargetPrizeIndex] = useState<number | null>(null);
  const [pendingSpinResult, setPendingSpinResult] = useState<any | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);

  // Trigger spin on server first
  const handleStartSpin = async () => {
    if (isSpinning) return;
    setSpinError(null);

    try {
      // 1. Call atomic server spin API
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantData),
      });

      const data = await res.json();

      if (!res.ok) {
        setSpinError(data.error || data.message || 'Xatolik yuz berdi.');
        return;
      }

      // Server successfully determined the winning prize and recorded in database!
      setPendingSpinResult(data);
      setTargetPrizeIndex(data.prizeIndex);
      setIsSpinning(true);
    } catch (err) {
      setSpinError('Tarmoqda xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.');
    }
  };

  const handleAnimationEnd = () => {
    setIsSpinning(false);
    if (pendingSpinResult) {
      onSpinSuccess({
        winningPrize: pendingSpinResult.winningPrize,
        ticketId: pendingSpinResult.ticketId,
        timestamp: pendingSpinResult.timestamp,
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-2 sm:py-6">
      {/* Error if spin fails */}
      {spinError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 max-w-md w-full">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{spinError}</span>
        </div>
      )}

      {/* Center Fortune Wheel */}
      <div className="my-2 sm:my-4">
        <FortuneWheel
          segmentsCount={totalSegments}
          isSpinning={isSpinning}
          targetPrizeIndex={targetPrizeIndex}
          onSpinEnd={handleAnimationEnd}
        />
      </div>

      {/* ONLY "Barabanni aylantirish" Button */}
      <div className="w-full max-w-sm mt-4 sm:mt-6 px-4">
        <button
          onClick={handleStartSpin}
          disabled={isSpinning}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl ${
            isSpinning
              ? 'bg-amber-600/30 text-amber-300/50 cursor-not-allowed border border-amber-500/20'
              : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 hover:brightness-110 active:scale-[0.98] shadow-amber-500/30 border border-amber-300'
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
              <span>Barabanni aylantirish</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
