import React from 'react';
import { CircularProgress } from './CircularProgress';

interface FloatingRestTimerProps {
  isActive: boolean;
  timeLeft: number;
  totalDuration: number;
  onSkip: () => void;
}

const formatSecondsToMMSS = (totalSeconds: number): string => {
    if (totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
        return '0:00';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const FloatingRestTimer: React.FC<FloatingRestTimerProps> = ({ isActive, timeLeft, totalDuration, onSkip }) => {
  if (!isActive) {
    return null;
  }

  const effectiveTotalDuration = Math.max(Number(totalDuration) || 0, timeLeft, 1);
  const percentage = Math.min(100, Math.max(0, ((effectiveTotalDuration - timeLeft) / effectiveTotalDuration) * 100));

  return (
    <div className="fixed bottom-6 right-6 max-sm:bottom-4 max-sm:right-4 z-50 animate-fade-in-up pointer-events-auto select-none">
      <div className="bg-slate-800/90 backdrop-blur-md border-2 border-cyan-500/60 rounded-2xl shadow-2xl p-4 flex flex-col items-center justify-center text-center w-48 shadow-cyan-500/20">
        <p className="text-sm font-bold text-cyan-400 mb-2">Siguiente Ejercicio</p>
        <div className="relative">
          <CircularProgress percentage={percentage} size={80} strokeWidth={8} color="#22d3ee" trailColor="rgba(255, 255, 255, 0.1)" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-2xl font-mono font-bold text-white">
              {formatSecondsToMMSS(timeLeft)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 text-xs text-slate-400 hover:text-white transition-colors bg-slate-700/60 hover:bg-slate-700 px-3 py-1.5 rounded-full font-medium"
        >
          Omitir Descanso
        </button>
      </div>
    </div>
  );
};
