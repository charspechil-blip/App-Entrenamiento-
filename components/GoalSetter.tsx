
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import type { ExerciseName, Goals, ExerciseGoal, TrainingType, Cluster } from '../types';
import { isTimeBased as isTimeBasedUtil, isBodyweight as isBodyweightUtil } from '../utils/exerciseUtils';

interface GoalSetterProps {
  exercises: ExerciseName[];
  currentGoals: Goals;
  onSetGoals: (goals: Goals) => void;
  trainingType: TrainingType;
  onSetTrainingType: (type: TrainingType) => void;
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

export const GoalSetter: React.FC<GoalSetterProps> = ({ exercises, currentGoals, onSetGoals, trainingType, onSetTrainingType }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseName | ''>('');
  const [goalData, setGoalData] = useState<Partial<ExerciseGoal>>(initialGoalState);
  const [isSaved, setIsSaved] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isTimeBased = useMemo(() => selectedExercise ? isTimeBasedUtil(selectedExercise) : false, [selectedExercise]);
  const isBodyweight = useMemo(() => selectedExercise ? isBodyweightUtil(selectedExercise) : false, [selectedExercise]);
  
  const isEffectivelyRepBased = useMemo(() => isBodyweight && !isTimeBased && !goalData.isWeighted, [isBodyweight, isTimeBased, goalData.isWeighted]);


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
    // When switching to a non-cluster type, reset series to the default.
    // The series field is irrelevant for cluster type under the new logic.
    if(type !== 'Clúster') {
        setGoalData(prev => ({...prev, series: 3}));
    }
  }

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
    if ((goalData.clusterGoals || []).length <= 1) return; // Prevent removing the last one
    setIsSaved(false);
    const updatedClusters = [...(goalData.clusterGoals || [])];
    updatedClusters.splice(index, 1);
    setGoalData(prev => ({ ...prev, clusterGoals: updatedClusters }));
  };


  const handleSaveGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;
    
    // Clean up irrelevant data before saving
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
    setIsSaved(true);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2500);
  };
  
  const handleRemoveGoal = () => {
      if (!selectedExercise) return;
      const { [selectedExercise]: _, ...remainingGoals } = currentGoals;
      onSetGoals(remainingGoals);
      setSelectedExercise(''); // Reset selection
  };
  
  const hasUnsavedChanges = !isSaved && selectedExercise;

  const trainingTypes: TrainingType[] = ['Normal', 'Clúster', 'Drop'];

  if (isCollapsed) {
    return (
      <div 
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsCollapsed(false)}
        aria-label="Metas de entrenamiento. Haz clic para editar."
      >
        <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`${Object.keys(currentGoals).length > 0 ? 'bg-emerald-500/10' : 'bg-slate-700/50'} p-2 rounded-full`}>
                   {Object.keys(currentGoals).length > 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                   )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-300">Metas de Entrenamiento</h2>
                    <p className="text-slate-400 text-sm">
                        {Object.keys(currentGoals).length > 0 
                            ? `${Object.keys(currentGoals).length} meta(s) establecida(s). Haz clic para editar.` 
                            : 'Establece tus metas para la sesión.'}
                    </p>
                </div>
            </div>
            <div className='text-right mt-4 sm:mt-0'>
                <span className="text-sm font-semibold bg-cyan-900/50 text-cyan-300 py-1 px-3 rounded-full">{trainingType}</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveGoal} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div>
                <h2 className="text-xl font-bold text-slate-300">Metas de Entrenamiento</h2>
                <p className="text-slate-400 mt-1 text-sm">Selecciona un ejercicio y establece tus metas.</p>
            </div>
            {hasUnsavedChanges && (
                <div className="text-amber-400 text-sm font-semibold flex items-center gap-2 animate-pulse mt-2 sm:mt-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Cambios sin guardar
                </div>
            )}
        </div>
      
      {/* Training Type Selector */}
      <fieldset className="mb-6">
          <legend className="text-sm font-medium text-slate-300 mb-2">Tipo de Entrenamiento</legend>
          <div className="flex flex-wrap gap-3">
              {trainingTypes.map(type => (
                  <button
                      key={type}
                      type="button"
                      onClick={() => handleTrainingTypeChange(type)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${trainingType === type ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                  >
                      {type}
                  </button>
              ))}
          </div>
      </fieldset>
      
      {/* Exercise Selector */}
      <div className="mb-4">
        <label htmlFor="exercise-select" className="block text-sm font-medium text-slate-300 mb-1">Ejercicio</label>
        <select
          id="exercise-select"
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value as ExerciseName)}
          className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">-- Selecciona un ejercicio --</option>
          {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
        </select>
      </div>

      {selectedExercise && (
        <div className="animate-fade-in space-y-4">
            {/* Form fields */}
            {isTimeBased ? (
                <div>
                    <label htmlFor="totalTime" className="block text-sm font-medium text-slate-300 mb-1">Tiempo Total (segundos)</label>
                    <input type="number" name="totalTime" id="totalTime" value={goalData.totalTime || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" min="1" />
                </div>
            ) : trainingType === 'Clúster' ? (
                <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Configuración de Clústeres</h3>
                    <div className="space-y-2">
                        {(goalData.clusterGoals || [{ weight: 0, reps: 0 }]).map((cluster, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold text-sm pr-1">Clúster {index + 1}</span>
                                <input type="number" placeholder="Kg" value={cluster.weight || ''} onChange={(e) => handleClusterChange(index, 'weight', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" />
                                <input type="number" placeholder="Reps" value={cluster.reps || ''} onChange={(e) => handleClusterChange(index, 'reps', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" />
                                <button type="button" onClick={() => removeCluster(index)} disabled={(goalData.clusterGoals || []).length <= 1} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50 disabled:hover:text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                            </div>
                        ))}
                        <button type="button" onClick={addCluster} className="text-sm text-cyan-400 hover:text-cyan-300">+ Añadir Clúster</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {!isEffectivelyRepBased && (
                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-1">Peso (Kg)</label>
                            <input type="number" name="weight" id="weight" step="0.1" value={goalData.weight || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" min="0"/>
                        </div>
                    )}
                    <div>
                        <label htmlFor="reps" className="block text-sm font-medium text-slate-300 mb-1">Reps</label>
                        <input type="number" name="reps" id="reps" value={goalData.reps || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" min="1"/>
                    </div>
                    <div>
                        <label htmlFor="series" className="block text-sm font-medium text-slate-300 mb-1">Series</label>
                        <input type="number" name="series" id="series" value={goalData.series || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" min="1"/>
                    </div>
                    {isBodyweight && !isTimeBased && (
                        <div className="col-span-2 md:col-span-1 flex items-end">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" name="isWeighted" checked={goalData.isWeighted || false} onChange={handleInputChange} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500" />
                                <span className="text-sm text-slate-300">Con Lastre</span>
                            </label>
                        </div>
                    )}
                </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center mt-8 gap-4">
                <button 
                    type="button" 
                    onClick={() => setIsCollapsed(true)} 
                    className="w-full sm:flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 px-6 rounded-lg transition-all text-center"
                >
                    Cerrar
                </button>
                <button 
                    type="submit" 
                    className="w-full sm:flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed text-center" 
                    disabled={isSaved || !selectedExercise}
                >
                    {isSaved ? 'Meta Guardada' : 'Guardar Meta'}
                </button>
                {currentGoals[selectedExercise] && (
                    <button 
                        type="button" 
                        onClick={handleRemoveGoal} 
                        className="w-full sm:flex-1 bg-rose-800 hover:bg-rose-700 text-rose-300 font-bold py-3 px-6 rounded-lg transition-all text-center"
                    >
                        Borrar
                    </button>
                )}
            </div>
             <div className="text-center mt-2 h-5">
                {showConfirmation && (
                    <p className="text-emerald-400 text-sm animate-fade-in">¡Meta para {selectedExercise} guardada!</p>
                )}
            </div>
        </div>
      )}
    </form>
  );
};
