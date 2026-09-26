/**
 * Identificador canónico único del ejercicio en el catálogo maestro o en ejercicios personalizados.
 * Formato estándar: kebab-case (ej. 'sentadilla', 'press-banca-plano-barra', 'curl-biceps-barra').
 * Single Source of Truth para la identidad en toda la aplicación.
 */
export type ExerciseId = string;

/**
 * Referencia canónica dual: identidad (id) y representación visible (nombre).
 */
export interface ExerciseRef {
  id: ExerciseId;
  nombre: string;
}

export type ExerciseName = 
  // Calistenia
  'Flexión / Inver' | 'Dominadas' | 'Fondos en paralelas' | 'Pike Push-ups' | 'Remo invertido' | 'Muscle-ups (si aplica)' | 'Flexiones diamante' | 'Flexiones arqueras' | 'Face pull con anillas' | 'L-Sit' |
  'Sentadilla' | 'Zancadas' | 'Sentadilla búlgara' | 'Elevación de talones' | 'Puente de glúteos' | 'Sentadilla pistola (si aplica)' | 'Nordic curls (si aplica)' | 'Saltos al cajón' | 'Sentadilla isométrica (wall sit)' |
  'Plancha' | 'Elevación de piernas colgado' | 'Dragon Flag (si aplica)' | 'Abdominales en V (V-ups)' | 'Plancha lateral' | 'Hollow body hold' | 'Giros rusos' | 'Mountain climbers' | 'Toes-to-bar' |
  'Burpees' | 'Elevación de rodillas' | 'Saltos de tijera' | 'Fondos en banco' |
  // Gym
  'Curl / Biceps' | 'Press de banca' | 'Remo / Inclina' | 'Press militar' | 'Elev / Lat' | 'Press francés' | 'Jalón al pecho (pulldown)' | 'Aperturas con mancuernas' | 'Face pull con polea' | 'Encogimientos de hombros' | 'Extensiones de tríceps en polea' |
  'Peso muerto' | 'Prensa de piernas' | 'Extensiones de cuádrigratis' | 'Curl femoral' | 'Zancadas con mancuernas' | 'Hip thrust' | 'Abductores en máquina' | 'Aductores en máquina' |
  'Plancha con peso' | 'Elevación de piernas en silla romana' | 'Crunch en polea alta' | 'Giros rusos con disco' | 'Leñador (woodchopper) en polea' | 'Ab wheel' | 'Hiperextensiones' |
  'Clean and Jerk' | 'Snatch' | 'Dominadas con lastre' | 'Thrusters' | 'Paseo del granjero' | (string & {});

export type RoutineType = 'Calistenia' | 'Gym' | 'Personalizado';

export type RoutineFocus = 'Core' | 'Tren Superior' | 'Tren Inferior' | 'Mixto';

export type BodyZone = 'Tren superior' | 'Tren inferior' | 'Core' | 'Cuerpo completo';

export type TrainingType = 'Normal' | 'Clúster' | 'Drop';

export interface UserRoutine {
  id?: string;
  name?: string;
  type: RoutineType;
  focus: RoutineFocus;
  zones?: string[];
  exercises: (ExerciseId | ExerciseName)[];
  exerciseIds?: ExerciseId[];
  equipment?: string[];
}

export interface Cluster {
  weight: number;
  reps: number;
  time?: number;
  rir?: number;
}

export interface ExerciseLog {
  id: string;
  timestamp: string;
  exerciseId?: ExerciseId;
  exerciseName: ExerciseName;
  clusters: Cluster[];
  heartRate?: number;
  perceivedExertion?: number;
  notes?: string;
  routineId?: string;
  routineName?: string;
  sessionId?: string;
  sessionDurationSeconds?: number;
  interExerciseRestSeconds?: number;
}

export interface ExerciseGoal {
  weight: number;
  reps: number;
  series: number;
  totalTime: number;
  tempo: string;
  isWeighted?: boolean;
  useTempo?: boolean;
  clusterGoals?: Cluster[];
  executionMethod?: TrainingType;
  restBetweenSets?: number;
  clusterConfig?: {
    microRestSeconds?: number;
    repsPerBlock?: number;
  };
  dropSetConfig?: {
    dropCount?: number;
    reductionPercent?: number;
  };
}

export type Goals = Partial<Record<ExerciseId | ExerciseName, ExerciseGoal>>;

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  restingHeartRate?: number;
  favoriteExercises?: (ExerciseId | ExerciseName)[];
  availableEquipment?: string[];
}

export interface RestSettings {
  restBetweenSets: number;
  restBetweenExercises: number;
  mode: 'auto' | 'manual';
}

export interface ColorTheme {
    text: string;
    bg: string;
    hoverBg: string;
    ring: string;
    border: string;
    shadow: string;
}

export interface SavedRoutine {
    id: string;
    profileId: string;
    name: string;
    exercises: (ExerciseId | ExerciseName)[];
    exerciseIds?: ExerciseId[];
    goals: Goals;
    restSettings: RestSettings;
    trainingType: TrainingType;
}

export interface SessionAnalysisMetrics {
    sessionDate: string;
    totalVolume: number;
    volumeByExercise: {
        exerciseName: string;
        volume: number;
        sets: number;
        reps: number;
    }[];
    estimatedSessionDurationMinutes: number;
    estimatedSessionDurationFormatted: string;
    totalRestMinutes: number;
    totalRestFormatted: string;
    loadDensity: number;
    prevLoadDensity: number | null;
    loadDensityDiffPercent: number | null;
    hasPreviousSession: boolean;
}