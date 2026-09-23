import fs from 'fs';
import path from 'path';
import { validateCatalog } from './validateCatalog.js';

/**
 * Script de Publicación del Catálogo Maestro — Entreno
 * 
 * ARQUITECTURA OFICIAL:
 * 
 *                     CATÁLOGO MAESTRO
 *                          │
 *                          ▼
 *               src/data/ejercicios.json   ◄── FUENTE CANÓNICA OFICIAL
 *                          │
 *                          ├──────────────► exerciseCatalog.ts (Servicio App)
 *                          │
 *                          ▼
 *               publicación para aplicación
 *                          │
 *                          ▼
 *               public/ejercicios.json      ◄── COPIA DERIVADA DE PUBLICACIÓN
 * 
 * NOTA HISTÓRICA / LEGACY:
 * Los archivos modulares:
 * - data_lower.js
 * - data_upper_push.js
 * - data_upper_pull.js
 * - data_core_cardio_mov.js
 * corresponden a la fase inicial de bootstrap del catálogo y se conservan intactos
 * como fuentes legacy para trazabilidad histórica, pero NO constituyen la fuente de verdad.
 */

// 1. Validar la fuente canónica antes de publicar
const validationResult = validateCatalog();
if (!validationResult.valid) {
  console.error('\n✖ Error: El catálogo maestro no superó la validación. Cancelando publicación.');
  process.exit(1);
}

// 2. Leer la fuente canónica oficial
const canonicalPath = path.resolve('src', 'data', 'ejercicios.json');
const canonicalContent = fs.readFileSync(canonicalPath, 'utf-8');
const catalog = JSON.parse(canonicalContent);

// 3. Escribir la copia derivada de publicación en public/ejercicios.json
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const publicPath = path.resolve(publicDir, 'ejercicios.json');

// Formatear JSON limpio y consistente
const publishedContent = JSON.stringify(catalog, null, 2);
fs.writeFileSync(publicPath, publishedContent, 'utf-8');

console.log(`\n✔ Publicación exitosa:`);
console.log(`  - Fuente canónica: ${canonicalPath}`);
console.log(`  - Copia derivada : ${publicPath}`);
console.log(`  - Total ejercicios: ${catalog.total_ejercicios} (Versión ${catalog.version})\n`);
