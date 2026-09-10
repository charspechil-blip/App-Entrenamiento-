import React, { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { UserProfile, SavedRoutine } from '../types';

interface WelcomeScreenProps {
    profiles: UserProfile[];
    savedRoutines: SavedRoutine[];
    onSelectProfile: (profileId: string) => void;
    onStartNewRoutine: (profileId: string) => void;
    onStartSavedRoutine: (profileId: string, routine: SavedRoutine) => void;
    onCreateProfile: () => void;
    onDeleteProfile: (profileId: string) => void;
    onDeleteRoutine: (routineId: string) => void;
    onViewHistory: (profileId: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ profiles, savedRoutines, onSelectProfile, onStartNewRoutine, onStartSavedRoutine, onCreateProfile, onDeleteProfile, onDeleteRoutine, onViewHistory }) => {
    const [expandedProfileId, setExpandedProfileId] = useState<string | null>(() => {
        return profiles.length === 1 ? profiles[0].id : null;
    });

    const handleProfileClick = (profileId: string) => {
        setExpandedProfileId(current => (current === profileId ? null : profileId));
    };

    return (
        <div id="welcome-screen" className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 animate-fade-in-up text-center flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 pb-2 mb-2">
                        Monitor de Ejercicio
                    </h1>
                    <p className="text-slate-400 mb-6 text-sm">Selecciona tu perfil para empezar a entrenar.</p>
                </div>

                <div className="flex-grow space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                    {profiles.length > 0 ? (
                        profiles.map(profile => {
                            const isExpanded = expandedProfileId === profile.id;
                            const profileRoutines = savedRoutines.filter(r => r.profileId === profile.id);

                            return (
                                <div key={profile.id} id={`profile-card-${profile.id}`} className={`bg-slate-700/30 border border-slate-600 rounded-lg p-4 transition-all duration-300 ${isExpanded ? 'ring-2 ring-cyan-500' : ''}`}>
                                    <div className="group flex items-center gap-2">
                                        <button
                                            type="button"
                                            id={`btn-expand-profile-${profile.id}`}
                                            onClick={() => handleProfileClick(profile.id)}
                                            className="flex-grow bg-slate-700/50 hover:bg-slate-700 rounded-lg py-3 px-4 text-white text-lg font-semibold transition-all duration-300 w-full text-left flex items-center justify-between"
                                        >
                                            <span>{profile.name}</span>
                                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-400' : ''}`} />
                                        </button>
                                        <button 
                                            type="button"
                                            id={`btn-delete-profile-${profile.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteProfile(profile.id);
                                            }}
                                            className="p-2 text-slate-500 hover:text-rose-400 transition-opacity opacity-0 group-hover:opacity-100"
                                            aria-label={`Eliminar perfil ${profile.name}`}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-slate-600 animate-fade-in space-y-3">
                                            <h3 className="text-sm font-bold text-slate-200 tracking-wide text-left mb-1">
                                                ¿Qué quieres hacer hoy?
                                            </h3>

                                            {/* 🏋️ Comenzar entrenamiento */}
                                            <button
                                                type="button"
                                                id={`btn-select-profile-${profile.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onSelectProfile(profile.id);
                                                }}
                                                className="w-full group bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.99] text-white p-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-900/30 border border-cyan-400/20 text-left flex items-center gap-3.5 cursor-pointer"
                                            >
                                                <div className="w-11 h-11 rounded-lg bg-black/20 flex items-center justify-center text-2xl flex-shrink-0">
                                                    🏋️
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="font-bold text-white text-base leading-tight">
                                                        Comenzar entrenamiento
                                                    </div>
                                                    <div className="text-cyan-100/90 text-xs mt-0.5 font-normal">
                                                        Entrena y registra tu sesión
                                                    </div>
                                                </div>
                                            </button>

                                            {/* ⚙️ Crear nueva rutina */}
                                            <button
                                                type="button"
                                                id={`btn-start-routine-${profile.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onStartNewRoutine(profile.id);
                                                }}
                                                className="w-full group bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.99] text-white p-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/30 border border-indigo-400/20 text-left flex items-center gap-3.5 cursor-pointer"
                                            >
                                                <div className="w-11 h-11 rounded-lg bg-black/20 flex items-center justify-center text-2xl flex-shrink-0">
                                                    ⚙️
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="font-bold text-white text-base leading-tight">
                                                        Crear nueva rutina
                                                    </div>
                                                    <div className="text-indigo-100/90 text-xs mt-0.5 font-normal">
                                                        Diseña una rutina personalizada
                                                    </div>
                                                </div>
                                            </button>

                                            {/* 📊 Ver historial */}
                                            <button
                                                type="button"
                                                id={`btn-view-history-${profile.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onViewHistory(profile.id);
                                                }}
                                                className="w-full group bg-slate-700/80 hover:bg-slate-700 active:scale-[0.99] text-white p-3.5 rounded-xl transition-all duration-200 border border-slate-600/80 text-left flex items-center gap-3.5 cursor-pointer hover:border-slate-500"
                                            >
                                                <div className="w-11 h-11 rounded-lg bg-slate-800/80 flex items-center justify-center text-2xl flex-shrink-0">
                                                    📊
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="font-bold text-white text-base leading-tight">
                                                        Ver historial
                                                    </div>
                                                    <div className="text-slate-300 text-xs mt-0.5 font-normal">
                                                        Consulta tu progreso
                                                    </div>
                                                </div>
                                            </button>

                                            {/* ────────────── Mis rutinas ────────────── */}
                                            <div className="pt-3 border-t border-slate-600/70 text-left space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                                        <span>⭐</span> Mis rutinas
                                                    </h4>
                                                    {profileRoutines.length > 0 && (
                                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                                                            {profileRoutines.length} {profileRoutines.length === 1 ? 'guardada' : 'guardadas'}
                                                        </span>
                                                    )}
                                                </div>

                                                {profileRoutines.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {profileRoutines.map(routine => (
                                                            <div 
                                                                key={routine.id} 
                                                                className="group flex items-center justify-between bg-slate-700/50 hover:bg-slate-700/90 border border-slate-600/60 rounded-xl p-3 transition-all duration-200"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    id={`btn-saved-routine-${routine.id}`}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        onStartSavedRoutine(profile.id, routine);
                                                                    }}
                                                                    className="flex-grow text-left flex items-center gap-3 min-w-0 cursor-pointer"
                                                                >
                                                                    <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center text-lg flex-shrink-0">
                                                                        📋
                                                                    </div>
                                                                    <div className="min-w-0 flex-grow">
                                                                        <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                                                                            {routine.name}
                                                                        </div>
                                                                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                                            {Array.isArray(routine.exercises) && routine.exercises.length > 0 && (
                                                                                <span>{routine.exercises.length} {routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}</span>
                                                                            )}
                                                                            {routine.trainingType && (
                                                                                <>
                                                                                    <span>•</span>
                                                                                    <span>{routine.trainingType}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                                <button 
                                                                    type="button"
                                                                    id={`btn-del-routine-${routine.id}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDeleteRoutine(routine.id);
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1.5 flex-shrink-0"
                                                                    title={`Eliminar rutina ${routine.name}`}
                                                                    aria-label={`Eliminar rutina ${routine.name}`}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-3.5 bg-slate-700/20 border border-dashed border-slate-700/70 rounded-xl text-center">
                                                        <p className="text-xs text-slate-400 font-medium">
                                                            No tienes rutinas favoritas guardadas aún.
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 mt-1">
                                                            Al crear y guardar una rutina en tu panel, aparecerá aquí como acceso directo.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-slate-500 py-8">No hay perfiles guardados.</p>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 pt-2 border-t border-slate-700/60">
                    <button
                        type="button"
                        id="btn-create-new-profile"
                        onClick={onCreateProfile}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-cyan-500/30 text-base sm:text-lg"
                    >
                        + Crear Perfil Nuevo
                    </button>
                </div>
            </div>
        </div>
    );
};