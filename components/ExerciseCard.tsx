import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ExerciseLog, ExerciseGoal, ExerciseName, Cluster, ColorTheme, UserProfile, TrainingType } from '../types';
import { GoalProgress } from './GoalProgress';
import { isTimeBased as isTimeBasedUtil, isEffectivelyRepBased as isRepBasedUtil } from '../utils/exerciseUtils';
import { generateUUID } from '../utils/uuid';
import { Check, Plus, Trash2, Clock, Dumbbell, Heart, Info, ArrowRight, SlidersHorizontal } from 'lucide-react';

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
  onFinishExercise?: (exerciseName: ExerciseName) => void;
  isDisabled?: boolean;
}

interface LocalSeriesRow {
  id: string;
  weight: string;
  reps: string;
  rir: string;
  time: number;
  isCompleted: boolean;
  dropWeight?: string;
  dropReps?: string;
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
  onFinishExercise,
  isDisabled = false
}) => {
  const isTimeBased = useMemo(() => isTimeBasedUtil(exerciseName), [exerciseName]);

  // Inline execution method: Normal (default), Clúster, or Drop set
  const [executionMethod, setExecutionMethod] = useState<TrainingType>(() => {
    return goal?.executionMethod || trainingType || 'Normal';
  });

  // Inline rest time configuration for this exercise
  const [inlineRest, setInlineRest] = useState<number>(() => {
    return goal?.restBetweenSets || restBetweenSets || 60;
  });

  // Cluster parameters
  const [clusterMicroRest, setClusterMicroRest] = useState<number>(() => {
    return goal?.clusterConfig?.microRestSeconds || 15;
  });
  const [clusterBlockReps, setClusterBlockReps] = useState<number>(() => {
    return goal?.clusterConfig?.repsPerBlock || 2;
  });

  // Drop set parameters
  const [dropReductionPercent, setDropReductionPercent] = useState<number>(() => {
    return goal?.dropSetConfig?.reductionPercent || 20;
  });

  const isEffectivelyRepBased = useMemo(() => isRepBasedUtil(exerciseName, goal, executionMethod), [exerciseName, goal, executionMethod]);

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

  // Helper to obtain goal or historical values for any series/cluster row
  const getGoalOrFallbackValues = useCallback((index: number) => {
    const isClusterGoalMode = !!(goal?.clusterGoals && goal.clusterGoals.length > 0);
    const clusterGoal = isClusterGoalMode ? goal?.clusterGoals?.[index] : undefined;
    const hasClusterWeight = clusterGoal?.weight !== undefined && clusterGoal.weight > 0;
    const hasClusterReps = clusterGoal?.reps !== undefined && clusterGoal.reps > 0;

    // General exercise goal (only if NOT in cluster mode with individual goals)
    const hasGeneralWeight = !isClusterGoalMode && goal?.weight !== undefined && goal.weight > 0;
    const hasGeneralReps = !isClusterGoalMode && goal?.reps !== undefined && goal.reps > 0;

    // Previous session log records
    const prevCluster = previousLog?.clusters?.[index];
    const prevFirstCluster = previousLog?.clusters?.[0];
    const hasPrevWeight = prevCluster?.weight !== undefined && prevCluster.weight > 0;
    const hasPrevReps = prevCluster?.reps !== undefined && prevCluster.reps > 0;
    const prevRir = prevCluster?.rir !== undefined 
      ? String(prevCluster.rir) 
      : (prevFirstCluster?.rir !== undefined ? String(prevFirstCluster.rir) : '2');

    // Resolve weight
    let defaultWeight = '';
    if (hasClusterWeight) {
      defaultWeight = String(clusterGoal!.weight);
    } else if (hasGeneralWeight) {
      defaultWeight = String(goal!.weight);
    } else if (hasPrevWeight) {
      defaultWeight = String(prevCluster!.weight);
    } else if (prevFirstCluster?.weight !== undefined && prevFirstCluster.weight > 0) {
      defaultWeight = String(prevFirstCluster.weight);
    }

    // Resolve reps / time
    let defaultReps = '';
    if (isTimeBased) {
      defaultReps = String(goal?.totalTime || prevCluster?.time || prevFirstCluster?.time || 30);
    } else if (hasClusterReps) {
      defaultReps = String(clusterGoal!.reps);
    } else if (hasGeneralReps) {
      defaultReps = String(goal!.reps);
    } else if (hasPrevReps) {
      defaultReps = String(prevCluster!.reps);
    } else if (prevFirstCluster?.reps !== undefined && prevFirstCluster.reps > 0) {
      defaultReps = String(prevFirstCluster.reps);
    }

    return {
      weight: defaultWeight,
      reps: defaultReps,
      rir: prevRir || '2',
      time: isTimeBased ? (parseInt(defaultReps, 10) || 30) : 0,
    };
  }, [goal, previousLog, isTimeBased]);

  // Progressive Configuration: initialize series list ensuring all goal series (clusters or standard)
  // are created with their corresponding target weight and reps loaded from the start
  const [series, setSeries] = useState<LocalSeriesRow[]>(() => {
    const prevClusters = previousLog?.clusters || [];
    const currentClusters = currentLog?.clusters || [];
    const goalSeriesCount = (goal?.clusterGoals && goal.clusterGoals.length > 0)
      ? goal.clusterGoals.length
      : (goal?.series && goal.series > 0 ? goal.series : 0);

    // If user configured a goal, plannedCount strictly equals the goal series count (or completed rows count if higher)
    // Only if NO goal is set, fallback to previous log clusters or default 3
    const plannedCount = goalSeriesCount > 0
      ? Math.max(goalSeriesCount, currentClusters.length)
      : Math.max(1, prevClusters.length || 3, currentClusters.length);

    const initialRows: LocalSeriesRow[] = [];

    for (let i = 0; i < plannedCount; i++) {
      if (i < currentClusters.length) {
        const c = currentClusters[i];
        initialRows.push({
          id: generateUUID(),
          weight: c.weight !== undefined ? String(c.weight) : '',
          reps: c.reps !== undefined ? String(c.reps) : '',
          rir: c.rir !== undefined ? String(c.rir) : '',
          time: c.time || 0,
          isCompleted: true
        });
      } else {
        const fallback = getGoalOrFallbackValues(i);
        initialRows.push({
          id: generateUUID(),
          weight: fallback.weight,
          reps: fallback.reps,
          rir: fallback.rir,
          time: fallback.time,
          isCompleted: false
        });
      }
    }

    return initialRows;
  });

  const seriesRef = useRef<LocalSeriesRow[]>(series);
  seriesRef.current = series;
  const notesRef = useRef<string>(notes);
  notesRef.current = notes;

  // Reactively sync execution method when goal changes
  useEffect(() => {
    if (goal?.executionMethod) {
      setExecutionMethod(goal.executionMethod);
    }
  }, [goal?.executionMethod]);

  // Reactively sync rows when goals are present or updated
  useEffect(() => {
    if (!goal) return;

    const goalSeriesCount = (goal.clusterGoals && goal.clusterGoals.length > 0)
      ? goal.clusterGoals.length
      : (goal.series && goal.series > 0 ? goal.series : 0);

    if (goalSeriesCount <= 0) return;

    const prev = seriesRef.current;
    
    // Check completed series
    const completedCount = prev.filter(s => s.isCompleted).length;
    // The target number of rows reflects the goal count, or completed count if higher
    const targetCount = Math.max(goalSeriesCount, completedCount);

    let updated = [...prev];

    // If we have extra uncompleted rows that exceed targetCount (e.g. from a previous 3 default), trim them
    if (updated.length > targetCount) {
      const trimmed: LocalSeriesRow[] = [];
      let uncompletedKept = 0;
      const maxUncompletedToKeep = Math.max(0, targetCount - completedCount);
      for (const row of updated) {
        if (row.isCompleted) {
          trimmed.push(row);
        } else if (uncompletedKept < maxUncompletedToKeep) {
          trimmed.push(row);
          uncompletedKept++;
        }
      }
      updated = trimmed;
    }

    // Now update/populate each row according to the target goal values
    for (let i = 0; i < targetCount; i++) {
      const suggested = getGoalOrFallbackValues(i);
      if (i < updated.length) {
        if (!updated[i].isCompleted) {
          updated[i] = {
            ...updated[i],
            weight: suggested.weight,
            reps: suggested.reps,
            rir: updated[i].rir || suggested.rir,
            time: suggested.time
          };
        }
      } else {
        updated.push({
          id: generateUUID(),
          weight: suggested.weight,
          reps: suggested.reps,
          rir: suggested.rir,
          time: suggested.time,
          isCompleted: false
        });
      }
    }

    seriesRef.current = updated;
    setSeries(updated);
  }, [goal, getGoalOrFallbackValues]);

  // Sync state if currentLog gets updated externally
  useEffect(() => {
    if (currentLog?.heartRate !== undefined) {
      setBpm(String(currentLog.heartRate));
      bpmRef.current = String(currentLog.heartRate);
    }

    if (!currentLog || !currentLog.clusters || currentLog.clusters.length === 0) {
      const isAnyCompleted = seriesRef.current.some(s => s.isCompleted);
      if (isAnyCompleted) {
        const resetRows = seriesRef.current.map((s, idx) => {
          const fallback = getGoalOrFallbackValues(idx);
          return {
            ...s,
            isCompleted: false,
            weight: fallback.weight,
            reps: fallback.reps,
            rir: fallback.rir
          };
        });
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
  }, [currentLog, getGoalOrFallbackValues]);

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

      // If newly completing and values are empty, use goals or sensible defaults
      if (willBeCompleted) {
        const fallback = getGoalOrFallbackValues(idx);
        if (!effReps || effReps.trim() === '' || effReps === '0') {
          effReps = fallback.reps || (isTimeBased ? '30' : '10');
        }
        if (!isTimeBased && (!effWeight || effWeight.trim() === '')) {
          effWeight = fallback.weight || '0';
        }
        if (!effRir || effRir.trim() === '') {
          effRir = fallback.rir || '2';
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
      const restDuration = inlineRest || restBetweenSets || 40;

      if (autoRest && restDuration > 0) {
        if (hasUncheckedSeries) {
          intraSetRestEndTimeRef.current = Date.now() + restDuration * 1000;
          setIntraSetRestTimeLeft(restDuration);
          setIsIntraSetResting(true);
        }
        // Inter-exercise rest is not triggered on series check; user clicks "Finalizar ejercicio"
      }
    }
  };

  // Handler for "Finalizar ejercicio →"
  const handleFinishExercise = () => {
    const completedClusters: Cluster[] = seriesRef.current
      .filter(s => s.isCompleted)
      .map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps, 10) || 0,
        ...(s.rir !== '' && { rir: parseFloat(s.rir) || 0 }),
        ...(isTimeBased && { time: parseInt(s.reps, 10) || s.time || 0 })
      }));

    const hr = bpmRef.current.trim() ? parseInt(bpmRef.current, 10) || undefined : undefined;
    if (completedClusters.length > 0) {
      onUpdateLog(exerciseName, completedClusters, notesRef.current, hr);
    }

    if (onFinishExercise) {
      onFinishExercise(exerciseName);
    }
  };

  // Add a new series row
  const handleAddSeries = () => {
    const current = seriesRef.current;
    const newIndex = current.length;
    const fallback = getGoalOrFallbackValues(newIndex);
    const lastRow = current[current.length - 1];

    const updated: LocalSeriesRow[] = [
      ...current,
      {
        id: generateUUID(),
        weight: fallback.weight || lastRow?.weight || '',
        reps: fallback.reps || lastRow?.reps || '',
        rir: fallback.rir || lastRow?.rir || '2',
        time: isTimeBased ? (parseInt(fallback.reps || lastRow?.reps || '30', 10) || 30) : 0,
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
              <span>Descanso: {inlineRest}s</span>
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
            {completedCount}/{series.length} {executionMethod === 'Clúster' ? 'clústeres' : 'series'}
          </span>
        </div>
      </div>

      {/* Inline Configuration Bar: Método & Descanso */}
      <div className="mb-3 bg-slate-950/60 rounded-xl p-2 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Execution Method Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Método:</span>
          {(['Normal', 'Clúster', 'Drop'] as TrainingType[]).map((m) => {
            const isSel = executionMethod === m;
            const label = m === 'Drop' ? 'Drop set' : m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setExecutionMethod(m)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                  isSel
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Rest selector */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Descanso:</span>
          {[30, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setInlineRest(sec)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                inlineRest === sec
                  ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Method Configuration (Only visible when Clúster or Drop set is active) */}
      {executionMethod === 'Clúster' && (
        <div className="mb-3 p-2 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-1 text-cyan-300 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configuración Clúster:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-slate-300 text-[11px]">
              <span>Micro-pausa:</span>
              <input
                type="number"
                value={clusterMicroRest}
                onChange={(e) => setClusterMicroRest(parseInt(e.target.value, 10) || 15)}
                className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-cyan-300 font-bold"
                min="5"
                max="60"
              />
              <span>s</span>
            </label>
            <label className="flex items-center gap-1 text-slate-300 text-[11px]">
              <span>Reps/bloque:</span>
              <input
                type="number"
                value={clusterBlockReps}
                onChange={(e) => setClusterBlockReps(parseInt(e.target.value, 10) || 2)}
                className="w-10 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-cyan-300 font-bold"
                min="1"
                max="10"
              />
            </label>
          </div>
        </div>
      )}

      {executionMethod === 'Drop' && (
        <div className="mb-3 p-2 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-1 text-amber-300 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configuración Drop Set:</span>
          </div>
          <label className="flex items-center gap-1 text-slate-300 text-[11px]">
            <span>Reducción de carga:</span>
            <input
              type="number"
              value={dropReductionPercent}
              onChange={(e) => setDropReductionPercent(parseInt(e.target.value, 10) || 20)}
              className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-amber-300 font-bold"
              min="5"
              max="50"
            />
            <span>%</span>
          </label>
        </div>
      )}

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
        <span>{executionMethod === 'Clúster' ? 'Agregar Clúster' : 'Agregar Serie'}</span>
      </button>

      {/* BPM Section (Registrar al finalizar el ejercicio) */}
      <div className={`mt-3.5 pt-3 border-t rounded-xl p-3 transition-all duration-200 ${
        isAllSeriesCompleted
          ? 'bg-rose-950/20 border-rose-500/30'
          : 'bg-slate-950/40 border-slate-800/60'
      }`}>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" />
            </div>
            <div className="flex items-center flex-wrap gap-1 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">BPM</span>
              <span className="text-[11px] sm:text-xs text-slate-400 truncate">
                Registrar al finalizar el ejercicio
              </span>
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
              className="w-16 sm:w-20 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-lg py-1.5 px-2 text-center text-sm font-bold text-white placeholder-slate-600 focus:outline-none transition-all"
            />
            <span className="text-xs font-semibold text-slate-400">BPM</span>
          </div>
        </div>
      </div>

      {/* Button: Finalizar ejercicio → (Al completar las series o registrar BPM) */}
      {(isAllSeriesCompleted || completedCount > 0) && (
        <div className="mt-3">
          <button
            type="button"
            id={`btn-finish-exercise-${exerciseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
            onClick={handleFinishExercise}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer ${
              isAllSeriesCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 active:scale-[0.99] animate-subtle-pulse ring-2 ring-emerald-400/60'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
            }`}
          >
            <span>Finalizar ejercicio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
