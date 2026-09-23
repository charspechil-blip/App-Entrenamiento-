import fs from 'fs';
import path from 'path';

/**
 * Validador Oficial de la Taxonomía Muscular — Entreno (Punto 6B)
 * 
 * Comprueba:
 * 1. Estructura e Integridad: campos requeridos y tipos correctos.
 * 2. Unicidad de IDs: no repetidos, en snake_case estricto, sin tildes ni espacios.
 * 3. Relaciones Padre-Hijo:
 *    - Si un músculo declara "padre", ese padre existe y contiene a este músculo en su array "hijos".
 *    - Si un músculo declara "hijos", todos los hijos existen y tienen a este músculo como "padre".
 * 4. Detección de Ciclos: ningún elemento puede ser ancestro de sí mismo.
 * 5. Aliases y Sinónimos:
 *    - No colisionan con IDs de otros músculos.
 *    - No están duplicados entre diferentes músculos canónicos.
 * 6. Cobertura del Catálogo Actual:
 *    - Todos los 29 tokens musculares usados actualmente en el catálogo deben tener correspondencia
 *      directa con un ID canónico o un alias inequívoco.
 */

const MUSCLES_JSON_PATH = path.resolve('src', 'data', 'muscles.json');
const CATALOG_JSON_PATH = path.resolve('src', 'data', 'ejercicios.json');

const REQUIRED_FIELDS = [
  'id',
  'nombre',
  'zona',
  'region',
  'tipo',
  'padre',
  'hijos',
  'nivel_catalogacion',
  'funcion_principal',
  'articulaciones_asociadas',
  'aliases'
];

const VALID_ZONAS = ['superior', 'inferior', 'core', 'cuello'];
const VALID_TIPOS = ['grupo_muscular', 'musculo_individual', 'porcion_anatomica'];
const VALID_NIVELES = ['operativo_recomendado', 'especifico_avanzado', 'agrupador_jerarquico'];

export function validateMuscles() {
  const errors = [];
  const warnings = [];
  const notices = [];

  console.log('='.repeat(65));
  console.log('  VALIDACIÓN DE LA TAXONOMÍA MUSCULAR OFICIAL — ENTRENO (6B)');
  console.log('='.repeat(65));

  if (!fs.existsSync(MUSCLES_JSON_PATH)) {
    errors.push(`No se encuentra el archivo de taxonomía muscular en: ${MUSCLES_JSON_PATH}`);
    return { valid: false, errors, warnings, notices };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(MUSCLES_JSON_PATH, 'utf-8'));
  } catch (err) {
    errors.push(`Error al parsear ${MUSCLES_JSON_PATH}: ${err.message}`);
    return { valid: false, errors, warnings, notices };
  }

  if (!data.musculos || !Array.isArray(data.musculos)) {
    errors.push(`El archivo debe contener una clave "musculos" de tipo array.`);
    return { valid: false, errors, warnings, notices };
  }

  const muscles = data.musculos;
  const muscleMap = new Map();
  const aliasMap = new Map();

  // 1. Validar formato básico y unicidad de IDs
  muscles.forEach((m, idx) => {
    const pos = `[Índice ${idx} / ID: ${m.id || 'SIN_ID'}]`;

    REQUIRED_FIELDS.forEach(field => {
      if (field === 'padre') {
        if (m.padre === undefined) {
          errors.push(`${pos}: Campo obligatorio ausente "padre" (debe ser null para elementos raíz).`);
        }
      } else {
        if (m[field] === undefined || m[field] === null) {
          errors.push(`${pos}: Campo obligatorio ausente "${field}".`);
        }
      }
    });

    if (!m.id || typeof m.id !== 'string') {
      errors.push(`${pos}: ID inválido.`);
      return;
    }

    // Regla: snake_case estricto, sin tildes ni espacios
    if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(m.id)) {
      errors.push(`${pos}: ID "${m.id}" no cumple formato snake_case estricto (minúsculas, sin tildes ni espacios).`);
    }

    if (muscleMap.has(m.id)) {
      errors.push(`${pos}: ID duplicado "${m.id}".`);
    } else {
      muscleMap.set(m.id, m);
    }

    if (!VALID_ZONAS.includes(m.zona)) {
      errors.push(`${pos}: Zona inválida "${m.zona}". Válidas: ${VALID_ZONAS.join(', ')}`);
    }

    if (!VALID_TIPOS.includes(m.tipo)) {
      errors.push(`${pos}: Tipo inválido "${m.tipo}". Válidos: ${VALID_TIPOS.join(', ')}`);
    }

    if (!VALID_NIVELES.includes(m.nivel_catalogacion)) {
      errors.push(`${pos}: Nivel de catalogación inválido "${m.nivel_catalogacion}". Válidos: ${VALID_NIVELES.join(', ')}`);
    }

    if (!Array.isArray(m.hijos)) {
      errors.push(`${pos}: "hijos" debe ser un array.`);
    }

    if (!Array.isArray(m.aliases)) {
      errors.push(`${pos}: "aliases" debe ser un array.`);
    } else {
      m.aliases.forEach(alias => {
        const normAlias = alias.toLowerCase().trim();
        if (aliasMap.has(normAlias) && aliasMap.get(normAlias) !== m.id) {
          warnings.push(`${pos}: Alias "${alias}" compartido con músculo "${aliasMap.get(normAlias)}".`);
        } else {
          aliasMap.set(normAlias, m.id);
        }
      });
    }
  });

  // 2. Validar colisión entre aliases e IDs de otros músculos
  muscleMap.forEach((m, id) => {
    if (aliasMap.has(id) && aliasMap.get(id) !== id) {
      errors.push(`Conflicto crítico: El ID "${id}" está registrado como alias de "${aliasMap.get(id)}".`);
    }
  });

  // 3. Validar relaciones padre-hijo bidireccionales y ausencia de ciclos
  muscleMap.forEach((m, id) => {
    const pos = `[ID: ${id}]`;

    // Validar padre
    if (m.padre !== null) {
      if (!muscleMap.has(m.padre)) {
        errors.push(`${pos}: Padre inexistente "${m.padre}".`);
      } else {
        const parent = muscleMap.get(m.padre);
        if (!parent.hijos.includes(id)) {
          errors.push(`${pos}: Declara padre "${m.padre}", pero el padre no lo incluye en su lista de "hijos".`);
        }
      }
    }

    // Validar hijos
    m.hijos.forEach(hijoId => {
      if (!muscleMap.has(hijoId)) {
        errors.push(`${pos}: Hijo inexistente "${hijoId}".`);
      } else {
        const child = muscleMap.get(hijoId);
        if (child.padre !== id) {
          errors.push(`${pos}: Incluye hijo "${hijoId}", pero el hijo tiene padre "${child.padre}".`);
        }
      }
    });

    // Detección de ciclos
    let curr = m.padre;
    const visited = new Set([id]);
    while (curr !== null) {
      if (visited.has(curr)) {
        errors.push(`${pos}: Se detectó un ciclo en la jerarquía a través de "${curr}".`);
        break;
      }
      visited.add(curr);
      const nextParent = muscleMap.get(curr);
      curr = nextParent ? nextParent.padre : null;
    }
  });

  // 4. Cobertura del catálogo actual
  if (fs.existsSync(CATALOG_JSON_PATH)) {
    try {
      const catalogData = JSON.parse(fs.readFileSync(CATALOG_JSON_PATH, 'utf-8'));
      const exercises = catalogData.ejercicios || [];
      const usedTokens = new Set();

      exercises.forEach(ex => {
        (ex.musculos_principales || []).forEach(t => usedTokens.add(t));
        (ex.musculos_secundarios || []).forEach(t => usedTokens.add(t));
        (ex.estabilizadores || []).forEach(t => usedTokens.add(t));
      });

      let coveredCount = 0;
      const unmapped = [];

      usedTokens.forEach(token => {
        const norm = token.toLowerCase().trim();
        if (muscleMap.has(norm) || aliasMap.has(norm)) {
          coveredCount++;
        } else {
          unmapped.push(token);
        }
      });

      if (unmapped.length > 0) {
        errors.push(`Tokens utilizados en el catálogo actual sin correspondencia en la taxonomía (ni como ID ni como alias): ${unmapped.join(', ')}`);
      } else {
        notices.push(`Cobertura total: Los ${usedTokens.size} tokens musculares del catálogo actual están mapeados inequívocamente.`);
      }
    } catch (catErr) {
      warnings.push(`No se pudo verificar la cobertura contra el catálogo: ${catErr.message}`);
    }
  }

  // Resumen
  console.log(`▶ Total músculos y grupos definidos: ${muscles.length}`);
  const groupCount = muscles.filter(m => m.tipo === 'grupo_muscular').length;
  const indCount = muscles.filter(m => m.tipo === 'musculo_individual').length;
  const porcCount = muscles.filter(m => m.tipo === 'porcion_anatomica').length;
  console.log(`  - Grupos musculares   : ${groupCount}`);
  console.log(`  - Músculos individuales: ${indCount}`);
  console.log(`  - Porciones anatómicas : ${porcCount}`);

  if (notices.length > 0) {
    console.log(`\nℹ️  NOTAS:`);
    notices.forEach(n => console.log(`   - ${n}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ADVERTENCIAS (${warnings.length}):`);
    warnings.forEach(w => console.log(`   ! ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ ERRORES DE INTEGRIDAD (${errors.length}):`);
    errors.forEach(e => console.log(`   ✖ ${e}`));
    console.log('='.repeat(65));
    console.log('  ESTADO: FALLÓ LA VALIDACIÓN DE TAXONOMÍA MUSCULAR');
    console.log('='.repeat(65));
    return { valid: false, errors, warnings, notices };
  }

  console.log('='.repeat(65));
  console.log('  ESTADO: VALIDACIÓN EXITOSA — TAXONOMÍA MUSCULAR ÍNTEGRA');
  console.log('='.repeat(65));
  return { valid: true, errors, warnings, notices };
}

// Ejecución directa por CLI
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('validateMuscles.js') || 
  process.argv[1].includes('validateMuscles')
);

if (isDirectRun) {
  const result = validateMuscles();
  process.exit(result.valid ? 0 : 1);
}
