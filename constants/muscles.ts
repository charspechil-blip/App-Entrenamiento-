
import type { ExerciseName } from '../types';
import { 
  getDynamicMusclesForExercise, 
  findExerciseById, 
  findExerciseByName 
} from '../services/exerciseCatalog';

export type MuscleGroup =
  | 'neck'
  | 'shoulders'
  | 'shoulders_front'
  | 'shoulders_rear'
  | 'chest'
  | 'biceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'adductors'
  | 'calves_front'
  | 'traps'
  | 'triceps'
  | 'lats'
  | 'mid_back'
  | 'lower_back'
  | 'glutes'
  | 'hamstrings'
  | 'calves_rear';

/**
 * SINGLE SOURCE OF TRUTH (SSOT) — MAPEO DINÁMICO DE GRUPOS MUSCULARES
 * 
 * Este proyector elimina la duplicación hardcodeada de ejercicios y músculos.
 * Toda la información anatómica se deriva dinámicamente de "src/data/ejercicios.json"
 * y "src/data/muscles.json" a través de services/exerciseCatalog.ts.
 */
export const MUSCLE_GROUP_MAPPING: Partial<Record<ExerciseName, MuscleGroup[]>> = new Proxy({}, {
  get(_target, prop: string) {
    if (typeof prop !== 'string' || !prop) return undefined;
    const dynamic = getDynamicMusclesForExercise(prop);
    if (dynamic && dynamic.length > 0) {
      return dynamic;
    }
    const ex = findExerciseById(prop) || findExerciseByName(prop);
    if (ex && ex.muscle_groups && ex.muscle_groups.length > 0) {
      return ex.muscle_groups;
    }
    return undefined;
  }
});

