import React, { useState, FormEvent, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ExerciseLog, ExerciseGoal, ExerciseName, Cluster, ColorTheme, UserProfile, TrainingType } from '../types';
import { GoalProgress } from './GoalProgress';
import { HeartRateModal } from './HeartRateModal';
import { TimeScroller } from './TimeScroller';
import { isTimeBased as isTimeBasedUtil, isEffectivelyRepBased as isRepBasedUtil } from '../utils/exerciseUtils';
import { generateUUID } from '../utils/uuid';


interface ExerciseCardProps {
  exerciseName: ExerciseName;
  onCompleteExercise: (logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
  goal?: ExerciseGoal;
  progress?: { weight: number; reps: number; clusters: number; totalTime: number; heartRate?: number; };
  color: ColorTheme;
  userProfile: UserProfile | null;
  isCompletedToday: boolean;
  restBetweenSets: number;
  trainingType: TrainingType;
  isDisabled: boolean;
}

type LocalCluster = { id: string; weight: string; reps: string; time: number };

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
    onCompleteExercise, 
    goal, 
    progress, 
    color, 
    userProfile, 
    isCompletedToday, 
    restBetweenSets,
    trainingType,
    isDisabled
}) => {
  const [clusters, setClusters] = useState<LocalCluster[]>([{ id: generateUUID(), weight: '', reps: '', time: 0 }]);
  const [timeSeries, setTimeSeries] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingLog, setPendingLog] = useState<Omit<ExerciseLog, 'id' | 'timestamp' | 'heartRate' | 'perceivedExertion'> | null>(null);
  
  const [viewMode, setViewMode] = useState<'form' | 'completed'>(isCompletedToday ? 'completed' : 'form');
  
  // Intra-set rest timer state
  const [isIntraSetResting, setIsIntraSetResting] = useState(false);
  const [intraSetRestTimeLeft, setIntraSetRestTimeLeft] = useState(0);
  const intraSetRestEndTimeRef = useRef<number | null>(null);

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
        navigator.vibrate([150, 80, 150]);
      } catch {}
    }
  }, []);

  const isClusterMode = trainingType === 'Clúster';
  
  const isTimeBased = useMemo(() => isTimeBasedUtil(exerciseName), [exerciseName]);
  const isEffectivelyRepBased = useMemo(() => isRepBasedUtil(exerciseName, goal, trainingType), [exerciseName, goal, trainingType]);

  const lastCluster = useMemo(() => clusters.length > 0 ? clusters[clusters.length - 1] : null, [clusters]);

  const isAddSetDisabled = useMemo(() => {
    if (isClusterMode && clusters.length >= 5) {
        return true;
    }
    // Disable if the last cluster's reps are empty.
    if (lastCluster && lastCluster.reps.trim() === '') {
        return true;
    }
    return false;
  }, [isClusterMode, clusters.length, lastCluster]);

  const addSetDisabledTitle = useMemo(() => {
    if (isClusterMode && clusters.length >= 5) {
        return 'Máximo 5 clústeres por set';
    }
    if (lastCluster && lastCluster.reps.trim() === '') {
        return 'Completa las repeticiones para añadir otra serie';
    }
    return '';
  }, [isClusterMode, clusters.length, lastCluster]);


  useEffect(() => {
    setViewMode(isCompletedToday ? 'completed' : 'form');
  }, [isCompletedToday]);

  
  // Wall-clock timestamp driven intra-set countdown timer (survives phone screen lock and sleep)
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

    let wakeLockSentinel: any = null;
    if ('wakeLock' in navigator && typeof (navigator as any).wakeLock?.request === 'function') {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLockSentinel = lock;
      }).catch(() => {});
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isIntraSetResting, playRestCompleteChime]);

  const currentVolume = useMemo(() => {
    if (isTimeBased || isEffectivelyRepBased) return 0;
    return clusters.reduce((total, cluster) => {
      const weight = parseFloat(cluster.weight);
      const reps = parseInt(cluster.reps, 10);
      if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
        return total + (weight * reps);
      }
      return total;
    }, 0);
  }, [clusters, isTimeBased, isEffectivelyRepBased]);
  
  const currentTotalReps = useMemo(() => {
    if (!isEffectivelyRepBased) return 0;
     return clusters.reduce((total, cluster) => {
        const reps = parseInt(cluster.reps, 10);
        return total + (isNaN(reps) ? 0 : reps);
    }, 0);
  }, [clusters, isEffectivelyRepBased]);

  const currentTotalTime = useMemo(() => {
    if (!isTimeBased) return 0;
     return timeSeries.reduce((total, time) => total + time, 0);
  }, [timeSeries, isTimeBased]);

  const nextClusterGoal = useMemo(() => {
    if (!isClusterMode || !goal?.clusterGoals || goal.clusterGoals.length === 0) {
        return null;
    }
    // The index of the goal corresponds to the cluster row being filled.
    // If there's 1 row (index 0), we're aiming for the goal at index 0.
    const currentClusterIndex = clusters.length - 1;
    
    if (currentClusterIndex < goal.clusterGoals.length) {
        const clusterGoal = goal.clusterGoals[currentClusterIndex];
        // Only show if the goal has values
        if (clusterGoal && (clusterGoal.reps > 0 || clusterGoal.weight > 0)) {
            return clusterGoal;
        }
    }

    return null;
  }, [isClusterMode, goal, clusters]);

  const handleTextChange = (id: string, field: 'weight' | 'reps', value: string) => {
    setClusters(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };
  
  const addWeightRepCluster = () => {
    if (isAddSetDisabled) {
      return;
    }
    setClusters(prev => [...prev, { id: generateUUID(), weight: '', reps: '', time: 0 }]);
    if (restBetweenSets > 0) {
        intraSetRestEndTimeRef.current = Date.now() + restBetweenSets * 1000;
        setIntraSetRestTimeLeft(restBetweenSets);
        setIsIntraSetResting(true);
    }
  };

  const removeWeightRepCluster = (id: string) => {
    if (clusters.length > 1) {
      setClusters(prev => prev.filter(c => c.id !== id));
    }
  };

  const addTimeSeries = () => {
    if (currentTime > 0) {
        setTimeSeries(prev => [...prev, currentTime]);
        setCurrentTime(0);
        if (restBetweenSets > 0) {
            intraSetRestEndTimeRef.current = Date.now() + restBetweenSets * 1000;
            setIntraSetRestTimeLeft(restBetweenSets);
            setIsIntraSetResting(true);
        }
    }
  };

  const removeTimeSeries = (indexToRemove: number) => {
      setTimeSeries(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedClusters: Cluster[] = [];

    if (isTimeBased) {
        parsedClusters = timeSeries.map(time => ({ weight: 0, reps: 0, time }));
        if (parsedClusters.length === 0) {
            setError(`Debes registrar al menos una serie de ${isClusterMode ? 'clúster' : 'plancha'}.`);
            return;
        }
    } else if (isEffectivelyRepBased) {
        for (const cluster of clusters) {
            const parsedReps = parseInt(cluster.reps, 10);
            if (isNaN(parsedReps) || parsedReps <= 0) {
                setError('Por favor, ingresa un número de repeticiones válido y positivo.');
                return;
            }
            parsedClusters.push({ weight: 0, reps: parsedReps });
        }
    } else {
        for (const cluster of clusters) {
            const parsedWeight = parseFloat(cluster.weight);
            const parsedReps = parseInt(cluster.reps, 10);

            if (isNaN(parsedWeight) || isNaN(parsedReps) || parsedWeight < 0 || parsedReps <= 0) {
                setError('Por favor, ingresa valores válidos y positivos en todas las series.');
                return;
            }
            parsedClusters.push({ weight: parsedWeight, reps: parsedReps });
        }
    }

    if (parsedClusters.length === 0) {
      setError(`Debes registrar al menos un${isClusterMode ? ' clúster' : 'a serie'}.`);
      return;
    }

    setPendingLog({
      exerciseName,
      clusters: parsedClusters,
    });
    setIsModalOpen(true);
  };

  const handleFinalizeLog = (heartRate?: number, perceivedExertion?: number) => {
    if (pendingLog) {
      const finalLog = { 
        ...pendingLog, 
        ...(heartRate && { heartRate }),
        ...(perceivedExertion && { perceivedExertion })
      };
      onCompleteExercise(finalLog);
    }
    // Reset forms
    setClusters([{ id: generateUUID(), weight: '', reps: '', time: 0 }]);
    setTimeSeries([]);
    setCurrentTime(0);

    setIsModalOpen(false);
    setPendingLog(null);
    setViewMode('completed');
  };
  
  const handleSkipIntraSetRest = useCallback(() => {
    intraSetRestEndTimeRef.current = null;
    setIsIntraSetResting(false);
    setIntraSetRestTimeLeft(0);
  }, []);

  const renderIntraSetRestTimer = () => {
    if (!isIntraSetResting) return null;
    return (
        <div className="my-2 text-center p-3 bg-slate-900 rounded-lg border border-cyan-500/50 animate-fade-in">
            <p className="text-sm font-bold text-cyan-400">¡Descanso {isClusterMode ? 'entre clústeres' : ''}!</p>
            <p className="text-4xl font-mono font-bold text-white my-1">
                {formatSecondsToMMSS(intraSetRestTimeLeft)}
            </p>
            <button type="button" onClick={handleSkipIntraSetRest} className="text-xs text-slate-400 hover:text-white">Omitir</button>
        </div>
    );
  };


  const renderFeedback = () => {
      if (isTimeBased) {
        if (!goal?.totalTime || goal.totalTime <= 0 || currentTotalTime === 0) {
            return null;
        }
        const difference = currentTotalTime - goal.totalTime;

        if (difference > 0) {
            return <p className="text-amber-400 text-xs font-semibold animate-pulse">Tiempo excedido: +{difference}s</p>;
        }
        if (difference < 0) {
            return <p className="text-slate-400 text-xs">Tiempo no alcanzado: {difference}s</p>;
        }
        return <p className="text-green-400 text-xs font-semibold">¡Meta de tiempo alcanzada!</p>;
      }
      
      if (isEffectivelyRepBased) {
        const goalTotalReps = (goal?.reps || 0) * (goal?.series || 0);
        if (!goalTotalReps || goalTotalReps <= 0 || currentTotalReps === 0) {
            return null;
        }
        const difference = currentTotalReps - goalTotalReps;

        if (difference > 0) {
            return <p className="text-amber-400 text-xs font-semibold animate-pulse">Reps excedidas: +{difference}</p>;
        }
        if (difference < 0) {
            return <p className="text-slate-400 text-xs">Reps no alcanzadas: {difference}</p>;
        }
        return <p className="text-green-400 text-xs font-semibold">¡Meta de repeticiones alcanzada!</p>;
      }

      // Volume-based feedback
      const goalTotalVolume = trainingType === 'Clúster' && goal?.clusterGoals 
        ? goal.clusterGoals.reduce((sum, cg) => sum + (cg.weight * (cg.reps || 0)), 0)
        : (goal?.weight || 0) * (goal?.reps || 0) * (goal?.series || 0);

      if (!goalTotalVolume || goalTotalVolume <= 0 || currentVolume === 0) {
        return null;
      }
      const difference = currentVolume - goalTotalVolume;
      if (difference > 0) {
        return <p className="text-amber-400 text-xs font-semibold animate-pulse">Volumen excedido: +{difference.toLocaleString()}kg</p>;
      }
      if (difference < 0) {
        return <p className="text-slate-400 text-xs">Volumen no alcanzado: {difference.toLocaleString()}kg</p>;
      }
      return <p className="text-green-400 text-xs font-semibold">¡Meta de volumen alcanzada!</p>;
  };

  const renderTimeBasedForm = () => (
    <>
        <div className="space-y-1 mb-2 flex-grow">
            {timeSeries.map((time, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-md animate-fade-in">
                    <span className="text-slate-300 text-sm">Serie {index + 1}: <span className="font-mono font-bold text-white">{formatSecondsToMMSS(time)}</span></span>
                    <button type="button" onClick={() => removeTimeSeries(index)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            ))}
            {timeSeries.length === 0 && <p className="text-slate-500 text-center text-xs py-4">Añade tu primera serie de plancha.</p>}
        </div>
        {renderIntraSetRestTimer()}
        <div className="mb-2">
            <label className="block text-xs font-medium text-slate-300 mb-1 text-center">Añadir Tiempo de Serie</label>
            <TimeScroller value={currentTime} onChange={setCurrentTime} color={color} />
        </div>
        <button type="button" onClick={addTimeSeries} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium text-sm py-2 px-4 rounded-lg transition-colors duration-300">
            Añadir Serie
        </button>
    </>
  );

  const renderWeightRepForm = () => (
     <>
        <div className="space-y-1 flex-grow">
            {clusters.map((cluster, index) => (
            <div key={cluster.id} className="flex items-center gap-2 p-1.5 bg-slate-900/50 rounded-md">
                <span className="text-slate-400 font-bold text-sm pr-1">{isClusterMode ? 'Clúster ' : ''}{index + 1}</span>
                <div className="flex-1">
                    {isEffectivelyRepBased ? (
                        <div>
                        <label htmlFor={`reps-${cluster.id}`} className="sr-only">Reps</label>
                        <input
                            type="number"
                            id={`reps-${cluster.id}`}
                            value={cluster.reps}
                            onChange={(e) => handleTextChange(cluster.id, 'reps', e.target.value)}
                            placeholder="Reps"
                            min="1"
                            className={`w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
                            required
                        />
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                            <label htmlFor={`weight-${cluster.id}`} className="sr-only">Peso (Kg)</label>
                            <input
                                type="number"
                                id={`weight-${cluster.id}`}
                                value={cluster.weight}
                                onChange={(e) => handleTextChange(cluster.id, 'weight', e.target.value)}
                                placeholder="Kg"
                                min="0"
                                step="0.1"
                                className={`w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
                                required
                            />
                            </div>
                            <div className="flex-1">
                            <label htmlFor={`reps-${cluster.id}`} className="sr-only">Reps</label>
                            <input
                                type="number"
                                id={`reps-${cluster.id}`}
                                value={cluster.reps}
                                onChange={(e) => handleTextChange(cluster.id, 'reps', e.target.value)}
                                placeholder="Reps"
                                min="1"
                                className={`w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
                                required
                            />
                            </div>
                        </div>
                    )}
                </div>
                <button type="button" onClick={() => removeWeightRepCluster(cluster.id)} disabled={clusters.length <= 1} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50 disabled:hover:text-slate-400 transition-colors self-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                </button>
            </div>
            ))}
        </div>
        {renderIntraSetRestTimer()}
        {nextClusterGoal && (
            <div className="text-center text-sm text-slate-300 my-3 p-3 bg-slate-900 rounded-lg border border-slate-700 animate-fade-in">
                <span>Objetivo del Clúster: </span>
                <span className="font-bold text-amber-400">{nextClusterGoal.reps} reps</span>
                <span className="text-slate-400"> con </span>
                <span className="font-bold text-amber-400">{nextClusterGoal.weight} kg</span>
            </div>
        )}
        <button 
            type="button" 
            onClick={addWeightRepCluster} 
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium text-xs py-1.5 px-4 rounded-lg transition-colors duration-300 mt-1 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
            disabled={isAddSetDisabled}
            title={addSetDisabledTitle}
        >
            {isClusterMode ? 'Añadir Clúster' : 'Añadir Serie'}
        </button>
     </>
  );

  return (
    <>
      <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-4 flex flex-col h-full transform transition-all duration-300 ${isDisabled ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02]'}`}>
        <fieldset disabled={isDisabled} className="contents">
            <h2 className={`text-xl font-bold ${color.text} mb-3`}>{exerciseName}</h2>
            
            {goal && progress && <GoalProgress goal={goal} progress={progress} isTimeBased={isTimeBased} isRepBased={isEffectivelyRepBased} trainingType={trainingType} />}
            
            {viewMode === 'form' ? (
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col animate-fade-in">
                    <div className="flex-grow flex flex-col">
                        {isTimeBased ? renderTimeBasedForm() : renderWeightRepForm()}
                    </div>
                    <div className="mt-4 space-y-3">
                        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                        <div className="min-h-[1.25rem] text-center">{renderFeedback()}</div>
                        <button type="submit" className={`w-full ${color.bg} ${color.hoverBg} text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-md ${color.shadow}`}>
                            {isClusterMode ? 'Registrar Clúster Set' : 'Registrar Entrenamiento'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col items-center justify-center flex-grow py-8 animate-fade-in text-center">
                    <div className="bg-emerald-500/10 p-3 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-200">Entrenamiento Registrado</h3>
                    <p className="text-slate-400 text-sm mb-6">¡Buen trabajo!</p>
                    <button 
                        onClick={() => setViewMode('form')}
                        className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        Editar Entrenamiento
                    </button>
                </div>
            )}
        </fieldset>
      </div>
      <HeartRateModal
        isOpen={isModalOpen}
        onClose={() => handleFinalizeLog()}
        onSave={handleFinalizeLog}
        exerciseName={exerciseName}
        color={color}
        userProfile={userProfile}
      />
    </>
  );
};