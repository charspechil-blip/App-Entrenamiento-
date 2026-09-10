import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { UserProfile as UserProfileType } from '../types';
import { EquipmentSelector } from './EquipmentSelector';
import { DEFAULT_INITIAL_SELECTED_EQUIPMENT } from '../constants/equipment';

interface UserProfileProps {
  profile: UserProfileType | Omit<UserProfileType, 'id'> | null;
  onSave: (profileData: Omit<UserProfileType, 'id'>) => void;
  isWizardStep?: boolean;
  onCancel?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ profile, onSave, isWizardStep = false, onCancel }) => {
  const [isEditing, setIsEditing] = useState(!profile);
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<UserProfileType, 'id'>>({
    name: '',
    age: 0,
    weight: 0,
    height: 0,
    restingHeartRate: 0,
    availableEquipment: DEFAULT_INITIAL_SELECTED_EQUIPMENT,
  });

  useEffect(() => {
    if (profile) {
      const { id, ...data } = profile as any;
      setFormData({
        ...data,
        availableEquipment: (data.availableEquipment && data.availableEquipment.length > 0)
          ? data.availableEquipment
          : DEFAULT_INITIAL_SELECTED_EQUIPMENT,
      });
      if(!isWizardStep) setIsEditing(false);
    } else {
      setFormData({
        name: '',
        age: 0,
        weight: 0,
        height: 0,
        restingHeartRate: 0,
        availableEquipment: DEFAULT_INITIAL_SELECTED_EQUIPMENT,
      });
      setIsEditing(true);
    }
  }, [profile, isWizardStep]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
        setFormData(prev => ({...prev, name: value}));
    } else {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    if(!isWizardStep) setIsEditing(false);
  };

  const hasProfile = profile && profile.age > 0 && profile.weight > 0;

  if (!isEditing && !hasProfile && !isWizardStep) {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 text-center">
            <h2 className="text-xl font-bold text-slate-300">Completa tu perfil</h2>
            <p className="text-slate-400 mt-2">Añade tus datos para obtener un seguimiento más personalizado.</p>
            <button
                onClick={() => setIsEditing(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-indigo-500/30"
            >
                Añadir Perfil
            </button>
        </div>
    )
  }

  return (
    <div className={`${isWizardStep ? '' : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-300">Perfil de Usuario</h2>
        {!isEditing && !isWizardStep ? (
          <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">Editar</button>
        ) : null}
      </div>

      {isEditing || isWizardStep ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-slate-300 mb-1">Edad</label>
              <input type="number" name="age" id="age" value={formData.age || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-1">Peso (Kg)</label>
              <input type="number" name="weight" id="weight" step="0.1" value={formData.weight || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-1">Altura (cm)</label>
              <input type="number" name="height" id="height" value={formData.height || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required />
            </div>
            <div>
              <label htmlFor="restingHeartRate" className="block text-sm font-medium text-slate-300 mb-1">FC Reposo</label>
              <input type="number" name="restingHeartRate" id="restingHeartRate" value={formData.restingHeartRate || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" />
            </div>
          </div>

          <div className="pt-2">
            <EquipmentSelector
              selectedEquipment={formData.availableEquipment || DEFAULT_INITIAL_SELECTED_EQUIPMENT}
              onChange={(equipment) => setFormData(prev => ({ ...prev, availableEquipment: equipment }))}
              title="¿Con qué elementos cuentas para entrenar?"
              subtitle="Elige mancuernas, barras, cuerda de saltar, máquinas en casa o peso corporal. Tu perfil recordará este equipamiento para todas tus rutinas."
            />
          </div>

          {isWizardStep && (
            <div className="flex justify-center pt-4 gap-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-8 rounded-lg transition-all"
                    >
                        {isWizardStep ? 'Cancelar' : 'Volver'}
                    </button>
                )}
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all">Guardar y Continuar</button>
            </div>
          )}
          {!isWizardStep && (
            <div className="flex justify-end gap-4 pt-2">
                {profile && <button type="button" onClick={() => { if (profile) { const { id, ...data } = profile as any; setFormData(data); } setIsEditing(false); }} className="text-sm font-semibold text-slate-400 hover:text-slate-300">Cancelar</button>}
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all">Guardar Perfil</button>
            </div>
          )}
        </form>
      ) : (
        <div className="flex flex-row flex-wrap justify-between items-center gap-x-6 gap-y-2 animate-fade-in">
          <div className="text-center">
            <p className="text-xs text-slate-400">Edad</p>
            <p className="font-semibold text-lg">{profile?.age}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Peso</p>
            <p className="font-semibold text-lg">{profile?.weight} <span className="text-sm text-slate-400">Kg</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Altura</p>
            <p className="font-semibold text-lg">{profile?.height} <span className="text-sm text-slate-400">cm</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">FC Reposo</p>
            <p className="font-semibold text-lg">{profile?.restingHeartRate ? <>{profile.restingHeartRate} <span className="text-sm text-slate-400">PPM</span></> : 'N/A'}</p>
          </div>
          {profile?.availableEquipment && profile.availableEquipment.length > 0 && (
            <div className="w-full mt-3 pt-3 border-t border-slate-700/60">
              <button
                type="button"
                id="toggle-available-equipment-btn"
                onClick={() => setIsEquipmentOpen(!isEquipmentOpen)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-0.5 group focus:outline-none"
                aria-expanded={isEquipmentOpen}
              >
                <span className="font-medium text-slate-400 group-hover:text-slate-300">
                  Equipamiento disponible ({profile.availableEquipment.length})
                </span>
                <span className="flex items-center gap-1 text-[11px] text-cyan-400 group-hover:text-cyan-300 font-medium">
                  <span>{isEquipmentOpen ? 'Ocultar' : 'Ver'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isEquipmentOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {isEquipmentOpen && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 animate-fade-in">
                  {profile.availableEquipment.map(item => (
                    <span key={item} className="text-xs px-2 py-0.5 rounded bg-slate-700/80 text-cyan-300 border border-slate-600/70">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};