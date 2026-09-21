import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Plus, 
  X, 
  Check, 
  Flame, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ExerciseFormData } from './types';

interface Step3MusclesProps {
  data: ExerciseFormData;
  onChange: (updates: Partial<ExerciseFormData>) => void;
}

export const ANATOMY_CATALOG: {
  zone: string;
  subzones: {
    name: string;
    muscles: string[];
  }[];
}[] = [
  {
    zone: 'Tren superior',
    subzones: [
      {
        name: 'Pecho',
        muscles: ['Pectoral mayor (haz clavicular)', 'Pectoral mayor (haz esternal)', 'Pectoral menor', 'Serrato anterior']
      },
      {
        name: 'Espalda',
        muscles: ['Dorsal ancho', 'Trapecio superior', 'Trapecio medio', 'Trapecio inferior', 'Romboides', 'Redondo mayor', 'Redondo menor', 'Erectores espinales']
      },
      {
        name: 'Hombros',
        muscles: ['Deltoides anterior', 'Deltoides lateral', 'Deltoides posterior', 'Manguito rotador (Supraespinoso)', 'Infraespinoso']
      },
      {
        name: 'Bíceps',
        muscles: ['Bíceps braquial (cabeza larga)', 'Bíceps braquial (cabeza corta)', 'Braquial anterior', 'Coracobraquial']
      },
      {
        name: 'Tríceps',
        muscles: ['Tríceps braquial (cabeza larga)', 'Tríceps braquial (cabeza lateral)', 'Tríceps braquial (cabeza medial)', 'Ancóneo']
      },
      {
        name: 'Antebrazo',
        muscles: ['Braquiorradial', 'Flexores de muñeca', 'Extensores de muñeca', 'Pronadores / Supinadores']
      }
    ]
  },
  {
    zone: 'Tren inferior',
    subzones: [
      {
        name: 'Cuádriceps',
        muscles: ['Recto femoral', 'Vasto lateral', 'Vasto medial', 'Vasto intermedio']
      },
      {
        name: 'Isquiotibiales',
        muscles: ['Bíceps femoral', 'Semitendinoso', 'Semimembranoso']
      },
      {
        name: 'Glúteos',
        muscles: ['Glúteo mayor', 'Glúteo medio', 'Glúteo menor', 'Piriforme']
      },
      {
        name: 'Aductores',
        muscles: ['Aductor mayor', 'Aductor largo', 'Aductor corto', 'Grácil', 'Pectíneo']
      },
      {
        name: 'Abductores',
        muscles: ['Tensor de la fascia lata', 'Glúteo medio (fibras abductoras)']
      },
      {
        name: 'Gemelos',
        muscles: ['Gastrocnemio (gemelo medial)', 'Gastrocnemio (gemelo lateral)', 'Sóleo', 'Tibial anterior']
      }
    ]
  },
  {
    zone: 'Core',
    subzones: [
      {
        name: 'Abdominales',
        muscles: ['Recto abdominal', 'Oblicuo externo', 'Oblicuo interno', 'Transverso del abdomen']
      },
      {
        name: 'Lumbar & Pelvis',
        muscles: ['Erectores espinales (lumbar)', 'Cuadrado lumbar', 'Multífidos', 'Suelo pélvico']
      }
    ]
  },
  {
    zone: 'Cuerpo completo',
    subzones: [
      {
        name: 'Funcional & Postural',
        muscles: ['Cadena posterior completa', 'Cadena anterior', 'Estabilizadores escapulares', 'Glúteos y Core integrados']
      }
    ]
  }
];

export const Step3Muscles: React.FC<Step3MusclesProps> = ({ data, onChange }) => {
  const [selectedZone, setSelectedZone] = useState<string>('Tren superior');
  const [selectedSubzone, setSelectedSubzone] = useState<string>('Pecho');
  const [searchQuery, setSearchQuery] = useState('');
  const [customMuscleInput, setCustomMuscleInput] = useState('');
  const [selectionMode, setSelectionMode] = useState<'primary' | 'secondary'>('primary');

  // Toggle muscle in primary or secondary
  const handleToggleMuscle = (muscleName: string, forceTarget?: 'primary' | 'secondary') => {
    const target = forceTarget || selectionMode;
    const isPrimary = data.primaryMuscles.includes(muscleName);
    const isSecondary = data.secondaryMuscles.includes(muscleName);

    if (target === 'primary') {
      if (isPrimary) {
        onChange({ primaryMuscles: data.primaryMuscles.filter(m => m !== muscleName) });
      } else {
        // Remove from secondary if it was there and promote to primary
        const cleanSecondary = data.secondaryMuscles.filter(m => m !== muscleName);
        onChange({ 
          primaryMuscles: [...data.primaryMuscles, muscleName],
          secondaryMuscles: cleanSecondary
        });
      }
    } else {
      // Target is secondary
      if (isSecondary) {
        onChange({ secondaryMuscles: data.secondaryMuscles.filter(m => m !== muscleName) });
      } else {
        // Remove from primary if it was there and demote to secondary
        const cleanPrimary = data.primaryMuscles.filter(m => m !== muscleName);
        onChange({ 
          secondaryMuscles: [...data.secondaryMuscles, muscleName],
          primaryMuscles: cleanPrimary
        });
      }
    }
  };

  const handleRemoveMuscle = (muscleName: string) => {
    onChange({
      primaryMuscles: data.primaryMuscles.filter(m => m !== muscleName),
      secondaryMuscles: data.secondaryMuscles.filter(m => m !== muscleName)
    });
  };

  const handleAddCustomMuscle = () => {
    const trimmed = customMuscleInput.trim();
    if (!trimmed) return;
    handleToggleMuscle(trimmed, selectionMode);
    setCustomMuscleInput('');
  };

  // Filtered muscles based on search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const results: { muscle: string; subzone: string; zone: string }[] = [];

    ANATOMY_CATALOG.forEach(z => {
      z.subzones.forEach(sz => {
        sz.muscles.forEach(m => {
          if (m.toLowerCase().includes(q) || sz.name.toLowerCase().includes(q)) {
            results.push({ muscle: m, subzone: sz.name, zone: z.zone });
          }
        });
      });
    });
    return results;
  }, [searchQuery]);

  // Current subzone's muscles
  const currentSubzoneMuscles = useMemo(() => {
    const zoneObj = ANATOMY_CATALOG.find(z => z.zone === selectedZone);
    if (!zoneObj) return [];
    const subObj = zoneObj.subzones.find(sz => sz.name === selectedSubzone);
    return subObj ? subObj.muscles : [];
  }, [selectedZone, selectedSubzone]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Active Selected Muscles Summary Card */}
      <div className="p-3.5 rounded-xl bg-slate-850/90 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Musculatura Seleccionada</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {data.primaryMuscles.length} principales • {data.secondaryMuscles.length} secundarios
          </span>
        </div>

        {data.primaryMuscles.length === 0 && data.secondaryMuscles.length === 0 ? (
          <p className="text-xs text-slate-500 py-1 italic">
            Aún no has seleccionado músculos. Elige abajo como Principal o Secundario.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Primary Muscles Chips */}
            {data.primaryMuscles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-cyan-400" />
                  Principales:
                </span>
                {data.primaryMuscles.map(muscle => (
                  <span
                    key={muscle}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-semibold"
                  >
                    <span>{muscle}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMuscle(muscle)}
                      className="hover:text-rose-400 transition-colors ml-0.5"
                      aria-label={`Quitar ${muscle}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Secondary Muscles Chips */}
            {data.secondaryMuscles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  Secundarios:
                </span>
                {data.secondaryMuscles.map(muscle => (
                  <span
                    key={muscle}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium"
                  >
                    <span>{muscle}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMuscle(muscle)}
                      className="hover:text-rose-400 transition-colors ml-0.5"
                      aria-label={`Quitar ${muscle}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Target Selector Mode (Assign as Primary or Secondary) */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700">
        <span className="text-xs font-semibold text-slate-300 pl-2">
          Asignar selección actual como:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectionMode('primary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectionMode === 'primary'
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Principal</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectionMode('secondary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectionMode === 'secondary'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secundario</span>
          </button>
        </div>
      </div>

      {/* Quick Search across full anatomy */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar cualquier músculo (ej: deltoides, pectoral, bíceps femoral)..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9.5 pr-8 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search results view or Zone navigator */}
      {searchResults !== null ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resultados encontrados ({searchResults.length}):</span>
            <span className="text-[11px]">Toca para asignar como {selectionMode === 'primary' ? 'Principal' : 'Secundario'}</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">
                No encontramos ningún músculo predefinido con el nombre "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => {
                  handleToggleMuscle(searchQuery.trim(), selectionMode);
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar "{searchQuery.trim()}" como músculo nuevo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {searchResults.map(({ muscle, subzone, zone }) => {
                const isPrimary = data.primaryMuscles.includes(muscle);
                const isSecondary = data.secondaryMuscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => handleToggleMuscle(muscle)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isPrimary
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200'
                        : isSecondary
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200'
                        : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{muscle}</div>
                      <div className="text-[10px] text-slate-400">{zone} • {subzone}</div>
                    </div>
                    {isPrimary ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950">Principal</span>
                    ) : isSecondary ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white">Secundario</span>
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* General Body Zone Selector Tabs */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              1. Selecciona Zona Corporal:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ANATOMY_CATALOG.map(({ zone }) => {
                const isZoneActive = selectedZone === zone;
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => {
                      setSelectedZone(zone);
                      const zObj = ANATOMY_CATALOG.find(z => z.zone === zone);
                      if (zObj && zObj.subzones.length > 0) {
                        setSelectedSubzone(zObj.subzones[0].name);
                      }
                      if (!data.bodyZones.includes(zone)) {
                        onChange({ bodyZones: [...data.bodyZones, zone] });
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center select-none ${
                      isZoneActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-500/40 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subzone Tabs */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              2. Subzona Anatómica:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ANATOMY_CATALOG.find(z => z.zone === selectedZone)?.subzones.map(({ name }) => {
                const isSubActive = selectedSubzone === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setSelectedSubzone(name);
                      if (!data.subzones.includes(name)) {
                        onChange({ subzones: [...data.subzones, name] });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      isSubActive
                        ? 'bg-slate-750 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Muscles in current subzone */}
          <div className="p-3.5 rounded-xl bg-slate-850/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">
                Músculos en <span className="text-cyan-300">{selectedSubzone}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Modo: <strong className={selectionMode === 'primary' ? 'text-cyan-300' : 'text-indigo-300'}>
                  {selectionMode === 'primary' ? 'Principal' : 'Secundario'}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentSubzoneMuscles.map((muscle) => {
                const isPrimary = data.primaryMuscles.includes(muscle);
                const isSecondary = data.secondaryMuscles.includes(muscle);

                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => handleToggleMuscle(muscle)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isPrimary
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 shadow-sm'
                        : isSecondary
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-medium pr-2">{muscle}</span>
                    <div className="flex-shrink-0">
                      {isPrimary ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500 text-slate-950 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          P
                        </span>
                      ) : isSecondary ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500 text-white flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          S
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 text-xs">
                          +
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Muscle input field */}
      <div className="pt-2 border-t border-slate-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          ¿Deseas agregar un músculo no listado?
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customMuscleInput}
            onChange={(e) => setCustomMuscleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomMuscle();
              }
            }}
            placeholder="Ej: Coracobraquial, Semitendinoso, Iliopsoas..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
          />
          <button
            type="button"
            onClick={handleAddCustomMuscle}
            disabled={!customMuscleInput.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
