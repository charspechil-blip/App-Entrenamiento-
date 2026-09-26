

import React, { useState, useMemo, useEffect } from 'react';
import type { ExerciseLog, UserRoutine, ExerciseName, Cluster, TrainingType } from '../types';
import { PREDEFINED_EXERCISES } from '../constants/exercises';
import { getAllCatalogExercises, resolveExerciseId } from '../services/exerciseCatalog';
import { isTimeBased as isTimeBasedUtil, isBodyweight as isBodyweightUtil } from '../utils/exerciseUtils';
import { generateUUID } from '../utils/uuid';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (logs: ExerciseLog[]) => void;
  userRoutine: UserRoutine | null;
}

type ManualCluster = { id: string; weight: string; reps: string; time: string };
type ManualExercise = { id: string; name: ExerciseName; clusters: ManualCluster[] };

const todayISO = () => new Date().toISOString().split('T')[0];

const shouldShowWeight = (exerciseName: ExerciseName, trainingType: TrainingType): boolean => {
    if (isTimeBasedUtil(exerciseName)) {
        return false;
    }
    if (!isBodyweightUtil(exerciseName)) {
        return true;
    }
    // It's a bodyweight exercise. Show weight for these types which imply using weights.
    return trainingType === 'Clúster' || trainingType === 'Drop';
};


export const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose, onSave, userRoutine }) => {
    const [sessionDate, setSessionDate] = useState(todayISO);
    const [exercises, setExercises] = useState<ManualExercise[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<ExerciseName[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sessionTrainingType, setSessionTrainingType] = useState<TrainingType>('Normal');


    const allPossibleExercises = useMemo(() => {
        const all = new Set<ExerciseName>();
        Object.values(PREDEFINED_EXERCISES).forEach(routine => {
            Object.values(routine).forEach(focus => {
                focus.forEach(ex => all.add(ex));
            });
        });
        const catalogList = getAllCatalogExercises();
        catalogList.forEach(c => all.add(c.nombre as ExerciseName));
        return Array.from(all).sort();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            // Reset state after closing animation
            const timer = setTimeout(() => {
                setSessionDate(todayISO());
                setExercises([]);
                setSearchTerm('');
                setSuggestions([]);
                setError(null);
                setSessionTrainingType('Normal');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        const existingNames = exercises.map(ex => ex.name);
        if (value.trim().length > 1) {
            const filtered = allPossibleExercises.filter(ex =>
                ex.toLowerCase().includes(value.toLowerCase()) && !existingNames.includes(ex)
            );
            setSuggestions(filtered.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const addExercise = (name: ExerciseName) => {
        setExercises(prev => [...prev, {
            id: generateUUID(),
            name,
            clusters: [{ id: generateUUID(), weight: '', reps: '', time: '0' }]
        }]);
        setSearchTerm('');
        setSuggestions([]);
    };

    const removeExercise = (exerciseId: string) => {
        setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    };

    const handleClusterChange = (exerciseId: string, clusterId: string, field: keyof Omit<ManualCluster, 'id'>, value: string) => {
        setExercises(prev => prev.map(ex => 
            ex.id === exerciseId
                ? { ...ex, clusters: ex.clusters.map(c => c.id === clusterId ? { ...c, [field]: value } : c) }
                : ex
        ));
    };

    const addCluster = (exerciseId: string) => {
        setExercises(prev => prev.map(ex =>
            ex.id === exerciseId
                ? { ...ex, clusters: [...ex.clusters, { id: generateUUID(), weight: '', reps: '', time: '0' }] }
                : ex
        ));
    };

    const removeCluster = (exerciseId: string, clusterId: string) => {
        setExercises(prev => prev.map(ex =>
            ex.id === exerciseId
                ? { ...ex, clusters: ex.clusters.filter(c => c.id !== clusterId) }
                : ex
        ));
    };

    const handleSubmit = () => {
        setError(null);
        if (exercises.length === 0) {
            setError("Añade al menos un ejercicio para registrar la sesión.");
            return;
        }

        const [year, month, day] = sessionDate.split('-').map(Number);

        // Process exercises into valid log data, filtering out empty ones
        const validLogData = exercises
            .map(exercise => {
                const parsedClusters: Cluster[] = exercise.clusters
                    .map((cluster): Cluster | null => {
                        const isTime = isTimeBasedUtil(exercise.name);
                        const showWeight = shouldShowWeight(exercise.name, sessionTrainingType);
                        
                        const weight = showWeight ? parseFloat(cluster.weight) : 0;
                        const reps = parseInt(cluster.reps, 10);
                        const time = parseInt(cluster.time, 10);

                        if (isTime) {
                            if (!isNaN(time) && time > 0) {
                                return { weight: 0, reps: 0, time };
                            }
                        } else {
                            if (!isNaN(reps) && reps > 0) {
                                return { weight: isNaN(weight) ? 0 : weight, reps };
                            }
                        }
                        return null; // Invalid cluster
                    })
                    .filter((c): c is Cluster => c !== null);

                if (parsedClusters.length > 0) {
                    return {
                        exerciseName: exercise.name,
                        clusters: parsedClusters,
                    };
                }
                return null;
            })
            .filter((log): log is { exerciseName: ExerciseName; clusters: Cluster[] } => log !== null);
        
        if (validLogData.length === 0) {
             setError("Asegúrate de rellenar los datos de al menos una serie para cada ejercicio.");
             return;
        }

        // Create final logs with timestamps.
        const logsToAdd: ExerciseLog[] = validLogData.map((logData, index) => {
            // Stagger timestamp by one minute per exercise to maintain order.
            // This creates the date at noon in the user's local timezone to avoid DST/timezone shifts changing the day.
            const logTimestamp = new Date(year, month - 1, day, 12, index, 0).toISOString();
            return {
                id: generateUUID(),
                timestamp: logTimestamp,
                exerciseId: resolveExerciseId(logData.exerciseName),
                exerciseName: logData.exerciseName,
                clusters: logData.clusters,
            };
        });

        onSave(logsToAdd);
    };

    if (!isOpen) return null;

    const trainingTypes: TrainingType[] = ['Normal', 'Clúster', 'Drop'];

    return (
        <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 z-50 transition-opacity duration-300 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-2xl w-full relative transition-all duration-300 flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="flex-shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h2 className="text-xl font-bold text-white mb-2">Registrar Sesión Pasada</h2>
                    <p className="text-sm text-slate-400 mb-4">Añade los detalles del entrenamiento que ya realizaste.</p>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-4 scrollbar-hide space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="session-date" className="block text-sm font-medium text-slate-300 mb-1">Fecha de la Sesión</label>
                            <input
                                type="date"
                                id="session-date"
                                value={sessionDate}
                                onChange={(e) => setSessionDate(e.target.value)}
                                max={todayISO()}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        <fieldset>
                            <legend className="block text-sm font-medium text-slate-300 mb-1">Tipo de Entrenamiento</legend>
                            <div className="flex flex-wrap gap-2">
                                {trainingTypes.map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSessionTrainingType(type)}
                                        className={`px-3 py-2 rounded-md text-xs font-semibold transition-all duration-300 flex-grow ${sessionTrainingType === type ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="text-md font-semibold text-slate-300 mb-2">Añadir Ejercicios</h3>
                        {userRoutine && Array.isArray(userRoutine.exercises) && userRoutine.exercises.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs text-slate-400 mb-2">Sugerencias de tu rutina actual:</p>
                                <div className="flex flex-wrap gap-2">
                                    {userRoutine.exercises.filter(ex => !exercises.some(e => e.name === ex)).map(ex => (
                                        <button key={ex} onClick={() => addExercise(ex)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 py-1 px-2.5 rounded-full transition-colors">
                                            + {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Buscar otro ejercicio..."
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
                                autoComplete="off"
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-slate-600 border border-slate-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg animate-fade-in">
                                    {suggestions.map(suggestion => (
                                        <li key={suggestion} onMouseDown={() => addExercise(suggestion)} className="px-4 py-2 cursor-pointer hover:bg-slate-500 text-sm text-slate-200">
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {exercises.map((exercise) => {
                            const showWeightInput = shouldShowWeight(exercise.name, sessionTrainingType);
                            return (
                                <div key={exercise.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 animate-fade-in">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-cyan-400">{exercise.name}</h4>
                                        <button onClick={() => removeExercise(exercise.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h--3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {exercise.clusters.map((cluster, index) => (
                                            <div key={cluster.id} className="flex items-center gap-2">
                                                <span className="text-slate-400 text-sm">{index + 1}.</span>
                                                {isTimeBasedUtil(exercise.name) ? (
                                                    <input type="number" placeholder="Segundos" value={cluster.time} onChange={e => handleClusterChange(exercise.id, cluster.id, 'time', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-2 text-sm text-white"/>
                                                ) : (
                                                    <div className="flex-grow flex items-center gap-2">
                                                        {showWeightInput && <input type="number" placeholder="Kg" value={cluster.weight} onChange={e => handleClusterChange(exercise.id, cluster.id, 'weight', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-2 text-sm text-white"/>}
                                                        <input type="number" placeholder="Reps" value={cluster.reps} onChange={e => handleClusterChange(exercise.id, cluster.id, 'reps', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-2 text-sm text-white"/>
                                                    </div>
                                                )}
                                                <button onClick={() => removeCluster(exercise.id, cluster.id)} disabled={exercise.clusters.length <= 1} className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => addCluster(exercise.id)} className="text-xs text-cyan-400 hover:text-cyan-300 mt-3">+ Añadir Serie</button>
                                </div>
                            );
                        })}
                    </div>

                </div>

                <div className="flex-shrink-0 pt-4 mt-2 border-t border-slate-700">
                     {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-6 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Guardar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};