import type { ExerciseName, ExerciseGoal, TrainingType } from '../types';
import { TIME_BASED_EXERCISES, BODYWEIGHT_EXERCISES } from '../constants/exercises';
import { findExerciseById, findExerciseByName } from '../services/exerciseCatalog';

/**
 * Checks if an exercise is time-based (e.g., Plank).
 */
export const isTimeBased = (exerciseName: ExerciseName): boolean => {
    if (!exerciseName) return false;
    if (TIME_BASED_EXERCISES.includes(exerciseName)) return true;
    const normalized = exerciseName.toLowerCase();
    return normalized.includes('plancha') || 
           normalized.includes('isométrica') || 
           normalized.includes('isometrica') || 
           normalized.includes('hollow body');
};

/**
 * Checks if an exercise is typically performed with bodyweight.
 * Queries canonical catalog metadata directly.
 */
export const isBodyweight = (exerciseName: ExerciseName): boolean => {
    if (!exerciseName) return false;
    const ex = findExerciseById(exerciseName) || findExerciseByName(exerciseName);
    if (ex) {
        return Boolean(ex.sin_equipamiento_posible || (ex.equipamiento && ex.equipamiento.includes('peso_corporal')));
    }
    return BODYWEIGHT_EXERCISES.includes(exerciseName);
};

/**
 * Determines if an exercise should be treated as purely repetition-based for logging purposes.
 * This is true for bodyweight exercises that are not time-based and have no intention of using added weight.
 * The intention to use weight is inferred from the training goal ('Con Lastre') or the training type ('Clúster').
 */
export const isEffectivelyRepBased = (
    exerciseName: ExerciseName,
    goal?: ExerciseGoal,
    trainingType?: TrainingType
): boolean => {
    if (isTimeBased(exerciseName)) {
        return false;
    }
    if (!isBodyweight(exerciseName)) {
        return false;
    }

    // Check for weight intent in the goal or training type
    const hasWeightIntentInGoal = (goal?.isWeighted === true) ||
                                 (!!goal?.weight && goal.weight > 0) ||
                                 (trainingType === 'Clúster' && !!goal?.clusterGoals && goal.clusterGoals.some(c => c.weight > 0));

    return !hasWeightIntentInGoal;
};
