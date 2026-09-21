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

/**
 * Mapeo del equipamiento necesario o compatible para cada ejercicio.
 * Si un ejercicio tiene múltiples arrays alternativos, cualquiera de ellos lo hace posible.
 */
export const EXERCISE_EQUIPMENT_MAP: Record<string, string[]> = {
  // Calistenia - Tren Superior
  'Flexión / Inver': ['Peso corporal (Sin equipo)'],
  'Dominadas': ['Barra de dominadas'],
  'Fondos en paralelas': ['Paralelas / Anillas', 'Banco de pesas'],
  'Pike Push-ups': ['Peso corporal (Sin equipo)'],
  'Remo invertido': ['Paralelas / Anillas', 'Barra olímpica / Discos', 'Barra de dominadas'],
  'Muscle-ups (si aplica)': ['Barra de dominadas', 'Paralelas / Anillas'],
  'Flexiones diamante': ['Peso corporal (Sin equipo)'],
  'Flexiones arqueras': ['Peso corporal (Sin equipo)'],
  'Face pull con anillas': ['Paralelas / Anillas', 'Bandas elásticas'],
  'Fondos en banco': ['Banco de pesas', 'Peso corporal (Sin equipo)'],

  // Calistenia - Tren Inferior
  'Sentadilla': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Barra olímpica / Discos', 'Pesas rusas / Kettlebells'],
  'Zancadas': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Pesas rusas / Kettlebells'],
  'Sentadilla búlgara': ['Peso corporal (Sin equipo)', 'Banco de pesas', 'Mancuernas'],
  'Elevación de talones': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Barra olímpica / Discos'],
  'Puente de glúteos': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Barra olímpica / Discos', 'Bandas elásticas'],
  'Sentadilla pistola (si aplica)': ['Peso corporal (Sin equipo)'],
  'Nordic curls (si aplica)': ['Peso corporal (Sin equipo)'],
  'Saltos al cajón': ['Peso corporal (Sin equipo)', 'Banco de pesas'],
  'Sentadilla isométrica (wall sit)': ['Peso corporal (Sin equipo)'],

  // Calistenia - Core
  'Plancha': ['Peso corporal (Sin equipo)'],
  'Elevación de piernas colgado': ['Barra de dominadas'],
  'Dragon Flag (si aplica)': ['Banco de pesas', 'Peso corporal (Sin equipo)'],
  'Abdominales en V (V-ups)': ['Peso corporal (Sin equipo)'],
  'Plancha lateral': ['Peso corporal (Sin equipo)'],
  'Hollow body hold': ['Peso corporal (Sin equipo)'],
  'Giros rusos': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Pesas rusas / Kettlebells', 'Barra olímpica / Discos'],
  'Mountain climbers': ['Peso corporal (Sin equipo)'],
  'Toes-to-bar': ['Barra de dominadas'],
  'L-Sit': ['Paralelas / Anillas', 'Peso corporal (Sin equipo)'],

  // Calistenia - Mixto / Cardio
  'Burpees': ['Peso corporal (Sin equipo)', 'Cuerda de saltar'],
  'Elevación de rodillas': ['Peso corporal (Sin equipo)'],
  'Saltos de tijera': ['Peso corporal (Sin equipo)', 'Cuerda de saltar'],

  // Gym - Tren Superior
  'Press de banca': ['Barra olímpica / Discos', 'Banco de pesas', 'Mancuernas', 'Máquina multifunción / Gimnasio en casa', 'Máquina de poleas / Smith'],
  'Remo / Inclina': ['Barra olímpica / Discos', 'Mancuernas', 'Máquina de poleas / Smith', 'Bandas elásticas'],
  'Press militar': ['Barra olímpica / Discos', 'Mancuernas', 'Máquina de poleas / Smith', 'Pesas rusas / Kettlebells'],
  'Elev / Lat': ['Mancuernas', 'Bandas elásticas', 'Máquina de poleas / Smith'],
  'Curl / Biceps': ['Mancuernas', 'Barra olímpica / Discos', 'Bandas elásticas', 'Máquina de poleas / Smith'],
  'Press francés': ['Barra olímpica / Discos', 'Mancuernas', 'Banco de pesas'],
  'Jalón al pecho (pulldown)': ['Máquina de poleas / Smith', 'Bandas elásticas', 'Máquina multifunción / Gimnasio en casa', 'Barra de dominadas'],
  'Aperturas con mancuernas': ['Mancuernas', 'Banco de pesas'],
  'Face pull con polea': ['Máquina de poleas / Smith', 'Bandas elásticas'],
  'Encogimientos de hombros': ['Mancuernas', 'Barra olímpica / Discos', 'Pesas rusas / Kettlebells'],
  'Extensiones de tríceps en polea': ['Máquina de poleas / Smith', 'Bandas elásticas'],

  // Gym - Tren Inferior
  'Peso muerto': ['Barra olímpica / Discos', 'Mancuernas', 'Pesas rusas / Kettlebells'],
  'Prensa de piernas': ['Máquinas de piernas', 'Máquina multifunción / Gimnasio en casa'],
  'Extensiones de cuádriceps': ['Máquinas de piernas', 'Máquina multifunción / Gimnasio en casa', 'Bandas elásticas'],
  'Curl femoral': ['Máquinas de piernas', 'Máquina multifunción / Gimnasio en casa', 'Mancuernas', 'Bandas elásticas'],
  'Zancadas con mancuernas': ['Mancuernas', 'Pesas rusas / Kettlebells'],
  'Hip thrust': ['Barra olímpica / Discos', 'Banco de pesas', 'Mancuernas', 'Bandas elásticas'],
  'Abductores en máquina': ['Máquinas de piernas', 'Bandas elásticas'],
  'Aductores en máquina': ['Máquinas de piernas', 'Bandas elásticas'],

  // Gym - Core
  'Plancha con peso': ['Barra olímpica / Discos', 'Mancuernas', 'Peso corporal (Sin equipo)'],
  'Elevación de piernas en silla romana': ['Paralelas / Anillas', 'Barra de dominadas'],
  'Crunch en polea alta': ['Máquina de poleas / Smith', 'Bandas elásticas'],
  'Giros rusos con disco': ['Barra olímpica / Discos', 'Mancuernas', 'Pesas rusas / Kettlebells'],
  'Leñador (woodchopper) en polea': ['Máquina de poleas / Smith', 'Bandas elásticas'],
  'Ab wheel': ['Rueda abdominal (Ab wheel)'],
  'Hiperextensiones': ['Banco de pesas', 'Peso corporal (Sin equipo)'],

  // Gym - Mixto / Olímpico
  'Clean and Jerk': ['Barra olímpica / Discos', 'Pesas rusas / Kettlebells'],
  'Snatch': ['Barra olímpica / Discos', 'Pesas rusas / Kettlebells', 'Mancuernas'],
  'Dominadas con lastre': ['Barra de dominadas', 'Mancuernas', 'Barra olímpica / Discos'],
  'Thrusters': ['Barra olímpica / Discos', 'Mancuernas', 'Pesas rusas / Kettlebells'],
  'Paseo del granjero': ['Mancuernas', 'Pesas rusas / Kettlebells', 'Barra olímpica / Discos'],
};

import { getDynamicEquipmentForExercise } from '../services/exerciseCatalog';

/**
 * Retorna las etiquetas de equipamiento compatibles para un ejercicio.
 */
export const getEquipmentForExercise = (exerciseName: string): string[] => {
  // 1. Revisar catálogo dinámico y ejercicios personalizados guardados
  const dynamicEq = getDynamicEquipmentForExercise(exerciseName);
  if (dynamicEq && dynamicEq.length > 0) {
    return dynamicEq;
  }

  // 2. Revisar mapa predefinido
  if (EXERCISE_EQUIPMENT_MAP[exerciseName]) {
    return EXERCISE_EQUIPMENT_MAP[exerciseName];
  }
  // Si no se encuentra especificado, inferir por nombre
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
