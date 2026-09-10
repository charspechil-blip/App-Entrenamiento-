
import React, { useMemo } from 'react';
import type { ExerciseLog, ExerciseName } from '../types';
import { ExerciseProgressChart } from './ExerciseProgressChart';

interface ExerciseHistoryDetailProps {
    exerciseName: ExerciseName;
    allLogs: ExerciseLog[];
    onBack: () => void;
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const ExerciseHistoryDetail: React.FC<ExerciseHistoryDetailProps> = ({ exerciseName, allLogs, onBack }) => {

    const { exerciseLogs, chartData, stats, sessions } = useMemo(() => {
        const filteredLogs = allLogs.filter(log => log.exerciseName === exerciseName)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let maxWeight = 0;
        let maxVolume = 0;

        const sessionsMap: Record<string, { totalVolume: number, maxWeight: number, clusters: {weight: number, reps: number, time?: number}[], RPEs: number[] }> = {};

        filteredLogs.forEach(log => {
            const dateKey = formatDate(log.timestamp);
            if (!sessionsMap[dateKey]) {
                sessionsMap[dateKey] = { totalVolume: 0, maxWeight: 0, clusters: [], RPEs: [] };
            }
            
            if (log.perceivedExertion) {
                sessionsMap[dateKey].RPEs.push(log.perceivedExertion);
            }

            const clusters = Array.isArray(log?.clusters) ? log.clusters : [];
            clusters.forEach(cluster => {
                const w = Number(cluster?.weight) || 0;
                const r = Number(cluster?.reps) || 0;
                const volume = w * r;
                sessionsMap[dateKey].totalVolume += volume;
                sessionsMap[dateKey].maxWeight = Math.max(sessionsMap[dateKey].maxWeight, w);
                sessionsMap[dateKey].clusters.push({ weight: w, reps: r, time: cluster?.time });

                maxWeight = Math.max(maxWeight, w);
            });
        });

        const chartDataPoints = Object.entries(sessionsMap).map(([date, data]) => {
            maxVolume = Math.max(maxVolume, data.totalVolume);
            return {
                date: new Date(filteredLogs.find(l => formatDate(l.timestamp) === date)!.timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                timestamp: new Date(filteredLogs.find(l => formatDate(l.timestamp) === date)!.timestamp).getTime(),
                maxWeight: data.maxWeight,
                totalVolume: data.totalVolume
            };
        }).sort((a,b) => a.timestamp - b.timestamp);

        const sessionEntries = Object.entries(sessionsMap)
            .map(([date, data]) => ({
                date,
                timestamp: new Date(filteredLogs.find(l => formatDate(l.timestamp) === date)!.timestamp).getTime(),
                ...data
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // Sort sessions descending for display

        return {
            exerciseLogs: filteredLogs,
            chartData: chartDataPoints,
            stats: { maxWeight, maxVolume, totalSessions: Object.keys(sessionsMap).length },
            sessions: sessionEntries
        };
    }, [allLogs, exerciseName]);

    if (exerciseLogs.length === 0) {
        return (
            <div className="text-center bg-slate-800/50 p-8 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-300">No hay datos para {exerciseName}.</h3>
                <button onClick={onBack} className="mt-4 text-cyan-400 hover:text-cyan-300">Volver al historial</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-200">Progreso de:</h2>
                    <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">{exerciseName}</p>
                </div>
                 <button 
                    onClick={onBack} 
                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
                    aria-label="Volver al historial"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Volver</span>
                </button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-300 mb-4 text-center">Récords Personales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-400">Peso Máximo (PR)</p>
                        <p className="text-2xl font-bold text-cyan-400">{stats.maxWeight.toLocaleString('es-ES')} <span className="text-lg text-slate-400">kg</span></p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Máximo Volumen / Sesión</p>
                        <p className="text-2xl font-bold text-cyan-400">{stats.maxVolume.toLocaleString('es-ES')} <span className="text-lg text-slate-400">kg</span></p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Total Sesiones</p>
                        <p className="text-2xl font-bold text-cyan-400">{stats.totalSessions}</p>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <ExerciseProgressChart data={chartData} />
            </div>

             <div>
                <h2 className="text-2xl font-bold text-slate-200 mb-4">Historial de Sesiones</h2>
                <div className="space-y-4">
                    {sessions.map(session => {
                        const avgRPE = session.RPEs.length > 0
                            ? (session.RPEs.reduce((a, b) => a + b, 0) / session.RPEs.length).toFixed(1)
                            : null;

                        return (
                            <div key={session.date} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <h3 className="font-bold text-cyan-400">{session.date}</h3>
                                <div className="mt-2 text-sm text-slate-300 space-y-1">
                                    {session.clusters.map((cluster, index) => (
                                         <p key={index} className="pl-2">
                                            <span className="text-slate-500">{index + 1}. </span>
                                            {cluster.time ? (
                                                `Tiempo: ${cluster.time}s`
                                            ) : (
                                                ` ${cluster.weight} kg x ${cluster.reps} reps`
                                            )}
                                        </p>
                                    ))}
                                </div>
                                <div className="mt-3 pt-2 border-t border-slate-700 text-xs text-center text-slate-400 flex flex-wrap justify-center items-center gap-x-2">
                                    <span>Volumen: <span className="font-semibold text-white">{session.totalVolume.toLocaleString()} kg</span></span>
                                    <span className="mx-2 hidden sm:inline">|</span>
                                    <span>Peso Máx: <span className="font-semibold text-white">{session.maxWeight.toLocaleString()} kg</span></span>
                                    {avgRPE && (
                                        <>
                                            <span className="mx-2 hidden sm:inline">|</span>
                                            <span>RPE Medio: <span className="font-semibold text-white">{avgRPE}/10</span></span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};