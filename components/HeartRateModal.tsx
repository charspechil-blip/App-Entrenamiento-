import React, { useState, useEffect, useMemo } from 'react';
import type { ColorTheme, UserProfile, ExerciseName } from '../types';

interface HeartRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (heartRate?: number, perceivedExertion?: number) => void;
  exerciseName: ExerciseName;
  color: ColorTheme;
  userProfile: UserProfile | null;
}

type HeartRateZones = {
    light: number;
    moderate: number;
    vigorous: number;
    high: number;
    max: number;
};

const getHeartRateFeedback = (hrValue: number, zones: HeartRateZones): { message: string; color: string } => {
    if (hrValue > zones.max) {
        return { message: `¡Atención! Frecuencia cardíaca por encima de tu máximo estimado (${zones.max} PPM).`, color: 'text-red-400' };
    }
    if (hrValue >= zones.high) {
        return { message: 'Intensidad muy alta. ¡Estás dándolo todo!', color: 'text-amber-400' };
    }
    if (hrValue >= zones.vigorous) {
        return { message: 'Zona de intensidad vigorosa. ¡Excelente para mejorar el rendimiento!', color: 'text-green-400' };
    }
    if (hrValue >= zones.moderate) {
        return { message: 'Zona de intensidad moderada. Ideal para la salud cardiovascular.', color: 'text-cyan-400' };
    }
    return { message: 'Intensidad ligera. Buen calentamiento o vuelta a la calma.', color: 'text-slate-400' };
};

export const HeartRateModal: React.FC<HeartRateModalProps> = ({ isOpen, onClose, onSave, exerciseName, color, userProfile }) => {
  const [heartRate, setHeartRate] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState('');
  const [feedback, setFeedback] = useState<{ message: string, color: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setHeartRate('');
        setPerceivedExertion('');
        setFeedback(null);
      }, 300); // Wait for animation to finish
    }
  }, [isOpen]);

  const zones = useMemo<HeartRateZones | null>(() => {
    if (!userProfile?.age) return null;
    
    const maxHR = 220 - userProfile.age;

    // Use Karvonen formula if resting HR is available and valid
    if (userProfile.restingHeartRate && userProfile.restingHeartRate > 0 && userProfile.restingHeartRate < maxHR) {
        const hrr = maxHR - userProfile.restingHeartRate;
        return {
            light: Math.round(hrr * 0.5 + userProfile.restingHeartRate),
            moderate: Math.round(hrr * 0.6 + userProfile.restingHeartRate),
            vigorous: Math.round(hrr * 0.7 + userProfile.restingHeartRate),
            high: Math.round(hrr * 0.85 + userProfile.restingHeartRate),
            max: maxHR
        };
    }

    // Fallback to simple percentage of Max HR
    return {
        light: Math.round(maxHR * 0.5),
        moderate: Math.round(maxHR * 0.6),
        vigorous: Math.round(maxHR * 0.7),
        high: Math.round(maxHR * 0.85),
        max: maxHR
    };
  }, [userProfile]);

  const handleHeartRateChange = (value: string) => {
    setHeartRate(value);
    const hrValue = parseInt(value, 10);

    if (!value || isNaN(hrValue) || !zones) {
      setFeedback(null);
      return;
    }
    
    setFeedback(getHeartRateFeedback(hrValue, zones));
  };

  const handlePerceivedExertionChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 10)) {
        setPerceivedExertion(value);
    }
  };


  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(
        heartRate ? parseInt(heartRate, 10) : undefined,
        perceivedExertion ? parseInt(perceivedExertion, 10) : undefined
    );
  };
  
  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-sm w-full relative transition-all duration-300 text-center ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="flex justify-center mb-2">
            <div className="bg-emerald-500/10 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-1">¡Entrenamiento Registrado!</h2>
        <p className={`text-md font-semibold ${color.text} mb-4`}>{exerciseName}</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="heart-rate" className="block text-sm font-medium text-slate-300 mb-1">
              Opcional: Frecuencia Cardíaca (PPM)
            </label>
            <input
              type="number"
              id="heart-rate"
              value={heartRate}
              onChange={(e) => handleHeartRateChange(e.target.value)}
              placeholder="145"
              min="40"
              max="250"
              className={`w-28 mx-auto text-center bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
            />
            <div className="min-h-[1.25rem] text-xs text-center transition-opacity duration-300" style={{opacity: feedback ? 1 : 0}}>
              {feedback && <p className={feedback.color}>{feedback.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="perceived-exertion" className="block text-sm font-medium text-slate-300 mb-1">
              Intensidad Percibida (1-10)
            </label>
            <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  id="perceived-exertion"
                  value={perceivedExertion}
                  onChange={(e) => handlePerceivedExertionChange(e.target.value)}
                  placeholder="8"
                  min="1"
                  max="10"
                  className={`w-20 text-center bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
                />
                <span className="text-slate-400 text-lg">/ 10</span>
            </div>
          </div>
        </div>


        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
          >
            Ignorar
          </button>
          <button
            onClick={handleSave}
            className={`w-full ${color.bg} ${color.hoverBg} text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md ${color.shadow}`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};