import type { ExerciseName, RoutineType, BodyZone } from '../types';
import { PREDEFINED_EXERCISES, BODYWEIGHT_EXERCISES } from '../constants/exercises';
import { getAllCatalogExercises, findExerciseDetails, CatalogExercise } from '../services/exerciseCatalog';
import { getEquipmentForExercise } from '../constants/equipment';

export interface ExerciseDisplayItem {
  name: ExerciseName;
  primaryZone: BodyZone;
  muscleGroup: string;
  equipment: string[];
  isBodyweight: boolean;
  isGym: boolean;
  isFavorite: boolean;
}

/**
 * Maps a catalog zone string or predefined focus into a canonical BodyZone
 */
export function normalizeZone(zoneStr?: string): BodyZone {
  if (!zoneStr) return 'Tren superior';
  const lower = zoneStr.toLowerCase();
  if (lower.includes('inferior') || lower.includes('pierna')) return 'Tren inferior';
  if (lower.includes('core') || lower.includes('abdom')) return 'Core';
  if (lower.includes('completo') || lower.includes('mixto') || lower.includes('full')) return 'Cuerpo completo';
  return 'Tren superior';
}

/**
 * Returns user-friendly primary muscle category for filtering chips
 */
export function getMuscleCategory(details?: CatalogExercise | null, name?: string): string {
  if (details) {
    const main = (details.musculos_principales || []).join(' ').toLowerCase();
    const zone = (details.zona || '').toLowerCase();
    
    if (main.includes('pectoral') || main.includes('pecho')) return 'Pecho';
    if (main.includes('dorsal') || main.includes('trapecio') || main.includes('espalda') || main.includes('romboides')) return 'Espalda';
    if (main.includes('cuadriceps') || main.includes('gluteo') || main.includes('isquiotibial') || main.includes('gemelo') || zone === 'inferior') return 'Piernas';
    if (main.includes('deltoides') || main.includes('hombro')) return 'Hombros';
    if (main.includes('biceps') || main.includes('triceps') || main.includes('braquial') || main.includes('antebrazo')) return 'Brazos';
    if (main.includes('recto_abdominal') || main.includes('oblicuo') || main.includes('abdominal') || zone === 'core') return 'Core';
  }

  const n = (name || '').toLowerCase();
  if (n.includes('banca') || n.includes('flexión') || n.includes('apertura') || n.includes('fondo')) return 'Pecho';
  if (n.includes('remo') || n.includes('dominada') || n.includes('jalón') || n.includes('dorsal') || n.includes('peso muerto')) return 'Espalda';
  if (n.includes('sentadilla') || n.includes('prensa') || n.includes('zancada') || n.includes('curl femoral') || n.includes('extensi') || n.includes('talones') || n.includes('hip thrust')) return 'Piernas';
  if (n.includes('press militar') || n.includes('militar') || n.includes('elev') || n.includes('deltoid') || n.includes('lateral') || n.includes('face pull')) return 'Hombros';
  if (n.includes('curl') || n.includes('tríceps') || n.includes('biceps') || n.includes('francés')) return 'Brazos';
  if (n.includes('plancha') || n.includes('abdom') || n.includes('crunch') || n.includes('piernas') || n.includes('wheel') || n.includes('rusos')) return 'Core';

  return 'General';
}

/**
 * Returns full list of available exercises formatted and categorized
 */
export function getExerciseDisplayItems(favoriteExercises: ExerciseName[] = []): ExerciseDisplayItem[] {
  const catalog = getAllCatalogExercises();
  const resultMap = new Map<string, ExerciseDisplayItem>();

  // 1. Process from master catalog first (rich metadata)
  catalog.forEach(item => {
    const name = item.nombre as ExerciseName;
    const eqList = item.equipamiento && item.equipamiento.length > 0
      ? item.equipamiento
      : getEquipmentForExercise(name);
    
    const isBw = eqList.some(e => {
      const l = e.toLowerCase();
      return l.includes('corporal') || l.includes('sin equipo') || l.includes('peso_corporal');
    });

    const isGymEquip = eqList.some(e => {
      const l = e.toLowerCase();
      return l.includes('mancuerna') || l.includes('barra') || l.includes('maquina') || l.includes('polea') || l.includes('disco') || l.includes('kettlebell');
    });

    resultMap.set(name, {
      name,
      primaryZone: normalizeZone(item.zona),
      muscleGroup: getMuscleCategory(item, name),
      equipment: eqList,
      isBodyweight: isBw || BODYWEIGHT_EXERCISES.includes(name),
      isGym: isGymEquip || !BODYWEIGHT_EXERCISES.includes(name),
      isFavorite: favoriteExercises.includes(name)
    });
  });

  // 2. Process predefined exercises
  if (PREDEFINED_EXERCISES) {
    (['Calistenia', 'Gym'] as RoutineType[]).forEach(rtype => {
      const routineGroup = PREDEFINED_EXERCISES[rtype];
      if (!routineGroup) return;

      Object.entries(routineGroup).forEach(([focusKey, exList]) => {
        if (!Array.isArray(exList)) return;
        const mappedZone = normalizeZone(focusKey);

        exList.forEach(exName => {
          if (!resultMap.has(exName)) {
            const details = findExerciseDetails(exName);
            const eqList = getEquipmentForExercise(exName);
            const isBw = rtype === 'Calistenia' || BODYWEIGHT_EXERCISES.includes(exName);

            resultMap.set(exName, {
              name: exName,
              primaryZone: mappedZone,
              muscleGroup: getMuscleCategory(details, exName),
              equipment: eqList,
              isBodyweight: isBw,
              isGym: rtype === 'Gym' || !isBw,
              isFavorite: favoriteExercises.includes(exName)
            });
          }
        });
      });
    });
  }

  return Array.from(resultMap.values());
}

/**
 * Filter exercises according to:
 * - trainingType ('Gym' | 'Calistenia' | 'Personalizado')
 * - zones (array of selected body zones)
 * - muscleFilter ('Todos' | 'Pecho' | 'Espalda' | etc.)
 * - searchQuery (text query)
 * - onlyFavorites (boolean)
 */
export function filterWorkoutExercises({
  exercises,
  trainingType,
  zones,
  muscleFilter,
  searchQuery,
  onlyFavorites
}: {
  exercises: ExerciseDisplayItem[];
  trainingType: RoutineType;
  zones: BodyZone[];
  muscleFilter?: string;
  searchQuery?: string;
  onlyFavorites?: boolean;
}): ExerciseDisplayItem[] {
  const hasFullBody = zones.includes('Cuerpo completo');
  const lowerSearch = (searchQuery || '').toLowerCase().trim();

  return exercises.filter(item => {
    // 1. Filter by Training Type
    if (trainingType === 'Calistenia') {
      // Must be bodyweight or suitable without heavy gym machines
      if (!item.isBodyweight) return false;
    } else if (trainingType === 'Gym') {
      // Gym exercises usually require equipment or gym movements
      // All gym exercises are allowed, plus exercises that have gym tags
      if (!item.isGym && item.isBodyweight && !item.name.toLowerCase().includes('dominada') && !item.name.toLowerCase().includes('fondo')) {
        // Exclude pure calisthenics floor-only routines if gym is strictly chosen, but keep core/pullups
      }
    }
    // 'Personalizado' includes all

    // 2. Filter by Body Zone(s)
    if (!hasFullBody && zones.length > 0) {
      const matchesZone = zones.includes(item.primaryZone);
      if (!matchesZone) {
        // Special case: Core exercises can match Core zone
        if (zones.includes('Core') && item.muscleGroup === 'Core') {
          // allow
        } else {
          return false;
        }
      }
    }

    // 3. Filter by Muscle Category chip
    if (muscleFilter && muscleFilter !== 'Todos') {
      if (item.muscleGroup.toLowerCase() !== muscleFilter.toLowerCase()) {
        return false;
      }
    }

    // 4. Favorites only
    if (onlyFavorites && !item.isFavorite) {
      return false;
    }

    // 5. Search query
    if (lowerSearch) {
      const matchName = item.name.toLowerCase().includes(lowerSearch);
      const matchMuscle = item.muscleGroup.toLowerCase().includes(lowerSearch);
      const matchEquip = item.equipment.some(e => e.toLowerCase().includes(lowerSearch));
      if (!matchName && !matchMuscle && !matchEquip) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Favorites first, then alphabetical
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.name.localeCompare(b.name);
  });
}
