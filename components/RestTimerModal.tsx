import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Clock, X, SkipForward, Pause, Play, RotateCcw, Dumbbell, ChevronUp, ChevronDown } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { findExerciseByName } from '../services/exerciseCatalog';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextExerciseName: string | null;
  defaultDurationSec: number;
  onSaveDefaultDuration?: (newDurationSec: number) => void;
  onRestComplete?: () => void;
}

const MUSCLE_TRANSLATIONS: Record<string, string> = {
  cuadriceps: 'Cuádriceps',
  gluteo_mayor: 'Glúteos',
  gluteo_medio: 'Glúteos',
  gluteos: 'Glúteos',
  isquiotibiales: 'Isquios',
  gemelos: 'Gemelos',
  pantorrillas: 'Pantorrillas',
  pectoral_mayor: 'Pectorales',
  pectoral_menor: 'Pecho',
  pecho: 'Pecho',
  deltoides_anterior: 'Hombros',
  deltoides_lateral: 'Hombros',
  deltoides_posterior: 'Hombros',
  deltoides: 'Hombros',
  hombros: 'Hombros',
  triceps: 'Tríceps',
  triceps_braquial: 'Tríceps',
  biceps: 'Bíceps',
  biceps_braquial: 'Bíceps',
  dorsal_ancho: 'Espalda',
  espalda: 'Espalda',
  trapecio: 'Trapecios',
  recto_abdominal: 'Core',
  abdominales: 'Abdomen',
  oblicuos: 'Oblicuos',
  core: 'Core',
  antebrazos: 'Antebrazos',
  erectores_espinales: 'Espalda baja',
};

const formatMMSS = (totalSeconds: number): string => {
  if (totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  isOpen,
  onClose,
  nextExerciseName,
  defaultDurationSec,
  onSaveDefaultDuration,
  onRestComplete,
}) => {
  const initialDuration = Math.max(10, defaultDurationSec || 180);
  const [totalDuration, setTotalDuration] = useState<number>(initialDuration);
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [defaultSavedTime, setDefaultSavedTime] = useState<number>(initialDuration);

  const endTimeRef = useRef<number | null>(null);
  const timeLeftRef = useRef<number>(timeLeft);
  timeLeftRef.current = timeLeft;

  // Sound chime helper
  const playSoundChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 60, 180]);
      }
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }, []);

  // Sync initial duration when modal opens
  useEffect(() => {
    if (isOpen) {
      const duration = Math.max(10, defaultDurationSec || 180);
      setTotalDuration(duration);
      setTimeLeft(duration);
      setDefaultSavedTime(duration);
      setIsPaused(false);
      endTimeRef.current = Date.now() + duration * 1000;
    } else {
      endTimeRef.current = null;
    }
  }, [isOpen, defaultDurationSec]);

  // Main countdown timer loop
  useEffect(() => {
    if (!isOpen || isPaused) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeftRef.current * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const remainingMs = endTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setTimeLeft(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(interval);
        endTimeRef.current = null;
        playSoundChime();
        if (onRestComplete) {
          onRestComplete();
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, playSoundChime, onRestComplete]);

  // Derived muscle tags for next exercise
  const muscleSubtitle = useMemo(() => {
    if (!nextExerciseName) return '¡Rutina finalizada! Gran trabajo';
    const catalogItem = findExerciseByName(nextExerciseName);
    if (!catalogItem) {
      return 'Siguiente ejercicio de tu rutina';
    }
    const muscles = [
      ...(catalogItem.musculos_principales || []),
      ...(catalogItem.musculos_secundarios || []),
    ];
    const translated = muscles
      .map(m => MUSCLE_TRANSLATIONS[m.toLowerCase()] || m)
      .filter(Boolean);

    const unique = Array.from(new Set(translated)).slice(0, 3);
    return unique.length > 0 ? unique.join(' · ') : 'Fuerza · Resistencia';
  }, [nextExerciseName]);

  if (!isOpen) return null;

  // Percentage for circular progress
  const effectiveTotal = Math.max(totalDuration, 1);
  const percentage = Math.min(100, Math.max(0, (timeLeft / effectiveTotal) * 100));

  // Current minutes and seconds in target duration
  const currentMinutes = Math.floor(totalDuration / 60);
  const currentSeconds = totalDuration % 60;

  // Handlers for adjust time panel
  const handleAdjustMinutes = (delta: number) => {
    const newMinutes = Math.max(0, Math.min(30, currentMinutes + delta));
    const newTotal = newMinutes * 60 + currentSeconds;
    if (newTotal <= 0) return;
    setTotalDuration(newTotal);
    setTimeLeft(newTotal);
    if (!isPaused) {
      endTimeRef.current = Date.now() + newTotal * 1000;
    }
    if (onSaveDefaultDuration) {
      onSaveDefaultDuration(newTotal);
      setDefaultSavedTime(newTotal);
    }
  };

  const handleAdjustSeconds = (delta: number) => {
    let newSeconds = currentSeconds + delta;
    let newMinutes = currentMinutes;
    if (newSeconds >= 60) {
      newSeconds = 0;
      newMinutes = Math.min(30, newMinutes + 1);
    } else if (newSeconds < 0) {
      if (newMinutes > 0) {
        newMinutes -= 1;
        newSeconds = 50;
      } else {
        newSeconds = 0;
      }
    }
    const newTotal = Math.max(10, newMinutes * 60 + newSeconds);
    setTotalDuration(newTotal);
    setTimeLeft(newTotal);
    if (!isPaused) {
      endTimeRef.current = Date.now() + newTotal * 1000;
    }
    if (onSaveDefaultDuration) {
      onSaveDefaultDuration(newTotal);
      setDefaultSavedTime(newTotal);
    }
  };

  const handleAdd30s = () => {
    const newTotal = totalDuration + 30;
    setTotalDuration(newTotal);
    setTimeLeft(prev => prev + 30);
    if (!isPaused) {
      endTimeRef.current = (endTimeRef.current || Date.now()) + 30 * 1000;
    }
    if (onSaveDefaultDuration) {
      onSaveDefaultDuration(newTotal);
      setDefaultSavedTime(newTotal);
    }
  };

  const handleSubtract30s = () => {
    const newTotal = Math.max(10, totalDuration - 30);
    setTotalDuration(newTotal);
    setTimeLeft(prev => Math.max(5, prev - 30));
    if (!isPaused) {
      const remaining = Math.max(5, timeLeft - 30);
      endTimeRef.current = Date.now() + remaining * 1000;
    }
    if (onSaveDefaultDuration) {
      onSaveDefaultDuration(newTotal);
      setDefaultSavedTime(newTotal);
    }
  };

  // Bottom action buttons
  const handleTogglePause = () => {
    if (isPaused) {
      // Resume
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsPaused(false);
    } else {
      // Pause
      endTimeRef.current = null;
      setIsPaused(true);
    }
  };

  const handleReset = () => {
    setTimeLeft(totalDuration);
    if (!isPaused) {
      endTimeRef.current = Date.now() + totalDuration * 1000;
    }
  };

  const handleSkip = () => {
    endTimeRef.current = null;
    setTimeLeft(0);
    onClose();
  };

  // Values for the picker display (1 step before, current, 1 step after)
  const prevMinute = Math.max(0, currentMinutes - 1);
  const nextMinute = currentMinutes + 1;

  const prevSeconds = (currentSeconds - 10 + 60) % 60;
  const nextSeconds = (currentSeconds + 10) % 60;

  return (
    <div
      id="rest-timer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-[#0B132B] border-2 border-cyan-500/40 rounded-3xl p-3.5 sm:p-4 w-full max-w-[365px] sm:max-w-[385px] shadow-[0_0_40px_rgba(6,182,212,0.25)] text-white relative flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full border border-cyan-400/50 bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold text-base leading-tight">Descanso</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-tight">Siguiente ejercicio</p>
              <h3 className="text-sm sm:text-base font-bold text-white truncate leading-tight mt-0.5">
                {nextExerciseName || 'Fin de rutina'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate leading-tight">
                {muscleSubtitle}
              </p>
            </div>
          </div>

          {/* Close Button X */}
          <button
            type="button"
            id="btn-close-rest-timer"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Cerrar temporizador"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Area: Circular Timer + Ajustar Tiempo (Strictly side-by-side in 1 row) */}
        <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[140px_1fr] items-center gap-2.5 sm:gap-3 my-3 sm:my-3.5">
          {/* Left: Circular Progress Timer */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <CircularProgress
                percentage={percentage}
                size={128}
                strokeWidth={9}
                color="#00E5FF"
                trailColor="rgba(6, 182, 212, 0.15)"
              >
                <div className="text-center flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-[28px] font-black text-white tracking-tight font-mono leading-none">
                    {formatMMSS(timeLeft)}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1 leading-none">
                    de {formatMMSS(totalDuration)}
                  </span>
                </div>
              </CircularProgress>
            </div>
          </div>

          {/* Right: Ajustar tiempo Card */}
          <div className="bg-[#0D162B] border border-slate-800/90 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center shadow-inner">
            <h4 className="text-[11px] sm:text-xs font-semibold text-slate-200 tracking-wide mb-1 text-center">
              Ajustar tiempo
            </h4>

            <div className="w-full grid grid-cols-2 gap-1 text-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-wider">Minutos</span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-wider">Segundos</span>
            </div>

            {/* Stepper / Picker Columns */}
            <div className="w-full grid grid-cols-2 gap-1.5 my-0.5 items-center">
              {/* Minutes Column */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleAdjustMinutes(-1)}
                  className="text-[11px] sm:text-xs font-bold text-slate-500 hover:text-slate-300 py-0.5 transition-colors flex items-center justify-center cursor-pointer"
                  title="Restar 1 minuto"
                >
                  {prevMinute}
                </button>
                <div className="w-full bg-[#080E1E] border border-cyan-500/40 rounded-lg py-1 px-1.5 text-white font-bold text-xs sm:text-sm text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] font-mono">
                  {currentMinutes}
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustMinutes(1)}
                  className="text-[11px] sm:text-xs font-bold text-slate-500 hover:text-slate-300 py-0.5 transition-colors flex items-center justify-center cursor-pointer"
                  title="Sumar 1 minuto"
                >
                  {nextMinute}
                </button>
              </div>

              {/* Seconds Column */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleAdjustSeconds(-10)}
                  className="text-[11px] sm:text-xs font-bold text-slate-500 hover:text-slate-300 py-0.5 transition-colors flex items-center justify-center cursor-pointer"
                  title="Restar 10 segundos"
                >
                  {prevSeconds.toString().padStart(2, '0')}
                </button>
                <div className="w-full bg-[#080E1E] border border-cyan-500/40 rounded-lg py-1 px-1.5 text-white font-bold text-xs sm:text-sm text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] font-mono">
                  {currentSeconds.toString().padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustSeconds(10)}
                  className="text-[11px] sm:text-xs font-bold text-slate-500 hover:text-slate-300 py-0.5 transition-colors flex items-center justify-center cursor-pointer"
                  title="Sumar 10 segundos"
                >
                  {nextSeconds.toString().padStart(2, '0')}
                </button>
              </div>
            </div>

            {/* Quick Adjustment Buttons: - 30s | + 30s */}
            <div className="grid grid-cols-2 gap-1.5 w-full mt-1">
              <button
                type="button"
                id="btn-timer-sub-30"
                onClick={handleSubtract30s}
                className="bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-700/80 text-slate-200 font-semibold text-[10px] py-1 px-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow"
              >
                - 30s
              </button>
              <button
                type="button"
                id="btn-timer-add-30"
                onClick={handleAdd30s}
                className="bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-700/80 text-slate-200 font-semibold text-[10px] py-1 px-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow"
              >
                + 30s
              </button>
            </div>

            {/* Default Time Indicator */}
            <div className="mt-1 text-[9px] text-slate-400 text-center leading-tight">
              Tiempo por defecto: <span className="font-semibold text-slate-300">{formatMMSS(defaultSavedTime)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Control Buttons Row: Omitir descanso | Pausar/Reanudar | Reiniciar */}
        <div className="grid grid-cols-3 gap-2 text-center my-1.5">
          {/* 1. Omitir descanso */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="btn-timer-skip"
              onClick={handleSkip}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-rose-500/15 border-2 border-rose-500/50 hover:bg-rose-500/25 active:scale-95 text-rose-400 flex items-center justify-center transition-all shadow-md shadow-rose-950/40 cursor-pointer"
              aria-label="Omitir descanso"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <span className="text-[10px] text-slate-300 font-medium mt-1 leading-tight">
              Omitir descanso
            </span>
          </div>

          {/* 2. Pausar / Reanudar */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="btn-timer-toggle-pause"
              onClick={handleTogglePause}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-800/90 border-2 border-slate-600 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition-all shadow-md cursor-pointer"
              aria-label={isPaused ? 'Reanudar' : 'Pausar'}
            >
              {isPaused ? (
                <Play className="w-5 h-5 ml-0.5" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
            </button>
            <span className="text-[10px] text-slate-300 font-medium mt-1 leading-tight">
              {isPaused ? 'Reanudar' : 'Pausar'}
            </span>
          </div>

          {/* 3. Reiniciar */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="btn-timer-reset"
              onClick={handleReset}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-teal-500/15 border-2 border-teal-500/50 hover:bg-teal-500/25 active:scale-95 text-teal-300 flex items-center justify-center transition-all shadow-md shadow-teal-950/40 cursor-pointer"
              aria-label="Reiniciar descanso"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <span className="text-[10px] text-slate-300 font-medium mt-1 leading-tight">
              Reiniciar
            </span>
          </div>
        </div>

        {/* Motivational Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80 text-slate-400 text-[10px] sm:text-[11px] text-center font-normal">
          <Dumbbell className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>Un paso más cerca de tu mejor versión</span>
        </div>
      </div>
    </div>
  );
};
