/**
 * SINGLE SOURCE OF TRUTH (SSOT) — SERVICIO DEL CATÁLOGO DE EJERCICIOS
 * ===================================================================
 * 
 * ARQUITECTURA OFICIAL:
 * 
 *     ┌─────────────────────────────────────────────────────────┐
 *     │              src/data/ejercicios.json                   │
 *     │             (FUENTE CANÓNICA MAESTRA)                  │
 *     │            109 Ejercicios Oficiales 1.3                │
 *     └───────────────────────────┬─────────────────────────────┘
 *                                 │
 *                                 ▼  (Lectura determinista en build / runtime)
 *     ┌─────────────────────────────────────────────────────────┐
 *     │             services/exerciseCatalog.ts                 │
 *     │          - Proyección de Campos Derivados               │
 *     │          - Adaptadores de Compatibilidad (Legacy)       │
 *     │          - Fusión con Ejercicios Personalizados         │
 *     └───────────────────────────┬─────────────────────────────┘
 *                                 │
 *        ┌────────────────────────┴────────────────────────┐
 *        ▼                                                 ▼
 *    Componentes UI                                 Servicios y Utilidades
 *    (CustomExerciseModal,                          (constants/muscles.ts,
 *     ManualLogModal, SetupWizard,                   constants/equipment.ts,
 *     RestTimerModal, App.tsx)                       workoutFlowUtils.ts)
 * 
 * PRINCIPIO FUNDAMENTAL:
 * Ningún dato canónico se almacena duplicado manualmente.
 * Las propiedades derivadas (muscle_groups, muscles.primary, etc.) se computan
 * dinámicamente mediante toCatalogExercise() preservando la pureza de src/data/ejercicios.json.
 */

import masterData from '../src/data/ejercicios.json';
import type { MuscleGroup } from '../constants/muscles';
import type { ExerciseId, ExerciseRef } from '../types';

// =====================================================================
// 1. ESQUEMA DE DATOS
// =====================================================================

/**
 * Esquema canónico de un ejercicio en src/data/ejercicios.json (Puntos 3A/3B/3C/4/6C)
 */
export interface CanonicalExercise {
  id: string;
  nombre: string;
  nombres_alternativos?: string[];
  familia: string;
  patron_movimiento: string;
  zona: 'inferior' | 'superior' | 'core' | 'cuerpo_completo' | string;
  subzona?: string;
  tipo: 'multiarticular' | 'aislamiento' | string;
  capacidad_fisica?: string;
  cadena_cinetica?: 'abierta' | 'cerrada' | 'mixta' | string;
  articulaciones_principales?: string[];
  articulaciones_secundarias?: string[];
  plano_predominante?: 'sagital' | 'frontal' | 'transversal' | 'multiplanar' | string;
  unilateralidad?: 'bilateral' | 'unilateral' | 'alternado' | 'asimetrico' | string;
  tipo_resistencia?: 'peso_libre' | 'peso_corporal' | 'polea' | 'maquina_guiada' | 'elastico' | string;
  demanda_estabilidad?: 'baja' | 'media' | 'alta' | string;
  musculos_principales: string[];
  musculos_secundarios: string[];
  estabilizadores?: string[];
  equipamiento: string[];
  variantes?: string[];
  ejercicios_relacionados?: string[];
  sustitutos?: string[];
  descripcion: string;
  ejecucion_pasos: string[];
  errores_comunes?: string[];
  consejos_ejecucion?: string[];
  precauciones?: string[];
  video_url?: string;
  imagen?: string;
  nivel?: string;
  personalizado?: boolean;
  actualizado_en?: string;
}

/**
 * Interfaz extendida para la aplicación con campos derivados y de compatibilidad (Tipo B y C)
 */
export interface CatalogExercise extends CanonicalExercise {
  // Campos derivados (Tipo B)
  muscle_groups: MuscleGroup[];
  unilateral: boolean;
  sin_equipamiento_posible: boolean;
  canBeDoneWithoutEquipment: boolean;

  // Adaptadores de compatibilidad tipada hacia UI legacy (Tipo C)
  name?: string;
  description?: string;
  descripcion_breve?: string;
  muscles?: {
    primary: string[];
    secondary: string[];
  };
  executionSteps?: string[];
  equipment?: string[];
  equipmentVariants?: string[];
  variantes_equipamiento?: string[];
  bodyZones?: string[];
  zonas_corporales?: string[];
  subzones?: string[];
  subzonas?: string[];
  category?: string;
  categoria?: string;
  secondaryCategories?: string[];
  categorias_secundarias?: string[];
  movementType?: string;
  tipo_movimiento?: string;
  movementPattern?: string[];
  patrones_movimiento?: string[];
  laterality?: string;
  lado_cuerpo?: string;
  position?: string;
  posicion_principal?: string;
  difficulty?: string;
  nivel_dificultad?: string;
  executionDescription?: string;
  descripcion_tecnica?: string;
  commonErrors?: string[];
  executionTips?: string[];
  precautions?: string[];
  videoUrl?: string;
  image?: string;
  tags?: string[];
  zona_anatomica?: string;
  tipo_ejercicio?: string;
  categoria_funcional?: string;
  objetivo?: string;
  funcion?: string;
}

// =====================================================================
// 2. CONSTANTES Y MAPEOS DE SERVICIO (ADAPTADORES DE PRESENTACIÓN UI)
// =====================================================================

const STORAGE_KEY = 'user_custom_exercises_catalog';

/**
 * Almacenes en memoria estrictamente separados:
 * - cachedOfficialExercises: Los 109 ejercicios oficiales inmutables.
 * - cachedCustomExercises: Ejercicios personalizados creados por el usuario.
 */
let cachedOfficialExercises: CatalogExercise[] = [];
let cachedCustomExercises: CatalogExercise[] = [];

const dynamicEquipmentMap = new Map<string, string[]>();
const dynamicMuscleMap = new Map<string, MuscleGroup[]>();

/**
 * ADAPTADOR DERIVADO DE PRESENTACIÓN (UI):
 * Mapea tokens anatómicos canónicos de "src/data/muscles.json" hacia las 20 regiones visuales
 * de interfaz (MuscleGroup) utilizadas por los componentes de mapa de calor corporal.
 * 
 * ESPECIFICACIÓN DE ARQUITECTURA SSOT (Punto 7 / 7A):
 * - NO es una segunda taxonomía muscular.
 * - NO sustituye a "src/data/muscles.json" (única fuente canónica de las 84 entidades anatómicas).
 * - NO modifica la clasificación anatómica oficial ni las decisiones de 6A/6B/6C.
 * - Es estrictamente una capa de proyección visual para componentes gráficos.
 * - Los ESTABILIZADORES isométricos se omiten deliberadamente de esta proyección visual:
 *   en ejercicios compuestos (sentadillas, peso muerto, remos), incluir estabilizadores
 *   saturaría permanentemente el abdomen y la zona lumbar en el mapa de calor, impidiendo
 *   distinguir el objetivo motor primario y dinámico del ejercicio.
 */
export const ANATOMY_TO_MUSCLE_GROUP: Record<string, MuscleGroup> = {
  // Inferior
  'cuadriceps': 'quads',
  'recto_femoral': 'quads',
  'vasto_lateral': 'quads',
  'vasto_medial': 'quads',
  'vasto_intermedio': 'quads',
  'isquiotibiales': 'hamstrings',
  'biceps_femoral': 'hamstrings',
  'semitendinoso': 'hamstrings',
  'semimembranoso': 'hamstrings',
  'gluteo_mayor': 'glutes',
  'gluteo_medio': 'glutes',
  'gluteo_menor': 'glutes',
  'gluteos': 'glutes',
  'aductor_mayor': 'adductors',
  'aductor_largo': 'adductors',
  'aductor_corto': 'adductors',
  'pectineo': 'adductors',
  'gracil': 'adductors',
  'aductores': 'adductors',
  'aductores_cadera': 'adductors',
  'gastrocnemio': 'calves_rear',
  'gemelos': 'calves_rear',
  'soleo': 'calves_rear',
  'pantorrillas': 'calves_rear',
  'triceps_sural': 'calves_rear',
  'tibial_anterior': 'calves_front',
  'tibial_posterior': 'calves_rear',
  'iliopsoas': 'quads',
  'psoas_mayor': 'quads',
  'iliaco': 'quads',
  'sartorio': 'quads',
  'tensor_fascia_lata': 'glutes',
  'rotadores_cadera_profundos': 'glutes',
  'piriforme': 'glutes',

  // Superior
  'pectoral_mayor': 'chest',
  'pectoral_mayor_clavicular': 'chest',
  'pectoral_mayor_esternal': 'chest',
  'pectoral_menor': 'chest',
  'pecho': 'chest',
  'pectorales': 'chest',
  'deltoides_anterior': 'shoulders_front',
  'deltoides_lateral': 'shoulders',
  'deltoides_posterior': 'shoulders_rear',
  'hombros': 'shoulders',
  'deltoides': 'shoulders',
  'manguito_rotador': 'shoulders',
  'supraespinoso': 'shoulders',
  'infraespinoso': 'shoulders_rear',
  'redondo_menor': 'shoulders_rear',
  'subescapular': 'shoulders',
  'triceps_braquial': 'triceps',
  'triceps_cabeza_larga': 'triceps',
  'triceps_cabeza_lateral': 'triceps',
  'triceps_cabeza_medial': 'triceps',
  'triceps': 'triceps',
  'anconeo': 'triceps',
  'biceps_braquial': 'biceps',
  'biceps': 'biceps',
  'braquial': 'biceps',
  'braquiorradial': 'forearms',
  'flexores_muneca': 'forearms',
  'extensores_muneca': 'forearms',
  'antebrazo': 'forearms',
  'antebrazos': 'forearms',
  'pronador_redondo': 'forearms',
  'dorsal_ancho': 'lats',
  'dorsales': 'lats',
  'redondo_mayor': 'lats',
  'trapecio': 'traps',
  'trapecio_superior': 'traps',
  'trapecio_medio': 'traps',
  'trapecio_inferior': 'traps',
  'trapecios': 'traps',
  'romboides': 'mid_back',
  'romboides_mayor': 'mid_back',
  'romboides_menor': 'mid_back',
  'espalda_media': 'mid_back',
  'elevador_escapula': 'traps',
  'serrato_anterior': 'chest',
  'erectores_espinales': 'lower_back',
  'iliocostal': 'lower_back',
  'longisimo': 'lower_back',
  'espinal': 'lower_back',
  'lumbar': 'lower_back',
  'lumbares': 'lower_back',
  'cuadrado_lumbar': 'lower_back',
  'multifidos': 'lower_back',

  // Core
  'recto_abdominal': 'abs',
  'abdomen': 'abs',
  'abdominales': 'abs',
  'oblicuo_externo': 'obliques',
  'oblicuo_interno': 'obliques',
  'oblicuos': 'obliques',
  'transverso_abdominal': 'abs',
  'suelo_pelvico': 'abs',
  'diafragma': 'abs',
  'core': 'abs'
};

// =====================================================================
// 3. FUNCIONES DERIVADORAS DETERMINISTAS
// =====================================================================

/**
 * Normaliza y traduce equipamiento técnico en etiquetas amigables para filtros de interfaz
 */
export const normalizeEquipmentTags = (rawList: string[] = []): string[] => {
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
    if (lower === 'mancuernas') results.add('Mancuernas');
    if (lower === 'barra olímpica / discos' || lower === 'barra olimpica / discos') results.add('Barra olímpica / Discos');
  });

  if (results.size === 0) {
    results.add('Peso corporal (Sin equipo)');
  }

  return Array.from(results);
};

/**
 * Extrae deterministamente los grupos visuales MuscleGroup para mapas corporales
 */
export const extractMuscleGroups = (
  principales: string[] = [], 
  secundarios: string[] = []
): MuscleGroup[] => {
  const groups = new Set<MuscleGroup>();

  [...principales, ...secundarios].forEach(m => {
    if (!m) return;
    const key = m.toLowerCase().replace(/[\s-]+/g, '_');
    if (ANATOMY_TO_MUSCLE_GROUP[key]) {
      groups.add(ANATOMY_TO_MUSCLE_GROUP[key]);
      return;
    }
    for (const [anatomyKey, muscleGroup] of Object.entries(ANATOMY_TO_MUSCLE_GROUP)) {
      if (key.includes(anatomyKey)) {
        groups.add(muscleGroup);
      }
    }
  });

  return Array.from(groups);
};

/**
 * Función canónica de proyección SSOT: Transforma un registro canónico en CatalogExercise
 * calculando todas las propiedades derivadas y adaptadores de compatibilidad.
 */
export const toCatalogExercise = (canonical: CanonicalExercise | any): CatalogExercise => {
  const priMuscles = canonical.musculos_principales || canonical.muscles?.primary || [];
  const secMuscles = canonical.musculos_secundarios || canonical.muscles?.secondary || [];
  const eqList = canonical.equipamiento || canonical.equipment || [];
  
  const muscleGroups = canonical.muscle_groups && canonical.muscle_groups.length > 0
    ? canonical.muscle_groups
    : extractMuscleGroups(priMuscles, secMuscles);

  const isUnilateral = canonical.unilateral !== undefined
    ? Boolean(canonical.unilateral)
    : (canonical.unilateralidad === 'unilateral' || canonical.unilateralidad === 'alternado');

  const canBeBodyweight = canonical.canBeDoneWithoutEquipment !== undefined
    ? Boolean(canonical.canBeDoneWithoutEquipment)
    : canonical.sin_equipamiento_posible !== undefined
      ? Boolean(canonical.sin_equipamiento_posible)
      : (eqList.includes('peso_corporal') || eqList.some((e: string) => e.toLowerCase().includes('corporal')));

  const rawName = canonical.nombre || canonical.name || canonical.id || 'Ejercicio';
  const desc = canonical.descripcion || canonical.description || canonical.descripcion_breve || `Ejercicio de entrenamiento: ${rawName}.`;
  const steps = canonical.ejecucion_pasos || canonical.executionSteps || ['Realiza el movimiento con técnica controlada.'];

  const friendlyEq = normalizeEquipmentTags(eqList);

  return {
    // 1. Propiedades Canónicas Oficiales
    id: canonical.id,
    nombre: rawName,
    nombres_alternativos: canonical.nombres_alternativos || [],
    familia: canonical.familia || canonical.patron_movimiento || 'general',
    patron_movimiento: canonical.patron_movimiento || 'general',
    zona: canonical.zona || 'superior',
    subzona: canonical.subzona || '',
    tipo: canonical.tipo || 'multiarticular',
    capacidad_fisica: canonical.capacidad_fisica || 'hipertrofia',
    cadena_cinetica: canonical.cadena_cinetica || 'abierta',
    articulaciones_principales: canonical.articulaciones_principales || [],
    articulaciones_secundarias: canonical.articulaciones_secundarias || [],
    plano_predominante: canonical.plano_predominante || 'sagital',
    unilateralidad: canonical.unilateralidad || (isUnilateral ? 'unilateral' : 'bilateral'),
    tipo_resistencia: canonical.tipo_resistencia || 'peso_libre',
    demanda_estabilidad: canonical.demanda_estabilidad || 'media',
    musculos_principales: priMuscles,
    musculos_secundarios: secMuscles,
    estabilizadores: canonical.estabilizadores || [],
    equipamiento: eqList,
    variantes: canonical.variantes || [],
    ejercicios_relacionados: canonical.ejercicios_relacionados || [],
    sustitutos: canonical.sustitutos || [],
    descripcion: desc,
    ejecucion_pasos: steps,
    errores_comunes: canonical.errores_comunes || canonical.commonErrors || [],
    consejos_ejecucion: canonical.consejos_ejecucion || canonical.executionTips || [],
    precauciones: canonical.precauciones || canonical.precautions || [],
    video_url: canonical.video_url || canonical.videoUrl || '',
    imagen: canonical.imagen || canonical.image || '',
    nivel: canonical.nivel || 'intermedio',
    personalizado: Boolean(canonical.personalizado),
    actualizado_en: canonical.actualizado_en || new Date().toISOString(),

    // 2. Propiedades Derivadas (Tipo B)
    muscle_groups: muscleGroups,
    unilateral: isUnilateral,
    sin_equipamiento_posible: canBeBodyweight,
    canBeDoneWithoutEquipment: canBeBodyweight,

    // 3. Proyecciones de Compatibilidad (Tipo C)
    name: rawName,
    description: desc,
    descripcion_breve: desc,
    muscles: {
      primary: priMuscles,
      secondary: secMuscles,
    },
    executionSteps: steps,
    equipment: friendlyEq,
    equipmentVariants: canonical.variantes_equipamiento || canonical.equipmentVariants || [],
    variantes_equipamiento: canonical.variantes_equipamiento || canonical.equipmentVariants || [],
    bodyZones: canonical.bodyZones || [canonical.zona === 'inferior' ? 'Tren inferior' : canonical.zona === 'superior' ? 'Tren superior' : canonical.zona === 'core' ? 'Core' : 'Cuerpo completo'],
    zonas_corporales: canonical.zonas_corporales || [canonical.zona === 'inferior' ? 'Tren inferior' : canonical.zona === 'superior' ? 'Tren superior' : canonical.zona === 'core' ? 'Core' : 'Cuerpo completo'],
    subzones: canonical.subzones || (canonical.subzona ? [canonical.subzona] : []),
    subzonas: canonical.subzonas || (canonical.subzona ? [canonical.subzona] : []),
    category: canonical.category || (canonical.capacidad_fisica ? canonical.capacidad_fisica.charAt(0).toUpperCase() + canonical.capacidad_fisica.slice(1) : 'Fuerza'),
    categoria: canonical.categoria || (canonical.capacidad_fisica ? canonical.capacidad_fisica.charAt(0).toUpperCase() + canonical.capacidad_fisica.slice(1) : 'Fuerza'),
    secondaryCategories: canonical.secondaryCategories || canonical.categorias_secundarias || [],
    categorias_secundarias: canonical.categorias_secundarias || canonical.secondaryCategories || [],
    movementType: canonical.movementType || canonical.tipo_movimiento || canonical.patron_movimiento || 'General',
    tipo_movimiento: canonical.tipo_movimiento || canonical.movementType || canonical.patron_movimiento || 'General',
    movementPattern: canonical.movementPattern || [canonical.patron_movimiento].filter(Boolean),
    patrones_movimiento: canonical.patrones_movimiento || [canonical.patron_movimiento].filter(Boolean),
    laterality: canonical.laterality || (isUnilateral ? 'Unilateral' : 'Bilateral'),
    lado_cuerpo: canonical.lado_cuerpo || (isUnilateral ? 'Unilateral' : 'Bilateral'),
    position: canonical.position || canonical.posicion_principal || 'De pie',
    posicion_principal: canonical.posicion_principal || canonical.position || 'De pie',
    difficulty: canonical.difficulty || canonical.nivel_dificultad || canonical.nivel || 'Intermedio',
    nivel_dificultad: canonical.nivel_dificultad || canonical.difficulty || canonical.nivel || 'Intermedio',
    executionDescription: canonical.executionDescription || canonical.descripcion_tecnica || desc,
    descripcion_tecnica: canonical.descripcion_tecnica || canonical.executionDescription || desc,
    commonErrors: canonical.commonErrors || canonical.errores_comunes || [],
    executionTips: canonical.executionTips || canonical.consejos_ejecucion || [],
    precautions: canonical.precautions || canonical.precauciones || [],
    videoUrl: canonical.videoUrl || canonical.video_url || '',
    image: canonical.image || canonical.imagen || '',
    tags: canonical.tags || [canonical.zona, canonical.patron_movimiento, ...eqList].filter(Boolean),
    zona_anatomica: canonical.zona,
    tipo_ejercicio: canonical.tipo,
    categoria_funcional: canonical.capacidad_fisica
  };
};

// =====================================================================
// 4. API DEL SERVICIO DEL CATÁLOGO (ARQUITECTURA SSOT CON AISLAMIENTO)
// =====================================================================

/**
 * Inicializa y cachea el catálogo oficial y los ejercicios personalizados en memoria
 * de forma estrictamente separada.
 */
export const initializeExerciseCatalog = (): CatalogExercise[] => {
  // 1. Cargar el Catálogo Maestro Oficial (109 ejercicios inmutables de src/data/ejercicios.json)
  const canonicalList = (masterData?.ejercicios || []) as CanonicalExercise[];
  cachedOfficialExercises = canonicalList.map(raw => toCatalogExercise(raw));

  // 2. Cargar Ejercicios Personalizados del Usuario (almacenamiento aislado de cliente)
  let rawCustomList: any[] = [];
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          rawCustomList = parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading custom exercises from localStorage:', e);
  }

  cachedCustomExercises = rawCustomList.map(raw => toCatalogExercise({
    ...raw,
    personalizado: true
  }));

  // Sincronización asíncrona no bloqueante con el almacenamiento del servidor
  if (typeof fetch !== 'undefined') {
    fetch('/api/exercises/custom')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.ejercicios) && data.ejercicios.length > 0) {
          const serverCustomMap = new Map<string, CatalogExercise>();
          cachedCustomExercises.forEach(ex => serverCustomMap.set(ex.id, ex));
          data.ejercicios.forEach((raw: any) => {
            const projected = toCatalogExercise({ ...raw, personalizado: true });
            serverCustomMap.set(projected.id, projected);
          });
          cachedCustomExercises = Array.from(serverCustomMap.values());
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedCustomExercises));
          } catch (_) {}
          rebuildDynamicMaps();
        }
      })
      .catch(() => {
        // Silencioso si se ejecuta offline o en entorno SSR
      });
  }

  // 3. Poblar mapas dinámicos de acceso rápido para la presentación
  rebuildDynamicMaps();

  return getAllCatalogExercises();
};

/**
 * MAPA DE COMPATIBILIDAD HISTÓRICA / LEGACY
 * Relaciona nombres cortos o desactualizados utilizados en versiones previas de la aplicación
 * con el identificador canónico ExerciseId oficial de src/data/ejercicios.json.
 */
export const LEGACY_NAME_TO_CANONICAL_ID: Record<string, string> = {
  // Calistenia - Tren Superior
  'Flexión / Inver': 'flexiones-de-brazos',
  'Dominadas': 'dominadas-pronadas',
  'Fondos en paralelas': 'fondos-en-paralelas',
  'Pike Push-ups': 'pike-push-ups',
  'Remo invertido': 'remo-invertido',
  'Muscle-ups (si aplica)': 'muscle-up',
  'Flexiones diamante': 'flexiones-diamante',
  'Flexiones arqueras': 'flexiones-arqueras',
  'Face pull con anillas': 'remo-en-anillas',
  'Fondos en banco': 'fondos-en-banco',

  // Calistenia - Tren Inferior
  'Sentadilla': 'sentadilla-aerea',
  'Zancadas': 'zancadas-estaticas',
  'Sentadilla búlgara': 'sentadilla-bulgara',
  'Elevación de talones': 'elevacion-talones-de-pie',
  'Puente de glúteos': 'puente-de-gluteos',
  'Sentadilla pistola (si aplica)': 'sentadilla-pistola',
  'Nordic curls (si aplica)': 'curl-nordico',
  'Saltos al cajón': 'salto-al-cajon',
  'Sentadilla isométrica (wall sit)': 'sentadilla-isometrica-pared',

  // Calistenia - Core
  'Plancha': 'plancha-abdominal-frontal',
  'Elevación de piernas colgado': 'elevacion-piernas-colgado',
  'Dragon Flag (si aplica)': 'hollow-body-hold',
  'Abdominales en V (V-ups)': 'crunch-abdominal-suelo',
  'Plancha lateral': 'plancha-lateral',
  'Hollow body hold': 'hollow-body-hold',
  'Giros rusos': 'giros-rusos',
  'Mountain climbers': 'mountain-climbers',
  'Toes-to-bar': 'elevacion-piernas-colgado',
  'L-Sit': 'hollow-body-hold',

  // Calistenia - Mixto
  'Burpees': 'burpees',
  'Elevación de rodillas': 'saltos-en-tijera',
  'Saltos de tijera': 'saltos-en-tijera',

  // Gym - Tren Superior
  'Press de banca': 'press-banca-plano-barra',
  'Remo / Inclina': 'remo-con-barra-inclinado',
  'Press militar': 'press-militar-barra',
  'Elev / Lat': 'elevaciones-laterales-mancuernas',
  'Curl / Biceps': 'curl-biceps-barra',
  'Press francés': 'press-frances-barra-z',
  'Jalón al pecho (pulldown)': 'jalon-al-pecho-polea',
  'Aperturas con mancuernas': 'aperturas-mancuernas-plano',
  'Face pull con polea': 'face-pull-polea',
  'Encogimientos de hombros': 'remo-con-barra-inclinado',
  'Extensiones de tríceps en polea': 'extension-triceps-polea-alta',

  // Gym - Tren Inferior
  'Peso muerto': 'peso-muerto-convencional',
  'Prensa de piernas': 'prensa-de-piernas',
  'Extensiones de cuádriceps': 'extension-cuadriceps-maquina',
  'Curl femoral': 'curl-femoral-tumbado',
  'Zancadas con mancuernas': 'zancadas-caminando',
  'Hip thrust': 'hip-thrust-barra',
  'Abductores en máquina': 'prensa-de-piernas',
  'Aductores en máquina': 'sentadilla-sumo',

  // Gym - Core
  'Elevación de piernas en silla romana': 'elevacion-piernas-colgado',
  'Crunch en polea alta': 'crunch-en-polea-alta',
  'Giros rusos con disco': 'giros-rusos',
  'Leñador (woodchopper) en polea': 'press-pallof',
  'Ab wheel': 'rueda-abdominal',
  'Hiperextensiones': 'buenos-dias',
  'Plancha con peso': 'plancha-abdominal-frontal',

  // Gym - Mixto
  'Clean and Jerk': 'dos-tiempos-clean-and-jerk',
  'Snatch': 'arrancada-snatch',
  'Dominadas con lastre': 'dominadas-pronadas',
  'Thrusters': 'push-press',
  'Paseo del granjero': 'paseo-del-granjero',
};

/**
 * Reconstruye los mapas dinámicos de equipamiento y grupos musculares
 */
function rebuildDynamicMaps() {
  dynamicEquipmentMap.clear();
  dynamicMuscleMap.clear();

  const all = getAllCatalogExercises();
  all.forEach(ex => {
    const normalizedEq = normalizeEquipmentTags(ex.equipamiento);
    // Indexar por ID canónico
    dynamicEquipmentMap.set(ex.id, normalizedEq);
    // Indexar por nombre visible oficial
    dynamicEquipmentMap.set(ex.nombre, normalizedEq);
    if (ex.nombres_alternativos) {
      ex.nombres_alternativos.forEach(alt => dynamicEquipmentMap.set(alt, normalizedEq));
    }

    if (ex.muscle_groups && ex.muscle_groups.length > 0) {
      // Indexar por ID canónico
      dynamicMuscleMap.set(ex.id, ex.muscle_groups);
      // Indexar por nombre visible oficial
      dynamicMuscleMap.set(ex.nombre, ex.muscle_groups);
      if (ex.nombres_alternativos) {
        ex.nombres_alternativos.forEach(alt => dynamicMuscleMap.set(alt, ex.muscle_groups));
      }
    }
  });

  // Mapear nombres legacy a sus datos canónicos
  for (const [legacyName, canonicalId] of Object.entries(LEGACY_NAME_TO_CANONICAL_ID)) {
    const canonical = all.find(e => e.id === canonicalId);
    if (canonical) {
      if (!dynamicEquipmentMap.has(legacyName)) {
        dynamicEquipmentMap.set(legacyName, normalizeEquipmentTags(canonical.equipamiento));
      }
      if (!dynamicMuscleMap.has(legacyName) && canonical.muscle_groups) {
        dynamicMuscleMap.set(legacyName, canonical.muscle_groups);
      }
    }
  }
}

/**
 * Obtiene estrictamente los 109 ejercicios oficiales certificados del Catálogo Maestro
 */
export const getOfficialExercises = (): CatalogExercise[] => {
  if (cachedOfficialExercises.length === 0) {
    initializeExerciseCatalog();
  }
  return [...cachedOfficialExercises];
};

/**
 * Obtiene estrictamente los ejercicios personalizados creados por el usuario
 */
export const getCustomExercises = (): CatalogExercise[] => {
  if (cachedOfficialExercises.length === 0) {
    initializeExerciseCatalog();
  }
  return [...cachedCustomExercises];
};

/**
 * Capa de presentación y búsqueda: Retorna la vista combinada
 * [Oficiales + Personalizados].
 * Si un ejercicio personalizado sobreescribe por ID a uno oficial,
 * la versión personalizada prevalece en la vista, pero el catálogo oficial
 * en cachedOfficialExercises permanece 100% intacto.
 */
export const getAllCatalogExercises = (): CatalogExercise[] => {
  if (cachedOfficialExercises.length === 0) {
    initializeExerciseCatalog();
  }

  const combinedMap = new Map<string, CatalogExercise>();
  
  // Primero se registran los oficiales
  cachedOfficialExercises.forEach(ex => combinedMap.set(ex.id, ex));
  
  // Luego se incorporan los personalizados (pueden sobreescribir vista de presentación)
  cachedCustomExercises.forEach(ex => combinedMap.set(ex.id, ex));

  return Array.from(combinedMap.values());
};

/**
 * Búsqueda canónica por ExerciseId (identidad primaria oficial)
 */
export const findExerciseById = (id: ExerciseId): CatalogExercise | undefined => {
  if (!id) return undefined;
  const normalized = id.toLowerCase().trim();
  const all = getAllCatalogExercises();
  return all.find(e => e.id.toLowerCase().trim() === normalized);
};

/**
 * Búsqueda insensible a mayúsculas/minúsculas por ID, nombre oficial, nombres alternativos o alias legacy
 */
export const findExerciseByName = (name: string): CatalogExercise | undefined => {
  if (!name) return undefined;
  const normalized = name.toLowerCase().trim();
  const all = getAllCatalogExercises();
  
  // 1. Coincidencia directa por id, nombre, nombres alternativos o name
  let found = all.find(e => 
    e.id.toLowerCase().trim() === normalized ||
    e.nombre.toLowerCase().trim() === normalized ||
    (e.nombres_alternativos && e.nombres_alternativos.some(alt => alt.toLowerCase().trim() === normalized)) ||
    (e.name && e.name.toLowerCase().trim() === normalized)
  );

  // 2. Coincidencia por alias histórico legacy
  if (!found && LEGACY_NAME_TO_CANONICAL_ID[name]) {
    const targetId = LEGACY_NAME_TO_CANONICAL_ID[name];
    found = all.find(e => e.id === targetId);
  }

  return found;
};

export const findExerciseDetails = findExerciseByName;

/**
 * Resuelve el identificador canónico ExerciseId a partir de un ID o nombre visible.
 * Si no se encuentra en el catálogo, genera un ID normalizado o devuelve el valor original.
 */
export const resolveExerciseId = (idOrName: string): ExerciseId => {
  if (!idOrName) return '';
  if (LEGACY_NAME_TO_CANONICAL_ID[idOrName]) {
    return LEGACY_NAME_TO_CANONICAL_ID[idOrName];
  }
  const ex = findExerciseById(idOrName) || findExerciseByName(idOrName);
  if (ex) return ex.id;
  return idOrName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Resuelve el nombre visible en español para presentación en UI a partir de un ExerciseId o nombre.
 */
export const resolveExerciseName = (idOrName: string): string => {
  if (!idOrName) return '';
  const ex = findExerciseById(idOrName) || findExerciseByName(idOrName);
  if (ex) return ex.nombre;
  return idOrName;
};

/**
 * Resuelve la referencia dual canónica { id, nombre }
 */
export const resolveExerciseRef = (idOrName: string): ExerciseRef => {
  const ex = findExerciseById(idOrName) || findExerciseByName(idOrName);
  if (ex) {
    return { id: ex.id, nombre: ex.nombre };
  }
  return {
    id: resolveExerciseId(idOrName),
    nombre: idOrName
  };
};

/**
 * Obtiene el equipamiento amigable normalizado para un ejercicio
 */
export const getDynamicEquipmentForExercise = (exerciseName: string): string[] | undefined => {
  if (dynamicEquipmentMap.size === 0) {
    initializeExerciseCatalog();
  }
  return dynamicEquipmentMap.get(exerciseName);
};

/**
 * Obtiene los grupos musculares somáticos de interfaz para un ejercicio
 */
export const getDynamicMusclesForExercise = (exerciseName: string): MuscleGroup[] | undefined => {
  if (dynamicMuscleMap.size === 0) {
    initializeExerciseCatalog();
  }
  return dynamicMuscleMap.get(exerciseName);
};

/**
 * Guarda o actualiza un ejercicio personalizado en almacenamiento aislado
 * (sin mutar jamás la fuente canónica de los 109 ejercicios oficiales)
 */
export const saveCustomExerciseToCatalog = async (
  exercise: Partial<CatalogExercise> & { nombre: string }
): Promise<CatalogExercise> => {
  const rawName = exercise.nombre || exercise.name || 'Ejercicio Personalizado';
  const cleanId = exercise.id || rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const normalizedExercise = toCatalogExercise({
    ...exercise,
    id: cleanId,
    nombre: rawName.trim(),
    personalizado: true,
    actualizado_en: new Date().toISOString()
  });

  // 1. Actualizar memoria exclusiva de personalizados (cachedOfficialExercises queda intacto)
  const existingCustomIdx = cachedCustomExercises.findIndex(e => 
    e.id === cleanId || e.nombre.toLowerCase().trim() === rawName.toLowerCase().trim()
  );

  if (existingCustomIdx >= 0) {
    cachedCustomExercises[existingCustomIdx] = normalizedExercise;
  } else {
    cachedCustomExercises.push(normalizedExercise);
  }

  // 2. Persistir en localStorage cliente de personalizados
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedCustomExercises));
  } catch (e) {
    console.warn('Error saving custom exercise to localStorage:', e);
  }

  // 3. Reconstruir mapas de presentación
  rebuildDynamicMaps();

  // 4. Sincronizar asíncronamente con el almacén aislado de usuario en servidor (user_custom_exercises.json)
  try {
    await fetch('/api/exercises/save-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedExercise),
    });
  } catch (syncErr) {
    console.warn('Server sync error for custom exercise (saved locally):', syncErr);
  }

  return normalizedExercise;
};

/**
 * Elimina un ejercicio personalizado del almacén de usuario
 * (impide terminantemente eliminar ejercicios oficiales)
 */
export const deleteCustomExercise = (idOrName: string): boolean => {
  const normalized = idOrName.toLowerCase().trim();
  const idx = cachedCustomExercises.findIndex(e => 
    e.id.toLowerCase() === normalized || e.nombre.toLowerCase().trim() === normalized
  );

  if (idx === -1) {
    return false;
  }

  cachedCustomExercises.splice(idx, 1);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedCustomExercises));
  } catch (_) {}

  rebuildDynamicMaps();
  return true;
};

// Carga inicial en frío
initializeExerciseCatalog();
