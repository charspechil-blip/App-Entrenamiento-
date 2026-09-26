import type { ExerciseName, RoutineFocus, RoutineType, ExerciseId } from '../types';
import { 
  getOfficialExercises, 
  getAllCatalogExercises, 
  findExerciseById, 
  findExerciseByName,
  resolveExerciseName 
} from '../services/exerciseCatalog';

// Re-exportar utilidades canónicas del SSOT para centralización
export { 
  getOfficialExercises, 
  getAllCatalogExercises, 
  findExerciseById, 
  findExerciseByName 
};

/**
 * Plantillas predefinidas canónicas por rutina y enfoque,
 * referenciadas exclusivamente por su ExerciseId canónico del SSOT (src/data/ejercicios.json).
 */
export const PREDEFINED_ROUTINE_EXERCISE_IDS: Record<RoutineType, Partial<Record<RoutineFocus, ExerciseId[]>>> = {
  Calistenia: {
    'Tren Superior': [
      'flexiones-de-brazos',
      'dominadas-pronadas',
      'fondos-en-paralelas',
      'pike-push-ups',
      'remo-invertido',
      'muscle-up',
      'flexiones-diamante',
      'flexiones-arqueras',
      'remo-en-anillas',
      'fondos-en-banco'
    ],
    'Tren Inferior': [
      'sentadilla-aerea',
      'zancadas-estaticas',
      'sentadilla-bulgara',
      'elevacion-talones-de-pie',
      'puente-de-gluteos',
      'sentadilla-pistola',
      'curl-nordico',
      'salto-al-cajon',
      'sentadilla-isometrica-pared'
    ],
    'Core': [
      'plancha-abdominal-frontal',
      'elevacion-piernas-colgado',
      'hollow-body-hold',
      'crunch-abdominal-suelo',
      'plancha-lateral',
      'giros-rusos',
      'mountain-climbers'
    ],
    'Mixto': [
      'burpees',
      'flexiones-de-brazos',
      'sentadilla-aerea',
      'plancha-abdominal-frontal',
      'dominadas-pronadas',
      'zancadas-estaticas'
    ],
  },
  Gym: {
    'Tren Superior': [
      'press-banca-plano-barra',
      'remo-con-barra-inclinado',
      'press-militar-barra',
      'elevaciones-laterales-mancuernas',
      'curl-biceps-barra',
      'press-frances-barra-z',
      'jalon-al-pecho-polea',
      'aperturas-mancuernas-plano',
      'face-pull-polea',
      'extension-triceps-polea-alta'
    ],
    'Tren Inferior': [
      'sentadilla',
      'peso-muerto-convencional',
      'prensa-de-piernas',
      'extension-cuadriceps-maquina',
      'curl-femoral-tumbado',
      'zancadas-caminando',
      'hip-thrust-barra',
      'elevacion-talones-de-pie'
    ],
    'Core': [
      'elevacion-piernas-colgado',
      'crunch-en-polea-alta',
      'giros-rusos',
      'press-pallof',
      'rueda-abdominal',
      'buenos-dias',
      'plancha-abdominal-frontal'
    ],
    'Mixto': [
      'dos-tiempos-clean-and-jerk',
      'arrancada-snatch',
      'push-press',
      'paseo-del-granjero',
      'press-banca-plano-barra',
      'peso-muerto-convencional'
    ],
  },
  Personalizado: {
    'Tren Superior': [],
    'Tren Inferior': [],
    'Core': [],
    'Mixto': [],
  }
};

/**
 * Genera dinámicamente el diccionario de nombres de ejercicios predefinidos
 * proyectando los identificadores canónicos de PREDEFINED_ROUTINE_EXERCISE_IDS
 * a través de resolveExerciseName(id) del catálogo maestro.
 */
export function getPredefinedExercises(): Record<RoutineType, Partial<Record<RoutineFocus, ExerciseName[]>>> {
  const result: any = {
    Calistenia: {},
    Gym: {},
    Personalizado: {
      'Tren Superior': [],
      'Tren Inferior': [],
      'Core': [],
      'Mixto': [],
    }
  };

  for (const [rType, focuses] of Object.entries(PREDEFINED_ROUTINE_EXERCISE_IDS)) {
    result[rType] = {};
    for (const [focus, idList] of Object.entries(focuses)) {
      result[rType][focus] = (idList as string[]).map(id => resolveExerciseName(id) as ExerciseName);
    }
  }

  return result;
}

/**
 * Estructura de compatibilidad para componentes existentes.
 * Se deriva dinámicamente del catálogo oficial y no contiene datos hardcodeados independientes.
 */
export const PREDEFINED_EXERCISES: Record<RoutineType, Partial<Record<RoutineFocus, ExerciseName[]>>> = getPredefinedExercises();

/**
 * Lista dinámica de ejercicios de peso corporal / calistenia derivados del catálogo maestro
 */
export function getBodyweightExercises(): ExerciseName[] {
  const official = getAllCatalogExercises();
  const names = new Set<string>();
  
  official.forEach(ex => {
    if (ex.sin_equipamiento_posible || (ex.equipamiento && ex.equipamiento.includes('peso_corporal'))) {
      names.add(ex.nombre);
    }
  });

  return Array.from(names) as ExerciseName[];
}

export const BODYWEIGHT_EXERCISES: ExerciseName[] = getBodyweightExercises();

/**
 * Constante pura de comportamiento/UI: Ejercicios medidos por tiempo en lugar de repeticiones
 */
export const TIME_BASED_EXERCISES: ExerciseName[] = [
  'Plancha',
  'Plancha abdominal frontal',
  'Plancha lateral',
  'Sentadilla isométrica en pared',
  'Sentadilla isométrica (wall sit)',
  'Hollow body hold'
];

