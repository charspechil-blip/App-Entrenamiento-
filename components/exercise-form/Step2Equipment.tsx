import React, { useState } from 'react';
import { 
  Dumbbell, 
  Check, 
  Plus, 
  X, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ExerciseFormData } from './types';

interface Step2EquipmentProps {
  data: ExerciseFormData;
  onChange: (updates: Partial<ExerciseFormData>) => void;
}

export const MAIN_EQUIPMENT_CARDS: { id: string; label: string; iconDesc: string }[] = [
  { id: 'Peso corporal', label: 'Peso corporal', iconDesc: 'Sin equipo' },
  { id: 'Mancuernas', label: 'Mancuernas', iconDesc: 'Par o individual' },
  { id: 'Barra olímpica', label: 'Barra olímpica', iconDesc: 'Barra / Discos' },
  { id: 'Máquina', label: 'Máquina', iconDesc: 'Palancas / Guiadas' },
  { id: 'Polea', label: 'Polea', iconDesc: 'Cable crossover / Torres' },
  { id: 'Kettlebell', label: 'Kettlebell', iconDesc: 'Pesas rusas' },
  { id: 'Bandas elásticas', label: 'Bandas elásticas', iconDesc: 'Resistencia elástica' },
  { id: 'Banco', label: 'Banco', iconDesc: 'Plano / Inclinable' },
  { id: 'Barra de dominadas', label: 'Barra dominadas', iconDesc: 'Pull-up bar' },
  { id: 'Discos', label: 'Discos', iconDesc: 'Carga libre' },
  { id: 'TRX', label: 'TRX', iconDesc: 'Suspensión' },
  { id: 'Otro', label: 'Otro', iconDesc: 'Material especial' }
];

const SUGGESTED_VARIANTS = [
  'Polea alta',
  'Polea baja',
  'Agarre neutro',
  'Agarre supino',
  'Barra Z',
  'Banco inclinado (30-45°)',
  'Banco declinado',
  'Mancuerna individual',
  'Kettlebell doble',
  'Cuerda en polea'
];

export const Step2Equipment: React.FC<Step2EquipmentProps> = ({ data, onChange }) => {
  const [customVariantInput, setCustomVariantInput] = useState('');

  const handleToggleEquipment = (itemLabel: string) => {
    const isSelected = data.equipment.includes(itemLabel);
    let updated: string[];
    if (isSelected) {
      // Don't leave completely empty, fallback or let user toggle
      updated = data.equipment.filter(e => e !== itemLabel);
      if (updated.length === 0) {
        updated = ['Peso corporal'];
      }
    } else {
      updated = [...data.equipment, itemLabel];
    }
    onChange({ equipment: updated });
  };

  const handleAddCustomVariant = () => {
    const trimmed = customVariantInput.trim();
    if (!trimmed) return;
    if (!data.equipmentVariants.includes(trimmed)) {
      onChange({ equipmentVariants: [...data.equipmentVariants, trimmed] });
    }
    setCustomVariantInput('');
  };

  const handleToggleVariantChip = (variant: string) => {
    const exists = data.equipmentVariants.includes(variant);
    if (exists) {
      onChange({ equipmentVariants: data.equipmentVariants.filter(v => v !== variant) });
    } else {
      onChange({ equipmentVariants: [...data.equipmentVariants, variant] });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Primary Equipment Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
            <span>Equipamiento Necesario</span>
          </label>
          <span className="text-[11px] text-slate-400">Puedes seleccionar varios</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {MAIN_EQUIPMENT_CARDS.map(({ id, label, iconDesc }) => {
            const isSelected = data.equipment.includes(id) || data.equipment.some(e => e.toLowerCase().includes(label.toLowerCase()));
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleToggleEquipment(id)}
                className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-150 select-none ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500/70 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-cyan-200' : 'text-slate-200'}`}>
                    {label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'border border-slate-600 bg-slate-750'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  {iconDesc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Equipment Variants */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Variantes de Equipamiento o Agarre</span>
          </label>
          <span className="text-[11px] text-slate-400">Opcional</span>
        </div>

        {/* Selected variants badges */}
        {data.equipmentVariants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {data.equipmentVariants.map((variant) => (
              <span
                key={variant}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs font-medium"
              >
                <span>{variant}</span>
                <button
                  type="button"
                  onClick={() => handleToggleVariantChip(variant)}
                  className="hover:text-rose-400 transition-colors ml-0.5"
                  aria-label={`Eliminar variante ${variant}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggested variants chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTED_VARIANTS.filter(v => !data.equipmentVariants.includes(v)).slice(0, 6).map((variant) => (
            <button
              key={variant}
              type="button"
              onClick={() => handleToggleVariantChip(variant)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-xs font-medium transition-colors"
            >
              + {variant}
            </button>
          ))}
        </div>

        {/* Add custom variant input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customVariantInput}
            onChange={(e) => setCustomVariantInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomVariant();
              }
            }}
            placeholder="Escribe otra variante (ej: Barra hexagonal, Banco inclinado 45°)..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
          />
          <button
            type="button"
            onClick={handleAddCustomVariant}
            disabled={!customVariantInput.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      {/* Without Equipment Possible Toggle */}
      <div className="pt-2 border-t border-slate-800">
        <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200">
                ¿Puede realizarse sin equipamiento?
              </span>
              <span title="Útil cuando entrenas de viaje o en casa sin material" className="text-slate-400 cursor-help">
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Permite a la aplicación recomendar este ejercicio en rutinas calisténicas o sin pesas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onChange({ canBeDoneWithoutEquipment: false })}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                !data.canBeDoneWithoutEquipment
                  ? 'bg-slate-700 border-slate-500 text-white'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => onChange({ canBeDoneWithoutEquipment: true })}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                data.canBeDoneWithoutEquipment
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              ✓ Sí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
