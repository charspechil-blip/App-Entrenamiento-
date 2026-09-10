import React, { useState, useEffect } from 'react';

interface SaveRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const SaveRoutineModal: React.FC<SaveRoutineModalProps> = ({ isOpen, onClose, onSave }) => {
  const [routineName, setRoutineName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRoutineName('');
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmedName = routineName.trim();
    if (trimmedName.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    onSave(trimmedName);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-sm w-full relative transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <h2 className="text-xl font-bold text-white mb-2 text-center">Guardar Rutina</h2>
        <p className="text-sm text-slate-400 mb-6 text-center">Dale un nombre a esta configuración para usarla más tarde.</p>

        <div className="space-y-2">
          <label htmlFor="routine-name" className="block text-sm font-medium text-slate-300">
            Nombre de la Rutina
          </label>
          <input
            type="text"
            id="routine-name"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="Ej: Día de Pecho y Tríceps"
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
          />
          <div className="h-4 text-xs text-center pt-1">
            {error && <p className="text-rose-400">{error}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
