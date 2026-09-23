import masterData from '../src/data/ejercicios.json';
import type { MuscleGroup } from '../constants/muscles';

export interface CatalogExercise {
  id: string;
  nombre: string;
  name?: string;
  nombres_alternativos?: string[];
  familia?: string;
  patron_movimiento?: string;
  zona?: 'inferior' | 'superior' | 'core' | 'cuerpo_completo' | 'cardiovascular' | 'movilidad' | string;
  subzona?: string;
  musculos_principales: string[];
  musculos_secundarios: string[];
  muscle_groups?: MuscleGroup[];
  descripcion: string;
  descripcion_breve?: string;
  description?: string;
  ejecucion_pasos: string[];
  executionSteps?: string[];
  equipamiento: string[];
  equipment?: string[];
  variantes_equipamiento?: string[];
  equipmentVariants?: string[];
  sin_equipamiento_posible?: boolean;
  canBeDoneWithoutEquipment?: boolean;
  zonas_corporales?: string[];
  bodyZones?: string[];
  subzonas?: string[];
  subzones?: string[];
  categoria?: string;
  category?: string;
  categorias_secundarias?: string[];
  secondaryCategories?: string[];
  tipo_movimiento?: string;
  movementType?: string;
  patrones_movimiento?: string[];
  movementPattern?: string[];
  lado_cuerpo?: string;
  laterality?: string;
  posicion_principal?: string;
  position?: string;
  nivel_dificultad?: string;
  difficulty?: string;
  descripcion_tecnica?: string;
  executionDescription?: string;
  errores_comunes?: string[];
  commonErrors?: string[];
  consejos_ejecucion?: string[];
  executionTips?: string[];
  precauciones?: string[];
  precautions?: string[];
  video_url?: string;
  videoUrl?: string;
  imagen?: string;
  image?: string;
  muscles?: {
    primary: string[];
    secondary: string[];
  };
  tipo?: 'multiarticular' | 'aislamiento' | 'potencia' | string;
  nivel?: 'principiante' | 'intermedio' | 'avanzado' | string;
  unilateral?: boolean;
  variantes?: string[];
  tags?: string[];
  personalizado?: boolean;
  actualizado_en?: string;
  // Dimensiones conceptuales normalizadas del Catálogo Maestro (Punto 3A/3B/3C)
  zona_anatomica?: string;
  tipo_ejercicio?: 'multiarticular' | 'aislamiento' | string;
  categoria_funcional?: string;
  estabilizadores?: string[];
  ejercicios_relacionados?: string[];
  sustitutos?: string[];
  capacidad_fisica?: string;
  cadena_cinetica?: 'abierta' | 'cerrada' | 'mixta' | string;
  articulaciones_principales?: string[];
  articulaciones_secundarias?: string[];
  plano_predominante?: 'sagital' | 'frontal' | 'transversal' | 'multiplanar' | string;
  unilateralidad?: 'bilateral' | 'unilateral' | 'alternado' | 'asimetrico' | string;
  tipo_resistencia?: 'peso_libre' | 'peso_corporal' | 'polea' | 'maquina_guiada' | 'elastico' | string;
  demanda_estabilidad?: 'baja' | 'media' | 'alta' | string;
  objetivo?: string;
  funcion?: string;
}

// Storage key for custom user exercises
const STORAGE_KEY = 'user_custom_exercises_catalog';

// Cache of all loaded exercises
let cachedExercises: CatalogExercise[] = [];
const dynamicEquipmentMap = new Map<string, string[]>();
const dynamicMuscleMap = new Map<string, MuscleGroup[]>();

// Muscle key translation map from Spanish anatomy to internal MuscleGroup keys
const ANATOMY_TO_MUSCLE_GROUP: Record<string, MuscleGroup> = {
  // Inferior
  'cuadriceps': 'quads',
  'isquiotibiales': 'hamstrings',
  'gluteo_mayor': 'glutes',
  'gluteo_medio': 'glutes',
  'gluteos': 'glutes',
  'aductor_mayor': 'adductors',
  'aductores': 'adductors',
  'gemelos': 'calves_rear',
  'soleo': 'calves_rear',
  'pantorrillas': 'calves_rear',
  'tibial_anterior': 'calves_front',
  // Superior
  'pectoral_mayor': 'chest',
  'pectoral_menor': 'chest',
  'pecho': 'chest',
  'pectorales': 'chest',
  'deltoides_anterior': 'shoulders_front',
  'deltoides_lateral': 'shoulders',
  'deltoides_posterior': 'shoulders_rear',
  'hombros': 'shoulders',
  'deltoides': 'shoulders',
  'triceps_braquial': 'triceps',
  'triceps': 'triceps',
  'biceps_braquial': 'biceps',
  'biceps': 'biceps',
  'braquial': 'biceps',
  'antebrazo': 'forearms',
  'antebrazos': 'forearms',
  'dorsal_ancho': 'lats',
  'dorsales': 'lats',
  'trapecio': 'traps',
  'trapecios': 'traps',
  'romboides': 'mid_back',
  'espalda_media': 'mid_back',
  'erectores_espinales': 'lower_back',
  'lumbar': 'lower_back',
  'lumbares': 'lower_back',
  // Core
  'recto_abdominal': 'abs',
  'abdomen': 'abs',
  'abdominales': 'abs',
  'oblicuo_externo': 'obliques',
  'oblicuos': 'obliques',
  'transverso_abdominal': 'abs',
  'core': 'abs'
};

// Map raw catalog equipment to user-friendly equipment names
export const normalizeEquipmentTags = (rawList: string[]): string[] => {
  if (!rawList || rawList.length === 0) return ['Peso corporal (Sin equipo)'];
  const results = new Set<string>();

  rawList.forEach(eq => {
    const lower = eq.toLowerCase().trim();
    if (lower.includes('peso corporal') || lower.includes('sin equipo') || lower === 'peso_corporal') {
      results.add('Peso corporal (Sin equipo)');
    }
    if (lower.includes('mancuerna')) {
      results.add('Mancuernas');
    }
    if (lower.includes('barra') && !lower.includes('dominada') && !lower.includes('paralela')) {
      results.add('Barra olímpica / Discos');
    }
    if (lower.includes('dominada') || lower === 'barra_dominadas') {
      results.add('Barra de dominadas');
    }
    if (lower.includes('paralela') || lower.includes('anilla')) {
      results.add('Paralelas / Anillas');
    }
    if (lower.includes('banco')) {
      results.add('Banco de pesas');
    }
    if (lower.includes('kettlebell') || lower.includes('pesa rusa') || lower === 'kettlebell') {
      results.add('Pesas rusas / Kettlebells');
    }
    if (lower.includes('banda') || lower.includes('elastica') || lower === 'bandas_elasticas') {
      results.add('Bandas elásticas');
    }
    if (lower.includes('polea') || lower.includes('maquina') || lower.includes('smith') || lower === 'polea' || lower === 'maquina') {
      results.add('Máquina de poleas / Smith');
      results.add('Máquinas de piernas');
      results.add('Máquina multifunción / Gimnasio en casa');
    }
    if (lower.includes('rueda') || lower.includes('ab wheel')) {
      results.add('Rueda abdominal (Ab wheel)');
    }
    if (lower.includes('cuerda') || lower.includes('saltar')) {
      results.add('Cuerda de saltar');
    }
    // Also accept exact names directly
    if (lower === 'mancuernas') results.add('Mancuernas');
    if (lower === 'barra olímpica / discos' || lower === 'barra olimpica / discos') results.add('Barra olímpica / Discos');
    if (lower === 'máquina gym' || lower === 'maquina gym') {
      results.add('Máquina de poleas / Smith');
      results.add('Máquinas de piernas');
      results.add('Máquina multifunción / Gimnasio en casa');
    }
  });

  if (results.size === 0) {
    results.add('Peso corporal (Sin equipo)');
  }

  return Array.from(results);
};

// Extract muscle groups for map highlighting
export const extractMuscleGroups = (principales: string[] = [], secundarios: string[] = []): MuscleGroup[] => {
  const groups = new Set<MuscleGroup>();
  
  [...principales, ...secundarios].forEach(m => {
    const key = m.toLowerCase().replace(/[\s-]+/g, '_');
    if (ANATOMY_TO_MUSCLE_GROUP[key]) {
      groups.add(ANATOMY_TO_MUSCLE_GROUP[key]);
    }
    // Also check substring matching
    for (const [anatomyKey, muscleGroup] of Object.entries(ANATOMY_TO_MUSCLE_GROUP)) {
      if (key.includes(anatomyKey)) {
        groups.add(muscleGroup);
      }
    }
  });

  return Array.from(groups);
};

// Initialize exercises from bundled master JSON and localStorage
export const initializeExerciseCatalog = (): CatalogExercise[] => {
  const baseExercises: CatalogExercise[] = (masterData?.ejercicios || []) as CatalogExercise[];
  
  let customExercises: CatalogExercise[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      customExercises = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading custom exercises from localStorage:', e);
  }

  // Merge, prioritizing custom if same id/name
  const exerciseMap = new Map<string, CatalogExercise>();
  
  baseExercises.forEach(ex => {
    exerciseMap.set(ex.nombre.toLowerCase().trim(), ex);
    if (ex.id) exerciseMap.set(ex.id, ex);
  });

  customExercises.forEach(ex => {
    exerciseMap.set(ex.nombre.toLowerCase().trim(), ex);
    if (ex.id) exerciseMap.set(ex.id, ex);
  });

  const merged = Array.from(new Set(Array.from(exerciseMap.values())));
  cachedExercises = merged;

  // Populate dynamic equipment and muscle maps
  merged.forEach(ex => {
    const normalizedEq = normalizeEquipmentTags(ex.equipamiento);
    dynamicEquipmentMap.set(ex.nombre, normalizedEq);
    if (ex.nombres_alternativos) {
      ex.nombres_alternativos.forEach(alt => dynamicEquipmentMap.set(alt, normalizedEq));
    }

    const muscleGroups = ex.muscle_groups && ex.muscle_groups.length > 0 
      ? ex.muscle_groups 
      : extractMuscleGroups(ex.musculos_principales, ex.musculos_secundarios);
      
    if (muscleGroups.length > 0) {
      dynamicMuscleMap.set(ex.nombre, muscleGroups);
      if (ex.nombres_alternativos) {
        ex.nombres_alternativos.forEach(alt => dynamicMuscleMap.set(alt, muscleGroups));
      }
    }
  });

  return merged;
};

// Get all exercises from catalog
export const getAllCatalogExercises = (): CatalogExercise[] => {
  if (cachedExercises.length === 0) {
    return initializeExerciseCatalog();
  }
  return cachedExercises;
};

// Find an exercise by name or alternate names
export const findExerciseByName = (name: string): CatalogExercise | undefined => {
  const normalized = name.toLowerCase().trim();
  const all = getAllCatalogExercises();
  return all.find(e => 
    e.nombre.toLowerCase().trim() === normalized ||
    (e.nombres_alternativos && e.nombres_alternativos.some(alt => alt.toLowerCase().trim() === normalized)) ||
    e.id === normalized
  );
};

export const findExerciseDetails = findExerciseByName;

// Get dynamic equipment for any exercise
export const getDynamicEquipmentForExercise = (exerciseName: string): string[] | undefined => {
  if (dynamicEquipmentMap.size === 0) {
    initializeExerciseCatalog();
  }
  return dynamicEquipmentMap.get(exerciseName);
};

// Get dynamic muscle groups for any exercise
export const getDynamicMusclesForExercise = (exerciseName: string): MuscleGroup[] | undefined => {
  if (dynamicMuscleMap.size === 0) {
    initializeExerciseCatalog();
  }
  return dynamicMuscleMap.get(exerciseName);
};

// Save a custom exercise both locally and to server
export const saveCustomExerciseToCatalog = async (exercise: Partial<CatalogExercise> & { nombre: string }): Promise<CatalogExercise> => {
  const normalizedEquipment = (exercise.equipment || exercise.equipamiento) && (exercise.equipment || exercise.equipamiento)!.length > 0
    ? (exercise.equipment || exercise.equipamiento)!
    : ['Peso corporal'];

  const primaryMuscles = exercise.muscles?.primary || exercise.musculos_principales || [];
  const secondaryMuscles = exercise.muscles?.secondary || exercise.musculos_secundarios || [];

  const muscleGroups = exercise.muscle_groups && exercise.muscle_groups.length > 0
    ? exercise.muscle_groups
    : extractMuscleGroups(primaryMuscles, secondaryMuscles);

  const rawName = exercise.name || exercise.nombre;
  const newExercise: CatalogExercise = {
    id: exercise.id || rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    nombre: rawName.trim(),
    name: rawName.trim(),
    nombres_alternativos: exercise.nombres_alternativos || [],
    familia: exercise.familia || exercise.patron_movimiento || 'general',
    patron_movimiento: exercise.patron_movimiento || (exercise.patrones_movimiento && exercise.patrones_movimiento[0]) || 'general',
    zona: exercise.zona || (exercise.zonas_corporales && exercise.zonas_corporales[0]?.toLowerCase().includes('inferior') ? 'inferior' : exercise.zonas_corporales && exercise.zonas_corporales[0]?.toLowerCase().includes('core') ? 'core' : 'superior') || 'superior',
    subzona: exercise.subzona || (exercise.subzonas && exercise.subzonas[0]) || '',
    musculos_principales: primaryMuscles,
    musculos_secundarios: secondaryMuscles,
    muscles: {
      primary: primaryMuscles,
      secondary: secondaryMuscles
    },
    muscle_groups: muscleGroups,
    descripcion: exercise.description || exercise.descripcion_tecnica || exercise.descripcion || `Ejercicio enfocado en ${rawName}.`,
    descripcion_breve: exercise.descripcion_breve || exercise.description || exercise.descripcion || '',
    description: exercise.description || exercise.descripcion_breve || exercise.descripcion || '',
    ejecucion_pasos: exercise.executionSteps || exercise.ejecucion_pasos || ['Realiza el movimiento con técnica estricta, control y alineación postural.'],
    executionSteps: exercise.executionSteps || exercise.ejecucion_pasos || ['Realiza el movimiento con técnica estricta, control y alineación postural.'],
    equipamiento: normalizedEquipment,
    equipment: normalizedEquipment,
    variantes_equipamiento: exercise.equipmentVariants || exercise.variantes_equipamiento || [],
    equipmentVariants: exercise.equipmentVariants || exercise.variantes_equipamiento || [],
    sin_equipamiento_posible: exercise.canBeDoneWithoutEquipment !== undefined ? exercise.canBeDoneWithoutEquipment : exercise.sin_equipamiento_posible,
    canBeDoneWithoutEquipment: exercise.canBeDoneWithoutEquipment !== undefined ? exercise.canBeDoneWithoutEquipment : exercise.sin_equipamiento_posible,
    zonas_corporales: exercise.bodyZones || exercise.zonas_corporales || [],
    bodyZones: exercise.bodyZones || exercise.zonas_corporales || [],
    subzonas: exercise.subzones || exercise.subzonas || [],
    subzones: exercise.subzones || exercise.subzonas || [],
    categoria: exercise.category || exercise.categoria || 'Fuerza',
    category: exercise.category || exercise.categoria || 'Fuerza',
    categorias_secundarias: exercise.secondaryCategories || exercise.categorias_secundarias || [],
    secondaryCategories: exercise.secondaryCategories || exercise.categorias_secundarias || [],
    tipo_movimiento: exercise.movementType || exercise.tipo_movimiento || 'Empuje',
    movementType: exercise.movementType || exercise.tipo_movimiento || 'Empuje',
    patrones_movimiento: exercise.movementPattern || exercise.patrones_movimiento || [],
    movementPattern: exercise.movementPattern || exercise.patrones_movimiento || [],
    lado_cuerpo: exercise.laterality || exercise.lado_cuerpo || (exercise.unilateral ? 'Unilateral' : 'Bilateral'),
    laterality: exercise.laterality || exercise.lado_cuerpo || (exercise.unilateral ? 'Unilateral' : 'Bilateral'),
    posicion_principal: exercise.position || exercise.posicion_principal || 'De pie',
    position: exercise.position || exercise.posicion_principal || 'De pie',
    nivel_dificultad: exercise.difficulty || exercise.nivel_dificultad || 'Intermedio',
    difficulty: exercise.difficulty || exercise.nivel_dificultad || 'Intermedio',
    descripcion_tecnica: exercise.executionDescription || exercise.descripcion_tecnica || '',
    executionDescription: exercise.executionDescription || exercise.descripcion_tecnica || '',
    errores_comunes: exercise.commonErrors || exercise.errores_comunes || [],
    commonErrors: exercise.commonErrors || exercise.errores_comunes || [],
    consejos_ejecucion: exercise.executionTips || exercise.consejos_ejecucion || [],
    executionTips: exercise.executionTips || exercise.consejos_ejecucion || [],
    precauciones: exercise.precautions || exercise.precauciones || ['Mantener la columna neutra y no bloquear articulaciones bruscamente.'],
    precautions: exercise.precautions || exercise.precauciones || ['Mantener la columna neutra y no bloquear articulaciones bruscamente.'],
    video_url: exercise.videoUrl || exercise.video_url || '',
    videoUrl: exercise.videoUrl || exercise.video_url || '',
    imagen: exercise.image || exercise.imagen || '',
    image: exercise.image || exercise.imagen || '',
    tipo: exercise.tipo || 'multiarticular',
    nivel: exercise.nivel || 'intermedio',
    unilateral: exercise.laterality === 'Unilateral' || Boolean(exercise.unilateral),
    variantes: exercise.variantes || exercise.equipmentVariants || [],
    tags: exercise.tags || [exercise.category || exercise.categoria, ...(exercise.bodyZones || exercise.zonas_corporales || []), ...normalizedEquipment].filter(Boolean) as string[],
    personalizado: true,
    actualizado_en: new Date().toISOString()
  };

  // 1. Update in-memory cache and maps
  const existingIdx = cachedExercises.findIndex(e => e.nombre.toLowerCase().trim() === newExercise.nombre.toLowerCase().trim());
  if (existingIdx >= 0) {
    cachedExercises[existingIdx] = newExercise;
  } else {
    cachedExercises.push(newExercise);
  }

  const normalizedEqForApp = normalizeEquipmentTags(newExercise.equipamiento);
  dynamicEquipmentMap.set(newExercise.nombre, normalizedEqForApp);
  if (newExercise.muscle_groups && newExercise.muscle_groups.length > 0) {
    dynamicMuscleMap.set(newExercise.nombre, newExercise.muscle_groups);
  }

  // 2. Save in localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const existingList: CatalogExercise[] = saved ? JSON.parse(saved) : [];
    const index = existingList.findIndex(e => e.nombre.toLowerCase().trim() === newExercise.nombre.toLowerCase().trim());
    if (index >= 0) {
      existingList[index] = newExercise;
    } else {
      existingList.push(newExercise);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingList));
  } catch (e) {
    console.warn('Error saving custom exercise to localStorage:', e);
  }

  // 3. Sync with server backend so it gets persisted to public/ejercicios.json and src/data/ejercicios.json
  try {
    await fetch('/api/exercises/save-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExercise),
    });
  } catch (syncErr) {
    console.warn('Server sync error for custom exercise (saved locally):', syncErr);
  }

  return newExercise;
};

// Initial auto-load on module load
initializeExerciseCatalog();
