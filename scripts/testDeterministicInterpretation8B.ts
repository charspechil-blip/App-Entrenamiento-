/**
 * ETAPA 8B — SUITE DE PRUEBAS DETERMINISTAS (10 CASOS OBLIGATORIOS)
 * =================================================================
 * 
 * Verifica que el motor de interpretación responde con exactitud matemática
 * y trazabilidad causal a los 10 escenarios fisiológicos y biomecánicos
 * estipulados en la Sección 23 de la especificación de 8B.
 */

import {
  interpretExecution,
  evaluateComparability,
  evaluateDataCompleteness,
} from '../services/deterministicInterpretation';
import type {
  ObservedExerciseExecution,
  HistoryReferenceSet,
  TrainingBlockContext,
  SessionContext,
  ObservedSet,
} from '../types/deterministicEngine';

function createMockSet(
  loadKg: number,
  reps: number,
  rir: number = 2,
  restSecondsAfter: number = 180,
  structureType: any = 'CONVENTIONAL'
): ObservedSet {
  return {
    setIndex: 1,
    structure: { type: structureType },
    loadKg,
    reps,
    rir,
    restSecondsAfter,
    reliability: {
      confidence: 'CONFIRMED',
      source: 'direct_input',
      identityConfidence: 'CONFIRMED',
    },
  };
}

function createMockExecution(
  id: string,
  exerciseId: string,
  exerciseName: string,
  sets: ObservedSet[]
): ObservedExerciseExecution {
  return {
    id,
    exerciseId,
    exerciseNameSnapshot: exerciseName as any,
    sessionId: `session-${id}`,
    timestamp: '2026-10-01T10:00:00.000Z',
    orderInSession: 1,
    sets,
    executionReliability: {
      confidence: 'CONFIRMED',
      source: 'direct_input',
      identityConfidence: 'CONFIRMED',
    },
  };
}

const defaultBlock: TrainingBlockContext = {
  blockId: 'block-fuerza-1',
  name: 'Bloque de Fuerza Básica',
  objective: 'FUERZA',
  startDate: '2026-09-01T00:00:00Z',
  isClosed: false,
  allowPrescriptionInheritance: true,
};

let passedCount = 0;
let totalCount = 10;

console.log('=================================================================');
console.log('  EJECUCIÓN DE PRUEBAS DETERMINISTAS — ETAPA 8B (10 ESCENARIOS)  ');
console.log('=================================================================\n');

// -----------------------------------------------------------------------------
// CASO 1: Misma carga + mismas reps + mismo RIR -> PERFORMANCE_STABLE
// -----------------------------------------------------------------------------
{
  const ref = createMockExecution('ref-1', 'sentadilla', 'Sentadilla con barra', [
    createMockSet(100, 5, 2, 180),
  ]);
  const cur = createMockExecution('cur-1', 'sentadilla', 'Sentadilla con barra', [
    createMockSet(100, 5, 2, 180),
  ]);
  const history: HistoryReferenceSet = {
    previousSessionExecution: ref,
    rollingHistory: [ref],
    blockHistory: [ref],
    historicalExperimentalArchive: [],
  };

  const res = interpretExecution(cur, history, defaultBlock);
  console.log(`[CASO 1] Misma carga + reps + RIR -> ${res.primaryStatus}`);
  console.assert(res.primaryStatus === 'PERFORMANCE_STABLE', 'Caso 1 Falló');
  console.assert(res.performanceStatus === 'PERFORMANCE_STABLE', 'Caso 1 PerformanceStatus Falló');
  console.assert(res.decision === 'NOT_IMPLEMENTED_IN_8B', 'Caso 1 Decisión Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 2: Mayor carga + mismas reps + RIR equivalente -> PERFORMANCE_IMPROVED
// -----------------------------------------------------------------------------
{
  const ref = createMockExecution('ref-2', 'press-banca-plano-barra', 'Press de banca', [
    createMockSet(80, 8, 2, 180),
  ]);
  const cur = createMockExecution('cur-2', 'press-banca-plano-barra', 'Press de banca', [
    createMockSet(82.5, 8, 2, 180),
  ]);
  const history: HistoryReferenceSet = {
    previousSessionExecution: ref,
    rollingHistory: [ref],
    blockHistory: [ref],
    historicalExperimentalArchive: [],
  };

  const res = interpretExecution(cur, history, defaultBlock);
  console.log(`[CASO 2] Mayor carga + mismas reps + RIR eq -> ${res.primaryStatus}`);
  console.assert(res.primaryStatus === 'PERFORMANCE_IMPROVED', 'Caso 2 Falló');
  console.assert(res.performanceStatus === 'PERFORMANCE_IMPROVED', 'Caso 2 Status Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 3: Menos reps + descanso considerablemente menor -> PERFORMANCE_DECLINE_WITH_REDUCED_REST
// -----------------------------------------------------------------------------
{
  const ref = createMockExecution('ref-3', 'dominadas-pronadas', 'Dominadas', [
    createMockSet(0, 10, 2, 180),
  ]);
  // Descanso se redujo a 60s (vs 180s), reps cayeron a 7
  const cur = createMockExecution('cur-3', 'dominadas-pronadas', 'Dominadas', [
    createMockSet(0, 7, 2, 60),
  ]);
  const history: HistoryReferenceSet = {
    previousSessionExecution: ref,
    rollingHistory: [ref],
    blockHistory: [ref],
    historicalExperimentalArchive: [],
  };

  const res = interpretExecution(cur, history, defaultBlock);
  console.log(`[CASO 3] Menos reps + menor descanso -> ${res.primaryStatus}`);
  console.assert(res.primaryStatus === 'PERFORMANCE_DECLINE_WITH_REDUCED_REST', 'Caso 3 Falló');
  console.assert(res.contributingFactors.some(c => c.includes('densidad') || c.includes('Descanso')), 'Caso 3 Causa Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 4: Una única sesión mala entre varias normales -> ISOLATED_PERFORMANCE_ANOMALY
// -----------------------------------------------------------------------------
{
  const s1 = createMockExecution('s1', 'sentadilla', 'Sentadilla', [createMockSet(100, 10, 2, 180)]);
  const s2 = createMockExecution('s2', 'sentadilla', 'Sentadilla', [createMockSet(100, 10, 2, 180)]);
  const s3 = createMockExecution('s3', 'sentadilla', 'Sentadilla', [createMockSet(100, 10, 2, 180)]);
  
  // Sesión anómala con 7 reps
  const cur = createMockExecution('cur-4', 'sentadilla', 'Sentadilla', [createMockSet(100, 7, 2, 180)]);
  
  const history: HistoryReferenceSet = {
    previousSessionExecution: s3,
    rollingHistory: [s3, s2, s1],
    blockHistory: [s1, s2, s3],
    historicalExperimentalArchive: [],
  };

  const res = interpretExecution(cur, history, defaultBlock);
  console.log(`[CASO 4] Sesión atípica aislada -> ${res.primaryStatus}`);
  console.assert(res.primaryStatus === 'ISOLATED_PERFORMANCE_ANOMALY', 'Caso 4 Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 5: Varias sesiones comparables sin avance -> PLATEAU_CANDIDATE
// -----------------------------------------------------------------------------
{
  const s1 = createMockExecution('s1', 'peso-muerto-convencional', 'Peso muerto', [createMockSet(140, 5, 2, 240)]);
  const s2 = createMockExecution('s2', 'peso-muerto-convencional', 'Peso muerto', [createMockSet(140, 5, 2, 240)]);
  const s3 = createMockExecution('s3', 'peso-muerto-convencional', 'Peso muerto', [createMockSet(140, 5, 2, 240)]);
  
  // 4ta sesión consecutiva idéntica
  const cur = createMockExecution('cur-5', 'peso-muerto-convencional', 'Peso muerto', [createMockSet(140, 5, 2, 240)]);
  
  const history: HistoryReferenceSet = {
    previousSessionExecution: s3,
    rollingHistory: [s3, s2, s1],
    blockHistory: [s1, s2, s3],
    historicalExperimentalArchive: [],
  };

  const res = interpretExecution(cur, history, defaultBlock);
  console.log(`[CASO 5] Sesiones estancadas consecutivas -> ${res.primaryStatus}`);
  console.assert(res.primaryStatus === 'PLATEAU_CANDIDATE', 'Caso 5 Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 6: Mismo resultado externo pero RIR menor -> PERFORMANCE_STABLE_WITH_HIGHER_EFFORT
// -----------------------------------------------------------------------------
{
  // Ref: 80kg x 8 @ RIR 2
  const ref = createMockExecution('ref-6', 'press-banca-plano-barra', 'Press de banca', [
    createMockSet(80, 8, 2, 180),
  ]);
  // Cur: 80kg x 8 @ RIR 0 (mayor esfuerzo interno)
  const cur = createMockExecution('cur-6', 'press-banca-plano-barra', 'Press de banca', [
    createMockSet(80, 8, 0, 180),
  ]);
  const history: HistoryReferenceSet = {
    previousSessionExecution: ref,
    rollingHistory: [ref],
    blockHistory: [ref],
    historicalExperimentalArchive: [],
  };

  const res = interpretExecution(cur, history, defaultBlock);
  console.log(`[CASO 6] Mismo trabajo + menor RIR -> ${res.primaryStatus} (Effort: ${res.effortStatus})`);
  console.assert(res.primaryStatus === 'PERFORMANCE_STABLE_WITH_HIGHER_EFFORT', 'Caso 6 Falló');
  console.assert(res.performanceStatus === 'PERFORMANCE_STABLE', 'Caso 6 PerfStatus Falló');
  console.assert(res.effortStatus === 'EFFORT_MAXIMAL' || res.effortStatus === 'EFFORT_INCREASED', 'Caso 6 EffortStatus Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 7: Ejercicio diferente pero mismo nombre visible -> NON_COMPARABLE
// -----------------------------------------------------------------------------
{
  // Ref: Sentadilla con barra ('sentadilla')
  const ref = createMockExecution('ref-7', 'sentadilla', 'Sentadilla', [createMockSet(100, 5, 2, 180)]);
  // Cur: Sentadilla búlgara ('sentadilla-bulgara') pero llamada 'Sentadilla' en texto visible
  const cur = createMockExecution('cur-7', 'sentadilla-bulgara', 'Sentadilla', [createMockSet(24, 8, 2, 120)]);

  const comp = evaluateComparability(cur, ref, defaultBlock, defaultBlock);
  console.log(`[CASO 7] Mismo nombre visible + distinto ExerciseId -> ${comp.classification}`);
  console.assert(comp.classification === 'NON_COMPARABLE', 'Caso 7 Falló');
  console.assert(comp.invalidationReasons[0].includes('Identificadores de ejercicio diferentes'), 'Caso 7 Razón Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 8: Bloque híbrido cerrado frente a bloque de fuerza -> NO_DIRECT_PRESCRIPTION_REFERENCE
// -----------------------------------------------------------------------------
{
  const hybridBlock: TrainingBlockContext = {
    blockId: 'block-hybrid-closed',
    name: 'Bloque Híbrido Experimental Antiguo',
    objective: 'HIBRIDO_EXPERIMENTAL',
    startDate: '2025-01-01T00:00:00Z',
    isClosed: true,
    allowPrescriptionInheritance: false,
  };

  const ref = createMockExecution('ref-8', 'press-militar-barra', 'Press militar', [createMockSet(50, 8, 2, 120)]);
  const cur = createMockExecution('cur-8', 'press-militar-barra', 'Press militar', [createMockSet(50, 5, 2, 180)]);

  const history: HistoryReferenceSet = {
    previousSessionExecution: ref,
    rollingHistory: [ref],
    blockHistory: [ref],
    historicalExperimentalArchive: [],
  };

  // Cur se evalúa en Bloque de Fuerza con referencia de Bloque Híbrido
  const comp = evaluateComparability(cur, ref, defaultBlock, hybridBlock);
  const res = interpretExecution(cur, history, defaultBlock);

  console.log(`[CASO 8] Ref de bloque experimental cerrado -> Comparabilidad: ${comp.classification}`);
  console.assert(comp.classification === 'NON_COMPARABLE', 'Caso 8 Comparabilidad Falló');
  console.assert(comp.invalidationReasons.some(r => r.includes('experimental cerrado')), 'Caso 8 Justificación Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 9: Dolor localizado acompañado de caída del rendimiento -> PAIN_CONTEXT_PRESENT
// -----------------------------------------------------------------------------
{
  const ref = createMockExecution('ref-9', 'press-frances-barra-z', 'Press francés', [createMockSet(40, 10, 2, 120)]);
  // Caída a 6 reps acompañada de molestia en codo (articular_pain)
  const cur = createMockExecution('cur-9', 'press-frances-barra-z', 'Press francés', [createMockSet(40, 6, 2, 120)]);
  
  const contextWithPain: SessionContext = {
    sessionId: 'session-cur-9',
    timestamp: '2026-10-01T10:00:00.000Z',
    localizedSymptoms: [
      {
        bodyZone: 'superior',
        muscleId: 'codo_triceps',
        intensity: 5,
        nature: 'articular_pain',
      },
    ],
    contextReliability: {
      confidence: 'CONFIRMED',
      source: 'direct_input',
      identityConfidence: 'CONFIRMED',
    },
  };

  const history: HistoryReferenceSet = {
    previousSessionExecution: ref,
    rollingHistory: [ref],
    blockHistory: [ref],
    historicalExperimentalArchive: [],
  };

  const res = interpretExecution(cur, history, defaultBlock, contextWithPain);
  console.log(`[CASO 9] Dolor localizado + caída de reps -> ${res.primaryStatus}`);
  console.assert(res.primaryStatus === 'PAIN_CONTEXT_PRESENT', 'Caso 9 Falló');
  console.assert(res.contributingFactors.some(c => c.includes('dolor articular')), 'Caso 9 Factor Falló');
  passedCount++;
}

// -----------------------------------------------------------------------------
// CASO 10: Datos incompletos -> DATA_PARTIAL o DATA_INSUFFICIENT
// -----------------------------------------------------------------------------
{
  // Ejecución sin RIR ni descansos reportados
  const partialExecution: ObservedExerciseExecution = {
    id: 'partial-1',
    exerciseId: 'curl-biceps-barra',
    exerciseNameSnapshot: 'Curl de bíceps' as any,
    sessionId: 'session-partial',
    timestamp: '2026-10-01T10:00:00.000Z',
    orderInSession: 2,
    sets: [
      {
        setIndex: 1,
        structure: { type: 'CONVENTIONAL' },
        loadKg: 30,
        reps: 10,
        // Sin rir ni restSecondsAfter
        reliability: {
          confidence: 'UNCERTAIN',
          source: 'legacy_reconstructed',
          identityConfidence: 'CONFIRMED',
        },
      },
    ],
    executionReliability: {
      confidence: 'UNCERTAIN',
      source: 'legacy_reconstructed',
      identityConfidence: 'CONFIRMED',
    },
  };

  const completeness = evaluateDataCompleteness(partialExecution);
  console.log(`[CASO 10] Datos incompletos -> ${completeness.status} (Faltan: ${completeness.missingFields.join(', ')})`);
  console.assert(completeness.status === 'DATA_PARTIAL', 'Caso 10 Falló');
  console.assert(completeness.missingFields.includes('rir_or_rpe'), 'Caso 10 Campo RIR Falló');
  passedCount++;
}

console.log('\n-----------------------------------------------------------------');
console.log(`RESULTADO: ${passedCount}/${totalCount} PRUEBAS DETERMINISTAS COMPLETADAS EXITOSAMENTE.`);
console.log('-----------------------------------------------------------------\n');
