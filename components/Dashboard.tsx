import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { ExerciseLog, ExerciseName, Goals, UserProfile, UserRoutine, RestSettings, TrainingType, Cluster } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { getExerciseColor } from '../colors';
import { GoalSetter } from './GoalSetter';
import { UserProfile as UserProfileComponent } from './UserProfile';
import { FloatingRestTimer } from './FloatingRestTimer';
import { Clock, Dumbbell, Layers, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  logs: ExerciseLog[];
  allLogs?: ExerciseLog[];
  sessionStartTime?: Date | null;
  goals: Goals;
  userProfile: UserProfile | null;
  userRoutine: UserRoutine | null;
  restSettings: RestSettings;
  trainingType: TrainingType;
  onLog: (logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
  onUpdateExerciseLog?: (exerciseName: ExerciseName, clusters: Cluster[], notes?: string) => void;
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
  allLogs = [],
  sessionStartTime,
  goals, 
  userProfile, 
  userRoutine,
  restSettings,
  trainingType,
  onLog, 
  onUpdateExerciseLog,
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

  // Live session duration counter
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!sessionStartTime) {
      setElapsedSeconds(0);
      return;
    }
    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 1000));
      setElapsedSeconds(diff);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const formatElapsedDuration = (totalSec: number): string => {
    if (totalSec < 60) return `${totalSec}s`;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

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

      // Note 2 (G5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.2);
      gain2.gain.setValueAtTime(0.22, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.7);
    } catch {}

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }
  }, []);

  const routineExercises = useMemo(() => {
    return Array.isArray(userRoutine?.exercises) ? userRoutine.exercises : [];
  }, [userRoutine]);

  const completedExercisesToday = useMemo(() => {
    return new Set(logs.map(log => log.exerciseName));
  }, [logs]);

  // Total session stats
  const { totalSessionVolume, totalCompletedSeries } = useMemo(() => {
    let vol = 0;
    let sCount = 0;
    (logs || []).forEach(log => {
      (log.clusters || []).forEach(c => {
        const w = Number(c.weight) || 0;
        const r = Number(c.reps) || 0;
        vol += w * r;
        sCount += 1;
      });
    });
    return { totalSessionVolume: vol, totalCompletedSeries: sCount };
  }, [logs]);

  const isRoutineFinished = useMemo(() => {
    if (!routineExercises || routineExercises.length === 0) {
      return false;
    }
    if (completedExercisesToday.size < routineExercises.length) {
      return false;
    }
    return routineExercises.every(ex => completedExercisesToday.has(ex));
  }, [routineExercises, completedExercisesToday]);

  // Wall-clock countdown timer for inter-exercise rest
  useEffect(() => {
    if (!interExerciseRestActive) return;

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
  }, [interExerciseRestActive, playRestCompleteChime, restSettings?.restBetweenExercises]);

  const exercisesForDisplay = useMemo(() => {
    return userRoutine?.exercises || [];
  }, [userRoutine]);

  // Look up previous session log for this exercise
  const getPreviousSessionLog = useCallback((exerciseName: ExerciseName): ExerciseLog | null => {
    const cutoffTime = sessionStartTime ? new Date(sessionStartTime).getTime() : new Date().setHours(0, 0, 0, 0);
    const pastLogs = (allLogs || []).filter(l => 
      l.exerciseName === exerciseName && new Date(l.timestamp).getTime() < cutoffTime
    );
    if (pastLogs.length === 0) return null;
    pastLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return pastLogs[0];
  }, [allLogs, sessionStartTime]);

  const handleExerciseLogUpdate = useCallback((exerciseName: ExerciseName, clusters: Cluster[], notes?: string) => {
    if (onUpdateExerciseLog) {
      onUpdateExerciseLog(exerciseName, clusters, notes);
    } else {
      onLog({
        exerciseName,
        clusters,
        notes
      });
    }
  }, [onUpdateExerciseLog, onLog]);

  const handleTriggerInterExerciseRest = useCallback(() => {
    const durationSec = Number(restSettings?.restBetweenExercises) || 0;
    const isAutoMode = restSettings?.mode !== 'manual';
    if (isAutoMode && durationSec > 0) {
      interExerciseRestEndTimeRef.current = Date.now() + durationSec * 1000;
      setInterExerciseRestTimeLeft(durationSec);
      setInterExerciseRestActive(true);
    }
  }, [restSettings]);

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
    return exercisesForDisplay.map((exercise) => {
      const prevLog = getPreviousSessionLog(exercise);
      const currLog = logs.find(l => l.exerciseName === exercise) || null;

      return (
        <ExerciseCard
          key={exercise}
          exerciseName={exercise}
          previousLog={prevLog}
          currentLog={currLog}
          onUpdateLog={handleExerciseLogUpdate}
          goal={goals[exercise]}
          color={getExerciseColor(exercise)}
          userProfile={userProfile}
          restBetweenSets={restSettings.restBetweenSets}
          trainingType={trainingType}
          autoRest={restSettings.mode === 'auto'}
          onTriggerInterExerciseRest={handleTriggerInterExerciseRest}
          isDisabled={interExerciseRestActive}
        />
      );
    });
  }, [
    exercisesForDisplay, 
    getPreviousSessionLog, 
    logs, 
    handleExerciseLogUpdate, 
    goals, 
    userProfile, 
    restSettings, 
    trainingType, 
    handleTriggerInterExerciseRest, 
    interExerciseRestActive
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <UserProfileComponent profile={userProfile} onSave={handleProfileSaveFromComponent} />

      <GoalSetter 
        exercises={exercisesForDisplay} 
        currentGoals={goals} 
        onSetGoals={onSetGoals} 
        trainingType={trainingType}
        onSetTrainingType={onSetTrainingType}
        restSettings={restSettings}
        onSaveRestSettings={onSaveRestSettings}
      />

      <div>
        {/* Workout Live Header Bar (Hevy-Style) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  Entreno Activo: <span className="text-cyan-400">{userRoutine?.type} - {userRoutine?.focus}</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Marca cada serie con <span className="text-emerald-400 font-bold">✓</span> al completarla. Guarda al terminar abajo o arriba.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={onEditRoutine} 
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60"
                aria-label="Añadir o editar ejercicios"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                Editar Rutina
              </button>

              <button
                onClick={onViewHistory}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm py-2 px-4 rounded-xl transition-all shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
                aria-label="Terminar sesión"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terminar</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar: Duración | Volumen | Series */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-center">
            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
              <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Duración</span>
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-cyan-400 mt-0.5">
                {formatElapsedDuration(elapsedSeconds)}
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
              <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Dumbbell className="w-3 h-3 text-amber-400" />
                <span>Volumen</span>
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-amber-400 mt-0.5">
                {totalSessionVolume.toLocaleString()} kg
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
              <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>Series</span>
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-emerald-400 mt-0.5">
                {totalCompletedSeries}
              </div>
            </div>
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exerciseElements.length > 0 ? (
            exerciseElements
          ) : (
            <div className="md:col-span-2 xl:col-span-3 text-center bg-slate-900/60 border border-slate-800 p-8 rounded-2xl">
              <h3 className="text-lg font-semibold text-slate-300">No hay ejercicios en esta rutina.</h3>
              <p className="text-slate-400 mt-2">Vuelve a la configuración para añadir ejercicios a tu rutina personalizada.</p>
            </div>
          )}
        </div>

        {/* Finalize / Save Session Card at the Bottom */}
        <div className="mt-12 text-center animate-fade-in bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 max-w-2xl mx-auto">
          {isRoutineFinished ? (
            <>
              <div className="flex justify-center mb-3">
                <div className="bg-emerald-500/10 p-3.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-emerald-400">¡Rutina Completada!</h3>
              <p className="text-slate-400 text-sm mt-1.5 mb-6">
                Has completado todos los ejercicios programados ({completedExercisesToday.size} de {routineExercises.length}). Tus datos ya están guardados.
              </p>
              <button
                onClick={onViewHistory}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/40 text-base sm:text-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <CheckCircle2 className="h-5 w-5" />
                Finalizar Sesión y Guardar Ahora
              </button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-slate-100">
                {totalCompletedSeries > 0 ? '¿Terminaste tu entrenamiento?' : 'Sesión de Entrenamiento'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-6 max-w-md mx-auto">
                {totalCompletedSeries > 0 
                  ? `Llevas ${totalCompletedSeries} series completadas en ${completedExercisesToday.size} ejercicios con un volumen de ${totalSessionVolume.toLocaleString()} kg.` 
                  : 'Registra tus series marcando las casillas con ✓. Puedes finalizar y guardar tu sesión en cualquier momento.'}
              </p>
              <button
                onClick={onViewHistory}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 text-base sm:text-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
                aria-label="Guardar sesión de entrenamiento ahora"
              >
                <CheckCircle2 className="h-5 w-5" />
                {totalCompletedSeries > 0 ? 'Guardar Sesión Ahora' : 'Finalizar Sesión Ahora'}
              </button>
            </>
          )}
        </div>
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
