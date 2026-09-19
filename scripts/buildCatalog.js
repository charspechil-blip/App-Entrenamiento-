import fs from 'fs';
import path from 'path';
import { lowerExercises } from './data_lower.js';
import { upperPushExercises } from './data_upper_push.js';
import { upperPullExercises } from './data_upper_pull.js';
import { coreCardioMovExercises } from './data_core_cardio_mov.js';

const allExercises = [
  ...lowerExercises,
  ...upperPushExercises,
  ...upperPullExercises,
  ...coreCardioMovExercises
];

// Verify duplicate IDs
const idSet = new Set();
const duplicates = [];
for (const ex of allExercises) {
  if (idSet.has(ex.id)) {
    duplicates.push(ex.id);
  }
  idSet.add(ex.id);
}

if (duplicates.length > 0) {
  console.error("Duplicate IDs found:", duplicates);
  process.exit(1);
}

const catalog = {
  version: "1.0.0",
  descripcion: "Catálogo maestro normalizado de ejercicios físicos para la aplicación de entrenamiento",
  total_ejercicios: allExercises.length,
  ejercicios: allExercises
};

const jsonContent = JSON.stringify(catalog, null, 2);

// Write to public/ejercicios.json
const publicPath = path.resolve('public', 'ejercicios.json');
fs.writeFileSync(publicPath, jsonContent, 'utf-8');
console.log(`Saved ${allExercises.length} exercises to ${publicPath}`);

// Also ensure src/data/ejercicios.json exists for direct imports if needed
const srcDataDir = path.resolve('src', 'data');
if (!fs.existsSync(srcDataDir)) {
  fs.mkdirSync(srcDataDir, { recursive: true });
}
const srcPath = path.resolve(srcDataDir, 'ejercicios.json');
fs.writeFileSync(srcPath, jsonContent, 'utf-8');
console.log(`Saved copy to ${srcPath}`);
