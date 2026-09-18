import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ExerciseLog, ExerciseGoal, ExerciseName, Cluster, ColorTheme, UserProfile, TrainingType } from '../types';
import { GoalProgress } from './GoalProgress';
import { isTimeBased as isTimeBasedUtil, isEffectivelyRepBased as isRepBasedUtil } from '../utils/exerciseUtils';
import { generateUUID } from '../utils/uuid';
import { Check, Plus, Trash2, Clock, Dumbbell, Heart, Info } from 'lucide-react';

interface ExerciseCardProps {
  exerciseName: ExerciseName;
  previousLog: ExerciseLog | null;
  currentLog?: ExerciseLog | null;
  onUpdateLog: (exerciseName: ExerciseName, clusters: Cluster[], notes?: string, heartRate?: number) => void;
  goal?: ExerciseGoal;
  color: ColorTheme;
  userProfile: UserProfile | null;
  restBetweenSets: number;
  trainingType: TrainingType;
  autoRest?: boolean;
  onTriggerInterExerciseRest?: () => void;
  isDisabled?: boolean;
}

interface LocalSeriesRow {
  id: string;
  weight: string;
  reps: string;
  rir: string;
  time: number;
  isCompleted: boolean;
}

const formatSecondsToMMSS = (totalSeconds: number): string => {
  if (totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  exerciseName, 
  previousLog,
  currentLog,
  onUpdateLog,
  goal, 
  color, 
  userProfile, 
  restBetweenSets,
  trainingType,
  autoRest = true,
  onTriggerInterExerciseRest,
  isDisabled = false
}) => {
  const isTimeBased = useMemo(() => isTimeBasedUtil(exerciseName), [exerciseName]);
  const isEffectivelyRepBased = useMemo(() => isRepBasedUtil(exerciseName, goal, trainingType), [exerciseName, goal, trainingType]);

  const [notes, setNotes] = useState<string>(currentLog?.notes || '');
  const [bpm, setBpm] = useState<string>(() => {
    return currentLog?.heartRate !== undefined ? String(currentLog.heartRate) : '';
  });
  const bpmRef = useRef<string>(bpm);
  bpmRef.current = bpm;
  
  // Intra-set rest timer state
  const [isIntraSetResting, setIsIntraSetResting] = useState(false);
  const [intraSetRestTimeLeft, setIntraSetRestTimeLeft] = useState(0);
  const intraSetRestEndTimeRef = useRef<number | null>(null);

  // Initialize series list from existing session log or empty rows based on planned count
  const [series, setSeries] = useState<LocalSeriesRow[]>(() => {
    if (currentLog?.clusters && currentLog.clusters.length > 0) {
      return currentLog.clusters.map((c) => ({
        id: generateUUID(),
        weight: c.weight !== undefined ? String(c.weight) : '',
        reps: c.reps !== undefined ? String(c.reps) : '',
        rir: c.rir !== undefined ? String(c.rir) : '',
        time: c.time || 0,
        isCompleted: true
      }));
    }

    const initialRows: LocalSeriesRow[] = [];
    const plannedCount = Math.max(1, goal?.series || 3);

    for (let i = 0; i < plannedCount; i++) {
      initialRows.push({
        id: generateUUID(),
        weight: '',
        reps: '',
        rir: '',
        time: isTimeBased ? (goal?.totalTime || 30) : 0,
        isCompleted: false
      });
    }

    return initialRows;
  });

  const seriesRef = useRef<LocalSeriesRow[]>(series);
  seriesRef.current = series;
  const notesRef = useRef<string>(notes);
  notesRef.current = notes;

  // Sync state if currentLog gets updated externally
  useEffect(() => {
    if (currentLog?.heartRate !== undefined) {
      setBpm(String(currentLog.heartRate));
      bpmRef.current = String(currentLog.heartRate);
    }

    if (!currentLog || !currentLog.clusters || currentLog.clusters.length === 0) {
      // If current session log is cleared or reset, reset series completion and empty inputs
      const isAnyCompleted = seriesRef.current.some(s => s.isCompleted);
      if (isAnyCompleted) {
        const resetRows = seriesRef.current.map(s => ({
          ...s,
          isCompleted: false,
          weight: '',
          reps: '',
          rir: ''
        }));
        seriesRef.current = resetRows;
        setSeries(resetRows);
      }
      return;
    }

    const prev = seriesRef.current;
    const isCurrentMatching = prev.length >= currentLog.clusters.length &&
      currentLog.clusters.every((c, i) => 
        prev[i] && prev[i].isCompleted &&
        parseFloat(prev[i].weight || '0') === c.weight &&
        parseInt(prev[i].reps || '0', 10) === c.reps &&
        (c.rir === undefined || parseFloat(prev[i].rir || '0') === c.rir)
      );

    if (isCurrentMatching) return;

    // Merge completed clusters into series rows without losing extra uncompleted rows
    const updated = [...prev];
    currentLog.clusters.forEach((c, i) => {
      if (updated[i]) {
        updated[i] = {
          ...updated[i],
          weight: c.weight !== undefined ? String(c.weight) : '',
          reps: c.reps !== undefined ? String(c.reps) : '',
          rir: c.rir !== undefined ? String(c.rir) : '',
          time: c.time || 0,
          isCompleted: true
        };
      } else {
        updated.push({
          id: generateUUID(),
          weight: c.weight !== undefined ? String(c.weight) : '',
          reps: c.reps !== undefined ? String(c.reps) : '',
          rir: c.rir !== undefined ? String(c.rir) : '',
          time: c.time || 0,
          isCompleted: true
        });
      }
    });
    seriesRef.current = updated;
    setSeries(updated);
  }, [currentLog]);

  const playRestCompleteChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch {}
    }
  }, []);

  // Intra-set countdown timer (continues accurately even on screen lock)
  useEffect(() => {
    if (!isIntraSetResting || !intraSetRestEndTimeRef.current) {
      return;
    }

    const updateTimer = () => {
      if (!intraSetRestEndTimeRef.current) return;
      const remainingMs = intraSetRestEndTimeRef.current - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      setIntraSetRestTimeLeft(remainingSecs);

      if (remainingSecs <= 0) {
        intraSetRestEndTimeRef.current = null;
        setIsIntraSetResting(false);
        playRestCompleteChime();
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 250);

    const handleVisibilityOrFocus = () => {
      updateTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
    };
  }, [isIntraSetResting, playRestCompleteChime]);

  const handleSkipIntraSetRest = useCallback(() => {
    intraSetRestEndTimeRef.current = null;
    setIsIntraSetResting(false);
    setIntraSetRestTimeLeft(0);
  }, []);

  // Format "ANTERIOR" string based on previous session log
  const getAnteriorText = useCallback((index: number): string => {
    if (!previousLog || !previousLog.clusters || !previousLog.clusters[index]) {
      return '-';
    }
    const cluster = previousLog.clusters[index];
    if (cluster.time && cluster.time > 0) {
      return `${cluster.time}s`;
    }
    if (cluster.weight > 0 && cluster.reps > 0) {
      return `${cluster.weight}kg × ${cluster.reps}`;
    }
    if (cluster.reps > 0) {
      return cluster.weight > 0 ? `${cluster.weight}kg × ${cluster.reps}` : `${cluster.reps} reps`;
    }
    if (cluster.weight > 0) {
      return `${cluster.weight}kg`;
    }
    return '-';
  }, [previousLog]);

  // Handle text input changes
  const handleInputChange = (id: string, field: 'weight' | 'reps' | 'rir', value: string) => {
    const updated = seriesRef.current.map(s => (s.id === id ? { ...s, [field]: value } : s));
    seriesRef.current = updated;
    setSeries(updated);

    // If the changed series was already completed, update the session log immediately
    const changed = updated.find(s => s.id === id);
    if (changed?.isCompleted) {
      const completedClusters: Cluster[] = updated
        .filter(s => s.isCompleted)
        .map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps, 10) || 0,
          ...(s.rir !== '' && { rir: parseFloat(s.rir) || 0 }),
          ...(isTimeBased && { time: parseInt(s.reps, 10) || s.time || 0 })
        }));
      const hr = bpmRef.current.trim() ? parseInt(bpmRef.current, 10) || undefined : undefined;
      onUpdateLog(exerciseName, completedClusters, notesRef.current, hr);
    }
  };

  // Handle BPM input change
  const handleBpmChange = (value: string) => {
    setBpm(value);
    bpmRef.current = value;
    const hr = value.trim() ? parseInt(value, 10) || undefined : undefined;
    const completedClusters: Cluster[] = seriesRef.current
      .filter(s => s.isCompleted)
      .map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps, 10) || 0,
        ...(s.rir !== '' && { rir: parseFloat(s.rir) || 0 }),
        ...(isTimeBased && { time: parseInt(s.reps, 10) || s.time || 0 })
      }));
    if (completedClusters.length > 0) {
      onUpdateLog(exerciseName, completedClusters, notesRef.current, hr);
    }
  };

  // Toggle checklist checkmark [✓]
  const handleToggleCheck = (id: string, index: number) => {
    let isNewlyCompleted = false;

    const updated = seriesRef.current.map((s, idx) => {
      if (s.id !== id) return s;
      const willBeCompleted = !s.isCompleted;
      if (willBeCompleted) isNewlyCompleted = true;

      let effWeight = s.weight;
      let effReps = s.reps;
      let effRir = s.rir;

      // If newly completing and values are empty, auto-fill with defaults
      if (willBeCompleted) {
        if (!effReps || effReps.trim() === '' || effReps === '0') {
          const fallbackReps = goal?.clusterGoals?.[idx]?.reps || 
                               goal?.reps || 
                               previousLog?.clusters?.[idx]?.reps || 
                               (isTimeBased ? (goal?.totalTime || 30) : 10);
          effReps = String(fallbackReps);
        }
        if (!isTimeBased && (!effWeight || effWeight.trim() === '')) {
          const fallbackWeight = goal?.clusterGoals?.[idx]?.weight ?? 
                                 goal?.weight ?? 
                                 previousLog?.clusters?.[idx]?.weight ?? 
                                 0;
          effWeight = String(fallbackWeight);
        }
        if (!effRir || effRir.trim() === '') {
          const fallbackRir = previousLog?.clusters?.[idx]?.rir !== undefined 
            ? String(previousLog.clusters[idx].rir) 
            : '2';
          effRir = fallbackRir;
        }
      }

      return {
        ...s,
        weight: effWeight,
        reps: effReps,
        rir: effRir,
        isCompleted: willBeCompleted
      };
    });

    seriesRef.current = updated;
    setSeries(updated);

    // Commit completed series to session logs outside of setState updater
    const completedClusters: Cluster[] = updated
      .filter(s => s.isCompleted)
      .map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps, 10) || 0,
        ...(s.rir !== '' && { rir: parseFloat(s.rir) || 0 }),
        ...(isTimeBased && { time: parseInt(s.reps, 10) || s.time || 0 })
      }));

    const hr = bpmRef.current.trim() ? parseInt(bpmRef.current, 10) || undefined : undefined;
    onUpdateLog(exerciseName, completedClusters, notesRef.current, hr);

    if (isNewlyCompleted) {
      playRestCompleteChime();

      // Check if there are more series to do in this exercise
      const hasUncheckedSeries = updated.some(s => !s.isCompleted);
      const restDuration = restBetweenSets || 40;

      if (autoRest && restDuration > 0) {
        if (hasUncheckedSeries) {
          intraSetRestEndTimeRef.current = Date.now() + restDuration * 1000;
          setIntraSetRestTimeLeft(restDuration);
          setIsIntraSetResting(true);
        } else if (onTriggerInterExerciseRest) {
          onTriggerInterExerciseRest();
        }
      }
    }
  };

  // Add a new series row
  const handleAddSeries = () => {
    const current = seriesRef.current;
    const updated: LocalSeriesRow[] = [
      ...current,
      {
        id: generateUUID(),
        weight: '',
        reps: '',
        rir: '',
        time: isTimeBased ? (goal?.totalTime || 30) : 0,
        isCompleted: false
      }
    ];

    seriesRef.current = updated;
    setSeries(updated);
  };

  // Remove a series row
  const handleRemoveSeries = (id: string) => {
    if (seriesRef.current.length <= 1) return;
    const updated = seriesRef.current.filter(s => s.id !== id);
    seriesRef.current = updated;
    setSeries(updated);

    const completedClusters: Cluster[] = updated
      .filter(s => s.isCompleted)
      .map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps, 10) || 0,
        ...(s.rir !== '' && { rir: parseFloat(s.rir) || 0 }),
        ...(isTimeBased && { time: parseInt(s.reps, 10) || s.time || 0 })
      }));
    const hr = bpmRef.current.trim() ? parseInt(bpmRef.current, 10) || undefined : undefined;
    onUpdateLog(exerciseName, completedClusters, notesRef.current, hr);
  };

  // Handle notes change
  const handleNotesChange = (newNotes: string) => {
    notesRef.current = newNotes;
    setNotes(newNotes);
    const completedClusters: Cluster[] = seriesRef.current
      .filter(s => s.isCompleted)
      .map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps, 10) || 0,
        ...(s.rir !== '' && { rir: parseFloat(s.rir) || 0 }),
        ...(isTimeBased && { time: parseInt(s.reps, 10) || s.time || 0 })
      }));
    const hr = bpmRef.current.trim() ? parseInt(bpmRef.current, 10) || undefined : undefined;
    onUpdateLog(exerciseName, completedClusters, newNotes, hr);
  };

  // Progress metrics for GoalProgress
  const completedCount = useMemo(() => series.filter(s => s.isCompleted).length, [series]);
  const progressMetrics = useMemo(() => {
    let weight = 0;
    let reps = 0;
    let totalTime = 0;

    series.filter(s => s.isCompleted).forEach(s => {
      const w = parseFloat(s.weight) || 0;
      const r = parseInt(s.reps, 10) || 0;
      weight += w * r;
      reps += r;
      totalTime += s.time || r;
    });

    return {
      weight,
      reps,
      clusters: completedCount,
      totalTime
    };
  }, [series, completedCount]);

  const isAllSeriesCompleted = series.length > 0 && series.every(s => s.isCompleted);

  return (
    <div className={`bg-slate-900/90 border rounded-2xl shadow-xl p-4 sm:p-5 flex flex-col transition-all duration-300 ${
      isAllSeriesCompleted 
        ? 'border-emerald-500/40 bg-slate-900/95 ring-1 ring-emerald-500/20' 
        : 'border-slate-800 hover:border-slate-700'
    } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
      
      {/* Exercise Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${color.bg} text-white flex-shrink-0 shadow-md`}>
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-cyan-400 truncate tracking-tight">
              {exerciseName}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400/90 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Descanso: {restBetweenSets || 40}s</span>
            </div>
          </div>
        </div>

        {/* Series Completion Status Pill */}
        <div className="flex-shrink-0">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            isAllSeriesCompleted 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : completedCount > 0 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {completedCount}/{series.length} {trainingType === 'Clúster' ? 'clústeres' : 'series'}
          </span>
        </div>
      </div>

      {/* Notes Input */}
      <div className="mb-3">
        <input
          type="text"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Agregar notas aquí..."
          className="w-full bg-slate-950/40 hover:bg-slate-950/70 focus:bg-slate-950 text-slate-300 placeholder-slate-500 text-xs py-1.5 px-2.5 rounded-lg border border-transparent focus:border-slate-700 outline-none transition-all"
        />
      </div>

      {/* Goal Progress (if configured) */}
      {goal && (
        <div className="mb-3">
          <GoalProgress 
            goal={goal} 
            progress={progressMetrics} 
            isTimeBased={isTimeBased} 
            isRepBased={isEffectivelyRepBased} 
            trainingType={trainingType} 
          />
        </div>
      )}

      {/* Intra-set Rest Banner (when rest is active) */}
      {isIntraSetResting && (
        <div className="my-2 p-3 rounded-xl bg-slate-950 border border-cyan-500/60 shadow-lg text-center animate-fade-in">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              ¡Descanso en curso!
            </span>
            <button
              type="button"
              onClick={handleSkipIntraSetRest}
              className="text-slate-400 hover:text-white text-[11px] px-2 py-0.5 rounded bg-slate-800 transition-colors"
            >
              Omitir
            </button>
          </div>
          <div className="text-3xl font-mono font-black text-white tracking-widest my-0.5">
            {formatSecondsToMMSS(intraSetRestTimeLeft)}
          </div>
        </div>
      )}

      {/* Table Header: SERIE | ANTERIOR | KG | REPS | RIR | ✓ */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-2 border-b border-slate-800">
        <div className="w-8 sm:w-9 text-center flex-shrink-0">Serie</div>
        <div className="w-20 sm:w-24 text-center flex-shrink-0">Anterior</div>
        <div className="flex-1 min-w-[40px] text-center flex items-center justify-center gap-0.5">
          <span>{isTimeBased ? 'Seg' : 'Kg'}</span>
        </div>
        {!isTimeBased && (
          <div className="flex-1 min-w-[40px] text-center">Reps</div>
        )}
        <div className="flex-1 min-w-[36px] text-center">RIR</div>
        <div className="w-8 sm:w-9 text-center flex-shrink-0">
          <Check className="w-4 h-4 mx-auto text-emerald-400 stroke-[3]" />
        </div>
        {series.length > 1 && <div className="w-5 flex-shrink-0" />}
      </div>

      {/* Series Rows */}
      <div className="space-y-1.5 mt-2 flex-grow">
        {series.map((s, index) => (
          <div
            key={s.id}
            className={`flex items-center gap-1.5 sm:gap-2 py-1.5 px-1 rounded-xl transition-all duration-200 ${
              s.isCompleted
                ? 'bg-emerald-950/20 border border-emerald-500/30'
                : 'hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            {/* SERIE Number Badge */}
            <div className="w-8 sm:w-9 flex-shrink-0 flex items-center justify-center">
              <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                s.isCompleted 
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {index + 1}
              </span>
            </div>

            {/* ANTERIOR Record */}
            <div className="w-20 sm:w-24 flex-shrink-0 text-center text-xs font-mono text-slate-300 truncate px-0.5" title={getAnteriorText(index)}>
              {getAnteriorText(index)}
            </div>

            {/* KG / SEG Input */}
            <div className="flex-1 min-w-[40px]">
              <input
                type="number"
                value={isTimeBased ? (s.time || s.reps) : s.weight}
                onChange={(e) => handleInputChange(s.id, isTimeBased ? 'reps' : 'weight', e.target.value)}
                placeholder="0"
                min="0"
                step={isTimeBased ? '1' : '0.5'}
                className={`w-full bg-slate-950 border rounded-lg py-1.5 px-1 text-center text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                  s.isCompleted ? 'border-emerald-500/40 bg-emerald-950/40' : 'border-slate-800'
                }`}
              />
            </div>

            {/* REPS Input */}
            {!isTimeBased && (
              <div className="flex-1 min-w-[40px]">
                <input
                  type="number"
                  value={s.reps}
                  onChange={(e) => handleInputChange(s.id, 'reps', e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className={`w-full bg-slate-950 border rounded-lg py-1.5 px-1 text-center text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                    s.isCompleted ? 'border-emerald-500/40 bg-emerald-950/40' : 'border-slate-800'
                  }`}
                />
              </div>
            )}

            {/* RIR Input */}
            <div className="flex-1 min-w-[36px]">
              <input
                type="number"
                value={s.rir}
                onChange={(e) => handleInputChange(s.id, 'rir', e.target.value)}
                placeholder="0"
                min="0"
                max="10"
                step="0.5"
                className={`w-full bg-slate-950 border rounded-lg py-1.5 px-1 text-center text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                  s.isCompleted ? 'border-emerald-500/40 bg-emerald-950/40' : 'border-slate-800'
                }`}
              />
            </div>

            {/* Checklist Button [✓] */}
            <div className="w-8 sm:w-9 flex-shrink-0 flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleToggleCheck(s.id, index)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  s.isCompleted
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300/60 scale-105'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500'
                }`}
                aria-label={s.isCompleted ? `Desmarcar serie ${index + 1}` : `Marcar serie ${index + 1} como lista`}
              >
                <Check className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${s.isCompleted ? 'stroke-[3] text-slate-950' : 'stroke-[2] opacity-40'}`} />
              </button>
            </div>

            {/* Delete row (if > 1 series) */}
            {series.length > 1 && (
              <div className="w-5 flex-shrink-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveSeries(s.id)}
                  className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition-colors"
                  title="Eliminar serie"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Button: + Agregar Serie */}
      <button
        type="button"
        onClick={handleAddSeries}
        className="w-full mt-3 py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200"
      >
        <Plus className="w-4 h-4 text-cyan-400" />
        <span>{trainingType === 'Clúster' ? 'Agregar Clúster' : 'Agregar Serie'}</span>
      </button>

      {/* BPM Bar (al finalizar el ejercicio) */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2.5 bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" />
          </div>
          <div className="flex items-center flex-wrap gap-1 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">BPM</span>
            <span className="text-[11px] sm:text-xs text-slate-400 truncate">(al finalizar el ejercicio)</span>
            <div className="relative group cursor-pointer inline-flex items-center">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-300 ml-0.5" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-48 p-2 bg-slate-900 text-[11px] text-slate-300 rounded-lg shadow-xl border border-slate-700 z-20 text-center pointer-events-none">
                Frecuencia cardíaca (pulsaciones por minuto) registrada al terminar este ejercicio.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(e.target.value)}
            placeholder="--"
            min="40"
            max="240"
            className="w-16 sm:w-20 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg py-1.5 px-2 text-center text-sm font-bold text-white placeholder-slate-600 focus:outline-none transition-all"
          />
          <span className="text-xs font-semibold text-slate-400">BPM</span>
        </div>
      </div>

      {/* Note: NO individual "Registrar Entrenamiento" button! Finalization happens globally via "Finalizar sesión ahora" / "Guardar sesión ahora" */}
    </div>
  );
};
