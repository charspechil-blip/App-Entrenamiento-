import React, { useState, useEffect } from 'react';
import type { RestSettings as RestSettingsType } from '../types';

interface RestSettingsProps {
  settings: RestSettingsType;
  onSave: (settings: RestSettingsType) => void;
}

// Local state can have a different shape to handle the form correctly
interface FormState {
    restBetweenSets: string;
    restBetweenExercises: string;
    mode: 'auto' | 'manual';
}

export const RestSettings: React.FC<RestSettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<FormState>({
    restBetweenSets: String(settings.restBetweenSets),
    restBetweenExercises: String(settings.restBetweenExercises),
    mode: settings.mode,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setFormData({
        restBetweenSets: String(settings.restBetweenSets),
        restBetweenExercises: String(settings.restBetweenExercises),
        mode: settings.mode,
    });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setIsSaved(false);
    
    if (type === 'radio') {
        setFormData(prev => ({ ...prev, mode: value as 'auto' | 'manual' }));
    } else { // Handle number inputs
        // Allow the input to be empty, otherwise store the value.
        // The `type="number"` input will prevent non-numeric characters.
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
        restBetweenSets: Number(formData.restBetweenSets) || 0,
        restBetweenExercises: Number(formData.restBetweenExercises) || 0,
        mode: formData.mode,
    });
    setIsSaved(true);
    setIsCollapsed(true);
  };
  
   if (isCollapsed) {
    return (
      <div 
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsCollapsed(false)}
        aria-label="Metas de descanso registradas. Haz clic para editar."
      >
        <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-300">Metas de Descanso Registradas</h2>
                    <p className="text-slate-400 text-sm">Haz clic aquí para editar.</p>
                </div>
            </div>
            <div className='text-right mt-4 sm:mt-0'>
                <p className='text-sm text-slate-400'>Entre Series: <span className='font-bold text-white'>{settings.restBetweenSets}s</span></p>
                <p className='text-sm text-slate-400'>Entre Ejercicios: <span className='font-bold text-white'>{settings.restBetweenExercises}s</span></p>
            </div>
        </div>
      </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div>
                 <h2 className="text-xl font-bold text-slate-300">Metas de Descanso</h2>
                <p className="text-slate-400 mt-1 text-sm">Configura tus tiempos de recuperación.</p>
            </div>
             {!isSaved && (
                <div className="text-amber-400 text-sm font-semibold flex items-center gap-2 animate-pulse mt-2 sm:mt-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Cambios sin guardar
                </div>
            )}
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Time Inputs */}
        <div className="space-y-4">
            <div>
              <label htmlFor="restBetweenSets" className="block text-sm font-medium text-slate-300 mb-1">Descanso entre Series (seg)</label>
              <input type="number" name="restBetweenSets" id="restBetweenSets" value={formData.restBetweenSets} onChange={handleChange} onFocus={handleFocus} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required min="0" />
            </div>
            <div>
              <label htmlFor="restBetweenExercises" className="block text-sm font-medium text-slate-300 mb-1">Descanso entre Ejercicios (seg)</label>
              <input type="number" name="restBetweenExercises" id="restBetweenExercises" value={formData.restBetweenExercises} onChange={handleChange} onFocus={handleFocus} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required min="0" />
            </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-4">
            <fieldset>
                <legend className="text-sm font-medium text-slate-300 mb-2">Modo de Descanso</legend>
                <div className="space-y-3">
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="mode-auto" name="mode" type="radio" value="auto" checked={formData.mode === 'auto'} onChange={handleChange} className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-slate-500 bg-slate-600" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="mode-auto" className="font-medium text-slate-200">Descansos automáticos</label>
                            <p className="text-slate-400 text-xs">Se activa los tiempos de forma automática al registrar marcador cardíaco y al finalizar cada ejercicio.</p>
                        </div>
                    </div>
                     <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="mode-manual" name="mode" type="radio" value="manual" checked={formData.mode === 'manual'} onChange={handleChange} className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-slate-500 bg-slate-600" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="mode-manual" className="font-medium text-slate-200">Descansos manual</label>
                            <p className="text-slate-400 text-xs">Al ingresar tu ritmo cardiaco se anexa ingresar tiempos de descanso.</p>
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-cyan-500/30 disabled:bg-slate-600 disabled:cursor-not-allowed">
          Guardar Metas de Descanso
        </button>
      </div>
    </form>
  );
};