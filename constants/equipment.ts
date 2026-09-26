import type { ExerciseName } from '../types';

export interface EquipmentDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'libre' | 'calistenia' | 'maquinas' | 'accesorios';
}

export const DEFAULT_EQUIPMENT_LIST: EquipmentDefinition[] = [
  { id: 'bodyweight', name: 'Peso corporal (Sin equipo)', icon: '🤸', description: 'Ejercicios libres sin material', category: 'calistenia' },
  { id: 'dumbbells', name: 'Mancuernas', icon: '🏋️', description: 'Mancuernas ajustables o fijas', category: 'libre' },
  { id: 'barbell', name: 'Barra olímpica / Discos', icon: '⚡', description: 'Barra recta, discos olímpicos o estándar', category: 'libre' },
  { id: 'pullup_bar', name: 'Barra de dominadas', icon: '🧗', description: 'Barra fija para colgarse', category: 'calistenia' },
  { id: 'parallel_bars', name: 'Paralelas / Anillas', icon: '⚖️', description: 'Barras paralelas, estación de fondos o anillas', category: 'calistenia' },
  { id: 'bench', name: 'Banco de pesas', icon: '🛋️', description: 'Banco plano, inclinado o multiposición', category: 'libre' },
  { id: 'jump_rope', name: 'Cuerda de saltar', icon: '🪢', description: 'Para calentamiento o trabajo metabólico', category: 'accesorios' },
  { id: 'resistance_bands', name: 'Bandas elásticas', icon: '🎗️', description: 'Bandas de resistencia o tubos de látex', category: 'accesorios' },
  { id: 'kettlebells', name: 'Pesas rusas / Kettlebells', icon: '🔔', description: 'Kettlebells de diferentes pesos', category: 'libre' },
  { id: 'pulley_machine', name: 'Máquina de poleas / Smith', icon: '⚙️', description: 'Torre de poleas, cruces de poleas o jaula Smith', category: 'maquinas' },
  { id: 'leg_machines', name: 'Máquinas de piernas', icon: '🦵', description: 'Prensa, sillón de cuádriceps, femoral, abductores', category: 'maquinas' },
  { id: 'ab_wheel', name: 'Rueda abdominal (Ab wheel)', icon: '🔘', description: 'Rueda para extensión de abdomen', category: 'accesorios' },
  { id: 'home_machine', name: 'Máquina multifunción / Gimnasio en casa', icon: '🏠', description: 'Estación multifuncional o aparato casero', category: 'maquinas' },
];

import { 
  getDynamicEquipmentForExercise, 
  findExerciseById, 
  findExerciseByName 
} from '../services/exerciseCatalog';

/**
 * Retorna las etiquetas de equipamiento compatibles para un ejercicio.
 * Single Source of Truth: Consulta dinámicamente el catálogo canónico (src/data/ejercicios.json).
 */
export const getEquipmentForExercise = (exerciseName: string): string[] => {
  if (!exerciseName) return ['Peso corporal (Sin equipo)'];

  // 1. Revisar catálogo dinámico de exerciseCatalog (indexado por ID, nombre y alias)
  const dynamicEq = getDynamicEquipmentForExercise(exerciseName);
  if (dynamicEq && dynamicEq.length > 0) {
    return dynamicEq;
  }

  // 2. Buscar en catálogo general si no estuviera cargado en el mapa
  const ex = findExerciseById(exerciseName) || findExerciseByName(exerciseName);
  if (ex && ex.equipment && ex.equipment.length > 0) {
    return ex.equipment;
  }

  // 3. Fallback heurístico solo si no se encuentra en el catálogo
  const lower = exerciseName.toLowerCase();
  if (lower.includes('mancuerna')) return ['Mancuernas'];
  if (lower.includes('barra') || lower.includes('olímp')) return ['Barra olímpica / Discos'];
  if (lower.includes('polea')) return ['Máquina de poleas / Smith'];
  if (lower.includes('cuerda') || lower.includes('saltar')) return ['Cuerda de saltar'];
  if (lower.includes('máquina')) return ['Máquina multifunción / Gimnasio en casa'];
  if (lower.includes('kettlebell') || lower.includes('pesa rusa')) return ['Pesas rusas / Kettlebells'];
  if (lower.includes('dominada')) return ['Barra de dominadas'];
  return ['Peso corporal (Sin equipo)'];
};

/**
 * Mapeo de compatibilidad histórica para consumidores que accedan a EXERCISE_EQUIPMENT_MAP.
 * Se delega 100% en getEquipmentForExercise dinámico (sin listas hardcodeadas).
 */
export const EXERCISE_EQUIPMENT_MAP: Record<string, string[]> = new Proxy({}, {
  get(_target, prop: string) {
    if (typeof prop !== 'string' || !prop) return [];
    return getEquipmentForExercise(prop);
  }
});

export const DEFAULT_INITIAL_SELECTED_EQUIPMENT: string[] = [
  'Peso corporal (Sin equipo)',
  'Mancuernas',
  'Barra olímpica / Discos',
  'Barra de dominadas',
  'Paralelas / Anillas',
  'Banco de pesas',
  'Bandas elásticas',
];

/**
 * Determina si un ejercicio se puede realizar con el equipamiento disponible seleccionado por el usuario.
 */
export const canPerformExerciseWithEquipment = (
  exerciseName: string,
  availableEquipment: string[]
): boolean => {
  if (!availableEquipment || availableEquipment.length === 0) return true;
  const required = getEquipmentForExercise(exerciseName);
  // Si alguno de los elementos requeridos/compatibles está en la lista de disponibles del usuario
  return required.some(req => availableEquipment.includes(req));
};
