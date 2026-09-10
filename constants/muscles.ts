
import type { ExerciseName } from '../types';

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

export const MUSCLE_GROUP_MAPPING: Partial<Record<ExerciseName, MuscleGroup[]>> = {
  // Calistenia - Tren Superior
  'Flexión / Inver': ['chest', 'shoulders_front', 'triceps'],
  'Dominadas': ['lats', 'biceps', 'mid_back'],
  'Fondos en paralelas': ['triceps', 'chest', 'shoulders_front'],
  'Pike Push-ups': ['shoulders', 'triceps'],
  'Remo invertido': ['mid_back', 'biceps', 'lats'],
  'Muscle-ups (si aplica)': ['lats', 'biceps', 'triceps', 'chest', 'shoulders'],
  'Flexiones diamante': ['triceps', 'chest'],
  'Flexiones arqueras': ['chest', 'shoulders_front', 'triceps'],
  'Face pull con anillas': ['shoulders_rear', 'mid_back', 'traps'],
  'Fondos en banco': ['triceps'],
  // Calistenia - Tren Inferior
  'Sentadilla': ['quads', 'glutes', 'hamstrings', 'adductors'],
  'Zancadas': ['quads', 'glutes'],
  'Sentadilla búlgara': ['quads', 'glutes'],
  'Elevación de talones': ['calves_rear', 'calves_front'],
  'Puente de glúteos': ['glutes', 'hamstrings'],
  'Sentadilla pistola (si aplica)': ['quads', 'glutes'],
  'Nordic curls (si aplica)': ['hamstrings'],
  'Saltos al cajón': ['quads', 'glutes', 'calves_rear'],
  'Sentadilla isométrica (wall sit)': ['quads', 'glutes'],
  // Calistenia - Core
  'Plancha': ['abs', 'lower_back'],
  'Elevación de piernas colgado': ['abs', 'obliques'],
  'Dragon Flag (si aplica)': ['abs', 'lower_back'],
  'Abdominales en V (V-ups)': ['abs'],
  'Plancha lateral': ['obliques'],
  'Hollow body hold': ['abs'],
  'Giros rusos': ['obliques'],
  'Mountain climbers': ['abs', 'quads'],
  'Toes-to-bar': ['abs', 'lats'],
  'L-Sit': ['abs', 'quads', 'triceps'],
  // Calistenia - Mixto
  'Burpees': ['chest', 'quads', 'glutes', 'shoulders', 'abs'],
  'Elevación de rodillas': ['abs', 'quads'],
  'Saltos de tijera': ['calves_rear', 'quads'],

  // Gym - Tren Superior
  'Press de banca': ['chest', 'shoulders_front', 'triceps'],
  'Remo / Inclina': ['mid_back', 'lats', 'biceps'],
  'Press militar': ['shoulders', 'triceps'],
  'Elev / Lat': ['shoulders'],
  'Curl / Biceps': ['biceps'],
  'Press francés': ['triceps'],
  'Jalón al pecho (pulldown)': ['lats', 'mid_back', 'biceps'],
  'Aperturas con mancuernas': ['chest'],
  'Face pull con polea': ['shoulders_rear', 'traps', 'mid_back'],
  'Encogimientos de hombros': ['traps'],
  'Extensiones de tríceps en polea': ['triceps'],
  // Gym - Tren Inferior
  'Peso muerto': ['hamstrings', 'glutes', 'lower_back', 'traps'],
  'Prensa de piernas': ['quads', 'glutes', 'hamstrings'],
  'Extensiones de cuádriceps': ['quads'],
  'Curl femoral': ['hamstrings'],
  'Zancadas con mancuernas': ['quads', 'glutes'],
  'Hip thrust': ['glutes', 'hamstrings'],
  'Abductores en máquina': ['glutes'],
  'Aductores en máquina': ['adductors'],
  // Gym - Core
  'Plancha con peso': ['abs', 'lower_back'],
  'Elevación de piernas en silla romana': ['abs'],
  'Crunch en polea alta': ['abs'],
  'Giros rusos con disco': ['obliques'],
  'Leñador (woodchopper) en polea': ['obliques', 'abs'],
  'Ab wheel': ['abs', 'lats'],
  'Hiperextensiones': ['lower_back', 'glutes'],
  // Gym - Mixto
  'Clean and Jerk': ['quads', 'glutes', 'hamstrings', 'lower_back', 'traps', 'shoulders', 'triceps'],
  'Snatch': ['quads', 'glutes', 'hamstrings', 'lower_back', 'traps', 'shoulders'],
  'Dominadas con lastre': ['lats', 'biceps', 'mid_back'],
  'Thrusters': ['quads', 'shoulders', 'glutes', 'triceps'],
  'Paseo del granjero': ['forearms', 'traps', 'abs', 'calves_rear']
};