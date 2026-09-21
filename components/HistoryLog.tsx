import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { ExerciseLog, Goals, UserProfile, ExerciseName, Cluster, SessionAnalysisMetrics } from '../types';
import { ProgressChart } from './ProgressChart';
import { DeleteModal } from './DeleteModal';
import { generateHistoryPdf } from '../services/pdfGenerator';
import { AIAnalysisCard } from './AIAnalysisCard';

interface HistoryLogProps {
  logs: ExerciseLog[];
  goals: Goals;
  userProfile: UserProfile | null;
  lastFinishedSessionMetrics?: { sessionId: string; durationSeconds: number; interExerciseRestSeconds: number } | null;
  onDelete: (logIdsToDelete: string[]) => void;
  onOpenManualLog: () => void;
  onSelectExercise: (exercise: ExerciseName) => void;
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatTotalHoursMinutes = (milliseconds: number): string => {
    if (isNaN(milliseconds) || milliseconds < 0) return '0 horas, 0 min';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    return `${hours} horas, ${minutes} min`;
};

const formatSessionDuration = (milliseconds: number): string => {
    if (isNaN(milliseconds) || milliseconds < 0) return 'N/A';
    if (milliseconds < 60000) return '< 1 min';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);
    
    return parts.join(' ');
};

const formatSessionStopwatch = (totalSec: number): string => {
    if (isNaN(totalSec) || totalSec <= 0) return '0s';
    if (totalSec < 60) return `${totalSec}s`;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins < 60) {
        return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
};


export const HistoryLog: React.FC<HistoryLogProps> = ({ 
    logs, 
    goals, 
    userProfile, 
    lastFinishedSessionMetrics,
    onDelete, 
    onOpenManualLog, 
    onSelectExercise 
}) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
    const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
    
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const { logsBySession, sortedSessionKeys, uniqueExercises } = useMemo(() => {
        // Group logs into discrete workout sessions
        const sessionMap: Record<string, ExerciseLog[]> = {};
        const exercises = new Set<ExerciseName>();
        
        // 1. Group logs with explicit sessionId
        const explicitSessionLogs = (logs || []).filter(l => Boolean(l.sessionId));
        explicitSessionLogs.forEach(log => {
            const sId = log.sessionId!;
            if (!sessionMap[sId]) sessionMap[sId] = [];
            sessionMap[sId].push(log);
            exercises.add(log.exerciseName);
        });

        // 2. Group legacy logs without sessionId by discrete workout window (within 45 min on same day)
        const legacyLogs = (logs || []).filter(l => !l.sessionId);
        const sortedLegacy = [...legacyLogs].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        let currentLegacyGroup: ExerciseLog[] = [];
        let currentLegacyKey = '';

        sortedLegacy.forEach(log => {
            exercises.add(log.exerciseName);
            const logTime = new Date(log.timestamp).getTime();
            const logDate = formatDate(log.timestamp);

            if (currentLegacyGroup.length === 0) {
                currentLegacyGroup = [log];
                currentLegacyKey = `legacy_${logDate}_${logTime}`;
                sessionMap[currentLegacyKey] = currentLegacyGroup;
            } else {
                const prevLog = currentLegacyGroup[currentLegacyGroup.length - 1];
                const prevTime = new Date(prevLog.timestamp).getTime();
                const prevDate = formatDate(prevLog.timestamp);
                const timeDiffMs = Math.abs(prevTime - logTime);
                const sameRoutine = (!log.routineId || !prevLog.routineId || log.routineId === prevLog.routineId);

                // Cluster if within 45 minutes, same day, and same routine
                if (prevDate === logDate && timeDiffMs <= 45 * 60 * 1000 && sameRoutine) {
                    currentLegacyGroup.push(log);
                } else {
                    currentLegacyGroup = [log];
                    currentLegacyKey = `legacy_${logDate}_${logTime}`;
                    sessionMap[currentLegacyKey] = currentLegacyGroup;
                }
            }
        });

        // 3. Build sorted session keys
        const sortedKeys = Object.keys(sessionMap).sort((keyA, keyB) => {
            const logsA = sessionMap[keyA] || [];
            const logsB = sessionMap[keyB] || [];
            const timeA = Math.max(...logsA.map(l => new Date(l.timestamp).getTime()), 0);
            const timeB = Math.max(...logsB.map(l => new Date(l.timestamp).getTime()), 0);
            return timeB - timeA;
        });

        // If lastFinishedSessionMetrics exists, prioritize that session at the top
        if (lastFinishedSessionMetrics?.sessionId) {
            const matchIdx = sortedKeys.findIndex(k => k === lastFinishedSessionMetrics.sessionId);
            if (matchIdx > 0) {
                const [matched] = sortedKeys.splice(matchIdx, 1);
                sortedKeys.unshift(matched);
            }
        }

        return { 
            logsBySession: sessionMap, 
            sortedSessionKeys: sortedKeys, 
            uniqueExercises: Array.from(exercises).sort() 
        };
    }, [logs, lastFinishedSessionMetrics]);

    const latestSessionMetrics = useMemo((): SessionAnalysisMetrics | null => {
        if (sortedSessionKeys.length === 0) return null;

        const latestSessionKey = sortedSessionKeys[0];
        const sessionLogs = logsBySession[latestSessionKey] || [];
        if (sessionLogs.length === 0) return null;

        // 1. Calculate latest session volume and volume by exercise (THIS session only!)
        const exerciseMap = new Map<string, { volume: number; sets: number; reps: number }>();
        let totalVolume = 0;
        let totalSets = 0;

        sessionLogs.forEach(log => {
            const clusters = Array.isArray(log.clusters) ? log.clusters : [];
            const exName = log.exerciseName;
            const current = exerciseMap.get(exName) || { volume: 0, sets: 0, reps: 0 };

            clusters.forEach(c => {
                const w = Number(c?.weight) || 0;
                const r = Number(c?.reps) || 0;
                const vol = w * r;
                totalVolume += vol;
                current.volume += vol;
                current.reps += r;
                current.sets += 1;
                totalSets += 1;
            });

            exerciseMap.set(exName, current);
        });

        const volumeByExercise = Array.from(exerciseMap.entries()).map(([exerciseName, data]) => ({
            exerciseName,
            volume: data.volume,
            sets: data.sets,
            reps: data.reps,
        }));

        // 2. Measure session duration - matches the "DURACIÓN" counter from the active session
        let durationSeconds = 0;
        const logWithDuration = sessionLogs.find(l => typeof l.sessionDurationSeconds === 'number' && (l.sessionDurationSeconds ?? 0) >= 0);
        if (logWithDuration && typeof logWithDuration.sessionDurationSeconds === 'number') {
            durationSeconds = logWithDuration.sessionDurationSeconds;
        } else if (lastFinishedSessionMetrics && (lastFinishedSessionMetrics.sessionId === latestSessionKey || latestSessionKey.includes(lastFinishedSessionMetrics.sessionId))) {
            durationSeconds = lastFinishedSessionMetrics.durationSeconds;
        } else {
            const timestamps = sessionLogs
                .map(l => new Date(l.timestamp).getTime())
                .filter(t => !isNaN(t) && t > 0);
            if (timestamps.length > 1) {
                const minTime = Math.min(...timestamps);
                const maxTime = Math.max(...timestamps);
                durationSeconds = Math.max(0, Math.round((maxTime - minTime) / 1000));
            }
        }

        const estimatedSessionDurationFormatted = formatSessionStopwatch(durationSeconds);
        // Duration in minutes for load density calculation (fallback to 1 min if 0s to prevent Infinity)
        const durationMinutesForCalc = durationSeconds > 0 ? (durationSeconds / 60) : 1;

        // 3. Sum of rests between exercises, strictly excluding series micro-rests
        const numExercises = volumeByExercise.length;
        const interTransitions = Math.max(0, numExercises - 1);
        
        let totalRestSeconds = 0;
        const logWithRest = sessionLogs.find(l => typeof l.interExerciseRestSeconds === 'number');
        if (logWithRest && typeof logWithRest.interExerciseRestSeconds === 'number') {
            totalRestSeconds = logWithRest.interExerciseRestSeconds;
        } else if (lastFinishedSessionMetrics && (lastFinishedSessionMetrics.sessionId === latestSessionKey || latestSessionKey.includes(lastFinishedSessionMetrics.sessionId))) {
            totalRestSeconds = lastFinishedSessionMetrics.interExerciseRestSeconds;
        } else {
            // Default 3 min (180s) per transition between exercises
            totalRestSeconds = interTransitions * 180;
        }

        const totalRestMinutes = Math.round(totalRestSeconds / 60);
        const totalRestFormatted = totalRestSeconds < 60 ? `${totalRestSeconds}s` : `${totalRestMinutes} min`;

        // 4. Load density: totalVolume / duration in minutes
        const loadDensity = Math.round((totalVolume / durationMinutesForCalc) * 10) / 10;

        // 5. Compare with previous session
        let prevLoadDensity: number | null = null;
        let loadDensityDiffPercent: number | null = null;
        let hasPreviousSession = false;

        if (sortedSessionKeys.length > 1) {
            const prevKey = sortedSessionKeys[1];
            const prevLogs = logsBySession[prevKey] || [];

            if (prevLogs.length > 0) {
                hasPreviousSession = true;
                let prevTotalVolume = 0;
                prevLogs.forEach(l => {
                    const clusters = Array.isArray(l.clusters) ? l.clusters : [];
                    clusters.forEach(c => {
                        const w = Number(c?.weight) || 0;
                        const r = Number(c?.reps) || 0;
                        prevTotalVolume += w * r;
                    });
                });

                let prevDurationSec = 0;
                const prevLogWithDuration = prevLogs.find(l => typeof l.sessionDurationSeconds === 'number' && (l.sessionDurationSeconds ?? 0) >= 0);
                if (prevLogWithDuration && typeof prevLogWithDuration.sessionDurationSeconds === 'number') {
                    prevDurationSec = prevLogWithDuration.sessionDurationSeconds;
                } else {
                    const prevTimestamps = prevLogs
                        .map(l => new Date(l.timestamp).getTime())
                        .filter(t => !isNaN(t) && t > 0);
                    if (prevTimestamps.length > 1) {
                        const minTime = Math.min(...prevTimestamps);
                        const maxTime = Math.max(...prevTimestamps);
                        prevDurationSec = Math.max(0, Math.round((maxTime - minTime) / 1000));
                    }
                }

                const prevDurationMin = prevDurationSec > 0 ? (prevDurationSec / 60) : 1;
                if (prevTotalVolume > 0 && prevDurationMin > 0) {
                    prevLoadDensity = Math.round((prevTotalVolume / prevDurationMin) * 10) / 10;
                    if (prevLoadDensity > 0) {
                        const diff = ((loadDensity - prevLoadDensity) / prevLoadDensity) * 100;
                        loadDensityDiffPercent = Math.round(diff * 10) / 10;
                    }
                } else if (prevTotalVolume === 0 && totalVolume > 0) {
                    loadDensityDiffPercent = 100;
                    prevLoadDensity = 0;
                }
            }
        }

        const firstLog = sessionLogs[0];
        const sessionDate = firstLog ? formatDate(firstLog.timestamp) : latestSessionKey;

        return {
            sessionDate,
            totalVolume,
            volumeByExercise,
            estimatedSessionDurationMinutes: Math.round(durationMinutesForCalc),
            estimatedSessionDurationFormatted,
            totalRestMinutes,
            totalRestFormatted,
            loadDensity,
            prevLoadDensity,
            loadDensityDiffPercent,
            hasPreviousSession,
        };
    }, [sortedSessionKeys, logsBySession, lastFinishedSessionMetrics]);

    const generateSummary = useCallback(async () => {
        if (!userProfile || sortedSessionKeys.length === 0) {
            return;
        }

        setIsGeneratingSummary(true);
        setSummaryError(null);

        try {
            const latestSessionKey = sortedSessionKeys[0];
            const sessionLogs = logsBySession[latestSessionKey];
            if (!sessionLogs || sessionLogs.length === 0) {
                setIsGeneratingSummary(false);
                return;
            }

            const res = await fetch('/api/gemini/analyze-workout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userProfile, 
                    sessionLogs,
                    metrics: latestSessionMetrics 
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data.summary) {
                setAiSummary(data.summary);
            } else {
                throw new Error("Respuesta vacía del servidor.");
            }
        } catch (err) {
            console.error("Error al obtener análisis de IA:", err);
            if (latestSessionMetrics) {
                const comparisonText = latestSessionMetrics.hasPreviousSession && latestSessionMetrics.loadDensityDiffPercent !== null
                    ? (latestSessionMetrics.loadDensityDiffPercent >= 0 
                        ? `(+${latestSessionMetrics.loadDensityDiffPercent}% vs. sesión anterior)` 
                        : `(${latestSessionMetrics.loadDensityDiffPercent}% vs. sesión anterior)`)
                    : '';
                setAiSummary(`Densidad alcanzada: **${latestSessionMetrics.loadDensity} kg/min** ${comparisonText}. Para tu siguiente sesión, busca aumentar 1 repetición en tu primer ejercicio y conserva la pausa de descanso para optimizar la carga.`);
            } else {
                setAiSummary(`Sesión completada con éxito. Registraste tus series correctamente; mantén la constancia en tu próxima sesión.`);
            }
        } finally {
            setIsGeneratingSummary(false);
        }
    }, [userProfile, sortedSessionKeys, logsBySession, latestSessionMetrics]);

    useEffect(() => {
        if (logs.length > 0) {
            generateSummary();
        }
    }, [logs, generateSummary]);

    const generalStats = useMemo(() => {
        const totalSessions = sortedSessionKeys.length;
        
        const totalDurationMs = sortedSessionKeys.reduce((total, key) => {
            const sessionLogs = logsBySession[key];
            if (sessionLogs.length > 1) {
                const timestamps = sessionLogs.map(log => new Date(log.timestamp).getTime());
                const sessionStart = Math.min(...timestamps);
                const sessionEnd = Math.max(...timestamps);
                return total + (sessionEnd - sessionStart);
            }
            return total;
        }, 0);

        const totalVolume = (logs || []).reduce((total, log) => {
            const clusters = Array.isArray(log?.clusters) ? log.clusters : [];
            return total + clusters.reduce((clusterTotal, c) => clusterTotal + ((Number(c?.weight) || 0) * (Number(c?.reps) || 0)), 0);
        }, 0);

        return {
            totalSessions,
            totalDuration: formatTotalHoursMinutes(totalDurationMs),
            totalVolume: totalVolume.toLocaleString('es-ES'),
        };
    }, [logs, logsBySession, sortedSessionKeys]);
    
    const handleToggleExpand = (sessionKey: string) => {
        setExpandedSessions(prev =>
            prev.includes(sessionKey)
                ? prev.filter(key => key !== sessionKey)
                : [...prev, sessionKey]
        );
    };

    const handleToggleSelection = (sessionKey: string) => {
        setSelectedSessions(prev =>
            prev.includes(sessionKey)
                ? prev.filter(key => key !== sessionKey)
                : [...prev, sessionKey]
        );
    };

    const handleSelectAll = () => {
        setSelectedSessions(sortedSessionKeys);
    };

    const handleDeselectAll = () => {
        setSelectedSessions([]);
    };
    
    const handleDownloadPdf = () => {
        if (selectedSessions.length === 0) return;

        const logsToExport = logs.filter(log =>
            selectedSessions.includes(formatDate(log.timestamp))
        );

        generateHistoryPdf(logsToExport, goals, userProfile, selectedSessions);
    };

    if (logs.length === 0) {
        return (
            <div className="text-center bg-slate-800/50 p-8 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-300">No hay historial de entrenamiento.</h3>
                <p className="text-slate-400 mt-2">Completa una sesión para ver tus registros aquí.</p>
                 <button 
                    onClick={onOpenManualLog}
                    className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg transition-colors mx-auto"
                    aria-label="Registrar una sesión pasada"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Registrar Primera Sesión
                </button>
            </div>
        );
    }
    
    return (
        <>
            <AIAnalysisCard
                metrics={latestSessionMetrics}
                summary={aiSummary}
                isLoading={isGeneratingSummary}
                error={summaryError}
                onRetry={generateSummary}
            />

            <div className="mb-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-300 mb-4 text-center">Estadísticas Generales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-400">Horas Totales de Entrenamiento</p>
                        <p className="text-2xl font-bold text-cyan-400">{generalStats.totalDuration}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Sesiones Registradas</p>
                        <p className="text-2xl font-bold text-cyan-400">{generalStats.totalSessions}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Volumen Total Levantado</p>
                        <p className="text-2xl font-bold text-cyan-400">{generalStats.totalVolume} <span className="text-lg text-slate-400">kg</span></p>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <ProgressChart logs={logs} selectedSessionKeys={selectedSessions} />
            </div>
            
            <div className="mb-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 space-y-4">
                 <div>
                    <h3 className="text-xl font-bold text-slate-300">Análisis y Exportación</h3>
                    <p className="text-sm text-slate-400 mt-1">Selecciona un ejercicio para ver su progreso o exporta tus sesiones a PDF.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="exercise-progress-select" className="block text-sm font-medium text-slate-300 mb-1">Ver progreso por ejercicio</label>
                        <select
                          id="exercise-progress-select"
                          onChange={(e) => onSelectExercise(e.target.value as ExerciseName)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="">-- Elige un ejercicio --</option>
                          {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-300 mb-1">Exportar sesiones a PDF</label>
                        <button
                            onClick={handleDownloadPdf}
                            disabled={selectedSessions.length === 0}
                            className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                            title="Descargar PDF de sesiones seleccionadas"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Descargar PDF ({selectedSessions.length})</span>
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-slate-300">{selectedSessions.length} de {sortedSessionKeys.length} sesión(es) para PDF</span>
                    <div className="space-x-4">
                        <button onClick={handleSelectAll} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Seleccionar todo</button>
                        <button onClick={handleDeselectAll} className="text-xs font-semibold text-slate-400 hover:text-slate-300">Deseccionar todo</button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-slate-200">Registros de Sesiones</h2>
                <div className="flex items-center gap-2 sm:gap-4">
                     <button 
                        onClick={onOpenManualLog}
                        className="flex items-center gap-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg transition-colors"
                        aria-label="Registrar una sesión pasada"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <span>Registrar Sesión Pasada</span>
                    </button>
                    <button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="p-2.5 bg-slate-700 hover:bg-slate-600 text-rose-400 rounded-lg transition-colors duration-300"
                        aria-label="Borrar registros del historial"
                        title="Borrar registros"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {sortedSessionKeys.map(sessionKey => {
                    const isExpanded = expandedSessions.includes(sessionKey);

                    const sessionLogs = logsBySession[sessionKey];
                    const totalExercises = new Set(sessionLogs.map(log => log?.exerciseName).filter(Boolean)).size;
                    const totalSessionVolume = sessionLogs.reduce((total, log) => {
                        const clusters = Array.isArray(log?.clusters) ? log.clusters : [];
                        return total + clusters.reduce((clusterTotal, c) => clusterTotal + ((Number(c?.weight) || 0) * (Number(c?.reps) || 0)), 0);
                    }, 0);
                    const totalSessionReps = sessionLogs.reduce((total, log) => {
                        const clusters = Array.isArray(log?.clusters) ? log.clusters : [];
                        return total + clusters.reduce((clusterTotal, c) => clusterTotal + (Number(c?.reps) || 0), 0);
                    }, 0);
                    
                    let sessionDuration = 'N/A';
                    const logWithDuration = sessionLogs.find(l => typeof l.sessionDurationSeconds === 'number' && (l.sessionDurationSeconds ?? 0) >= 0);
                    if (logWithDuration && typeof logWithDuration.sessionDurationSeconds === 'number') {
                        sessionDuration = formatSessionStopwatch(logWithDuration.sessionDurationSeconds);
                    } else if (lastFinishedSessionMetrics && (lastFinishedSessionMetrics.sessionId === sessionKey || sessionKey.includes(lastFinishedSessionMetrics.sessionId))) {
                        sessionDuration = formatSessionStopwatch(lastFinishedSessionMetrics.durationSeconds);
                    } else if (sessionLogs.length > 1) {
                        const timestamps = sessionLogs.map(log => new Date(log.timestamp).getTime()).filter(t => !isNaN(t) && t > 0);
                        if (timestamps.length > 1) {
                            const sessionStart = Math.min(...timestamps);
                            const sessionEnd = Math.max(...timestamps);
                            sessionDuration = formatSessionDuration(sessionEnd - sessionStart);
                        }
                    }

                    return (
                        <div key={sessionKey} className={`bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-xl shadow-lg transition-all duration-300 ${selectedSessions.includes(sessionKey) ? 'border-cyan-500 bg-slate-800' : ''}`}>
                            <div className="flex justify-between items-center p-6">
                                <div>
                                    <h3 className="text-lg font-bold text-cyan-400 capitalize">
                                        {formatDate(sessionLogs[0]?.timestamp || new Date().toISOString())}
                                        {sessionLogs[0]?.routineName ? (
                                            <span className="text-sm font-semibold text-slate-300 ml-2">
                                                · {sessionLogs[0].routineName}
                                            </span>
                                        ) : null}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <button
                                        onClick={() => handleToggleExpand(sessionKey)}
                                        className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                                        aria-expanded={isExpanded}
                                        aria-controls={`session-details-${sessionKey.replace(/\s/g, '-')}`}
                                    >
                                        {isExpanded ? 'Ocultar' : 'Ver Detalle'}
                                    </button>
                                    <input
                                        type="checkbox"
                                        checked={selectedSessions.includes(sessionKey)}
                                        onChange={() => handleToggleSelection(sessionKey)}
                                        className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-800 cursor-pointer"
                                        aria-label={`Seleccionar sesión del ${sessionKey}`}
                                    />
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div id={`session-details-${sessionKey.replace(/\s/g, '-')}`} className="px-6 pb-6 animate-fade-in">
                                    
                                    <div>
                                        <h4 className="font-semibold text-slate-300 mb-2 text-center">Resumen de la Sesión</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-slate-400">Volumen Total</p>
                                                <p className="font-bold text-white text-lg">{totalSessionVolume.toLocaleString()} <span className="text-sm text-slate-400">kg</span></p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Reps Totales</p>
                                                <p className="font-bold text-white text-lg">{totalSessionReps}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Ejercicios</p>
                                                <p className="font-bold text-white text-lg">{totalExercises}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Tiempo de Sesión</p>
                                                <p className="font-bold text-white text-lg">{sessionDuration}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-700 space-y-4">
                                        <h4 className="font-semibold text-slate-300 mb-2 text-center">Ejercicios Realizados</h4>
                                        {logsBySession[sessionKey]
                                            .reduce((acc, log) => {
                                                let exercise = acc.find(e => e.exerciseName === log.exerciseName);
                                                if (!exercise) {
                                                    exercise = { exerciseName: log.exerciseName, clusters: [], perceivedExertions: [] };
                                                    acc.push(exercise);
                                                }
                                                const clusters = Array.isArray(log?.clusters) ? log.clusters : [];
                                                exercise.clusters.push(...clusters);
                                                if (log.perceivedExertion) {
                                                    exercise.perceivedExertions.push(log.perceivedExertion);
                                                }
                                                return acc;
                                            }, [] as { exerciseName: ExerciseName, clusters: Cluster[], perceivedExertions: number[] }[])
                                            .map(({ exerciseName, clusters, perceivedExertions }) => {
                                                const totalVolume = clusters.reduce((sum, c) => sum + (c.weight * c.reps), 0);
                                                const totalReps = clusters.reduce((sum, c) => sum + c.reps, 0);
                                                const totalTime = clusters.reduce((sum, c) => sum + (c.time || 0), 0);
                                                const numSets = clusters.length;
                                                const avgRPE = perceivedExertions.length > 0 
                                                    ? (perceivedExertions.reduce((a, b) => a + b, 0) / perceivedExertions.length).toFixed(1)
                                                    : 0;

                                                return (
                                                    <div key={exerciseName} className="p-3 bg-slate-900/50 rounded-md">
                                                        <p className="font-semibold text-slate-200">{exerciseName}</p>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                                                            <span><span className="font-bold text-white">{numSets}</span> series</span>
                                                            {totalVolume > 0 && <span>Vol: <span className="font-bold text-white">{totalVolume.toLocaleString()}</span> kg</span>}
                                                            {totalReps > 0 && totalVolume === 0 && <span>Reps: <span className="font-bold text-white">{totalReps}</span></span>}
                                                            {totalTime > 0 && <span>Tiempo: <span className="font-bold text-white">{totalTime}</span>s</span>}
                                                            {Number(avgRPE) > 0 && <span>RPE: <span className="font-bold text-white">{avgRPE}</span>/10</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>

                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={onDelete}
                logsBySession={logsBySession}
                sortedSessionKeys={sortedSessionKeys}
            />
        </>
    );
};