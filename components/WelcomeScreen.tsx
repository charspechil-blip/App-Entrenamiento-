import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-slate-600 animate-fade-in space-y-3">
                                            <h3 className="text-sm font-semibold text-slate-300 mb-2">¿Qué quieres hacer hoy?</h3>
                                            <button
                                                type="button"
                                                id={`btn-select-profile-${profile.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onSelectProfile(profile.id);
                                                }}
                                                className="w-full bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <span>🏋️</span> Entrar al Panel de Rutina
                                            </button>
                                            <button
                                                type="button"
                                                id={`btn-start-routine-${profile.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onStartNewRoutine(profile.id);
                                                }}
                                                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <span>⚙️</span> Configurar Nueva Rutina
                                            </button>
                                            <button
                                                type="button"
                                                id={`btn-view-history-${profile.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onViewHistory(profile.id);
                                                }}
                                                className="w-full bg-slate-600 hover:bg-slate-500 active:scale-[0.99] text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <span>📊</span> Ver Historial
                                            </button>
                                            
                                            {profileRoutines.length > 0 && (
                                                <div className="space-y-2 pt-2">
                                                    <h4 className="text-xs text-slate-400">O selecciona una rutina guardada:</h4>
                                                    {profileRoutines.map(routine => (
                                                         <div key={routine.id} className="group flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                id={`btn-saved-routine-${routine.id}`}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    onStartSavedRoutine(profile.id, routine);
                                                                }}
                                                                className="flex-grow bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 text-left"
                                                            >
                                                                {routine.name}
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                id={`btn-del-routine-${routine.id}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteRoutine(routine.id);
                                                                }}
                                                                className="p-2 text-slate-500 hover:text-rose-400 transition-opacity opacity-0 group-hover:opacity-100"
                                                                aria-label={`Eliminar rutina ${routine.name}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                                            </button>
                                                         </div>
                                                    ))}
                                                </div>
                                            )}
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