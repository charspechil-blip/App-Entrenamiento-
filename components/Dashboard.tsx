import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { ExerciseLog, ExerciseName, Goals, UserProfile, UserRoutine, RestSettings, TrainingType, Cluster } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { getExerciseColor } from '../colors';
import { UserProfile as UserProfileComponent } from './UserProfile';
import { RestTimerModal } from './RestTimerModal';
import { Clock, Dumbbell, Layers, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  logs: ExerciseLog[];
  allLogs?: ExerciseLog[];
  sessionStartTime?: Date | null;
  onStartSession?: () => void;
  goals: Goals;
  userProfile: UserProfile | null;
  userRoutine: UserRoutine | null;
  restSettings: RestSettings;
  trainingType: TrainingType;
  onLog: (logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
  onUpdateExerciseLog?: (exerciseName: ExerciseName, clusters: Cluster[], notes?: string, heartRate?: number) => void;
  onSetGoals: (goals: Goals) => void;
  onSaveProfile: (profile: UserProfile) => void;
  onSaveRestSettings: (settings: RestSettings) => void;
  onSetTrainingType: (type: TrainingType) => void;
  onViewHistory: () => void;
  onFinishSession?: (durationSeconds: number, interExerciseRestSeconds: number) => void;
  onGoToSettings: () => void;
  onEditRoutine: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  logs, 
  allLogs = [],
  sessionStartTime,
  onStartSession,
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
  onFinishSession,
  onGoToSettings,
  onEditRoutine,
}) => {
  const [interExerciseRestActive, setInterExerciseRestActive] = useState(false);
  const [nextExerciseForRest, setNextExerciseForRest] = useState<string | null>(null);
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

  const handleFinishClick = () => {
    // Exact duration from the active session stopwatch
    const duration = elapsedSeconds;

    // Sum of rests between exercises, strictly excluding series micro-rests
    const completedExercisesCount = (logs || []).filter(l => Array.isArray(l.clusters) && l.clusters.length > 0).length;
    const interRestPerTransition = Number(restSettings?.restBetweenExercises) || 180;
    const totalInterExerciseRests = Math.max(0, completedExercisesCount - 1) * interRestPerTransition;

    if (onFinishSession) {
      onFinishSession(duration, totalInterExerciseRests);
    } else {
      onViewHistory();
    }
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

  // Look up previous session log for this exercise strictly within the current routine
  const getPreviousSessionLog = useCallback((exerciseName: ExerciseName): ExerciseLog | null => {
    const cutoffTime = sessionStartTime ? new Date(sessionStartTime).getTime() : new Date().setHours(0, 0, 0, 0);
    const currentRoutineId = userRoutine?.id;
    const currentRoutineName = userRoutine?.name?.trim().toLowerCase();

    const pastLogs = (allLogs || []).filter(l => {
      if (l.exerciseName !== exerciseName) return false;
      if (new Date(l.timestamp).getTime() >= cutoffTime) return false;

      // Routine isolation:
      // If current routine has an id, check if log has matching routineId
      if (currentRoutineId && l.routineId) {
        return l.routineId === currentRoutineId;
      }
      // If current routine has a name, check if log has matching routineName
      if (currentRoutineName && l.routineName) {
        return l.routineName.trim().toLowerCase() === currentRoutineName;
      }
      // If log belongs to an explicitly different routine, do NOT match
      if (l.routineName && currentRoutineName && l.routineName.trim().toLowerCase() !== currentRoutineName) {
        return false;
      }
      if (l.routineId && currentRoutineId && l.routineId !== currentRoutineId) {
        return false;
      }
      // If current routine is a specific saved/named routine, do not include legacy unclassified logs
      if (currentRoutineId || currentRoutineName) {
        return false;
      }

      return true;
    });

    if (pastLogs.length === 0) return null;
    pastLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return pastLogs[0];
  }, [allLogs, sessionStartTime, userRoutine]);

  const handleStartWorkout = useCallback(() => {
    if (onStartSession) {
      onStartSession();
    }
  }, [onStartSession]);

  const handleExerciseLogUpdate = useCallback((exerciseName: ExerciseName, clusters: Cluster[], notes?: string, heartRate?: number) => {
    if (!sessionStartTime && onStartSession) {
      onStartSession();
    }
    if (onUpdateExerciseLog) {
      onUpdateExerciseLog(exerciseName, clusters, notes, heartRate);
    } else {
      onLog({
        exerciseName,
        clusters,
        notes,
        heartRate
      });
    }
  }, [onUpdateExerciseLog, onLog, sessionStartTime, onStartSession]);

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
  
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  const handleSkipInterExerciseRest = useCallback(() => {
    interExerciseRestEndTimeRef.current = null;
    setInterExerciseRestActive(false);
    setInterExerciseRestTimeLeft(0);
  }, []);

  const handleSaveDefaultRestDuration = useCallback((newSec: number) => {
    onSaveRestSettings({
      ...restSettings,
      restBetweenExercises: newSec,
    });
  }, [restSettings, onSaveRestSettings]);

  const handleFinishExerciseInDashboard = useCallback((finishedExercise: ExerciseName) => {
    const currentIndex = exercisesForDisplay.indexOf(finishedExercise);
    let nextEx: string | null = null;
    if (currentIndex >= 0 && currentIndex < exercisesForDisplay.length - 1) {
      nextEx = exercisesForDisplay[currentIndex + 1];
    }
    setNextExerciseForRest(nextEx);
    setInterExerciseRestActive(true);

    if (nextEx) {
      const safeId = `exercise-card-${nextEx.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
      setTimeout(() => {
        const nextEl = document.getElementById(safeId);
        if (nextEl) {
          nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [exercisesForDisplay]);

  const exerciseElements = useMemo(() => {
    return exercisesForDisplay.map((exercise) => {
      const prevLog = getPreviousSessionLog(exercise);
      const currLog = logs.find(l => l.exerciseName === exercise) || null;
      const routineKey = userRoutine?.id || userRoutine?.name || 'routine';
      const safeId = `exercise-card-${exercise.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

      return (
        <div key={`${routineKey}_${exercise}`} id={safeId} className="transition-all">
          <ExerciseCard
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
            onFinishExercise={handleFinishExerciseInDashboard}
            isDisabled={interExerciseRestActive}
          />
        </div>
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
    handleFinishExerciseInDashboard,
    interExerciseRestActive,
    userRoutine
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick toggle for advanced settings/profile (keeps main training view clear and immediate) */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold text-slate-300">
          Rutina: <span className="text-cyan-400 font-bold">{userRoutine?.name || 'Entrenamiento del día'}</span>
        </span>
        <button
          type="button"
          onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
          className="hover:text-cyan-400 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <span>👤</span>
          <span>{showAdvancedConfig ? 'Ocultar perfil' : 'Perfil de usuario'}</span>
        </button>
      </div>

      {showAdvancedConfig && (
        <div className="space-y-6 animate-fade-in bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
          <UserProfileComponent profile={userProfile} onSave={handleProfileSaveFromComponent} />
        </div>
      )}

      {/* Botón Comenzar Entrenamiento */}
      <div id="section-start-training" className="animate-fade-in">
        {!sessionStartTime ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm text-center">
            <div className="max-w-md mx-auto space-y-2.5">
              <button
                type="button"
                id="btn-comenzar-entrenamiento"
                onClick={handleStartWorkout}
                disabled={exercisesForDisplay.length === 0}
                className={`w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-lg ${
                  exercisesForDisplay.length > 0
                    ? 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-cyan-500/25 active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-black/15 flex items-center justify-center text-xl flex-shrink-0">
                  🏋️
                </div>
                <span>Comenzar entrenamiento</span>
              </button>
              {exercisesForDisplay.length === 0 ? (
                <p className="text-xs text-amber-400 font-medium">
                  Agrega al menos un ejercicio a tu rutina para habilitar el entrenamiento.
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Toca para iniciar el contador de tiempo real de tu sesión.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 px-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-sm font-bold text-emerald-300">Entrenamiento en Curso</span>
                <span className="text-xs text-slate-400 ml-2 hidden sm:inline">Cronómetro activo</span>
              </div>
            </div>
            <div className="font-mono text-sm font-bold text-cyan-400 bg-slate-950/70 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatElapsedDuration(elapsedSeconds)}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        {/* Workout Live Header Bar (Hevy-Style) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${sessionStartTime ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  {sessionStartTime ? 'Entreno Activo:' : 'Rutina Preparada:'} <span className="text-cyan-400">{userRoutine?.name || `${userRoutine?.type} - ${userRoutine?.focus}`}</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {sessionStartTime 
                  ? 'Marca cada serie con ✓ al completarla. Guarda al terminar abajo o arriba.' 
                  : 'Pulsa "Comenzar entrenamiento" arriba para iniciar el contador de tiempo de tu sesión.'}
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
                onClick={handleFinishClick}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm py-2 px-4 rounded-xl transition-all shadow-md shadow-cyan-600/30 flex items-center gap-1.5 cursor-pointer"
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
                onClick={handleFinishClick}
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
                onClick={handleFinishClick}
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

      <RestTimerModal
        isOpen={interExerciseRestActive}
        onClose={() => setInterExerciseRestActive(false)}
        nextExerciseName={nextExerciseForRest}
        defaultDurationSec={restSettings.restBetweenExercises || 180}
        onSaveDefaultDuration={handleSaveDefaultRestDuration}
        onRestComplete={() => {
          setInterExerciseRestActive(false);
        }}
      />
    </div>
  );
};
