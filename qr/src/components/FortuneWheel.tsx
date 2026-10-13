import React, { useEffect, useRef, useState } from 'react';
import { playTickSound, playWinSound } from '../utils/audio.js';

interface WheelSegment {
  id: string;
  label: string;
  subLabel?: string;
  color: string;
}

interface FortuneWheelProps {
  segmentsCount?: number;
  isSpinning: boolean;
  targetPrizeIndex: number | null;
  onSpinEnd: () => void;
  disabled?: boolean;
}

export const FortuneWheel: React.FC<FortuneWheelProps> = ({
  segmentsCount = 8,
  isSpinning,
  targetPrizeIndex,
  onSpinEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickSegmentRef = useRef<number>(-1);
  const [size, setSize] = useState<number>(380);

  // Resize listener for responsive mobile-friendly canvas
  useEffect(() => {
    const handleResize = () => {
      const containerWidth = window.innerWidth;
      if (containerWidth < 380) {
        setSize(310);
      } else if (containerWidth < 640) {
        setSize(350);
      } else {
        setSize(420);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSegments = segmentsCount > 0 ? segmentsCount : 8;
  const segmentAngle = 360 / totalSegments;

  // Render Wheel on Canvas (Clean, luxury gold & navy mysterious sectors with NO prize names exposed)
  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = size;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    ctx.scale(dpr, dpr);

    const centerX = displaySize / 2;
    const centerY = displaySize / 2;
    const outerRadius = displaySize / 2 - 14;
    const innerRadius = 46;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // 1. Draw outer decorative gold ring with glowing lights
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius + 8, 0, 2 * Math.PI);
    const outerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      outerRadius - 10,
      centerX,
      centerY,
      outerRadius + 12
    );
    outerGradient.addColorStop(0, '#B45309');
    outerGradient.addColorStop(0.5, '#F59E0B');
    outerGradient.addColorStop(0.8, '#FCD34D');
    outerGradient.addColorStop(1, '#78350F');
    ctx.fillStyle = outerGradient;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
    ctx.shadowBlur = 18;
    ctx.fill();

    // Dark inset bezel
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#070B19';
    ctx.fill();
    ctx.restore();

    // 2. Draw rotating wheel segments
    ctx.save();
    ctx.translate(centerX, centerY);
    // Convert degrees to radians
    ctx.rotate((rotationAngle * Math.PI) / 180);

    const sectorColors = [
      '#101B38', // Deep Navy
      '#C2830B', // Warm Gold
      '#0B132B', // Midnight Blue
      '#B45309', // Deep Bronze
      '#172554', // Royal Navy
      '#D97706', // Radiant Amber Gold
      '#0A1128', // Rich Obsidian
      '#EAB308', // Yellow Gold
    ];

    for (let i = 0; i < totalSegments; i++) {
      const startAngle = (i * segmentAngle * Math.PI) / 180;
      const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;

      // Segment wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, outerRadius - 2, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = sectorColors[i % sectorColors.length];
      ctx.fill();

      // Golden border line between segments
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Sector Label (Mysterious lucky labels, NO specific prize names)
      ctx.save();
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      ctx.rotate(midAngle);

      const textRadius = outerRadius * 0.65;
      ctx.translate(textRadius, 0);
      ctx.rotate(Math.PI / 2);

      // Sektor naqshi
      ctx.fillStyle = '#FEF08A';
      ctx.font = `700 ${displaySize < 350 ? '11px' : '13px'} 'Cinzel', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('OMAD', 0, -4);

      // Sektor raqami
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `600 ${displaySize < 350 ? '9px' : '10px'} 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(`№ ${i + 1}`, 0, 10);

      ctx.restore();
    }

    // Outer decorative studs / glowing bulbs on the rim
    const studCount = totalSegments * 3;
    for (let s = 0; s < studCount; s++) {
      const angle = (s * (360 / studCount) * Math.PI) / 180;
      const sx = Math.cos(angle) * (outerRadius - 6);
      const sy = Math.sin(angle) * (outerRadius - 6);

      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = s % 2 === 0 ? '#FEF08A' : '#F59E0B';
      ctx.fill();
    }

    ctx.restore(); // restore wheel rotation

    // 3. Draw Center Metallic Gold Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(
      centerX - 10,
      centerY - 10,
      4,
      centerX,
      centerY,
      innerRadius
    );
    centerGrad.addColorStop(0, '#FEF08A');
    centerGrad.addColorStop(0.3, '#F59E0B');
    centerGrad.addColorStop(0.8, '#B45309');
    centerGrad.addColorStop(1, '#78350F');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Center Gold Ring
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center Emblem
    ctx.fillStyle = '#070B19';
    ctx.font = `800 ${displaySize < 350 ? '13px' : '15px'} 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OMAD', centerX, centerY - 2);

    ctx.fillStyle = '#78350F';
    ctx.font = '700 8px sans-serif';
    ctx.fillText('★ ★ ★', centerX, centerY + 13);

    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [size, totalSegments]);

  // Handle Spinning Animation (stops precisely at server-dictated targetPrizeIndex)
  useEffect(() => {
    if (!isSpinning || targetPrizeIndex === null) return;

    // Pointer is fixed at top: 12 o'clock (270 degrees in standard canvas coords)
    const pointerAngle = 270;
    const targetCenter = targetPrizeIndex * segmentAngle + segmentAngle / 2;

    const targetNormalizedRotation = (pointerAngle - targetCenter + 360) % 360;
    const startRotation = currentRotationRef.current;
    const fullSpins = 6 + Math.floor(Math.random() * 2); // 6 to 7 full revolutions
    const targetTotalRotation =
      startRotation + (360 - (startRotation % 360)) + fullSpins * 360 + targetNormalizedRotation;

    const spinDuration = 5200; // 5.2 seconds
    const startTime = performance.now();

    // Quintic ease-out for physical heavy-wheel feel
    const easeOutQuint = (t: number): number => {
      return 1 - Math.pow(1 - t, 5);
    };

    lastTickSegmentRef.current = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / spinDuration);
      const easedProgress = easeOutQuint(progress);

      const currentAngle = startRotation + (targetTotalRotation - startRotation) * easedProgress;
      currentRotationRef.current = currentAngle;

      // Realistic click sound on each segment crossing
      const currentPointerSegment =
        Math.floor(((pointerAngle - (currentAngle % 360) + 360) % 360) / segmentAngle);

      if (currentPointerSegment !== lastTickSegmentRef.current) {
        lastTickSegmentRef.current = currentPointerSegment;
        playTickSound();
      }

      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentRotationRef.current = targetTotalRotation % 360;
        drawWheel(currentRotationRef.current);
        playWinSound();
        setTimeout(() => {
          onSpinEnd();
        }, 300);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpinning, targetPrizeIndex, totalSegments]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      {/* Outer Halo Glow */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700"
        style={{
          width: `${size + 24}px`,
          height: `${size + 24}px`,
          background:
            'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(30, 58, 138, 0.18) 50%, transparent 75%)',
          filter: 'blur(12px)',
        }}
      />

      {/* Top Gold Pointer Indicator */}
      <div
        className="relative z-20 -mb-5 flex flex-col items-center pointer-events-none drop-shadow-xl"
        style={{ width: '48px' }}
      >
        <div className="w-9 h-11 relative flex items-center justify-center">
          <svg
            viewBox="0 0 40 48"
            className="w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
          >
            <defs>
              <linearGradient id="pointerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            <path
              d="M 20 46 L 5 14 C 3 9, 7 3, 20 3 C 33 3, 37 9, 35 14 Z"
              fill="url(#pointerGoldGrad)"
              stroke="#FFFBEB"
              strokeWidth="1.5"
            />
            <circle cx="20" cy="14" r="5" fill="#DC2626" stroke="#FEF08A" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Main Wheel Canvas */}
      <div
        className="relative rounded-full p-1 bg-gradient-to-b from-amber-400/40 via-amber-600/20 to-blue-900/40 shadow-2xl"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="rounded-full shadow-[inset_0_4px_16px_rgba(0,0,0,0.7)]"
        />
      </div>
    </div>
  );
};
