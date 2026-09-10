import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { ExerciseLog, Goals, UserProfile, ExerciseName, Cluster } from '../types';
import { ProgressChart } from './ProgressChart';
import { DeleteModal } from './DeleteModal';
import { generateHistoryPdf } from '../services/pdfGenerator';
import { AIAnalysisCard } from './AIAnalysisCard';

interface HistoryLogProps {
  logs: ExerciseLog[];
  goals: Goals;
  userProfile: UserProfile | null;
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


export const HistoryLog: React.FC<HistoryLogProps> = ({ logs, goals, userProfile, onDelete, onOpenManualLog, onSelectExercise }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
    const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
    
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const { logsBySession, sortedSessionKeys, uniqueExercises } = useMemo(() => {
        const grouped: Record<string, ExerciseLog[]> = {};
        const exercises = new Set<ExerciseName>();
        logs.forEach(log => {
            const dateKey = formatDate(log.timestamp);
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(log);
            exercises.add(log.exerciseName);
        });
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
             // We need to find the original timestamp to sort correctly
            const dateA = new Date(logs.find(log => formatDate(log.timestamp) === a)?.timestamp || 0).getTime();
            const dateB = new Date(logs.find(log => formatDate(log.timestamp) === b)?.timestamp || 0).getTime();
            return dateB - dateA;
        });
        return { logsBySession: grouped, sortedSessionKeys: sortedKeys, uniqueExercises: Array.from(exercises).sort() };
    }, [logs]);

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
                body: JSON.stringify({ userProfile, sessionLogs }),
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
            // Si hay algún problema de conexión, generar resumen de cortesía con el volumen alcanzado
            const latestSessionKey = sortedSessionKeys[0];
            const sessionLogs = logsBySession[latestSessionKey] || [];
            let totalVolume = 0;
            sessionLogs.forEach(l => {
                (l.clusters || []).forEach(c => {
                    totalVolume += (c.weight || 0) * (c.reps || 0);
                });
            });
            const volumeStr = totalVolume > 0 ? ` con un volumen total de **${totalVolume.toLocaleString('es-ES')} kg**` : '';
            setAiSummary(`¡Excelente entrenamiento completado, **${userProfile.name}**! Registraste con éxito ${sessionLogs.length} ejercicios${volumeStr}. Mantén la constancia e hidrátate adecuadamente para una recuperación óptima.`);
        } finally {
            setIsGeneratingSummary(false);
        }
    }, [userProfile, sortedSessionKeys, logsBySession]);

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
                    if (sessionLogs.length > 1) {
                        const timestamps = sessionLogs.map(log => new Date(log.timestamp).getTime());
                        const sessionStart = Math.min(...timestamps);
                        const sessionEnd = Math.max(...timestamps);
                        sessionDuration = formatSessionDuration(sessionEnd - sessionStart);
                    }

                    return (
                        <div key={sessionKey} className={`bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-xl shadow-lg transition-all duration-300 ${selectedSessions.includes(sessionKey) ? 'border-cyan-500 bg-slate-800' : ''}`}>
                            <div className="flex justify-between items-center p-6">
                                <div>
                                    <h3 className="text-lg font-bold text-cyan-400">{sessionKey}</h3>
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
                                                <p className="text-xs text-slate-400">Tiempo Estimado</p>
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