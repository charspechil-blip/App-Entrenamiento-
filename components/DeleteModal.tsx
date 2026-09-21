import React, { useState, useEffect } from 'react';
import type { ExerciseLog } from '../types';

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (logIdsToDelete: string[]) => void;
  logsBySession: Record<string, ExerciseLog[]>;
  sortedSessionKeys: string[];
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onDelete, logsBySession, sortedSessionKeys }) => {
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const getSessionDisplayTitle = (sessionKey: string): string => {
    const sessionLogs = logsBySession[sessionKey] || [];
    const first = sessionLogs[0];
    if (!first) return sessionKey;
    const dateStr = formatDate(first.timestamp);
    const routineStr = first.routineName ? ` · ${first.routineName}` : '';
    return `${dateStr}${routineStr}`;
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset state after closing animation
      const timer = setTimeout(() => {
        setSelectedSessions([]);
        setIsConfirming(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

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

  const handleDeleteRequest = () => {
    if (selectedSessions.length > 0) {
      setIsConfirming(true);
    }
  };

  const handleConfirmDelete = () => {
    const logIdsToDelete = selectedSessions.flatMap(sessionKey =>
      logsBySession[sessionKey].map(log => log.id)
    );
    onDelete(logIdsToDelete);
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-lg w-full relative transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {!isConfirming ? (
            <>
                <h2 className="text-xl font-bold text-white mb-2">Borrar Registros del Historial</h2>
                <p className="text-sm text-slate-400 mb-4">Selecciona las sesiones de entrenamiento que deseas eliminar permanentemente.</p>
                
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-300">{selectedSessions.length} de {sortedSessionKeys.length} seleccionadas</span>
                    <div className="space-x-4">
                        <button onClick={handleSelectAll} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Seleccionar todo</button>
                        <button onClick={handleDeselectAll} className="text-xs font-semibold text-slate-400 hover:text-slate-300">Deseccionar todo</button>
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                  {sortedSessionKeys.length > 0 ? (
                    sortedSessionKeys.map(sessionKey => (
                      <label key={sessionKey} className="flex items-center p-3 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(sessionKey)}
                          onChange={() => handleToggleSelection(sessionKey)}
                          className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="ml-3 text-sm text-slate-200 truncate">{getSessionDisplayTitle(sessionKey)}</span>
                      </label>
                    ))
                  ) : (
                     <p className="text-center text-slate-400 text-sm p-4">No hay registros para mostrar.</p>
                  )}
                </div>
            </>
        ) : (
            <div>
                <h2 className="text-xl font-bold text-rose-400 mb-4 text-center">Confirmar Eliminación</h2>
                <div className="text-center p-4 bg-rose-900/30 border border-rose-500/50 rounded-lg">
                    <p className="text-slate-200">
                        Está acción es irreversible asegúrese de tomar precauciones en sus datos.
                    </p>
                    <p className="mt-2 font-semibold text-white">
                        ¿Realmente deseas eliminar {selectedSessions.length} sesión(es) seleccionada(s)?
                    </p>
                </div>
            </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {isConfirming ? (
            <>
              <button
                onClick={() => setIsConfirming(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-300 order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md shadow-rose-500/20 order-1 sm:order-2"
              >
                Sí, Eliminar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-300 order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRequest}
                disabled={selectedSessions.length === 0}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md shadow-rose-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none order-1 sm:order-2"
              >
                {selectedSessions.length > 0 ? `Eliminar (${selectedSessions.length}) registro${selectedSessions.length > 1 ? 's' : ''}` : 'Eliminar registro'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
