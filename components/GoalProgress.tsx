import React from 'react';
import { ExerciseGoal, TrainingType } from '../types';

interface GoalProgressProps {
  goal: ExerciseGoal;
  progress: {
    weight: number;
    reps: number;
    clusters: number;
    totalTime: number;
    heartRate?: number;
  };
  isTimeBased: boolean;
  isRepBased: boolean;
  trainingType: TrainingType;
}

const formatSecondsToMMSS = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const ProgressBar: React.FC<{
  label: string;
  current: number;
  goal: number;
  unit: string;
  isTimeFormat?: boolean;
}> = ({ label, current, goal, unit, isTimeFormat = false }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isComplete = current >= goal;

  const displayCurrent = isTimeFormat ? formatSecondsToMMSS(current) : current.toLocaleString();
  const displayGoal = isTimeFormat ? formatSecondsToMMSS(goal) : goal.toLocaleString();


  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className={`text-xs font-mono ${isComplete ? 'text-green-400' : 'text-slate-400'}`}>
          {displayCurrent}{unit} / {displayGoal}{unit}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div 
          className={`${isComplete ? 'bg-green-500' : 'bg-cyan-500'} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ goal, progress, isTimeBased, isRepBased, trainingType }) => {
  if (!goal) {
    return null;
  }
  
  const isClusterMode = trainingType === 'Clúster';

  let goalSeriesCount = 0;
  let goalWeight = 0;
  let goalTotalReps = 0;

  if (isClusterMode && goal.clusterGoals) {
      goalSeriesCount = goal.clusterGoals.length;
      goalWeight = goal.clusterGoals.reduce((sum, cg) => sum + (cg.weight * (cg.reps || 0)), 0);
      goalTotalReps = goal.clusterGoals.reduce((sum, cg) => sum + (cg.reps || 0), 0);
  } else {
      goalSeriesCount = goal.series || 0;
      goalWeight = (goal.weight || 0) * (goal.reps || 0) * goalSeriesCount;
      goalTotalReps = (goal.reps || 0) * goalSeriesCount;
  }


  const hasWeightGoal = !isTimeBased && !isRepBased && goalWeight > 0;
  const hasRepsGoal = isRepBased && goalTotalReps > 0;
  const hasTimeGoal = isTimeBased && goal.totalTime && goal.totalTime > 0;
  const hasSeriesGoal = goalSeriesCount > 0 && !isTimeBased;
  const recordedHeartRate = progress?.heartRate;

  if (!hasWeightGoal && !hasRepsGoal && !hasTimeGoal && !hasSeriesGoal && !recordedHeartRate) {
      return null;
  }

  return (
    <div className="mb-4 space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progreso de Meta</h3>
      {hasTimeGoal && <ProgressBar label="Tiempo Total" current={progress.totalTime} goal={goal.totalTime!} unit="" isTimeFormat={true} />}
      {hasWeightGoal && <ProgressBar label="Volumen Total" current={progress.weight} goal={goalWeight} unit="Kg" />}
      {hasRepsGoal && <ProgressBar label="Reps Totales" current={progress.reps} goal={goalTotalReps} unit="" />}
      {hasSeriesGoal && <ProgressBar label="Series Totales" current={progress.clusters} goal={goalSeriesCount} unit="" />}
      {recordedHeartRate && recordedHeartRate > 0 && (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-slate-300">Frecuencia Cardíaca:</span>
            <span className="text-sm font-bold font-mono text-white">{recordedHeartRate} PPM</span>
        </div>
      )}
    </div>
  );
}