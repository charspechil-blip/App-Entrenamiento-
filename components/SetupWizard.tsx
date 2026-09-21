
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from './UserProfile';
import type { UserProfile as UserProfileType, RoutineType, RoutineFocus, ExerciseName, UserRoutine, ExerciseLog, TrainingType, RestSettings, Goals } from '../types';
import { PREDEFINED_EXERCISES } from '../constants/exercises';
import { ManualLogModal } from './ManualLogModal';
import { getEquipmentForExercise, canPerformExerciseWithEquipment, DEFAULT_EQUIPMENT_LIST, DEFAULT_INITIAL_SELECTED_EQUIPMENT } from '../constants/equipment';
import { CustomExerciseModal } from './CustomExerciseModal';
import { getAllCatalogExercises } from '../services/exerciseCatalog';
import { Sparkles, SlidersHorizontal } from 'lucide-react';


interface SetupWizardProps {
  onComplete: (
    profile: Omit<UserProfileType, 'id'>, 
    routine: RoutineType, 
    focus: RoutineFocus, 
    exercises: ExerciseName[], 
    favoriteExercises: ExerciseName[], 
    aiConfig?: { trainingType: TrainingType, restSettings: RestSettings, goals: Goals },
    equipment?: string[]
  ) => void;
  initialProfile?: UserProfileType | null;
  initialRoutine?: UserRoutine | null;
  onCancel?: () => void;
  startStep?: number;
  onSaveManualLog: (profile: Omit<UserProfileType, 'id'> | null, logs: ExerciseLog[]) => void;
}

const routineOptions: { name: RoutineType; description: string }[] = [
    { name: 'Calistenia', description: 'Entrenamiento con tu propio peso corporal.' },
    { name: 'Gym', description: 'Ejercicios clásicos de gimnasio con pesas.' },
    { name: 'Personalizado', description: 'Crea y personaliza tu propia rutina.' },
];

const routineColors: Record<RoutineType, { selected: string; base: string; text: string }> = {
    Calistenia: {
      selected: 'bg-emerald-900/50 border-emerald-500',
      base: 'bg-slate-700/50 border-slate-600 hover:border-emerald-600 hover:bg-slate-700',
      text: 'text-emerald-400',
    },
    Gym: {
      selected: 'bg-amber-900/50 border-amber-500',
      base: 'bg-slate-700/50 border-slate-600 hover:border-amber-600 hover:bg-slate-700',
      text: 'text-amber-400',
    },
    Personalizado: {
      selected: 'bg-blue-900/50 border-blue-500',
      base: 'bg-slate-700/50 border-slate-600 hover:border-blue-600 hover:bg-slate-700',
      text: 'text-blue-400',
    }
};

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, initialProfile, initialRoutine, onCancel, startStep = 1, onSaveManualLog }) => {
  const [step, setStep] = useState(startStep);
  const [profile, setProfile] = useState<Omit<UserProfileType, 'id'> | null>(initialProfile || null);
  const [routine, setRoutine] = useState<RoutineType | null>(initialRoutine?.type || null);
  const [focus, setFocus] = useState<RoutineFocus | null>(initialRoutine?.focus || null);
  const [selectedExercises, setSelectedExercises] = useState<ExerciseName[]>(initialRoutine?.exercises || []);
  const [favoriteExercises, setFavoriteExercises] = useState<ExerciseName[]>(initialProfile?.favoriteExercises || []);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(
    initialProfile?.availableEquipment || DEFAULT_INITIAL_SELECTED_EQUIPMENT
  );
  const [filterOnlyCompatible, setFilterOnlyCompatible] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [suggestions, setSuggestions] = useState<ExerciseName[]>([]);
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customModalExerciseName, setCustomModalExerciseName] = useState('');
  const [catalogVersion, setCatalogVersion] = useState(0);
  
  const [aiAssistMode, setAiAssistMode] = useState<'idle' | 'active' | 'manual'>('idle');

  const allPredefinedExercises = useMemo(() => {
    const allExercises = new Set<ExerciseName>();
    if (PREDEFINED_EXERCISES) {
      Object.values(PREDEFINED_EXERCISES).forEach(routineType => {
          if (routineType && routineType !== PREDEFINED_EXERCISES.Personalizado) {
              Object.values(routineType).forEach(focusExercises => {
                  if (Array.isArray(focusExercises)) {
                      focusExercises.forEach(ex => allExercises.add(ex));
                  }
              });
          }
      });
    }

    // Incorporar todos los ejercicios del catálogo maestro (ejercicios.json) y personalizados
    const catalogList = getAllCatalogExercises();
    catalogList.forEach(c => allExercises.add(c.nombre as ExerciseName));

    return Array.from(allExercises).sort();
  }, [catalogVersion]);

  useEffect(() => {
    setStep(startStep);
    if(initialRoutine) {
      setAiAssistMode('manual');
    } else {
      setAiAssistMode('idle');
    }
  }, [startStep, initialRoutine]);
  
  useEffect(() => {
    if(initialProfile) {
        setProfile(initialProfile);
        setFavoriteExercises(initialProfile.favoriteExercises || []);
        if (initialProfile.availableEquipment && initialProfile.availableEquipment.length > 0) {
          setAvailableEquipment(initialProfile.availableEquipment);
        }
    }
    if(initialRoutine) {
      setRoutine(initialRoutine.type);
      setFocus(initialRoutine.focus);
      setSelectedExercises(initialRoutine.exercises || []);
    } else {
      setRoutine(null);
      setFocus(null);
      setSelectedExercises([]);
    }
  }, [initialProfile, initialRoutine]);

  const handleProfileSave = (savedProfile: Omit<UserProfileType, 'id'>) => {
    setProfile(savedProfile);
    if (savedProfile.availableEquipment && savedProfile.availableEquipment.length > 0) {
      setAvailableEquipment(savedProfile.availableEquipment);
    }
    setStep(2);
  };

  const handleRoutineSelect = (selectedRoutine: RoutineType) => {
    setRoutine(selectedRoutine);
    setFocus(null);
    setSelectedExercises([]);
  };

  const handleFocusSelect = (selectedFocus: RoutineFocus) => {
    setFocus(selectedFocus);
    setSelectedExercises([]);
  };
  
  const handleExerciseToggle = (exerciseName: ExerciseName) => {
    setSelectedExercises(prev => 
        prev.includes(exerciseName) 
            ? prev.filter(ex => ex !== exerciseName)
            : [...prev, exerciseName]
    );
  };

  const handleToggleFavorite = (exerciseName: ExerciseName) => {
    setFavoriteExercises(prev => {
        const isFavorite = prev.includes(exerciseName);
        if (isFavorite) {
            return prev.filter(ex => ex !== exerciseName);
        } else {
            return [...prev, exerciseName];
        }
    });
  };

  const handleNewExerciseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewExerciseName(value);

    if (value.trim().length > 1) {
        const filtered = allPredefinedExercises.filter(ex =>
            ex.toLowerCase().includes(value.toLowerCase()) && !selectedExercises.includes(ex)
        );
        setSuggestions(filtered.slice(0, 5));
    } else {
        setSuggestions([]);
    }
  };

  const handleSuggestionClick = (exerciseName: ExerciseName) => {
    handleExerciseToggle(exerciseName);
    setNewExerciseName('');
    setSuggestions([]);
  };

  const handleAddNewExercise = () => {
    const trimmedName = newExerciseName.trim();
    if (!trimmedName) return;
    
    // Abrir el modal de configuración con checklist (equipamiento, zona, músculo) y opción de Gemini AI
    setCustomModalExerciseName(trimmedName);
    setIsCustomModalOpen(true);
  };

  const handleCustomExerciseAdded = (exerciseName: string) => {
    if (!selectedExercises.includes(exerciseName as ExerciseName)) {
      handleExerciseToggle(exerciseName as ExerciseName);
    }
    setCatalogVersion(v => v + 1);
    setNewExerciseName('');
    setSuggestions([]);
  };

  const handleContinueToStep3 = () => {
    if (routine && focus) {
        setStep(3);
    }
  }

  const handleFinish = () => {
    if (profile && routine && focus) {
      onComplete(profile, routine, focus, selectedExercises, favoriteExercises, undefined, availableEquipment);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setFocus(null);
  };
  
  const handleBackToStep2 = () => {
      setStep(2);
  }

  const focusOptions: RoutineFocus[] = ['Tren Superior', 'Tren Inferior', 'Core', 'Mixto'];

  const renderManualStep2 = () => (
    <>
      <div className="space-y-4">
        {routineOptions.map(option => {
          const isSelected = routine === option.name;
          const color = routineColors[option.name];
          return (
            <div key={option.name} className="transition-all duration-300">
              <button
                onClick={() => handleRoutineSelect(option.name)}
                className={`w-full p-6 rounded-lg border-2 transition-all duration-300 text-left ${isSelected ? color.selected : color.base}`}
              >
                <h3 className="font-bold text-lg text-white">{option.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{option.description}</p>
              </button>
              
              {isSelected && (
                <div key={`${option.name}-focus`} className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 animate-fade-in-up">
                  <h3 className="text-lg font-semibold text-slate-300 mb-4 text-center">Selecciona tu enfoque</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {focusOptions.map(f => (
                      <button
                        key={f}
                        onClick={() => handleFocusSelect(f)}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 text-center ${
                          focus === f
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsManualLogOpen(true)}
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          ¿Solo quieres registrar una sesión pasada?
        </button>
      </div>

      <div className="flex justify-center pt-6 gap-4">
        <button
          onClick={handleBackToStep1}
          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-8 rounded-lg transition-all"
        >
          &larr; Volver
        </button>
        <button
          onClick={handleContinueToStep3}
          disabled={!routine || !focus}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          Continuar &rarr;
        </button>
      </div>
    </>
  );

  return (
    <>
        <div className="fixed inset-0 bg-slate-900 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-slate-700 animate-fade-in-up flex flex-col">
            <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 pb-2 mb-4">
                {initialProfile ? 'Actualizar Configuración' : 'Crear Nuevo Perfil'}
            </h1>
            {initialProfile ? (
                <p className="text-slate-400 text-center">
                    Modifica tu perfil o cambia tu tipo de rutina.
                </p>
            ) : (
                <p className="text-slate-400 text-center">
                    Sigue los pasos para configurar tu cuenta.
                </p>
            )}
            </div>

            <div className="flex-grow overflow-y-auto -mr-4 pr-4 mt-8 scrollbar-hide">
            {step === 1 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 text-center">Paso 1: Tu Perfil</h2>
                    <UserProfile profile={profile} onSave={handleProfileSave} isWizardStep={true} onCancel={onCancel} />
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 text-center">Paso 2: Elige tu Rutina</h2>
                    {renderManualStep2()}
                </div>
            )}

            {step === 3 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-slate-200 mb-2 text-center">Paso 3: Selección de Ejercicios</h2>
                    <p className="text-xs sm:text-sm text-slate-400 text-center mb-4">
                      Selecciona los ejercicios adaptados al equipamiento guardado en tu perfil.
                    </p>

                    {/* Resumen de equipamiento del perfil y acceso rápido para modificarlo */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-4 py-2.5 mb-4 text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-cyan-400 font-semibold">Equipamiento de tu perfil:</span>
                            <span className="bg-slate-700 px-2 py-0.5 rounded text-cyan-300 font-medium">
                                {availableEquipment.length} elementos guardados
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-cyan-400 hover:text-cyan-300 underline font-medium text-left sm:text-right transition-colors"
                        >
                            Modificar en tu perfil
                        </button>
                    </div>

                    {/* Contenedor de selección de ejercicios */}
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
                          <div>
                            <h3 className="text-lg font-bold text-cyan-400">{routine} - {focus}</h3>
                            <p className="text-xs text-slate-400">
                              {selectedExercises.length} ejercicio{selectedExercises.length === 1 ? '' : 's'} seleccionado{selectedExercises.length === 1 ? '' : 's'}
                            </p>
                          </div>

                          {/* Filtro por compatibilidad con el equipamiento */}
                          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                            <button
                              type="button"
                              onClick={() => setFilterOnlyCompatible(false)}
                              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                                !filterOnlyCompatible
                                  ? 'bg-cyan-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterOnlyCompatible(true)}
                              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                                filterOnlyCompatible
                                  ? 'bg-cyan-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span>⚡ Solo con mi equipo</span>
                            </button>
                          </div>
                        </div>

                        {routine && focus ? (
                            (() => {
                                const predefined = PREDEFINED_EXERCISES[routine]?.[focus] || [];
                                const custom = selectedExercises.filter(ex => !predefined.includes(ex));
                                let allDisplayExercises = [...new Set([...predefined, ...custom])];
                                
                                const totalCount = allDisplayExercises.length;
                                const compatibleCount = allDisplayExercises.filter(ex => 
                                  canPerformExerciseWithEquipment(ex, availableEquipment)
                                ).length;

                                if (filterOnlyCompatible) {
                                  allDisplayExercises = allDisplayExercises.filter(ex => 
                                    canPerformExerciseWithEquipment(ex, availableEquipment)
                                  );
                                }

                                allDisplayExercises.sort((a, b) => {
                                    const aIsFavorite = favoriteExercises.includes(a);
                                    const bIsFavorite = favoriteExercises.includes(b);
                                    if (aIsFavorite && !bIsFavorite) return -1;
                                    if (!aIsFavorite && bIsFavorite) return 1;
                                    return a.localeCompare(b);
                                });

                                if (allDisplayExercises.length > 0) {
                                    return (
                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {allDisplayExercises.map(ex => {
                                                const isFavorite = favoriteExercises.includes(ex);
                                                const isCompatible = canPerformExerciseWithEquipment(ex, availableEquipment);
                                                const equipmentNeeded = getEquipmentForExercise(ex);

                                                return (
                                                    <div 
                                                      key={ex} 
                                                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md transition-colors gap-2 ${
                                                        selectedExercises.includes(ex)
                                                          ? 'bg-slate-800/90 border border-cyan-500/30'
                                                          : 'bg-slate-800/60 hover:bg-slate-800'
                                                      }`}
                                                    >
                                                        <div className="flex items-center flex-grow min-w-0">
                                                          <label className="flex items-center cursor-pointer min-w-0 flex-grow">
                                                              <input
                                                                  type="checkbox"
                                                                  checked={selectedExercises.includes(ex)}
                                                                  onChange={() => handleExerciseToggle(ex)}
                                                                  className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-emerald-500 focus:ring-emerald-500 flex-shrink-0"
                                                              />
                                                              <div className="ml-3 min-w-0">
                                                                <span className="text-sm font-medium text-slate-200 block truncate">{ex}</span>
                                                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                                  {equipmentNeeded.slice(0, 2).map((eqName) => (
                                                                    <span
                                                                      key={eqName}
                                                                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                                        availableEquipment.includes(eqName)
                                                                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                                                                          : 'bg-slate-700/60 text-slate-400 border border-slate-600/40'
                                                                      }`}
                                                                    >
                                                                      {eqName}
                                                                    </span>
                                                                  ))}
                                                                  {!isCompatible && (
                                                                    <span className="text-[10px] text-amber-400/90 italic">
                                                                      (Falta equipamiento)
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              </div>
                                                          </label>
                                                        </div>

                                                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setCustomModalExerciseName(ex);
                                                              setIsCustomModalOpen(true);
                                                            }}
                                                            className="p-1.5 rounded-full text-slate-500 hover:text-cyan-300 hover:bg-slate-700 transition-colors"
                                                            title={`Configurar equipamiento y zona de ${ex}`}
                                                            aria-label={`Configurar equipamiento y zona de ${ex}`}
                                                          >
                                                            <SlidersHorizontal className="h-4 w-4" />
                                                          </button>
                                                          <button
                                                              type="button"
                                                              onClick={() => handleToggleFavorite(ex)}
                                                              className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-amber-400 hover:bg-slate-700' : 'text-slate-500 hover:text-amber-300 hover:bg-slate-700'}`}
                                                              aria-label={isFavorite ? `Quitar ${ex} de favoritos` : `Añadir ${ex} a favoritos`}
                                                          >
                                                              {isFavorite ? (
                                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                  </svg>
                                                              ) : (
                                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                  </svg>
                                                              )}
                                                          </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                } else {
                                    return (
                                      <div className="text-center py-6">
                                        <p className="text-slate-400 mb-2">
                                          {filterOnlyCompatible
                                            ? 'No se encontraron ejercicios compatibles con los elementos seleccionados.'
                                            : 'Añade tus propios ejercicios para esta rutina personalizada.'}
                                        </p>
                                        {filterOnlyCompatible && (
                                          <button
                                            type="button"
                                            onClick={() => setFilterOnlyCompatible(false)}
                                            className="text-xs text-cyan-400 hover:underline font-semibold"
                                          >
                                            Ver todos los ejercicios sin filtrar por equipamiento
                                          </button>
                                        )}
                                      </div>
                                    );
                                }
                            })()
                        ) : null}
                    </div>
                    
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-slate-300 mb-2">Añadir Ejercicio Personalizado</h3>
                        <div className="relative">
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newExerciseName}
                                    onChange={handleNewExerciseNameChange}
                                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                                    placeholder="Ej: Empieza a escribir 'Sentadilla'..."
                                    className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
                                    autoComplete="off"
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddNewExercise}
                                    className="flex-shrink-0 whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                    aria-label="Añadir ejercicio personalizado"
                                >
                                    Añadir
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                      setCustomModalExerciseName(newExerciseName.trim() || 'Nuevo Ejercicio');
                                      setIsCustomModalOpen(true);
                                    }}
                                    className="flex-shrink-0 whitespace-nowrap bg-indigo-600/90 hover:bg-indigo-600 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-1.5 text-xs sm:text-sm"
                                    title="Configurar con checklist o ayuda de Gemini"
                                    aria-label="Configurar con IA"
                                >
                                    <Sparkles className="w-4 h-4 text-cyan-300" />
                                    <span className="hidden sm:inline">Configurar con IA</span>
                                </button>
                            </div>
                            {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-slate-600 border border-slate-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg animate-fade-in">
                                    {suggestions.map(suggestion => (
                                        <li
                                            key={suggestion}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="px-4 py-2 cursor-pointer hover:bg-slate-500 text-sm text-slate-200"
                                        >
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {newExerciseName && (
                            <p className="text-xs text-amber-400 mt-2 animate-fade-in">
                                Verifica que el ejercicio que incluyes corresponda a la rutina y enfoque seleccionado.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center pt-8 gap-4">
                        <button
                        onClick={handleBackToStep2}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-8 rounded-lg transition-all"
                        >
                        &larr; Volver
                        </button>
                        <button
                        onClick={handleFinish}
                        disabled={selectedExercises.length === 0}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                        {initialProfile ? 'Actualizar' : 'Finalizar Configuración'}
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
        </div>
        <ManualLogModal
            isOpen={isManualLogOpen}
            onClose={() => setIsManualLogOpen(false)}
            onSave={(newLogs) => {
                onSaveManualLog(profile, newLogs);
            }}
            userRoutine={initialRoutine} 
        />
        {isCustomModalOpen && (
            <CustomExerciseModal
                isOpen={isCustomModalOpen}
                onClose={() => setIsCustomModalOpen(false)}
                initialExerciseName={customModalExerciseName}
                onExerciseAdded={handleCustomExerciseAdded}
            />
        )}
    </>
  );
};
