import React, { useState } from 'react';
import { DEFAULT_EQUIPMENT_LIST, EquipmentDefinition } from '../constants/equipment';

interface EquipmentSelectorProps {
  selectedEquipment: string[];
  onChange: (equipment: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  selectedEquipment,
  onChange,
  title = '¿Con qué elementos cuentas para entrenar?',
  subtitle = 'Selecciona tu equipamiento para filtrar y adaptar los ejercicios a tu espacio o gimnasio.',
}) => {
  const [customEquipment, setCustomEquipment] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'libre' | 'calistenia' | 'maquinas' | 'accesorios'>('all');

  const toggleItem = (name: string) => {
    if (selectedEquipment.includes(name)) {
      onChange(selectedEquipment.filter(item => item !== name));
    } else {
      onChange([...selectedEquipment, name]);
    }
  };

  const handleSelectAll = () => {
    const allNames = DEFAULT_EQUIPMENT_LIST.map(e => e.name);
    const combined = Array.from(new Set([...allNames, ...selectedEquipment]));
    onChange(combined);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleQuickPreset = (preset: 'bodyweight' | 'home' | 'gym') => {
    if (preset === 'bodyweight') {
      onChange(['Peso corporal (Sin equipo)', 'Barra de dominadas']);
    } else if (preset === 'home') {
      onChange([
        'Peso corporal (Sin equipo)',
        'Mancuernas',
        'Banco de pesas',
        'Cuerda de saltar',
        'Bandas elásticas',
        'Barra de dominadas',
      ]);
    } else if (preset === 'gym') {
      onChange(DEFAULT_EQUIPMENT_LIST.map(e => e.name));
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customEquipment.trim();
    if (trimmed && !selectedEquipment.includes(trimmed)) {
      onChange([...selectedEquipment, trimmed]);
      setCustomEquipment('');
    }
  };

  const filteredDefinitions = activeCategory === 'all'
    ? DEFAULT_EQUIPMENT_LIST
    : DEFAULT_EQUIPMENT_LIST.filter(item => item.category === activeCategory);

  // Elementos personalizados que no están en la lista default
  const customItemsSelected = selectedEquipment.filter(
    item => !DEFAULT_EQUIPMENT_LIST.some(d => d.name === item)
  );

  return (
    <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 sm:p-5 mb-6 animate-fade-in shadow-inner">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-cyan-300 flex items-center gap-2">
            <span>🏋️‍♂️</span>
            <span>{title}</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-medium">
            {selectedEquipment.length} seleccionados
          </span>
        </div>
      </div>

      {/* Accesos rápidos de configuración */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-3 text-xs">
        <span className="text-slate-400 font-medium mr-1">Rápido:</span>
        <button
          type="button"
          onClick={() => handleQuickPreset('gym')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition-colors"
        >
          🏛️ Gimnasio Completo
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('home')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
        >
          🏠 Casa (Mancuernas/Bandas)
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('bodyweight')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700 transition-colors"
        >
          🤸 Solo Calistenia
        </button>
        <button
          type="button"
          onClick={handleSelectAll}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
        >
          Todos
        </button>
        {selectedEquipment.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1 bg-slate-800 hover:bg-rose-900/40 text-rose-300 rounded border border-slate-700 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Grid de opciones de equipamiento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-hide py-1">
        {filteredDefinitions.map(eq => {
          const isSelected = selectedEquipment.includes(eq.name);
          return (
            <button
              key={eq.id}
              type="button"
              onClick={() => toggleItem(eq.name)}
              className={`flex items-start text-left p-2.5 rounded-lg border text-xs transition-all duration-200 ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/40'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <span className="text-lg mr-2 flex-shrink-0 select-none">{eq.icon}</span>
              <div className="min-w-0 flex-grow">
                <div className="font-semibold flex items-center justify-between gap-1">
                  <span className="truncate">{eq.name}</span>
                  {isSelected && (
                    <span className="text-cyan-400 font-bold flex-shrink-0 text-[10px]">✓</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{eq.description}</p>
              </div>
            </button>
          );
        })}

        {/* Mostrar elementos personalizados agregados por el usuario */}
        {customItemsSelected.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => toggleItem(item)}
            className="flex items-start text-left p-2.5 rounded-lg border text-xs bg-indigo-950/60 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40"
          >
            <span className="text-lg mr-2 flex-shrink-0 select-none">✨</span>
            <div className="min-w-0 flex-grow">
              <div className="font-semibold flex items-center justify-between gap-1">
                <span className="truncate">{item}</span>
                <span className="text-indigo-400 font-bold flex-shrink-0 text-[10px]">✓</span>
              </div>
              <p className="text-[10px] text-indigo-300 truncate mt-0.5">Personalizado</p>
            </div>
          </button>
        ))}
      </div>

      {/* Añadir equipamiento adicional (ej: "Máquina casera", "TRX", etc.) */}
      <div className="mt-3 flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={customEquipment}
          onChange={e => setCustomEquipment(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom(e);
            }
          }}
          placeholder="¿Tienes otro elemento? Ej: Máquina multifuerza en casa, TRX, Cajón..."
          className="flex-grow bg-slate-800/90 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          disabled={!customEquipment.trim()}
          className="px-3 py-1.5 bg-slate-700 hover:bg-cyan-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-white text-xs font-semibold rounded-md transition-colors flex-shrink-0"
        >
          + Añadir
        </button>
      </div>
    </div>
  );
};
