
import React, { useState } from 'react';
import { HistoryLog } from './HistoryLog';
import { ManualLogModal } from './ManualLogModal';
import type { ExerciseLog, Goals, UserProfile, UserRoutine, ExerciseName } from '../types';
import { ExerciseHistoryDetail } from './ExerciseHistoryDetail';

interface HistoryScreenProps {
  logs: ExerciseLog[];
  goals: Goals;
  userProfile: UserProfile | null;
  userRoutine: UserRoutine | null;
  onDelete: (logIdsToDelete: string[]) => void;
  onAddLogs: (logs: ExerciseLog[]) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ logs, goals, userProfile, userRoutine, onDelete, onAddLogs }) => {
  const [isManualLogModalOpen, setManualLogModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseName | null>(null);

  if (selectedExercise) {
    return (
      <ExerciseHistoryDetail
        exerciseName={selectedExercise}
        allLogs={logs}
        onBack={() => setSelectedExercise(null)}
      />
    );
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      <HistoryLog 
        logs={logs} 
        goals={goals} 
        userProfile={userProfile} 
        onDelete={onDelete} 
        onOpenManualLog={() => setManualLogModalOpen(true)}
        onSelectExercise={(ex) => setSelectedExercise(ex)}
      />
      <ManualLogModal 
        isOpen={isManualLogModalOpen}
        onClose={() => setManualLogModalOpen(false)}
        onSave={(newLogs) => {
            onAddLogs(newLogs);
            setManualLogModalOpen(false);
        }}
        userRoutine={userRoutine}
      />
    </div>
  );
};