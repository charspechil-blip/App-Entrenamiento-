
import React, { useMemo } from 'react';
import type { ExerciseLog, ExerciseName } from '../types';
import { getExerciseColor } from '../colors';
import { MUSCLE_GROUP_MAPPING, MuscleGroup } from '../constants/muscles';

interface MuscleActivationMapProps {
    sessionLogs: ExerciseLog[];
}

interface ActiveMuscle {
    muscle: MuscleGroup;
    color: string; // Tailwind class like 'fill-cyan-500'
}

export const MuscleActivationMap: React.FC<MuscleActivationMapProps> = ({ sessionLogs }) => {
    
    const { activeMuscles, exerciseLegend } = useMemo(() => {
        const uniqueExercises: ExerciseName[] = Array.from(new Set(sessionLogs.map(log => log.exerciseName)));
        const muscles = new Map<MuscleGroup, string>();
        const legend: { name: ExerciseName; color: string }[] = [];

        uniqueExercises.forEach(exerciseName => {
            const colorTheme = getExerciseColor(exerciseName);
            // e.g., 'text-cyan-400' -> 'cyan'
            const simpleColor = colorTheme.text.split('-')[1]; 
            
            legend.push({ name: exerciseName, color: simpleColor });

            const muscleGroups = MUSCLE_GROUP_MAPPING[exerciseName];
            if (muscleGroups) {
                muscleGroups.forEach(muscle => {
                    // Generate the full Tailwind class name
                    muscles.set(muscle, `fill-${simpleColor}-500`);
                });
            }
        });

        const activeMusclesList: ActiveMuscle[] = Array.from(muscles.entries()).map(([muscle, color]) => ({
            muscle,
            color
        }));

        return { activeMuscles: activeMusclesList, exerciseLegend: legend };
    }, [sessionLogs]);
    
    if (exerciseLegend.length === 0) {
        return null;
    }
    
    return (
        <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h4 className="font-semibold text-slate-300 mb-4 text-center">Músculos Activados en la Sesión</h4>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <div className="flex justify-center gap-4">
                    <BodyFront activeMuscles={activeMuscles} />
                    <BodyBack activeMuscles={activeMuscles} />
                </div>
                <div className="w-full md:w-48 flex-shrink-0">
                    <p className="text-xs text-slate-400 mb-2 font-semibold">Leyenda:</p>
                    <div className="space-y-1">
                        {exerciseLegend.map(({ name, color }) => (
                             <div key={name} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-${color}-500 flex-shrink-0`}></div>
                                <span className="text-xs text-slate-300">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


interface BodyProps {
  activeMuscles: { muscle: MuscleGroup; color: string }[];
}

const BodyFront: React.FC<BodyProps> = ({ activeMuscles }) => {
  const muscleClasses = activeMuscles.reduce((acc, { muscle, color }) => {
    (acc as any)[muscle] = color;
    return acc;
  }, {} as Record<MuscleGroup, string>);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="267" viewBox="0 0 150 400" className="overflow-visible">
      {/* Base Silhouette */}
      <path d="M75 35 C 60 35, 60 50, 65 55 C 60 58, 45 70, 45 90 C 45 110, 40 120, 38 150 C 35 180, 40 200, 45 290 C 50 380, 60 395, 75 395 C 90 395, 100 380, 105 290 C 110 200, 115 180, 112 150 C 110 120, 105 110, 105 90 C 105 70, 90 58, 85 55 C 90 50, 90 35, 75 35 Z" className="fill-slate-800"/>
      {/* Muscle Groups */}
      <g className="fill-slate-700/50 transition-colors duration-300">
        <path className={muscleClasses.neck} d="M68 64 C 65 72, 65 78, 68 82 L 72 82 C 75 78, 75 72, 72 64 Z M82 64 C 85 72, 85 78, 82 82 L 78 82 C 75 78, 75 72, 78 64 Z" />
        <path className={muscleClasses.shoulders_front} d="M48 84 C 38 90, 35 110, 48 112 L 56 108 C 54 100, 52 90, 48 84 Z" />
        <path className={muscleClasses.shoulders_front} d="M102 84 C 112 90, 115 110, 102 112 L 94 108 C 96 100, 98 90, 102 84 Z" />
        <path className={muscleClasses.chest} d="M58 88 C 58 120, 72 125, 75 125 C 78 125, 92 120, 92 88 C 85 85, 65 85, 58 88 Z" />
        <path className={muscleClasses.biceps} d="M50 114 C 46 122, 46 140, 50 145 L 56 142 C 54 135, 54 125, 50 114 Z" />
        <path className={muscleClasses.biceps} d="M100 114 C 104 122, 104 140, 100 145 L 94 142 C 96 135, 96 125, 100 114 Z" />
        <path className={muscleClasses.forearms} d="M48 150 C 44 158, 46 178, 48 182 L 54 180 C 52 172, 52 160, 48 150 Z" />
        <path className={muscleClasses.forearms} d="M102 150 C 106 158, 104 178, 102 182 L 96 180 C 98 172, 98 160, 102 150 Z" />
        <path className={muscleClasses.abs} d="M64 128 L 86 128 L 86 140 L 64 140 Z M64 142 L 86 142 L 86 154 L 64 154 Z M64 156 L 86 156 L 86 168 L 64 168 Z" />
        <path className={muscleClasses.obliques} d="M58 128 C 54 135, 54 168, 62 170 L 62 128 Z M92 128 C 96 135, 96 168, 88 170 L 88 128 Z" />
        <path className={muscleClasses.quads} d="M60 175 C 55 200, 55 280, 68 290 L 72 290 C 72 200, 68 175, 60 175 Z" />
        <path className={muscleClasses.quads} d="M90 175 C 95 200, 95 280, 82 290 L 78 290 C 78 200, 82 175, 90 175 Z" />
        <path className={muscleClasses.adductors} d="M73 175 L 77 175 L 77 280 L 73 280 Z" />
        <path className={muscleClasses.calves_front} d="M65 300 C 62 320, 65 350, 68 360 L 71 360 C 71 320, 68 300, 65 300 Z" />
        <path className={muscleClasses.calves_front} d="M85 300 C 88 320, 85 350, 82 360 L 79 360 C 79 320, 82 300, 85 300 Z" />
      </g>
    </svg>
  );
};

const BodyBack: React.FC<BodyProps> = ({ activeMuscles }) => {
  const muscleClasses = activeMuscles.reduce((acc, { muscle, color }) => {
    (acc as any)[muscle] = color;
    return acc;
  }, {} as Record<MuscleGroup, string>);
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="267" viewBox="0 0 150 400" className="overflow-visible">
      {/* Base Silhouette */}
      <path d="M75 35 C 60 35, 60 50, 65 55 C 60 58, 45 70, 45 90 C 45 110, 40 120, 38 150 C 35 180, 40 200, 45 290 C 50 380, 60 395, 75 395 C 90 395, 100 380, 105 290 C 110 200, 115 180, 112 150 C 110 120, 105 110, 105 90 C 105 70, 90 58, 85 55 C 90 50, 90 35, 75 35 Z" className="fill-slate-800"/>
      {/* Muscle Groups */}
      <g className="fill-slate-700/50 transition-colors duration-300">
        <path className={muscleClasses.neck} d="M70 60 C 68 70, 68 75, 70 80 L 80 80 C 82 75, 82 70, 80 60 Z" />
        <path className={muscleClasses.traps} d="M75 68 C 65 75, 60 90, 64 100 L 75 120 L 86 100 C 90 90, 85 75, 75 68 Z" />
        <path className={muscleClasses.shoulders_rear} d="M48 84 C 38 90, 35 110, 48 112 L 56 108 C 54 100, 52 90, 48 84 Z" />
        <path className={muscleClasses.shoulders_rear} d="M102 84 C 112 90, 115 110, 102 112 L 94 108 C 96 100, 98 90, 102 84 Z" />
        <path className={muscleClasses.triceps} d="M50 114 C 46 122, 46 140, 50 145 L 56 142 C 54 135, 54 125, 50 114 Z" />
        <path className={muscleClasses.triceps} d="M100 114 C 104 122, 104 140, 100 145 L 94 142 C 96 135, 96 125, 100 114 Z" />
        <path className={muscleClasses.forearms} d="M48 150 C 44 158, 46 178, 48 182 L 54 180 C 52 172, 52 160, 48 150 Z" />
        <path className={muscleClasses.forearms} d="M102 150 C 106 158, 104 178, 102 182 L 96 180 C 98 172, 98 160, 102 150 Z" />
        <path className={muscleClasses.lats} d="M60 105 C 50 120, 50 160, 60 170 L 75 165 L 90 170 C 100 160, 100 120, 90 105 Z" />
        <path className={muscleClasses.mid_back} d="M66 105 L 84 105 L 84 160 L 66 160 Z" />
        <path className={muscleClasses.lower_back} d="M66 162 L 84 162 L 84 175 L 66 175 Z" />
        <path className={muscleClasses.glutes} d="M60 176 C 50 185, 50 210, 60 215 L 75 205 L 90 215 C 100 210, 100 185, 90 176 Z" />
        <path className={muscleClasses.hamstrings} d="M62 218 C 60 230, 60 280, 68 290 L 72 290 L 72 218 Z" />
        <path className={muscleClasses.hamstrings} d="M88 218 C 90 230, 90 280, 82 290 L 78 290 L 78 218 Z" />
        <path className={muscleClasses.calves_rear} d="M65 300 C 62 320, 65 350, 68 360 L 71 360 C 71 320, 68 300, 65 300 Z" />
        <path className={muscleClasses.calves_rear} d="M85 300 C 88 320, 85 350, 82 360 L 79 360 C 79 320, 82 300, 85 300 Z" />
      </g>
    </svg>
  );
};
