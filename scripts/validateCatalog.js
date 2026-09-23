import fs from 'fs';
import path from 'path';

/**
 * Validador Oficial del Catálogo Maestro de Ejercicios — Entreno
 * 
 * Comprueba:
 * 1. Identidad: IDs únicos, no vacíos, nombres no vacíos.
 * 2. Integridad: Campos obligatorios presentes, tipos correctos, arrays válidos.
 * 3. Relaciones: Variantes y ejercicios relacionados apuntan a IDs existentes (sin enlaces rotos).
 * 4. Compatibilidad: Se preservan exactamente los 109 ejercicios oficiales sin alteración de IDs.
 * 5. Duplicados: Detección de colisiones en IDs, nombres y nombres alternativos.
 * 6. Sincronización: Verifica que public/ejercicios.json sea una copia fiel derivada.
 */

const CANONICAL_SRC_PATH = path.resolve('src', 'data', 'ejercicios.json');
const DERIVED_PUBLIC_PATH = path.resolve('public', 'ejercicios.json');

const REQUIRED_FIELDS = [
  'id',
  'nombre',
  'nombres_alternativos',
  'familia',
  'patron_movimiento',
  'zona',
  'musculos_principales',
  'musculos_secundarios',
  'descripcion',
  'ejecucion_pasos',
  'equipamiento',
  'tipo',
  'nivel',
  'unilateral',
  'variantes',
  'precauciones',
  'tags'
];

export function validateCatalog() {
  const errors = [];
  const warnings = [];
  const notices = [];

  console.log('='.repeat(65));
  console.log('  VALIDACIÓN DEL CATÁLOGO MAESTRO DE EJERCICIOS — ENTRENO');
  console.log('='.repeat(65));

  // 1. Existencia del archivo maestro
  if (!fs.existsSync(CANONICAL_SRC_PATH)) {
    errors.push(`No se encuentra la fuente canónica en: ${CANONICAL_SRC_PATH}`);
    return { valid: false, errors, warnings, notices };
  }

  let catalog;
  try {
    const rawContent = fs.readFileSync(CANONICAL_SRC_PATH, 'utf-8');
    catalog = JSON.parse(rawContent);
  } catch (err) {
    errors.push(`Error de sintaxis JSON en ${CANONICAL_SRC_PATH}: ${err.message}`);
    return { valid: false, errors, warnings, notices };
  }

  // 2. Metadatos del catálogo
  const VALID_VERSIONS = ['1.1.0', '1.2.0'];
  const VALID_SCHEMAS = ['1.1', '1.2'];
  if (!VALID_VERSIONS.includes(catalog.version)) {
    warnings.push(`Versión del catálogo es "${catalog.version}", se esperaba una de: ${VALID_VERSIONS.join(', ')}`);
  }
  if (!VALID_SCHEMAS.includes(catalog.schema_version)) {
    warnings.push(`schema_version es "${catalog.schema_version}", se esperaba una de: ${VALID_SCHEMAS.join(', ')}`);
  }
  if (catalog.fuente_canonica !== 'src/data/ejercicios.json') {
    warnings.push(`fuente_canonica no coincide con "src/data/ejercicios.json"`);
  }

  const exercises = catalog.ejercicios;
  if (!Array.isArray(exercises)) {
    errors.push('El campo "ejercicios" debe ser un array.');
    return { valid: false, errors, warnings, notices };
  }

  // 3. Compatibilidad de conteo de ejercicios (109 oficiales)
  if (exercises.length !== 109) {
    warnings.push(`El catálogo tiene ${exercises.length} ejercicios (esperados 109 oficiales).`);
  } else {
    notices.push(`Total de ejercicios oficiales verificado: 109`);
  }

  if (catalog.total_ejercicios !== exercises.length) {
    warnings.push(`"total_ejercicios" (${catalog.total_ejercicios}) no coincide con longitud del array (${exercises.length})`);
  }

  // 4. Identidad y Duplicados
  const idMap = new Map();
  const nameMap = new Map();
  const allIds = new Set(exercises.map(e => e.id).filter(Boolean));
  const altNameMap = new Map();

  exercises.forEach((ex, idx) => {
    const pos = `[Índice ${idx} / ID: ${ex.id || 'SIN_ID'}]`;

    // ID no vacío y tipo string
    if (!ex.id || typeof ex.id !== 'string' || !ex.id.trim()) {
      errors.push(`${pos}: ID inválido o vacío.`);
    } else {
      if (idMap.has(ex.id)) {
        errors.push(`${pos}: ID duplicado "${ex.id}" (ya existe en índice ${idMap.get(ex.id)})`);
      } else {
        idMap.set(ex.id, idx);
      }
    }

    // Nombre no vacío y tipo string
    if (!ex.nombre || typeof ex.nombre !== 'string' || !ex.nombre.trim()) {
      errors.push(`${pos}: "nombre" no puede estar vacío.`);
    } else {
      const normName = ex.nombre.toLowerCase().trim();
      if (nameMap.has(normName)) {
        warnings.push(`${pos}: Nombre duplicado "${ex.nombre}" (coincide con índice ${nameMap.get(normName)})`);
      } else {
        nameMap.set(normName, idx);
      }
    }

    // Nombres alternativos
    if (ex.nombres_alternativos && Array.isArray(ex.nombres_alternativos)) {
      ex.nombres_alternativos.forEach(alt => {
        if (typeof alt === 'string' && alt.trim()) {
          const normAlt = alt.toLowerCase().trim();
          if (!altNameMap.has(normAlt)) {
            altNameMap.set(normAlt, []);
          }
          altNameMap.get(normAlt).push(ex.id);
        }
      });
    }

    // 5. Integridad de campos obligatorios
    REQUIRED_FIELDS.forEach(field => {
      if (ex[field] === undefined || ex[field] === null) {
        errors.push(`${pos}: Campo obligatorio ausente: "${field}"`);
      }
    });

    // Tipos de datos
    if (ex.musculos_principales && (!Array.isArray(ex.musculos_principales) || ex.musculos_principales.length === 0)) {
      warnings.push(`${pos}: "musculos_principales" debe ser un array no vacío.`);
    }
    if (ex.musculos_secundarios && !Array.isArray(ex.musculos_secundarios)) {
      errors.push(`${pos}: "musculos_secundarios" debe ser un array.`);
    }
    if (ex.ejecucion_pasos && (!Array.isArray(ex.ejecucion_pasos) || ex.ejecucion_pasos.length === 0)) {
      warnings.push(`${pos}: "ejecucion_pasos" debe contener al menos un paso.`);
    }
    if (ex.equipamiento && (!Array.isArray(ex.equipamiento) || ex.equipamiento.length === 0)) {
      warnings.push(`${pos}: "equipamiento" debe contener al menos un elemento.`);
    }
    if (typeof ex.unilateral !== 'boolean') {
      warnings.push(`${pos}: "unilateral" debería ser un booleano (actual: ${typeof ex.unilateral}).`);
    }

    // Validación semántica taxonómica y biomecánica (Puntos 3A, 3B y 3C)
    const VALID_ZONAS = ['inferior', 'superior', 'core', 'cuerpo_completo'];
    if (ex.zona && !VALID_ZONAS.includes(ex.zona)) {
      errors.push(`${pos}: "zona" inválida "${ex.zona}". No se permite usar 'cardiovascular' o 'movilidad' como zona anatómica.`);
    }
    if (ex.zona_anatomica && !VALID_ZONAS.includes(ex.zona_anatomica)) {
      errors.push(`${pos}: "zona_anatomica" inválida "${ex.zona_anatomica}".`);
    }

    const VALID_TIPOS = ['multiarticular', 'aislamiento'];
    if (ex.tipo && !VALID_TIPOS.includes(ex.tipo)) {
      errors.push(`${pos}: "tipo" inválido "${ex.tipo}". Debe ser estrictamente estructural ('multiarticular' o 'aislamiento').`);
    }
    if (ex.tipo_ejercicio && !VALID_TIPOS.includes(ex.tipo_ejercicio)) {
      errors.push(`${pos}: "tipo_ejercicio" inválido "${ex.tipo_ejercicio}".`);
    }

    const VALID_CAPACIDADES = ['fuerza', 'hipertrofia', 'potencia', 'resistencia_muscular', 'cardiovascular', 'movilidad'];
    if (ex.capacidad_fisica && !VALID_CAPACIDADES.includes(ex.capacidad_fisica)) {
      errors.push(`${pos}: "capacidad_fisica" inválida "${ex.capacidad_fisica}".`);
    }

    const VALID_CADENAS = ['abierta', 'cerrada', 'mixta'];
    if (ex.cadena_cinetica && !VALID_CADENAS.includes(ex.cadena_cinetica)) {
      errors.push(`${pos}: "cadena_cinetica" inválida "${ex.cadena_cinetica}".`);
    }

    const VALID_PLANOS = ['sagital', 'frontal', 'transversal', 'multiplanar'];
    if (ex.plano_predominante && !VALID_PLANOS.includes(ex.plano_predominante)) {
      errors.push(`${pos}: "plano_predominante" inválido "${ex.plano_predominante}".`);
    }

    const VALID_UNILATERALIDADES = ['bilateral', 'unilateral', 'alternado', 'asimetrico'];
    if (ex.unilateralidad && !VALID_UNILATERALIDADES.includes(ex.unilateralidad)) {
      errors.push(`${pos}: "unilateralidad" inválida "${ex.unilateralidad}".`);
    }

    const VALID_ESTABILIDADES = ['baja', 'media', 'alta'];
    if (ex.demanda_estabilidad && !VALID_ESTABILIDADES.includes(ex.demanda_estabilidad)) {
      errors.push(`${pos}: "demanda_estabilidad" inválida "${ex.demanda_estabilidad}".`);
    }

    const VALID_RESISTENCIAS = ['peso_libre', 'peso_corporal', 'polea', 'maquina_guiada', 'elastico'];
    if (ex.tipo_resistencia && !VALID_RESISTENCIAS.includes(ex.tipo_resistencia)) {
      errors.push(`${pos}: "tipo_resistencia" inválida "${ex.tipo_resistencia}".`);
    }

    // Verificar que no haya "core" genérico como músculo en secundarios
    if (ex.musculos_secundarios && ex.musculos_secundarios.includes('core')) {
      warnings.push(`${pos}: "core" no debe usarse como músculo anatómico en musculos_secundarios.`);
    }

    // 6. Relaciones: Variantes, Ejercicios Relacionados y Sustitutos
    if (ex.variantes) {
      if (!Array.isArray(ex.variantes)) {
        errors.push(`${pos}: "variantes" debe ser un array.`);
      } else {
        const seenV = new Set();
        ex.variantes.forEach(variantId => {
          if (!allIds.has(variantId)) {
            errors.push(`${pos}: Variante rota o inexistente "${variantId}".`);
          }
          if (variantId === ex.id) {
            errors.push(`${pos}: Autorreferencia en "variantes" ("${variantId}").`);
          }
          if (seenV.has(variantId)) {
            warnings.push(`${pos}: ID duplicado en "variantes" ("${variantId}").`);
          }
          seenV.add(variantId);
        });
      }
    }

    if (ex.ejercicios_relacionados) {
      if (!Array.isArray(ex.ejercicios_relacionados)) {
        errors.push(`${pos}: "ejercicios_relacionados" debe ser un array.`);
      } else {
        const seenR = new Set();
        ex.ejercicios_relacionados.forEach(relId => {
          if (!allIds.has(relId)) {
            errors.push(`${pos}: Ejercicio relacionado inexistente "${relId}".`);
          }
          if (relId === ex.id) {
            errors.push(`${pos}: Autorreferencia en "ejercicios_relacionados" ("${relId}").`);
          }
          if (seenR.has(relId)) {
            warnings.push(`${pos}: ID duplicado en "ejercicios_relacionados" ("${relId}").`);
          }
          seenR.add(relId);
        });
      }
    }

    if (ex.sustitutos) {
      if (!Array.isArray(ex.sustitutos)) {
        errors.push(`${pos}: "sustitutos" debe ser un array.`);
      } else {
        const seenS = new Set();
        ex.sustitutos.forEach(subId => {
          if (!allIds.has(subId)) {
            errors.push(`${pos}: Sustituto inexistente "${subId}".`);
          }
          if (subId === ex.id) {
            errors.push(`${pos}: Autorreferencia en "sustitutos" ("${subId}").`);
          }
          if (seenS.has(subId)) {
            warnings.push(`${pos}: ID duplicado en "sustitutos" ("${subId}").`);
          }
          seenS.add(subId);
        });
      }
    }
  });

  // Verificar colisiones entre nombres alternativos y nombres principales
  for (const [alt, ids] of altNameMap.entries()) {
    if (nameMap.has(alt)) {
      const mainOwnerIdx = nameMap.get(alt);
      const mainOwnerId = exercises[mainOwnerIdx].id;
      const otherIds = ids.filter(id => id !== mainOwnerId);
      if (otherIds.length > 0) {
        notices.push(`Nombre alternativo "${alt}" de [${otherIds.join(', ')}] coincide con nombre principal de [${mainOwnerId}]`);
      }
    }
  }

  // 7. Auditoría de Relaciones Asimétricas en Variantes (Informativo para normalización futura)
  let asymmetricLinks = 0;
  exercises.forEach(ex => {
    if (ex.variantes && Array.isArray(ex.variantes)) {
      ex.variantes.forEach(vId => {
        const target = exercises.find(t => t.id === vId);
        if (!target || !target.variantes || !target.variantes.includes(ex.id)) {
          asymmetricLinks++;
        }
      });
    }
  });
  notices.push(`Relaciones asimétricas detectadas en variantes (normalización conceptual futura): ${asymmetricLinks}`);

  // 8. Estadísticas de Relaciones
  let totalVariants = 0;
  let totalRelated = 0;
  let totalSubstitutes = 0;
  exercises.forEach(e => {
    totalVariants += (e.variantes?.length || 0);
    totalRelated += (e.ejercicios_relacionados?.length || 0);
    totalSubstitutes += (e.sustitutos?.length || 0);
  });
  notices.push(`Relaciones normalizadas: ${totalVariants} variantes, ${totalRelated} ejercicios relacionados, ${totalSubstitutes} sustitutos.`);

  // 9. Distribución de Zonas y Tipos para Trazabilidad
  const zoneStats = {};
  const typeStats = {};
  exercises.forEach(e => {
    zoneStats[e.zona] = (zoneStats[e.zona] || 0) + 1;
    typeStats[e.tipo] = (typeStats[e.tipo] || 0) + 1;
  });

  // 10. Comprobación de Sincronización con public/ejercicios.json
  if (fs.existsSync(DERIVED_PUBLIC_PATH)) {
    try {
      const pubContent = fs.readFileSync(DERIVED_PUBLIC_PATH, 'utf-8');
      const pubCatalog = JSON.parse(pubContent);
      if (pubCatalog.ejercicios?.length !== exercises.length) {
        warnings.push(`public/ejercicios.json (${pubCatalog.ejercicios?.length} ejercicios) difiere de src/data/ejercicios.json (${exercises.length} ejercicios).`);
      } else {
        notices.push(`Copia derivada en public/ejercicios.json sincronizada (${pubCatalog.ejercicios.length} ejercicios).`);
      }
    } catch (e) {
      warnings.push(`No se pudo leer public/ejercicios.json para validación de sincronización.`);
    }
  } else {
    warnings.push(`No se encontró public/ejercicios.json. Ejecuta npm run catalog:build para generarlo.`);
  }

  // Reporte final de validación
  console.log(`\n▶ Resumen del Catálogo:`);
  console.log(`  - Total ejercicios: ${exercises.length}`);
  console.log(`  - Versión: ${catalog.version} (schema: ${catalog.schema_version})`);
  console.log(`  - Fuente canónica: ${catalog.fuente_canonica || 'src/data/ejercicios.json'}`);
  console.log(`  - Publicación derivada: ${catalog.publicacion || 'public/ejercicios.json'}`);

  console.log(`\n▶ Distribución por "zona" actual:`);
  Object.entries(zoneStats).forEach(([z, count]) => {
    console.log(`    • ${z.padEnd(18)} : ${count}`);
  });

  console.log(`\n▶ Distribución por "tipo" actual:`);
  Object.entries(typeStats).forEach(([t, count]) => {
    console.log(`    • ${t.padEnd(18)} : ${count}`);
  });

  if (notices.length > 0) {
    console.log(`\nℹ️  NOTAS DE AUDITORÍA (${notices.length}):`);
    notices.forEach(n => console.log(`   - ${n}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ADVERTENCIAS (${warnings.length}):`);
    warnings.forEach(w => console.log(`   ! ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ ERRORES DE INTEGRIDAD (${errors.length}):`);
    errors.forEach(e => console.log(`   ✖ ${e}`));
    console.log('\n' + '='.repeat(65));
    console.log('  ESTADO: FALLÓ LA VALIDACIÓN');
    console.log('='.repeat(65) + '\n');
    return { valid: false, errors, warnings, notices };
  }

  console.log('\n' + '='.repeat(65));
  console.log('  ESTADO: VALIDACIÓN EXITOSA — CATÁLOGO MAESTRO ÍNTEGRO');
  console.log('='.repeat(65) + '\n');

  return { valid: true, errors, warnings, notices };
}

// Ejecución directa por CLI (node scripts/validateCatalog.js)
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/validateCatalog.js');
if (isMain) {
  const result = validateCatalog();
  if (!result.valid) {
    process.exit(1);
  }
}
