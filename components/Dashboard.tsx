import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { ExerciseLog, ExerciseName, Goals, UserProfile, UserRoutine, RestSettings, TrainingType } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { getExerciseColor } from '../colors';
import { GoalSetter } from './GoalSetter';
import { UserProfile as UserProfileComponent } from './UserProfile';
import { RestSettings as RestSettingsComponent } from './RestSettings';
import { FloatingRestTimer } from './FloatingRestTimer';


interface DashboardProps {
  logs: ExerciseLog[];
  goals: Goals;
  userProfile: UserProfile | null;
  userRoutine: UserRoutine | null;
  restSettings: RestSettings;
  trainingType: TrainingType;
  onLog: (logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
  onSetGoals: (goals: Goals) => void;
  onSaveProfile: (profile: UserProfile) => void;
  onSaveRestSettings: (settings: RestSettings) => void;
  onSetTrainingType: (type: TrainingType) => void;
  onViewHistory: () => void;
  onGoToSettings: () => void;
  onEditRoutine: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  logs, 
  goals, 
  userProfile, 
  userRoutine,
  restSettings,
  trainingType,
  onLog, 
  onSetGoals, 
  onSaveProfile,
  onSaveRestSettings,
  onSetTrainingType,
  onViewHistory,
  onGoToSettings,
  onEditRoutine,
}) => {
  const [interExerciseRestActive, setInterExerciseRestActive] = useState(false);
  const [interExerciseRestTimeLeft, setInterExerciseRestTimeLeft] = useState(0);
  const interExerciseRestEndTimeRef = useRef<number | null>(null);
  const prevLogsLengthRef = useRef(logs.length);

  const playRestCompleteChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Note 1 (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.22, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch {}

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }
  }, []);

  const completedExercisesToday = useMemo(() => {
    return new Set((logs || []).filter(log => log && log.exerciseName).map(log => log.exerciseName));
  }, [logs]);

  const routineExercises = useMemo(() => {
    return Array.isArray(userRoutine?.exercises) ? userRoutine.exercises : [];
  }, [userRoutine]);

  const isRoutineFinished = useMemo(() => {
    if (routineExercises.length === 0) {
        return false;
    }
    // Check if the number of unique completed exercises matches the number of exercises in the routine
    if (completedExercisesToday.size < routineExercises.length) {
        return false;
    }
    // Verify that every exercise in the routine is in the completed set
    return routineExercises.every(ex => completedExercisesToday.has(ex));
  }, [routineExercises, completedExercisesToday]);

  useEffect(() => {
    // Only reset if logs were explicitly cleared from a non-empty state
    if (prevLogsLengthRef.current > 0 && logs.length === 0) {
        interExerciseRestEndTimeRef.current = null;
        setInterExerciseRestActive(false);
        setInterExerciseRestTimeLeft(0);
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs.length]);

  // Wall-clock timestamp driven countdown: continues accurately even when phone screen turns off or locks
  useEffect(() => {
    if (!interExerciseRestActive) {
      return;
    }

    const durationSec = Number(restSettings?.restBetweenExercises) || 30;
    if (!interExerciseRestEndTimeRef.current) {
      interExerciseRestEndTimeRef.current = Date.now() + durationSec * 1000;
    }

    const updateTimer = () => {
      if (!interExerciseRestEndTimeRef.current) return;
      const remainingMs = interExerciseRestEndTimeRef.current - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      setInterExerciseRestTimeLeft(remainingSecs);

      if (remainingSecs <= 0) {
        interExerciseRestEndTimeRef.current = null;
        setInterExerciseRestActive(false);
        playRestCompleteChime();
      }
    };

    // Immediate check
    updateTimer();

    // High frequency interval (250ms) to ensure responsive display without drift
    const interval = window.setInterval(updateTimer, 250);

    // Instant synchronization when unlocking phone or switching back to the app
    const handleVisibilityOrFocus = () => {
      updateTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);

    // Request Screen Wake Lock if supported to prevent premature screen turn-off during rest
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
  }, [interExerciseRestActive, playRestCompleteChime, restSettings?.restBetweenExercises]);


  const progressData = useMemo(() => {
    const data: Record<string, { weight: number; reps: number; clusters: number; totalTime: number; heartRate?: number; lastLogWithHrTimestamp?: string; }> = {};
    
    (logs || []).forEach(log => {
        if (!log || !log.exerciseName) return;
        if (!data[log.exerciseName]) {
          data[log.exerciseName] = { weight: 0, reps: 0, clusters: 0, totalTime: 0 };
        }
        const clusters = Array.isArray(log.clusters) ? log.clusters : [];
        data[log.exerciseName].clusters += clusters.length;
        clusters.forEach(cluster => {
            const w = Number(cluster?.weight) || 0;
            const r = Number(cluster?.reps) || 0;
            const t = Number(cluster?.time) || 0;
            data[log.exerciseName].weight += w * r;
            data[log.exerciseName].reps += r;
            data[log.exerciseName].totalTime += t;
        });

        if (log.heartRate) {
          if (!data[log.exerciseName].lastLogWithHrTimestamp || log.timestamp > data[log.exerciseName].lastLogWithHrTimestamp!) {
              data[log.exerciseName].heartRate = Number(log.heartRate);
              data[log.exerciseName].lastLogWithHrTimestamp = log.timestamp;
          }
        }
      });

    Object.values(data).forEach(d => delete d.lastLogWithHrTimestamp);
    return data;
  }, [logs]);

  const exercisesForDisplay = useMemo(() => {
      return userRoutine?.exercises || [];
  }, [userRoutine]);
  
  const handleCompleteExercise = useCallback((logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => {
    onLog(logData);

    // We need to check for completion here to decide whether to start the rest timer.
    // The state `isRoutineFinished` won't be updated yet in this render cycle.
    const currentCompleted = new Set(logs.map(l => l.exerciseName));
    currentCompleted.add(logData.exerciseName);
    const routineExs = Array.isArray(userRoutine?.exercises) ? userRoutine.exercises : [];
    const allExercisesCompleted = routineExs.length > 0 && routineExs.every(ex => currentCompleted.has(ex));

    const durationSec = Number(restSettings?.restBetweenExercises) || 0;
    const isAutoMode = restSettings?.mode !== 'manual';

    if (!allExercisesCompleted && isAutoMode && durationSec > 0) {
        interExerciseRestEndTimeRef.current = Date.now() + durationSec * 1000;
        setInterExerciseRestTimeLeft(durationSec);
        setInterExerciseRestActive(true);
    }
  }, [onLog, restSettings, userRoutine, logs]);

  const handleProfileSaveFromComponent = useCallback((profileData: Omit<UserProfile, 'id'>) => {
    if (userProfile) {
      onSaveProfile({
        id: userProfile.id,
        ...profileData,
      });
    }
  }, [userProfile, onSaveProfile]);
  
  const handleSkipInterExerciseRest = useCallback(() => {
    interExerciseRestEndTimeRef.current = null;
    setInterExerciseRestActive(false);
    setInterExerciseRestTimeLeft(0);
  }, []);

  const exerciseElements = useMemo(() => {
    return exercisesForDisplay.map((exercise) => (
        <ExerciseCard
          key={exercise}
          exerciseName={exercise}
          onCompleteExercise={handleCompleteExercise}
          goal={goals[exercise]}
          progress={progressData[exercise]}
          isCompletedToday={completedExercisesToday.has(exercise)}
          color={getExerciseColor(exercise)}
          userProfile={userProfile}
          restBetweenSets={restSettings.restBetweenSets}
          trainingType={trainingType}
          isDisabled={interExerciseRestActive}
        />
    ));
  }, [
      exercisesForDisplay, 
      handleCompleteExercise, 
      goals, 
      progressData, 
      userProfile, 
      restSettings, 
      trainingType, 
      completedExercisesToday, 
      interExerciseRestActive
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
        <UserProfileComponent profile={userProfile} onSave={handleProfileSaveFromComponent} />
        
        <RestSettingsComponent settings={restSettings} onSave={onSaveRestSettings} />

        <GoalSetter 
            exercises={exercisesForDisplay} 
            currentGoals={goals} 
            onSetGoals={onSetGoals} 
            trainingType={trainingType}
            onSetTrainingType={onSetTrainingType}
        />

        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold text-slate-200">
                    Ejercicios de Hoy: <span className="text-cyan-400">{userRoutine?.type} - {userRoutine?.focus}</span>
                </h2>
                <button 
                    onClick={onEditRoutine} 
                    className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    aria-label="Añadir o editar ejercicios"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                    Añadir / Editar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {exerciseElements.length > 0 ? (
                exerciseElements
            ) : (
                <div className="md:col-span-2 xl:col-span-3 text-center bg-slate-800/50 p-8 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-300">No hay ejercicios en esta rutina.</h3>
                    <p className="text-slate-400 mt-2">Vuelve a la configuración para añadir ejercicios a tu rutina personalizada.</p>
                </div>
            )}
            </div>

            {isRoutineFinished && (
                <div className="mt-12 text-center animate-fade-in-up bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl shadow-lg p-8">
                    <div className="flex justify-center mb-4">
                    <div className="bg-emerald-500/10 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-400">¡Rutina Completada!</h3>
                    <p className="text-slate-400 mt-2 mb-6">Excelente trabajo. Revisa tus resultados para ver tu progreso.</p>
                    <button
                        onClick={onViewHistory}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/40 text-lg"
                    >
                        Finalizar Rutina y Ver Resultados
                    </button>
                </div>
            )}

            {!isRoutineFinished && completedExercisesToday.size > 0 && (
                 <div className="mt-12 text-center animate-fade-in-up bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-8">
                    <h3 className="text-xl font-bold text-amber-400">¿Deseas finalizar la sesión?</h3>
                    <p className="text-slate-400 mt-2 mb-6">Tu progreso se guardará, pero la rutina quedará marcada como incompleta.</p>
                    <button
                        onClick={onViewHistory}
                        className="bg-rose-700 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 text-lg"
                        aria-label="Finalizar sesión de entrenamiento ahora"
                    >
                        Finalizar Sesión Ahora
                    </button>
                </div>
            )}
        </div>
        <FloatingRestTimer
            isActive={interExerciseRestActive}
            timeLeft={interExerciseRestTimeLeft}
            totalDuration={restSettings.restBetweenExercises}
            onSkip={handleSkipInterExerciseRest}
        />
    </div>
  );
};