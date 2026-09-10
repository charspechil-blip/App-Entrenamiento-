import React from 'react';

interface HeaderProps {
    title: string;
    userName: string;
    showHistory: boolean;
    onNavigateHome: () => void;
    onViewHistory: () => void;
    onGoToSettings: () => void;
    onEditRoutine: () => void;
    onLogout: () => void;
    onGoToRoutineSelection: () => void;
    onOpenSaveRoutineModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, userName, showHistory, onNavigateHome, onViewHistory, onGoToSettings, onEditRoutine, onLogout, onGoToRoutineSelection, onOpenSaveRoutineModal }) => {
    
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className='text-center md:text-left'>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 pb-2">
                    {title}
                </h1>
                {userName && (
                    <p className="text-slate-400 text-sm">
                        Sesión de <span className="font-bold text-amber-400">{userName}</span>
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                {showHistory ? (
                    <>
                        <button 
                            onClick={onNavigateHome} 
                            className="flex-shrink-0 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors duration-300 text-sm"
                            aria-label="Volver al panel de rutina"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Volver al Panel</span>
                        </button>
                         <button 
                            onClick={onLogout} 
                            className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors duration-300"
                            aria-label="Cambiar de perfil"
                            title="Cambiar de perfil"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                            onClick={onViewHistory} 
                            className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors duration-300 text-sm"
                        >
                            Ver Historial
                        </button>
                         <button 
                            onClick={onOpenSaveRoutineModal}
                            className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors duration-300"
                            aria-label="Guardar rutina"
                            title="Guardar rutina"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                           </svg>
                        </button>
                         <button 
                            onClick={onGoToSettings} 
                            className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors duration-300"
                            aria-label="Configurar perfil"
                            title="Configurar perfil"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0l-.1.41a2 2 0 01-1.42 1.42l-.41.1c-1.56.38-1.56 2.6 0 2.98l.41.1a2 2 0 011.42 1.42l.1.41c.38 1.56 2.6 1.56 2.98 0l.1-.41a2 2 0 011.42-1.42l.41-.1c1.56-.38 1.56-2.6 0-2.98l-.41-.1a2 2 0 01-1.42-1.42l-.1-.41zM10 5a5 5 0 100 10 5 5 0 000-10zM10 8a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button 
                            onClick={onLogout} 
                            className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors duration-300"
                            aria-label="Cambiar de perfil"
                            title="Cambiar de perfil"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};