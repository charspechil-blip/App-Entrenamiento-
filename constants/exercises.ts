import type { ExerciseName, RoutineFocus, RoutineType } from '../types';

export const PREDEFINED_EXERCISES: Record<RoutineType, Partial<Record<RoutineFocus, ExerciseName[]>>> = {
    Calistenia: {
        'Tren Superior': ['Flexión / Inver', 'Dominadas', 'Fondos en paralelas', 'Pike Push-ups', 'Remo invertido', 'Muscle-ups (si aplica)', 'Flexiones diamante', 'Flexiones arqueras', 'Face pull con anillas', 'Fondos en banco'],
        'Tren Inferior': ['Sentadilla', 'Zancadas', 'Sentadilla búlgara', 'Elevación de talones', 'Puente de glúteos', 'Sentadilla pistola (si aplica)', 'Nordic curls (si aplica)', 'Saltos al cajón', 'Sentadilla isométrica (wall sit)'],
        'Core': ['Plancha', 'Elevación de piernas colgado', 'Dragon Flag (si aplica)', 'Abdominales en V (V-ups)', 'Plancha lateral', 'Hollow body hold', 'Giros rusos', 'Mountain climbers', 'Toes-to-bar', 'L-Sit'],
        'Mixto': ['Burpees', 'Flexión / Inver', 'Sentadilla', 'Plancha', 'Dominadas', 'Zancadas'],
    },
    Gym: {
        'Tren Superior': ['Press de banca', 'Remo / Inclina', 'Press militar', 'Elev / Lat', 'Curl / Biceps', 'Press francés', 'Jalón al pecho (pulldown)', 'Aperturas con mancuernas', 'Face pull con polea', 'Encogimientos de hombros', 'Extensiones de tríceps en polea'],
        'Tren Inferior': ['Sentadilla', 'Peso muerto', 'Prensa de piernas', 'Extensiones de cuádriceps', 'Curl femoral', 'Zancadas con mancuernas', 'Hip thrust', 'Elevación de talones', 'Abductores en máquina', 'Aductores en máquina'],
        'Core': ['Elevación de piernas en silla romana', 'Crunch en polea alta', 'Giros rusos con disco', 'Leñador (woodchopper) en polea', 'Ab wheel', 'Hiperextensiones', 'Plancha con peso'],
        'Mixto': ['Clean and Jerk', 'Snatch', 'Thrusters', 'Paseo del granjero', 'Press de banca', 'Peso muerto'],
    },
    Personalizado: {
        'Tren Superior': [],
        'Tren Inferior': [],
        'Core': [],
        'Mixto': [],
    }
};

export const BODYWEIGHT_EXERCISES: ExerciseName[] = [
  'Flexión / Inver', 'Dominadas', 'Fondos en paralelas', 'Pike Push-ups', 'Remo invertido', 'Muscle-ups (si aplica)', 'Flexiones diamante', 'Flexiones arqueras', 'Face pull con anillas', 'L-Sit',
  'Sentadilla', 'Zancadas', 'Sentadilla búlgara', 'Elevación de talones', 'Puente de glúteos', 'Sentadilla pistola (si aplica)', 'Nordic curls (si aplica)', 'Saltos al cajón', 'Sentadilla isométrica (wall sit)',
  'Plancha', 'Elevación de piernas colgado', 'Dragon Flag (si aplica)', 'Abdominales en V (V-ups)', 'Plancha lateral', 'Hollow body hold', 'Giros rusos', 'Mountain climbers', 'Toes-to-bar',
  'Burpees', 'Elevación de rodillas', 'Saltos de tijera', 'Fondos en banco',
];

export const TIME_BASED_EXERCISES: ExerciseName[] = ['Plancha'];
