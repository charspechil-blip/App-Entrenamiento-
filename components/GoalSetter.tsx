
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { ExerciseName, Goals, ExerciseGoal, TrainingType, RestSettings } from '../types';
import { isTimeBased as isTimeBasedUtil, isBodyweight as isBodyweightUtil } from '../utils/exerciseUtils';

interface GoalSetterProps {
  exercises: ExerciseName[];
  currentGoals: Goals;
  onSetGoals: (goals: Goals) => void;
  trainingType: TrainingType;
  onSetTrainingType: (type: TrainingType) => void;
  restSettings: RestSettings;
  onSaveRestSettings: (settings: RestSettings) => void;
}

// Initial state for a new goal
const initialGoalState: ExerciseGoal = {
  weight: 0,
  reps: 0,
  series: 3,
  totalTime: 60,
  tempo: '2-0-2-0',
  isWeighted: false,
  useTempo: false,
  clusterGoals: [{ weight: 0, reps: 0 }],
};

export const GoalSetter: React.FC<GoalSetterProps> = ({ 
  exercises, 
  currentGoals, 
  onSetGoals, 
  trainingType, 
  onSetTrainingType,
  restSettings,
  onSaveRestSettings,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseName | ''>('');
  const [goalData, setGoalData] = useState<Partial<ExerciseGoal>>(initialGoalState);
  const [isSaved, setIsSaved] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Form state for rest settings
  const [restFormData, setRestFormData] = useState({
    restBetweenSets: String(restSettings.restBetweenSets),
    restBetweenExercises: String(restSettings.restBetweenExercises),
    mode: restSettings.mode,
  });

  useEffect(() => {
    setRestFormData({
      restBetweenSets: String(restSettings.restBetweenSets),
      restBetweenExercises: String(restSettings.restBetweenExercises),
      mode: restSettings.mode,
    });
  }, [restSettings]);

  const isTimeBased = useMemo(() => (selectedExercise ? isTimeBasedUtil(selectedExercise) : false), [selectedExercise]);
  const isBodyweight = useMemo(() => (selectedExercise ? isBodyweightUtil(selectedExercise) : false), [selectedExercise]);
  
  const isEffectivelyRepBased = useMemo(
    () => isBodyweight && !isTimeBased && !goalData.isWeighted,
    [isBodyweight, isTimeBased, goalData.isWeighted]
  );

  useEffect(() => {
    if (selectedExercise) {
      const existingGoal = currentGoals[selectedExercise];
      const newGoal = existingGoal ? { ...initialGoalState, ...existingGoal } : { ...initialGoalState };
      setGoalData(newGoal);
    } else {
      setGoalData(initialGoalState);
    }
    setIsSaved(true);
  }, [selectedExercise, currentGoals]);
  
  const handleTrainingTypeChange = (type: TrainingType) => {
    onSetTrainingType(type);
    setIsSaved(false);
    if (type !== 'Clúster') {
      setGoalData(prev => ({ ...prev, series: prev.series || 3 }));
    }
  };

  const handleRestChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setIsSaved(false);
    if (type === 'radio') {
      setRestFormData(prev => ({ ...prev, mode: value as 'auto' | 'manual' }));
    } else {
      setRestFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setIsSaved(false);
    setGoalData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'tempo' ? value : Number(value)),
    }));
  };
  
  const handleClusterChange = (index: number, field: 'weight' | 'reps', value: string) => {
    setIsSaved(false);
    const updatedClusters = [...(goalData.clusterGoals || [])];
    updatedClusters[index] = { ...updatedClusters[index], [field]: Number(value) || 0 };
    setGoalData(prev => ({ ...prev, clusterGoals: updatedClusters }));
  };

  const addCluster = () => {
    setIsSaved(false);
    const updatedClusters = [...(goalData.clusterGoals || []), { weight: 0, reps: 0 }];
    setGoalData(prev => ({ ...prev, clusterGoals: updatedClusters }));
  };
  
  const removeCluster = (index: number) => {
    if ((goalData.clusterGoals || []).length <= 1) return;
    setIsSaved(false);
    const updatedClusters = [...(goalData.clusterGoals || [])];
    updatedClusters.splice(index, 1);
    setGoalData(prev => ({ ...prev, clusterGoals: updatedClusters }));
  };

  const handleSaveGoal = (e: FormEvent) => {
    e.preventDefault();

    // 1. Guardar metas de descanso
    const setsVal = Number(restFormData.restBetweenSets);
    const exercisesVal = Number(restFormData.restBetweenExercises);
    onSaveRestSettings({
      restBetweenSets: setsVal >= 0 ? setsVal : 60,
      restBetweenExercises: exercisesVal >= 0 ? exercisesVal : 180,
      mode: restFormData.mode,
    });

    // 2. Guardar meta del ejercicio si está seleccionado
    if (selectedExercise) {
      const finalGoalData: Partial<ExerciseGoal> = { ...goalData };
      if (trainingType !== 'Clúster') delete finalGoalData.clusterGoals;
      if (isTimeBased) {
        delete finalGoalData.weight;
        delete finalGoalData.reps;
        delete finalGoalData.series;
      } else if (isEffectivelyRepBased) {
        delete finalGoalData.weight;
        delete finalGoalData.totalTime;
      } else if (trainingType === 'Clúster') {
        delete finalGoalData.weight;
        delete finalGoalData.reps;
        delete finalGoalData.series;
      } else {
        delete finalGoalData.totalTime;
      }

      onSetGoals({ ...currentGoals, [selectedExercise]: finalGoalData });
    }

    setIsSaved(true);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2500);
  };
  
  const handleRemoveGoal = () => {
    if (!selectedExercise) return;
    const { [selectedExercise]: _, ...remainingGoals } = currentGoals;
    onSetGoals(remainingGoals);
    setSelectedExercise('');
    setIsSaved(true);
  };

  const trainingTypeLabels: Record<TrainingType, string> = {
    Normal: 'NORMAL',
    'Clúster': 'CLUSTER',
    Drop: 'DROP SET',
  };

  // Vista colapsada (tarjeta compacta)
  if (isCollapsed) {
    const goalsCount = Object.keys(currentGoals).length;
    return (
      <div 
        id="card-metas-del-entreno"
        className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-5 sm:p-6 cursor-pointer hover:bg-slate-800/90 transition-all group"
        onClick={() => setIsCollapsed(false)}
        aria-label="Metas del entreno. Haz clic para abrir y editar."
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl ${goalsCount > 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-700/50 text-slate-400'}`}>
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-200 tracking-wide uppercase">
                METAS DEL ENTRENO
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-400 mt-0.5">
                <span>Modalidad: <strong className="text-cyan-400">{trainingTypeLabels[trainingType]}</strong></span>
                <span>•</span>
                <span>Descansos: <strong className="text-slate-200">{restSettings.restBetweenSets}s</strong> / <strong className="text-slate-200">{restSettings.restBetweenExercises}s</strong></span>
                {goalsCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{goalsCount} meta(s)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-slate-700/50 sm:border-0">
            <span className="text-xs font-bold uppercase tracking-wider bg-cyan-900/50 text-cyan-300 py-1 px-3 rounded-full border border-cyan-700/40">
              {trainingTypeLabels[trainingType]}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">
              <span>Editar</span>
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveGoal} id="form-metas-del-entreno" className="bg-slate-800/70 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl p-5 sm:p-7 animate-fade-in space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-700/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-200 uppercase tracking-wide">
            METAS DEL ENTRENO
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Configura la modalidad, el ejercicio, descansos y tus objetivos de sesión.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isSaved && (
            <span className="text-amber-400 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              ● Cambios sin guardar
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-md bg-slate-700/60 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Minimizar ▲
          </button>
        </div>
      </div>

      {/* MODALIDAD (antes tipo de entrenamiento) */}
      <div id="section-modalidad">
        <label htmlFor="modality-select" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          MODALIDAD
        </label>
        <div className="relative">
          <select
            id="modality-select"
            value={trainingType}
            onChange={(e) => handleTrainingTypeChange(e.target.value as TrainingType)}
            className="w-full bg-slate-700/90 border border-slate-600 rounded-lg py-2.5 px-3.5 text-white font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer text-sm"
          >
            <option value="Normal">NORMAL</option>
            <option value="Clúster">CLUSTER</option>
            <option value="Drop">DROP SET</option>
          </select>
        </div>
      </div>

      {/* EJERCICIO */}
      <div id="section-ejercicio">
        <label htmlFor="exercise-select" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          EJERCICIO
        </label>
        <div className="relative">
          <select
            id="exercise-select"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value as ExerciseName)}
            className="w-full bg-slate-700/90 border border-slate-600 rounded-lg py-2.5 px-3.5 text-white font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer text-sm"
          >
            <option value="">-- Selecciona un ejercicio --</option>
            {exercises.map(ex => (
              <option key={ex} value={ex}>
                {ex} {currentGoals[ex] ? '✓ (Con meta guardada)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DESCANSOS */}
      <div id="section-descansos" className="pt-4 border-t border-slate-700/70">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>⏱️</span> DESCANSOS
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="restBetweenSets" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              ENTRE SERIE
            </label>
            <div className="relative">
              <input
                type="number"
                id="restBetweenSets"
                name="restBetweenSets"
                value={restFormData.restBetweenSets}
                onChange={handleRestChange}
                onFocus={(e) => e.target.select()}
                min="0"
                className="w-full bg-slate-700/90 border border-slate-600 rounded-lg py-2.5 px-3.5 pr-14 text-white font-bold text-base focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                placeholder="20"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">
                seg
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="restBetweenExercises" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              ENTRE EJERCICIO
            </label>
            <div className="relative">
              <input
                type="number"
                id="restBetweenExercises"
                name="restBetweenExercises"
                value={restFormData.restBetweenExercises}
                onChange={handleRestChange}
                onFocus={(e) => e.target.select()}
                min="0"
                className="w-full bg-slate-700/90 border border-slate-600 rounded-lg py-2.5 px-3.5 pr-14 text-white font-bold text-base focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                placeholder="20"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">
                seg
              </span>
            </div>
          </div>
        </div>

        {/* Modo de descanso */}
        <div className="mt-3.5 flex flex-wrap items-center gap-4 text-xs bg-slate-700/30 p-2.5 rounded-lg border border-slate-700/60">
          <span className="text-slate-400 font-semibold">Modo de descanso:</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-200">
            <input
              type="radio"
              name="mode"
              value="auto"
              checked={restFormData.mode === 'auto'}
              onChange={handleRestChange}
              className="text-cyan-500 focus:ring-cyan-500 bg-slate-700 cursor-pointer"
            />
            <span>Descansos automáticos</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-200">
            <input
              type="radio"
              name="mode"
              value="manual"
              checked={restFormData.mode === 'manual'}
              onChange={handleRestChange}
              className="text-cyan-500 focus:ring-cyan-500 bg-slate-700 cursor-pointer"
            />
            <span>Descansos manual</span>
          </label>
        </div>
      </div>

      {/* Criterios y casillas según modalidad y ejercicio (Observaciones A y B) */}
      {selectedExercise ? (
        <div className="pt-4 border-t border-slate-700/70 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              OBJETIVOS PARA: <span className="text-cyan-400">{selectedExercise}</span>
            </h4>
            {currentGoals[selectedExercise] && (
              <span className="text-[11px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                ● Meta activa
              </span>
            )}
          </div>

          {/* Observación A: Casilla check para activar o no el lastre */}
          {isBodyweight && !isTimeBased && (
            <div className="bg-slate-700/40 border border-slate-600/70 rounded-lg p-3">
              <label htmlFor="isWeighted" className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="isWeighted"
                  name="isWeighted"
                  checked={goalData.isWeighted || false}
                  onChange={handleInputChange}
                  className="mt-0.5 h-4 w-4 rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-200">Activar Lastre (peso adicional)</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Marca esta opción si realizarás el ejercicio con cinturón de lastre, chaleco o mancuerna extra.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Observación B: Diferencia en las casillas según modalidad elegida como está actualmente */}
          {isTimeBased ? (
            <div>
              <label htmlFor="totalTime" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tiempo Total (segundos)
              </label>
              <input
                type="number"
                name="totalTime"
                id="totalTime"
                value={goalData.totalTime || ''}
                onChange={handleInputChange}
                className="w-full bg-slate-700/90 border border-slate-600 rounded-lg py-2.5 px-3.5 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                min="1"
                placeholder="60"
              />
            </div>
          ) : trainingType === 'Clúster' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Configuración de Clústeres
                </h5>
                <button
                  type="button"
                  onClick={addCluster}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  + Añadir Clúster
                </button>
              </div>
              <div className="space-y-2">
                {(goalData.clusterGoals || [{ weight: 0, reps: 0 }]).map((cluster, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-700/30 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 font-bold text-xs w-20 flex-shrink-0">
                      Clúster {index + 1}
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        placeholder={isBodyweight && !goalData.isWeighted ? '0 (Corporal)' : 'Kg'}
                        value={cluster.weight || ''}
                        onChange={(e) => handleClusterChange(index, 'weight', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 pr-8 text-white text-sm"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">kg</span>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        placeholder="Reps"
                        value={cluster.reps || ''}
                        onChange={(e) => handleClusterChange(index, 'reps', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 pr-10 text-white text-sm"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">reps</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCluster(index)}
                      disabled={(goalData.clusterGoals || []).length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                      title="Eliminar este clúster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Modalidad Normal o Drop Set */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(!isEffectivelyRepBased || goalData.isWeighted) && (
                <div>
                  <label htmlFor="weight" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {goalData.isWeighted ? 'Lastre (Kg)' : 'Peso (Kg)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="weight"
                      id="weight"
                      step="0.5"
                      value={goalData.weight || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700/90 border border-slate-600 rounded-lg py-2 px-3 pr-8 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                      min="0"
                      placeholder="0"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">kg</span>
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="reps" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Repeticiones
                </label>
                <input
                  type="number"
                  name="reps"
                  id="reps"
                  value={goalData.reps || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700/90 border border-slate-600 rounded-lg py-2 px-3 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                  min="1"
                  placeholder="10"
                />
              </div>
              <div>
                <label htmlFor="series" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Series
                </label>
                <input
                  type="number"
                  name="series"
                  id="series"
                  value={goalData.series || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700/90 border border-slate-600 rounded-lg py-2 px-3 text-white font-medium focus:ring-2 focus:ring-cyan-500"
                  min="1"
                  placeholder="3"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-2 text-xs text-slate-400 italic">
          💡 Para establecer peso, repeticiones o clústeres específicos, selecciona un ejercicio arriba.
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row justify-center items-center pt-5 border-t border-slate-700/70 gap-3">
        <button 
          type="button" 
          onClick={() => setIsCollapsed(true)} 
          className="w-full sm:flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 px-6 rounded-lg transition-all text-center cursor-pointer"
        >
          Cerrar
        </button>

        <button 
          type="submit" 
          className="w-full sm:flex-1 bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-cyan-500/30 text-center cursor-pointer"
        >
          {isSaved ? 'Metas Guardadas' : 'Guardar Metas del Entreno'}
        </button>

        {selectedExercise && currentGoals[selectedExercise] && (
          <button 
            type="button" 
            onClick={handleRemoveGoal} 
            className="w-full sm:w-auto bg-rose-900/50 hover:bg-rose-800 text-rose-200 font-semibold py-3 px-5 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Borrar Meta</span>
          </button>
        )}
      </div>

      <div className="text-center h-5">
        {showConfirmation && (
          <p className="text-emerald-400 text-sm font-semibold animate-fade-in">
            ¡Metas del entreno guardadas correctamente!
          </p>
        )}
      </div>
    </form>
  );
};

