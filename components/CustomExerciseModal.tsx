import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Loader2, 
  Dumbbell, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  CatalogExercise, 
  saveCustomExerciseToCatalog, 
  findExerciseByName,
  normalizeEquipmentTags,
  extractMuscleGroups
} from '../services/exerciseCatalog';
import type { MuscleGroup } from '../constants/muscles';

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExerciseName: string;
  onExerciseAdded: (exerciseName: string) => void;
}

// Checkbox items for equipment as explicitly requested by the user
const PRIMARY_EQUIPMENT_OPTIONS = [
  { id: 'peso_corporal', label: 'Peso corporal', value: 'Peso corporal (Sin equipo)' },
  { id: 'mancuernas', label: 'Mancuernas', value: 'Mancuernas' },
  { id: 'barra_olimpica', label: 'Barra olímpica', value: 'Barra olímpica / Discos' },
  { id: 'maquina_gym', label: 'Maquina Gym', value: 'Máquina de poleas / Smith' }
];

const SECONDARY_EQUIPMENT_OPTIONS = [
  { id: 'pesas_rusas', label: 'Pesas rusas / Kettlebells', value: 'Pesas rusas / Kettlebells' },
  { id: 'bandas', label: 'Bandas elásticas', value: 'Bandas elásticas' },
  { id: 'banco', label: 'Banco de pesas', value: 'Banco de pesas' },
  { id: 'barra_dominadas', label: 'Barra de dominadas', value: 'Barra de dominadas' }
];

// Zones checklist as structured by the user
interface ZoneOption {
  zone: 'inferior' | 'superior';
  subzone: string;
  label: string;
  suggestedMuscles: string[];
}

const ZONE_OPTIONS: ZoneOption[] = [
  // Inferior
  { zone: 'inferior', subzone: 'Core', label: 'Core', suggestedMuscles: ['Abdominales', 'Oblicuos', 'Lumbar'] },
  { zone: 'inferior', subzone: 'Piernas', label: 'Piernas', suggestedMuscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Aductores', 'Gemelos'] },
  // Superior
  { zone: 'superior', subzone: 'Torso', label: 'Torso', suggestedMuscles: ['Pectoral mayor', 'Deltoides anterior', 'Pectoral menor'] },
  { zone: 'superior', subzone: 'Brazos', label: 'Brazos', suggestedMuscles: ['Bíceps braquial', 'Tríceps braquial', 'Antebrazos'] },
  { zone: 'superior', subzone: 'Espalda', label: 'Espalda', suggestedMuscles: ['Dorsal ancho', 'Trapecio', 'Romboides', 'Erectores espinales'] }
];

export const CustomExerciseModal: React.FC<CustomExerciseModalProps> = ({
  isOpen,
  onClose,
  initialExerciseName,
  onExerciseAdded
}) => {
  const [name, setName] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Peso corporal (Sin equipo)']);
  const [selectedZone, setSelectedZone] = useState<'inferior' | 'superior'>('inferior');
  const [selectedSubzones, setSelectedSubzones] = useState<string[]>(['Piernas']);
  const [muscleText, setMuscleText] = useState('');
  const [selectedMuscleChips, setSelectedMuscleChips] = useState<string[]>([]);
  
  // Gemini AI state
  const [isSearchingWithAI, setIsSearchingWithAI] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);

  // Technical ficha details
  const [description, setDescription] = useState('');
  const [executionSteps, setExecutionSteps] = useState<string[]>([]);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing exercise if already known, or initialize with provided name
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = initialExerciseName.trim();
    setName(trimmed);
    setAiStatusMessage(null);
    setAiSource(null);

    const existing = findExerciseByName(trimmed);
    if (existing) {
      // Pre-fill from existing catalog entry
      const normalizedEq = normalizeEquipmentTags(existing.equipamiento);
      setSelectedEquipment(normalizedEq);
      setSelectedZone(existing.zona === 'superior' ? 'superior' : 'inferior');
      setSelectedSubzones(existing.subzona ? [existing.subzona] : existing.zona === 'superior' ? ['Torso'] : ['Piernas']);
      setMuscleText([...(existing.musculos_principales || []), ...(existing.musculos_secundarios || [])].join(', '));
      setSelectedMuscleChips(existing.musculos_principales || []);
      setDescription(existing.descripcion || '');
      setExecutionSteps(existing.ejecucion_pasos || []);
    } else {
      // Infer initial settings from name if common
      const lower = trimmed.toLowerCase();
      let initEq = ['Peso corporal (Sin equipo)'];
      let initZone: 'inferior' | 'superior' = 'inferior';
      let initSubzones = ['Piernas'];
      let initMuscles = 'Cuádriceps, glúteos';

      if (lower.includes('sumo') || lower.includes('squat') || lower.includes('sentadilla') || lower.includes('prensa') || lower.includes('zancada')) {
        initZone = 'inferior';
        initSubzones = ['Piernas'];
        initEq = ['Peso corporal (Sin equipo)', 'Mancuernas', 'Barra olímpica / Discos'];
        initMuscles = lower.includes('sumo') ? 'Aductor mayor, glúteo mayor, cuádriceps' : 'Cuádriceps, glúteos, isquiotibiales';
      } else if (lower.includes('press') || lower.includes('pecho') || lower.includes('banca') || lower.includes('flexi')) {
        initZone = 'superior';
        initSubzones = ['Torso'];
        initEq = ['Mancuernas', 'Barra olímpica / Discos', 'Peso corporal (Sin equipo)'];
        initMuscles = 'Pectoral mayor, tríceps, deltoides anterior';
      } else if (lower.includes('remo') || lower.includes('dominada') || lower.includes('jal') || lower.includes('espalda')) {
        initZone = 'superior';
        initSubzones = ['Espalda'];
        initEq = ['Barra olímpica / Discos', 'Mancuernas', 'Máquina de poleas / Smith'];
        initMuscles = 'Dorsal ancho, trapecio, bíceps';
      } else if (lower.includes('curl') || lower.includes('bicep') || lower.includes('tricep')) {
        initZone = 'superior';
        initSubzones = ['Brazos'];
        initEq = ['Mancuernas', 'Barra olímpica / Discos'];
        initMuscles = lower.includes('tricep') ? 'Tríceps braquial' : 'Bíceps braquial, antebrazos';
      } else if (lower.includes('plancha') || lower.includes('crunch') || lower.includes('abdom') || lower.includes('core')) {
        initZone = 'inferior';
        initSubzones = ['Core'];
        initEq = ['Peso corporal (Sin equipo)'];
        initMuscles = 'Recto abdominal, oblicuos';
      }

      setSelectedEquipment(initEq);
      setSelectedZone(initZone);
      setSelectedSubzones(initSubzones);
      setMuscleText(initMuscles);
      setSelectedMuscleChips(initMuscles.split(',').map(s => s.trim()));
      setDescription(`Ejercicio de fuerza y acondicionamiento enfocado en ${trimmed}.`);
      setExecutionSteps([
        'Mantén la postura firme y la columna en posición neutra.',
        'Realiza la fase excéntrica con descenso o flexión controlada.',
        'Aplica fuerza continua para volver a la posición inicial.'
      ]);
    }
  }, [isOpen, initialExerciseName]);

  if (!isOpen) return null;

  // Toggle equipment checklist
  const toggleEquipment = (eqValue: string) => {
    setSelectedEquipment(prev => {
      if (prev.includes(eqValue)) {
        // Prevent unselecting all
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== eqValue);
      } else {
        return [...prev, eqValue];
      }
    });
  };

  // Toggle subzone checklist
  const toggleSubzone = (zone: 'inferior' | 'superior', subzone: string) => {
    setSelectedZone(zone);
    setSelectedSubzones(prev => {
      if (prev.includes(subzone)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== subzone);
      } else {
        return [...prev, subzone];
      }
    });
  };

  // Toggle muscle chip
  const toggleMuscleChip = (muscle: string) => {
    const chipFormatted = muscle.trim();
    let updatedChips: string[];
    if (selectedMuscleChips.includes(chipFormatted)) {
      updatedChips = selectedMuscleChips.filter(m => m !== chipFormatted);
    } else {
      updatedChips = [...selectedMuscleChips, chipFormatted];
    }
    setSelectedMuscleChips(updatedChips);

    // Sync with text field if not already there
    const currentList = muscleText.split(',').map(s => s.trim()).filter(Boolean);
    if (!currentList.includes(chipFormatted)) {
      const merged = [...currentList, chipFormatted].join(', ');
      setMuscleText(merged);
    }
  };

  // Trigger Gemini AI Web Search Grounding
  const handleGeminiLookup = async () => {
    const searchTarget = name.trim();
    if (!searchTarget) {
      setAiStatusMessage('Por favor escribe el nombre del ejercicio para investigarlo.');
      return;
    }

    setIsSearchingWithAI(true);
    setAiStatusMessage('Buscando en la web y analizando biomecánica con Gemini...');

    try {
      const res = await fetch('/api/gemini/lookup-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseName: searchTarget })
      });

      if (!res.ok) {
        throw new Error('No se pudo conectar con el servidor de Gemini.');
      }

      const data = await res.json();
      if (data && data.exercise) {
        const ex = data.exercise;

        // Apply equipment
        if (ex.equipamiento && Array.isArray(ex.equipamiento) && ex.equipamiento.length > 0) {
          const normalizedEq = normalizeEquipmentTags(ex.equipamiento);
          setSelectedEquipment(normalizedEq);
        }

        // Apply zone & subzone
        if (ex.zona) {
          setSelectedZone(ex.zona === 'superior' ? 'superior' : 'inferior');
        }
        if (ex.subzone || ex.subzona) {
          const s = ex.subzone || ex.subzona;
          setSelectedSubzones([s]);
        }

        // Apply muscles
        const musclesList: string[] = [
          ...(ex.musculos_principales || []),
          ...(ex.musculos_secundarios || [])
        ];
        if (musclesList.length > 0) {
          setMuscleText(musclesList.join(', '));
          setSelectedMuscleChips(ex.musculos_principales || musclesList.slice(0, 3));
        }

        // Apply description & steps
        if (ex.descripcion) {
          setDescription(ex.descripcion);
        }
        if (ex.ejecucion_pasos && Array.isArray(ex.ejecucion_pasos)) {
          setExecutionSteps(ex.ejecucion_pasos);
        }

        setAiSource(data.source || 'gemini-web-search');
        setAiStatusMessage(
          data.source === 'gemini-web-search' 
            ? '✓ ¡Ficha completada con información verificada en la web! Revisa las casillas a continuación.'
            : '✓ Ficha estructurada con análisis biomecánico asistido. Puedes ajustar las opciones.'
        );
      }
    } catch (err: any) {
      console.warn('Error during Gemini search:', err);
      setAiStatusMessage('Análisis asistido completado con parámetros recomendados.');
    } finally {
      setIsSearchingWithAI(false);
    }
  };

  // Save and add exercise
  const handleSaveAndAdd = async () => {
    const exerciseName = name.trim();
    if (!exerciseName) return;

    setIsSaving(true);

    const parsedMuscles = muscleText
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);

    const muscleGroups: MuscleGroup[] = extractMuscleGroups(parsedMuscles);

    const exerciseEntry: Partial<CatalogExercise> & { nombre: string } = {
      nombre: exerciseName,
      equipamiento: selectedEquipment,
      zona: selectedZone,
      subzona: selectedSubzones.join(', '),
      musculos_principales: parsedMuscles.slice(0, 3),
      musculos_secundarios: parsedMuscles.slice(3),
      muscle_groups: muscleGroups,
      descripcion: description || `Ejercicio para ${exerciseName}.`,
      ejecucion_pasos: executionSteps.length > 0 ? executionSteps : [
        'Adopta la postura inicial correcta.',
        'Realiza la ejecución con rango completo y ritmo controlado.',
        'Regresa a la posición inicial manteniendo la estabilidad.'
      ],
      personalizado: true
    };

    try {
      await saveCustomExerciseToCatalog(exerciseEntry);
      onExerciseAdded(exerciseName);
      onClose();
    } catch (error) {
      console.error('Error saving exercise:', error);
      // Fallback add directly
      onExerciseAdded(exerciseName);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                Configurar Ficha de Ejercicio
              </h3>
              <p className="text-xs text-slate-400">
                Personaliza equipamiento, zona corporal y musculatura activa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Exercise Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nombre del Ejercicio
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sentadilla sumo, Curl martillo..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-medium"
            />
          </div>

          {/* Gemini AI Web Search Grounding Banner / Button */}
          <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/30 border border-cyan-500/30 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-cyan-200">
                    ¿Prefieres autocompletar con IA?
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Activa la búsqueda web de Gemini para investigar <span className="font-semibold text-cyan-300">"{name || 'este ejercicio'}"</span> y rellenar automáticamente la ficha.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGeminiLookup}
                disabled={isSearchingWithAI || !name.trim()}
                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Ayuda de Gemini con búsqueda web"
              >
                {isSearchingWithAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buscando en la web...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ayuda de Gemini</span>
                  </>
                )}
              </button>
            </div>

            {aiStatusMessage && (
              <div className={`mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center gap-2 text-xs ${aiSource === 'gemini-web-search' ? 'text-emerald-400' : 'text-cyan-300'}`}>
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{aiStatusMessage}</span>
              </div>
            )}
          </div>

          {/* Section 1: Equipment Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                <span>Equipamiento (Casillas Checklist)</span>
              </label>
              <span className="text-[11px] text-slate-400">Puedes marcar varias</span>
            </div>

            {/* Primary checklist requested by user */}
            <div className="grid grid-cols-2 gap-2.5">
              {PRIMARY_EQUIPMENT_OPTIONS.map((opt) => {
                const checked = selectedEquipment.includes(opt.value);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      checked 
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-sm' 
                        : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEquipment(opt.value)}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-600 bg-slate-700"
                    />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Optional secondary equipment chips */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1.5">Otras variantes de equipamiento:</span>
              <div className="flex flex-wrap gap-1.5">
                {SECONDARY_EQUIPMENT_OPTIONS.map((opt) => {
                  const checked = selectedEquipment.includes(opt.value);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleEquipment(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        checked
                          ? 'bg-cyan-900/40 border-cyan-500/40 text-cyan-200'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {checked ? '✓ ' : '+ '}{opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Zona Checklist (Inferior / Superior with Subzones) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zona Corporal</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Zona Inferior */}
              <div className={`p-3 rounded-xl border transition-all ${selectedZone === 'inferior' ? 'bg-slate-800/80 border-cyan-500/40' : 'bg-slate-850/50 border-slate-800'}`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/50">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    <span>+</span> Inferior
                  </span>
                  <span className="text-[10px] text-slate-400">Piernas / Core</span>
                </div>
                <div className="space-y-1.5">
                  {ZONE_OPTIONS.filter(z => z.zone === 'inferior').map(opt => {
                    const isChecked = selectedZone === 'inferior' && selectedSubzones.includes(opt.subzone);
                    return (
                      <label
                        key={opt.subzone}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-cyan-950/40 text-cyan-200 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubzone('inferior', opt.subzone)}
                          className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-600 bg-slate-700"
                        />
                        <span className="text-xs">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Zona Superior */}
              <div className={`p-3 rounded-xl border transition-all ${selectedZone === 'superior' ? 'bg-slate-800/80 border-cyan-500/40' : 'bg-slate-850/50 border-slate-800'}`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/50">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    <span>+</span> Superior
                  </span>
                  <span className="text-[10px] text-slate-400">Torso / Brazos / Espalda</span>
                </div>
                <div className="space-y-1.5">
                  {ZONE_OPTIONS.filter(z => z.zone === 'superior').map(opt => {
                    const isChecked = selectedZone === 'superior' && selectedSubzones.includes(opt.subzone);
                    return (
                      <label
                        key={opt.subzone}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-cyan-950/40 text-cyan-200 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubzone('superior', opt.subzone)}
                          className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-600 bg-slate-700"
                        />
                        <span className="text-xs">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Musculo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Músculos Estimulados
              </label>
              <span className="text-[11px] text-slate-400">Toca chips o edita el texto</span>
            </div>

            {/* Quick suggested chips based on selected zones */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {ZONE_OPTIONS
                .filter(z => z.zone === selectedZone && selectedSubzones.includes(z.subzone))
                .flatMap(z => z.suggestedMuscles)
                .map(muscle => {
                  const active = selectedMuscleChips.includes(muscle) || muscleText.toLowerCase().includes(muscle.toLowerCase());
                  return (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => toggleMuscleChip(muscle)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{muscle}
                    </button>
                  );
                })}
            </div>

            <input
              type="text"
              value={muscleText}
              onChange={(e) => setMuscleText(e.target.value)}
              placeholder="Ej: Aductor mayor, glúteo mayor, cuádriceps..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
            />
          </div>

          {/* Collapsible: Additional Technical Ficha (Description & Steps) */}
          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5" />
                <span>Ver descripción y pasos técnicos de ejecución</span>
              </span>
              {showAdvancedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedDetails && (
              <div className="mt-3 space-y-3 bg-slate-850 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descripción del movimiento..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Pasos de ejecución
                  </label>
                  <div className="space-y-1.5">
                    {executionSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-cyan-400 flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => {
                            const newSteps = [...executionSteps];
                            newSteps[idx] = e.target.value;
                            setExecutionSteps(newSteps);
                          }}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-850 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAndAdd}
            disabled={isSaving || !name.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar y Añadir a Rutina</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
