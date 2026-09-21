import React, { useState, useMemo } from 'react';
import type { RoutineType, BodyZone, ExerciseName, SavedRoutine, TrainingType, RestSettings, Goals, UserProfile } from '../types';
import { getExerciseDisplayItems, filterWorkoutExercises, ExerciseDisplayItem } from '../utils/workoutFlowUtils';
import { CustomExerciseModal } from './CustomExerciseModal';
import { 
  Dumbbell, 
  Activity, 
  Sparkles, 
  Check, 
  Search, 
  Star, 
  ArrowRight, 
  ArrowLeft, 
  History, 
  Plus, 
  SlidersHorizontal,
  X,
  Flame,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface WorkoutFlowWizardProps {
  onStartRoutine: (params: {
    routineType: RoutineType;
    zones: BodyZone[];
    selectedExercises: ExerciseName[];
  }) => void;
  onContinuePreviousRoutine?: (routine: SavedRoutine) => void;
  lastSavedRoutine?: SavedRoutine | null;
  favoriteExercises?: ExerciseName[];
  onToggleFavorite?: (exerciseName: ExerciseName) => void;
  onCancel?: () => void;
}

const BODY_ZONES_CONFIG: {
  id: BodyZone;
  label: string;
  subtitle: string;
  icon: string;
}[] = [
  { 
    id: 'Tren superior', 
    label: 'Tren superior', 
    subtitle: 'Pecho, espalda, hombros y brazos',
    icon: '💪'
  },
  { 
    id: 'Tren inferior', 
    label: 'Tren inferior', 
    subtitle: 'Cuádriceps, glúteos, isquiotibiales y gemelos',
    icon: '🦵'
  },
  { 
    id: 'Core', 
    label: 'Core', 
    subtitle: 'Abdominales, oblicuos y zona lumbar',
    icon: '⚡'
  },
  { 
    id: 'Cuerpo completo', 
    label: 'Cuerpo completo', 
    subtitle: 'Trabajo integral de todas las cadenas musculares',
    icon: '🔥'
  }
];

const MUSCLE_FILTER_CHIPS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core'];

export const WorkoutFlowWizard: React.FC<WorkoutFlowWizardProps> = ({
  onStartRoutine,
  onContinuePreviousRoutine,
  lastSavedRoutine,
  favoriteExercises = [],
  onToggleFavorite,
  onCancel
}) => {
  // Navigation step (1, 2, or 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state: ¿Cómo vas a entrenar hoy?
  const [selectedTrainingType, setSelectedTrainingType] = useState<RoutineType | null>(null);

  // Step 2 state: ¿Qué vas a trabajar? (multi-selection)
  const [selectedZones, setSelectedZones] = useState<BodyZone[]>([]);

  // Step 3 state: Selección de ejercicios
  const [selectedExercises, setSelectedExercises] = useState<ExerciseName[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Custom exercise modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customModalExerciseName, setCustomModalExerciseName] = useState('');
  const [catalogUpdateTrigger, setCatalogUpdateTrigger] = useState(0);

  // Master exercise items
  const allExercises = useMemo(() => {
    return getExerciseDisplayItems(favoriteExercises);
  }, [favoriteExercises, catalogUpdateTrigger]);

  // Filtered exercises for Step 3
  const displayedExercises = useMemo(() => {
    if (!selectedTrainingType) return [];
    return filterWorkoutExercises({
      exercises: allExercises,
      trainingType: selectedTrainingType,
      zones: selectedZones.length > 0 ? selectedZones : ['Cuerpo completo'],
      muscleFilter: muscleFilter,
      searchQuery: searchQuery,
      onlyFavorites: onlyFavorites
    });
  }, [allExercises, selectedTrainingType, selectedZones, muscleFilter, searchQuery, onlyFavorites]);

  // Handlers
  const handleSelectTrainingType = (type: RoutineType) => {
    setSelectedTrainingType(type);
  };

  const handleToggleZone = (zone: BodyZone) => {
    if (zone === 'Cuerpo completo') {
      // Toggle full body
      if (selectedZones.includes('Cuerpo completo')) {
        setSelectedZones([]);
      } else {
        setSelectedZones(['Cuerpo completo']);
      }
      return;
    }

    // If selecting an individual zone, remove 'Cuerpo completo'
    setSelectedZones(prev => {
      const filtered = prev.filter(z => z !== 'Cuerpo completo');
      if (filtered.includes(zone)) {
        return filtered.filter(z => z !== zone);
      } else {
        return [...filtered, zone];
      }
    });
  };

  const handleToggleExercise = (exerciseName: ExerciseName) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseName)
        ? prev.filter(ex => ex !== exerciseName)
        : [...prev, exerciseName]
    );
  };

  const handleCustomExerciseAdded = (newExName: string) => {
    setCatalogUpdateTrigger(v => v + 1);
    if (!selectedExercises.includes(newExName as ExerciseName)) {
      setSelectedExercises(prev => [...prev, newExName as ExerciseName]);
    }
  };

  const handleStartWorkout = () => {
    if (!selectedTrainingType || selectedExercises.length === 0) return;
    onStartRoutine({
      routineType: selectedTrainingType,
      zones: selectedZones.length > 0 ? selectedZones : ['Cuerpo completo'],
      selectedExercises
    });
  };

  // Context summary string for Step 3
  const contextSummary = useMemo(() => {
    const typeLabel = selectedTrainingType === 'Gym' ? 'GYM' : (selectedTrainingType || 'Entrenamiento');
    const zonesLabel = selectedZones.length > 0 ? selectedZones.join(', ') : 'Cuerpo completo';
    return `${typeLabel} · ${zonesLabel}`;
  }, [selectedTrainingType, selectedZones]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-slate-900/90 border-b border-slate-800/90 px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block leading-none">
              App Entreno
            </span>
            <span className="text-sm font-semibold text-slate-300 leading-tight">
              Paso {step} de 3
            </span>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <div 
              key={num}
              className={`h-2 rounded-full transition-all duration-300 ${
                num === step 
                  ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400/50' 
                  : num < step 
                  ? 'w-4 bg-teal-500' 
                  : 'w-4 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {onCancel && (
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Cerrar"
            aria-label="Cerrar configuración"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        
        {/* ──────────────────────────────────────────────────────────
            PASO 1 — ¿CÓMO VAS A ENTRENAR HOY?
        ────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6 max-w-2xl mx-auto w-full">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
                ¿Cómo vas a entrenar hoy?
              </h1>
              <p className="text-sm sm:text-base text-slate-400">
                Selecciona la modalidad de tu sesión. Ajustarás series y cargas durante el entrenamiento.
              </p>
            </div>

            {/* 3 Large Touch Cards */}
            <div className="grid grid-cols-1 gap-4 pt-2">
              {/* Option 1: GYM */}
              <button
                type="button"
                id="btn-option-gym"
                onClick={() => handleSelectTrainingType('Gym')}
                className={`relative p-5 sm:p-6 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  selectedTrainingType === 'Gym'
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-400/30'
                    : 'border-slate-700/80 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                    selectedTrainingType === 'Gym' 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                      : 'bg-slate-800 text-amber-400 border border-slate-700'
                  }`}>
                    <Dumbbell className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-white">
                        GYM
                      </h3>
                      {selectedTrainingType === 'Gym' && (
                        <span className="text-[11px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      Ejercicios clásicos de gimnasio con pesas.
                    </p>
                  </div>
                </div>

                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedTrainingType === 'Gym'
                    ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20'
                    : 'border border-slate-700 text-transparent'
                }`}>
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </button>

              {/* Option 2: CALISTENIA */}
              <button
                type="button"
                id="btn-option-calistenia"
                onClick={() => handleSelectTrainingType('Calistenia')}
                className={`relative p-5 sm:p-6 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  selectedTrainingType === 'Calistenia'
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-xl shadow-emerald-950/50 ring-2 ring-emerald-400/30'
                    : 'border-slate-700/80 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                    selectedTrainingType === 'Calistenia' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}>
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-white">
                        CALISTENIA
                      </h3>
                      {selectedTrainingType === 'Calistenia' && (
                        <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      Entrenamiento principalmente con tu propio peso corporal.
                    </p>
                  </div>
                </div>

                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedTrainingType === 'Calistenia'
                    ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/20'
                    : 'border border-slate-700 text-transparent'
                }`}>
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </button>

              {/* Option 3: PERSONALIZADO */}
              <button
                type="button"
                id="btn-option-personalizado"
                onClick={() => handleSelectTrainingType('Personalizado')}
                className={`relative p-5 sm:p-6 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  selectedTrainingType === 'Personalizado'
                    ? 'border-blue-400 bg-blue-950/40 shadow-xl shadow-blue-950/50 ring-2 ring-blue-400/30'
                    : 'border-slate-700/80 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                    selectedTrainingType === 'Personalizado' 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                      : 'bg-slate-800 text-blue-400 border border-slate-700'
                  }`}>
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-white">
                        PERSONALIZADO
                      </h3>
                      {selectedTrainingType === 'Personalizado' && (
                        <span className="text-[11px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      Crea o utiliza una rutina adaptada a ti.
                    </p>
                  </div>
                </div>

                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedTrainingType === 'Personalizado'
                    ? 'bg-blue-400 text-slate-950 ring-4 ring-blue-400/20'
                    : 'border border-slate-700 text-transparent'
                }`}>
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </button>
            </div>

            {/* Secondary Option: Continuar sesión anterior */}
            {lastSavedRoutine && onContinuePreviousRoutine && (
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-continue-previous-routine"
                  onClick={() => onContinuePreviousRoutine(lastSavedRoutine)}
                  className="w-full p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700 hover:border-cyan-500/50 transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                        Continuar sesión anterior
                      </div>
                      <div className="text-sm font-bold text-slate-200">
                        {lastSavedRoutine.name} ({lastSavedRoutine.exercises.length} ejercicios)
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Reanudar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            )}

            {/* Step 1 Continue Button */}
            <div className="pt-4">
              <button
                type="button"
                id="btn-step1-continue"
                onClick={() => setStep(2)}
                disabled={!selectedTrainingType}
                className={`w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                  selectedTrainingType
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                }`}
              >
                <span>Continuar</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            PASO 2 — ¿QUÉ VAS A TRABAJAR?
        ────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6 max-w-2xl mx-auto w-full">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
                ¿Qué vas a trabajar?
              </h1>
              <p className="text-sm sm:text-base text-slate-400">
                Selecciona una o más zonas para tu entrenamiento de hoy.
              </p>
            </div>

            {/* Body Zones Visual Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {BODY_ZONES_CONFIG.map(zone => {
                const isSelected = selectedZones.includes(zone.id);

                return (
                  <button
                    key={zone.id}
                    type="button"
                    id={`zone-${zone.id.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => handleToggleZone(zone.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px] group ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl">{zone.icon}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950'
                          : 'border border-slate-700 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className={`text-base font-bold transition-colors ${
                        isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                      }`}>
                        {zone.label}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {zone.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-slate-400 font-medium">
              Puedes cambiar esto después.
            </p>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center gap-2 transition-colors border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <button
                type="button"
                id="btn-step2-continue"
                onClick={() => setStep(3)}
                disabled={selectedZones.length === 0}
                className={`flex-grow py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                  selectedZones.length > 0
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                }`}
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            PASO 3 — SELECCIÓN DE EJERCICIOS
        ────────────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="animate-fade-in space-y-4 max-w-3xl mx-auto w-full pb-20">
            {/* Header with context summary */}
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-xs font-bold text-cyan-300 mb-1">
                <span>🎯</span>
                <span>{contextSummary}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                Elige tus ejercicios
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Selecciona los ejercicios que incluirás en tu rutina.
              </p>
            </div>

            {/* Search Bar & Custom Exercise Action */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ejercicio, músculo o equipamiento..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                id="btn-add-custom-exercise"
                onClick={() => {
                  setCustomModalExerciseName(searchQuery.trim() || 'Nuevo Ejercicio');
                  setIsCustomModalOpen(true);
                }}
                className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Añadir ejercicio personalizado o consultar con IA"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Crear Ejercicio</span>
              </button>
            </div>

            {/* Muscle category filter chips + Favorites toggle */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setOnlyFavorites(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 flex-shrink-0 transition-colors ${
                  onlyFavorites
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-amber-400 hover:bg-slate-750 border border-slate-700'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Favoritos</span>
              </button>

              <div className="w-px h-5 bg-slate-800 flex-shrink-0 mx-1" />

              {MUSCLE_FILTER_CHIPS.map(chip => {
                const isActive = muscleFilter === chip && !onlyFavorites;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setMuscleFilter(chip);
                      setOnlyFavorites(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium flex-shrink-0 transition-colors ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* Compact Exercises List */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-2 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto space-y-1.5 divide-y divide-slate-800/40">
              {displayedExercises.length > 0 ? (
                displayedExercises.map(item => {
                  const isChecked = selectedExercises.includes(item.name);
                  const isFav = favoriteExercises.includes(item.name);

                  return (
                    <div
                      key={item.name}
                      onClick={() => handleToggleExercise(item.name)}
                      className={`p-3 rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isChecked
                          ? 'bg-cyan-950/35 border border-cyan-500/30'
                          : 'hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Checkbox + Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-grow">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent container click
                          className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500 flex-shrink-0 cursor-pointer"
                        />
                        <div className="min-w-0 flex-grow">
                          <div className="text-sm font-semibold text-slate-100 truncate">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] text-slate-400">
                            <span className="font-medium text-cyan-400">
                              {item.muscleGroup}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="truncate max-w-[200px] text-slate-400">
                              {item.equipment.slice(0, 2).join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Favorite Button */}
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(item.name);
                          }}
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                            isFav 
                              ? 'text-amber-400 hover:text-amber-300' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={isFav ? 'Quitar de favoritos' : 'Marcar favorito'}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 px-4 text-slate-400 space-y-2">
                  <p className="text-sm">No se encontraron ejercicios con los filtros actuales.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setMuscleFilter('Todos');
                      setOnlyFavorites(false);
                    }}
                    className="text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    Restablecer filtros
                  </button>
                </div>
              )}
            </div>

            {/* Back button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a zonas</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ──────────────────────────────────────────────────────────
          PERSISTENT BOTTOM BAR (Visible on Step 3)
      ────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <footer className="sticky bottom-0 z-30 bg-slate-900/95 border-t border-slate-800 px-4 sm:px-8 py-3.5 backdrop-blur-md">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-base sm:text-lg font-bold text-white leading-none">
                {selectedExercises.length} {selectedExercises.length === 1 ? 'ejercicio seleccionado' : 'ejercicios seleccionados'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Configurarás series, pesos y descansos en el panel de entreno.
              </div>
            </div>

            <button
              type="button"
              id="btn-comenzar-rutina"
              onClick={handleStartWorkout}
              disabled={selectedExercises.length === 0}
              className={`py-3.5 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 transition-all duration-200 shadow-lg ${
                selectedExercises.length > 0
                  ? 'bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 shadow-teal-500/25 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Comenzar rutina</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      )}

      {/* Custom Exercise Modal with Checklist & Gemini AI */}
      {isCustomModalOpen && (
        <CustomExerciseModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          initialExerciseName={customModalExerciseName}
          onExerciseAdded={handleCustomExerciseAdded}
        />
      )}
    </div>
  );
};
