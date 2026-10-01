/**
 * ETAPA 8B — LÓGICA DE INTERPRETACIÓN DEL MOTOR DETERMINISTA
 * ==========================================================
 * 
 * Módulo puro, determinista y completamente trazable que transforma:
 *   OBSERVACIONES + CONTEXTO + HISTORIAL
 * en:
 *   INTERPRETACIONES DETERMINISTAS (sin emitir prescripciones de carga ni volumen).
 * 
 * REGLA FUNDAMENTAL DE 8B:
 * - Responde: "¿Qué interpretación está respaldada por los datos disponibles?"
 * - NO toma decisiones de prescripción (subir/bajar peso, cambiar ejercicios, etc.).
 * - La prescripción pertenece exclusivamente a la Etapa 8C.
 * - Siempre retorna: decision = 'NOT_IMPLEMENTED_IN_8B'.
 */

import type {
  ExerciseId,
  ObservedExerciseExecution,
  ObservedSet,
  SessionContext,
  TrainingBlockContext,
  ComparabilityClassification,
  ComparabilityCriteria,
  DataCompletenessStatus,
  PerformanceStatus,
  EffortStatus,
  InterpretationConfidence,
  InterpretationTag,
  InterpretationResult,
  HistoryReferenceSet,
} from '../types/deterministicEngine';

// ============================================================================
// 1. EVALUACIÓN DE COMPLETITUD Y CALIDAD DE DATOS (LAYER 2.1)
// ============================================================================

export interface DataCompletenessEvaluation {
  status: DataCompletenessStatus;
  missingFields: string[];
  reasons: string[];
}

/**
 * Evalúa si una ejecución contiene datos suficientes y confiables para ser interpretada.
 */
export function evaluateDataCompleteness(
  execution: ObservedExerciseExecution,
  context?: SessionContext
): DataCompletenessEvaluation {
  const missingFields: string[] = [];
  const reasons: string[] = [];

  if (!execution.sets || execution.sets.length === 0) {
    missingFields.push('sets');
    reasons.push('No existen series registradas para esta ejecución.');
    return {
      status: 'DATA_INSUFFICIENT',
      missingFields,
      reasons,
    };
  }

  // Comprobar variables críticas en cada serie
  let hasValidReps = false;
  let hasRir = true;
  let hasRest = true;

  execution.sets.forEach((set, idx) => {
    if (set.reps > 0) hasValidReps = true;
    if (set.rir === undefined && set.rpe === undefined) hasRir = false;
    if (set.restSecondsAfter === undefined) hasRest = false;

    if (set.reliability?.confidence === 'ABSENT' || set.reliability?.confidence === 'UNCERTAIN') {
      reasons.push(`Serie ${idx + 1} posee confiabilidad degradada (${set.reliability.confidence}).`);
    }
  });

  if (!hasValidReps) {
    missingFields.push('reps');
    reasons.push('Ninguna serie posee repeticiones válidas (>0).');
    return {
      status: 'DATA_INSUFFICIENT',
      missingFields,
      reasons,
    };
  }

  if (!hasRir) {
    missingFields.push('rir_or_rpe');
    reasons.push('Falta información de proximidad al fallo (RIR o RPE).');
  }

  if (!hasRest) {
    missingFields.push('restSecondsAfter');
    reasons.push('Falta el tiempo de descanso posterior entre series.');
  }

  if (execution.executionReliability?.confidence === 'UNCERTAIN' || execution.executionReliability?.confidence === 'ABSENT') {
    reasons.push('Confiabilidad global de la ejecución marcada como baja o incierta.');
  }

  if (!context) {
    missingFields.push('sessionContext');
    reasons.push('Contexto de sesión (sueño, estrés, molestias) no proporcionado.');
  }

  if (missingFields.length > 0 || reasons.length > 0) {
    return {
      status: 'DATA_PARTIAL',
      missingFields,
      reasons,
    };
  }

  return {
    status: 'DATA_SUFFICIENT',
    missingFields: [],
    reasons: ['Todos los datos de rendimiento, descanso y contexto están verificados.'],
  };
}

// ============================================================================
// 2. EVALUACIÓN ESTRICTA DE COMPARABILIDAD (LAYER 2.2)
// ============================================================================

export interface DetailedComparabilityResult {
  classification: ComparabilityClassification;
  criteria: ComparabilityCriteria;
  invalidationReasons: string[];
}

/**
 * Determina si dos observaciones de ejercicio son biomecánica y fisiológicamente comparables.
 */
export function evaluateComparability(
  current: ObservedExerciseExecution,
  reference: ObservedExerciseExecution,
  currentBlock?: TrainingBlockContext,
  refBlock?: TrainingBlockContext
): DetailedComparabilityResult {
  const invalidationReasons: string[] = [];

  // Regla de Identidad 1: Mismo ExerciseId canónico estricto
  const sameExerciseId = current.exerciseId === reference.exerciseId;
  if (!sameExerciseId) {
    invalidationReasons.push(
      `Identificadores de ejercicio diferentes: '${current.exerciseId}' vs '${reference.exerciseId}' (incluso si comparten nombre visible).`
    );
  }

  // Regla de Bloque: Aislamiento del Bloque Híbrido Experimental Cerrado
  let sameBlockObjective = true;
  if (refBlock && currentBlock) {
    if (
      (refBlock.objective === 'HIBRIDO_EXPERIMENTAL' || !refBlock.allowPrescriptionInheritance) &&
      currentBlock.objective !== 'HIBRIDO_EXPERIMENTAL'
    ) {
      sameBlockObjective = false;
      invalidationReasons.push(
        `La referencia pertenece a un bloque experimental cerrado (${refBlock.objective}) y no es transferible al bloque activo (${currentBlock.objective}).`
      );
    } else if (refBlock.objective !== currentBlock.objective) {
      sameBlockObjective = false;
      invalidationReasons.push(
        `Objetivos de bloque de entrenamiento dispares: '${currentBlock.objective}' vs '${refBlock.objective}'.`
      );
    }
  }

  // Regla de Estructura de Set: convencional vs cluster vs drop
  const currentStructureType = current.sets[0]?.structure?.type || 'CONVENTIONAL';
  const refStructureType = reference.sets[0]?.structure?.type || 'CONVENTIONAL';
  const sameSetStructure = currentStructureType === refStructureType;
  if (!sameSetStructure) {
    invalidationReasons.push(
      `Estructuras de serie incompatibles: actual '${currentStructureType}' vs referencia '${refStructureType}'.`
    );
  }

  // Regla de Carga relativa: no comparar cargas con delta excesivo (>25%)
  const currentAvgLoad = calculateAverageLoad(current.sets);
  const refAvgLoad = calculateAverageLoad(reference.sets);
  const loadDeltaPct = refAvgLoad > 0 ? Math.abs(currentAvgLoad - refAvgLoad) / refAvgLoad : 0;
  const loadToleranceOk = loadDeltaPct <= 0.25;
  if (!loadToleranceOk && refAvgLoad > 0) {
    invalidationReasons.push(
      `Disparidad de carga externa excesiva (${(loadDeltaPct * 100).toFixed(1)}% de variación: ${currentAvgLoad}kg vs ${refAvgLoad}kg).`
    );
  }

  // Regla de Repeticiones: tolerancia dentro del mismo régimen energético
  const currentAvgReps = calculateAverageReps(current.sets);
  const refAvgReps = calculateAverageReps(reference.sets);
  const repDelta = Math.abs(currentAvgReps - refAvgReps);
  const repToleranceOk = repDelta <= 4;
  if (!repToleranceOk) {
    invalidationReasons.push(
      `Divergencia en rango de repeticiones (${currentAvgReps} reps vs ${refAvgReps} reps).`
    );
  }

  // Regla de Intervalos de Descanso: comparar descansos similares
  const currentAvgRest = calculateAverageRest(current.sets);
  const refAvgRest = calculateAverageRest(reference.sets);
  const restDeltaSeconds = Math.abs(currentAvgRest - refAvgRest);
  const restEquivalenceOk = restDeltaSeconds <= 75; // Tolerancia de 75s
  if (!restEquivalenceOk && refAvgRest > 0) {
    invalidationReasons.push(
      `Variación sustancial en el tiempo de descanso (${currentAvgRest}s vs ${refAvgRest}s).`
    );
  }

  // Posición en la sesión
  const similarOrder = Math.abs(current.orderInSession - reference.orderInSession) <= 2;
  if (!similarOrder) {
    invalidationReasons.push(
      `Posición en la sesión sensiblemente alterada (orden ${current.orderInSession} vs orden ${reference.orderInSession}).`
    );
  }

  const criteria: ComparabilityCriteria = {
    sameExerciseId,
    sameBiomechanicalVariant: true,
    sameSetStructure,
    loadTolerancePercentage: loadDeltaPct,
    repToleranceDelta: repDelta,
    restIntervalEquivalence: restEquivalenceOk,
    sameTrainingBlockObjective: sameBlockObjective,
    similarOrderInSession: similarOrder,
  };

  // Clasificación final
  if (!sameExerciseId || !sameBlockObjective || !sameSetStructure || !loadToleranceOk) {
    return {
      classification: 'NON_COMPARABLE',
      criteria,
      invalidationReasons,
    };
  }

  if (!restEquivalenceOk || !repToleranceOk || !similarOrder) {
    return {
      classification: 'CONDITIONALLY_COMPARABLE',
      criteria,
      invalidationReasons,
    };
  }

  return {
    classification: 'STRICTLY_COMPARABLE',
    criteria,
    invalidationReasons: [],
  };
}

// ============================================================================
// 3. INTERPRETACIÓN DE RENDIMIENTO Y ESFUERZO (LAYERS 3 Y 4)
// ============================================================================

export interface PerformanceEffortInterpretation {
  performanceStatus: PerformanceStatus;
  effortStatus: EffortStatus;
  primaryTag: InterpretationTag;
  secondaryTags: InterpretationTag[];
  evidence: string[];
  contributingFactors: string[];
  contradictoryFactors: string[];
}

/**
 * Interpreta la relación entre el trabajo externo (carga × reps) y el coste interno (RIR, descanso, fatiga).
 */
export function interpretPerformanceAndEffort(
  current: ObservedExerciseExecution,
  reference: ObservedExerciseExecution,
  comparability: DetailedComparabilityResult,
  context?: SessionContext
): PerformanceEffortInterpretation {
  const evidence: string[] = [];
  const contributingFactors: string[] = [];
  const contradictoryFactors: string[] = [];
  const secondaryTags: InterpretationTag[] = [];

  const curLoad = calculateAverageLoad(current.sets);
  const refLoad = calculateAverageLoad(reference.sets);
  const curReps = calculateAverageReps(current.sets);
  const refReps = calculateAverageReps(reference.sets);
  const curRir = calculateAverageRir(current.sets);
  const refRir = calculateAverageRir(reference.sets);
  const curRest = calculateAverageRest(current.sets);
  const refRest = calculateAverageRest(reference.sets);

  evidence.push(
    `Actual: ${curLoad}kg × ${curReps} reps${curRir !== undefined ? ` @ RIR ${curRir}` : ''} (descanso ${curRest}s).`,
    `Referencia: ${refLoad}kg × ${refReps} reps${refRir !== undefined ? ` @ RIR ${refRir}` : ''} (descanso ${refRest}s).`
  );

  // 1. Detección de Esfuerzo Interno
  let effortStatus: EffortStatus = 'EFFORT_UNKNOWN';
  if (curRir !== undefined && refRir !== undefined) {
    const rirDiff = curRir - refRir;
    if (curRir === 0) {
      effortStatus = 'EFFORT_MAXIMAL';
    } else if (rirDiff <= -1.0) {
      effortStatus = 'EFFORT_INCREASED';
    } else if (rirDiff >= 1.0) {
      effortStatus = 'EFFORT_LOWER';
    } else {
      effortStatus = 'EFFORT_EQUIVALENT';
    }
  }

  // 2. Detección de Modificación de Descanso
  const restSignificantlyReduced = refRest > 0 && curRest < refRest * 0.65 && (refRest - curRest) >= 45;
  if (restSignificantlyReduced) {
    contributingFactors.push(
      `Descanso entre series significativamente menor (${curRest}s vs ${refRest}s de referencia).`
    );
    secondaryTags.push('REDUCED_REST_PRESENT');
  }

  // 3. Detección de Dolor o Molestia en el Contexto
  const hasPain = context?.localizedSymptoms?.some(s => s.nature === 'articular_pain' && s.intensity >= 3);
  if (hasPain) {
    contributingFactors.push('Presencia de dolor articular o tendinoso reportado en el contexto previo.');
    secondaryTags.push('PAIN_CONTEXT_PRESENT');
  }

  // 4. Comparación de Rendimiento Externo
  const loadHigher = curLoad > refLoad * 1.01;
  const loadLower = curLoad < refLoad * 0.99;
  const repsHigher = curReps > refReps;
  const repsLower = curReps < refReps;
  const sameWork = !loadHigher && !loadLower && !repsHigher && !repsLower;

  // CASO A: Rendimiento idéntico pero con menor RIR (mayor coste interno o fallo)
  if (sameWork && (effortStatus === 'EFFORT_INCREASED' || effortStatus === 'EFFORT_MAXIMAL')) {
    return {
      performanceStatus: 'PERFORMANCE_STABLE',
      effortStatus,
      primaryTag: 'PERFORMANCE_STABLE_WITH_HIGHER_EFFORT',
      secondaryTags,
      evidence,
      contributingFactors,
      contradictoryFactors,
    };
  }

  // CASO B: Rendimiento estable (misma carga, mismas reps, RIR y descanso equivalentes)
  if (sameWork) {
    return {
      performanceStatus: 'PERFORMANCE_STABLE',
      effortStatus: effortStatus === 'EFFORT_UNKNOWN' ? 'EFFORT_EQUIVALENT' : effortStatus,
      primaryTag: 'PERFORMANCE_STABLE',
      secondaryTags,
      evidence,
      contributingFactors,
      contradictoryFactors,
    };
  }

  // CASO C: Rendimiento mejorado (más carga con mismas/más reps a esfuerzo equivalente, o más reps a misma carga)
  if ((loadHigher && !repsLower) || (!loadLower && repsHigher)) {
    if (effortStatus === 'EFFORT_INCREASED') {
      contradictoryFactors.push(
        'El incremento en repeticiones o carga se acompañó de una proximidad mayor al fallo (RIR inferior).'
      );
      secondaryTags.push('CONFLICTING_EVIDENCE');
    }
    return {
      performanceStatus: 'PERFORMANCE_IMPROVED',
      effortStatus,
      primaryTag: 'PERFORMANCE_IMPROVED',
      secondaryTags,
      evidence,
      contributingFactors,
      contradictoryFactors,
    };
  }

  // CASO D: Menos repeticiones con descanso considerablemente menor
  if (repsLower && restSignificantlyReduced) {
    contributingFactors.push(
      'La pérdida de repeticiones se asocia con un aumento de densidad y una incompleta recuperación de sustratos energéticos.'
    );
    return {
      performanceStatus: 'PERFORMANCE_DECLINED',
      effortStatus,
      primaryTag: 'PERFORMANCE_DECLINE_WITH_REDUCED_REST',
      secondaryTags,
      evidence,
      contributingFactors,
      contradictoryFactors,
    };
  }

  // CASO E: Rendimiento descendido acompañado de dolor
  if ((repsLower || loadLower) && hasPain) {
    return {
      performanceStatus: 'PERFORMANCE_DECLINED',
      effortStatus,
      primaryTag: 'PAIN_CONTEXT_PRESENT',
      secondaryTags,
      evidence,
      contributingFactors,
      contradictoryFactors,
    };
  }

  // CASO F: Caída de rendimiento general
  if (repsLower || loadLower) {
    return {
      performanceStatus: 'PERFORMANCE_DECLINED',
      effortStatus,
      primaryTag: 'PERFORMANCE_DECLINED',
      secondaryTags,
      evidence,
      contributingFactors,
      contradictoryFactors,
    };
  }

  return {
    performanceStatus: 'PERFORMANCE_MIXED',
    effortStatus,
    primaryTag: 'PERFORMANCE_MIXED',
    secondaryTags,
    evidence,
    contributingFactors,
    contradictoryFactors,
  };
}

// ============================================================================
// 4. INTERPRETACIÓN LONGITUDINAL, ANOMALÍAS Y ESTANCAMIENTO (LAYERS 10, 11 Y 12)
// ============================================================================

export interface LongitudinalInterpretation {
  trendTag: InterpretationTag;
  evidence: string[];
  isAnomaly: boolean;
}

/**
 * Analiza la trayectoria longitudinal a partir del historial móvil y la línea base.
 */
export function interpretLongitudinalTrend(
  current: ObservedExerciseExecution,
  historySet: HistoryReferenceSet,
  block?: TrainingBlockContext
): LongitudinalInterpretation {
  const rolling = historySet.rollingHistory || [];
  const evidence: string[] = [];

  if (rolling.length < 2) {
    return {
      trendTag: 'PERFORMANCE_STABLE',
      evidence: ['Historial insuficiente para calcular tendencias longitudinales (<2 sesiones).'],
      isAnomaly: false,
    };
  }

  const curReps = calculateAverageReps(current.sets);
  const curLoad = calculateAverageLoad(current.sets);

  // 1. Detección de Anomalía Aislada (Ej. 10, 10, 7, 10 o [10, 10, 10] actual: 7)
  const previousReps = rolling.map(h => calculateAverageReps(h.sets));
  const previousLoads = rolling.map(h => calculateAverageLoad(h.sets));
  
  const allPreviousLoadsStable = previousLoads.every(l => Math.abs(l - previousLoads[0]) <= 2);
  const allPreviousRepsStable = previousReps.every(r => Math.abs(r - previousReps[0]) <= 1);
  const baselineStableReps = previousReps[0];

  if (allPreviousLoadsStable && allPreviousRepsStable && (baselineStableReps - curReps) >= 2) {
    evidence.push(
      `Historial móvil previo estable en ${baselineStableReps} reps; sesión actual descendió aisladamente a ${curReps} reps.`
    );
    return {
      trendTag: 'ISOLATED_PERFORMANCE_ANOMALY',
      evidence,
      isAnomaly: true,
    };
  }

  // 2. Detección de Candidato a Estancamiento (Plateau Candidate)
  // Requiere al menos 3 sesiones consecutivas comparables sin progreso de carga ni repeticiones
  if (rolling.length >= 3) {
    const lastThreeExecutions = [current, ...rolling.slice(0, 2)];
    const loads = lastThreeExecutions.map(e => calculateAverageLoad(e.sets));
    const reps = lastThreeExecutions.map(e => calculateAverageReps(e.sets));
    const rirs = lastThreeExecutions.map(e => calculateAverageRir(e.sets));

    const loadSpread = Math.max(...loads) - Math.min(...loads);
    const repSpread = Math.max(...reps) - Math.min(...reps);

    if (loadSpread <= 1.0 && repSpread <= 1.0) {
      evidence.push(
        `3 sesiones consecutivas en el mismo bloque con carga idéntica (spread ${loadSpread}kg) y repeticiones estables (spread ${repSpread} reps).`
      );
      return {
        trendTag: 'PLATEAU_CANDIDATE',
        evidence,
        isAnomaly: false,
      };
    }
  }

  // 3. Detección de Progresión Sostenida
  const baseline = historySet.baselineExecution;
  if (baseline) {
    const baseLoad = calculateAverageLoad(baseline.sets);
    const baseReps = calculateAverageReps(baseline.sets);

    if (curLoad > baseLoad || (curLoad === baseLoad && curReps > baseReps)) {
      evidence.push(
        `Rendimiento actual (${curLoad}kg × ${curReps} reps) supera la línea base del bloque (${baseLoad}kg × ${baseReps} reps).`
      );
      return {
        trendTag: 'PROGRESSION_OBSERVED',
        evidence,
        isAnomaly: false,
      };
    }
  }

  return {
    trendTag: 'PERFORMANCE_STABLE',
    evidence: ['El rendimiento oscila dentro de las bandas normales del bloque activo.'],
    isAnomaly: false,
  };
}

// ============================================================================
// 5. ORQUESTADOR PRINCIPAL DE INTERPRETACIÓN DETERMINISTA (LAYER 19)
// ============================================================================

/**
 * Función central de interpretación determinista que genera el InterpretationResult.
 */
export function interpretExecution(
  currentExecution: ObservedExerciseExecution,
  historySet?: HistoryReferenceSet,
  currentBlock?: TrainingBlockContext,
  sessionContext?: SessionContext
): InterpretationResult {
  const missingData: string[] = [];
  const evidence: string[] = [];
  const references: string[] = [];
  const contributingFactors: string[] = [];
  const contradictoryFactors: string[] = [];
  const secondaryTags: InterpretationTag[] = [];

  // Paso 1: Completitud de Datos
  const completeness = evaluateDataCompleteness(currentExecution, sessionContext);
  missingData.push(...completeness.missingFields);

  // Si los datos son insuficientes, retornar interpretación degradada inmediata
  if (completeness.status === 'DATA_INSUFFICIENT') {
    return {
      category: 'PERFORMANCE',
      primaryStatus: 'NON_COMPARABLE',
      performanceStatus: 'PERFORMANCE_UNEVALUATED',
      effortStatus: 'EFFORT_UNKNOWN',
      secondaryTags: [],
      evidence: completeness.reasons,
      references: [],
      contributingFactors: [],
      contradictoryFactors: [],
      missingData,
      confidence: 'LOW',
      dataCompleteness: 'DATA_INSUFFICIENT',
      decision: 'NOT_IMPLEMENTED_IN_8B',
    };
  }

  // Paso 2: Selección de Referencia
  const reference = historySet?.previousSessionExecution || historySet?.baselineExecution;
  if (!reference) {
    return {
      category: 'PERFORMANCE',
      primaryStatus: 'PERFORMANCE_STABLE',
      performanceStatus: 'PERFORMANCE_UNEVALUATED',
      effortStatus: 'EFFORT_UNKNOWN',
      secondaryTags: ['TECHNICAL_EXECUTION_STABLE'],
      evidence: ['No existe sesión previa comparable ni línea base; ejecución catalogada como primer punto de anclaje.'],
      references: ['Nueva Línea Base'],
      contributingFactors: [],
      contradictoryFactors: [],
      missingData,
      confidence: completeness.status === 'DATA_SUFFICIENT' ? 'HIGH' : 'MEDIUM',
      dataCompleteness: completeness.status,
      decision: 'NOT_IMPLEMENTED_IN_8B',
    };
  }

  references.push(
    `Sesión de referencia: ${reference.timestamp} (id: ${reference.id})`
  );

  // Paso 3: Comparabilidad
  const refBlock = historySet?.blockHistory?.[0] ? currentBlock : undefined;
  const compEval = evaluateComparability(currentExecution, reference, currentBlock, refBlock);

  if (compEval.classification === 'NON_COMPARABLE') {
    // Si la razón es el bloque experimental cerrado:
    const isClosedExp = compEval.invalidationReasons.some(r => r.includes('experimental cerrado'));
    const primaryStatus = isClosedExp ? 'NO_DIRECT_PRESCRIPTION_REFERENCE' : 'NON_COMPARABLE';

    return {
      category: 'PERFORMANCE',
      primaryStatus,
      performanceStatus: 'PERFORMANCE_UNEVALUATED',
      effortStatus: 'EFFORT_UNKNOWN',
      secondaryTags: [primaryStatus],
      evidence: compEval.invalidationReasons,
      references,
      contributingFactors: [],
      contradictoryFactors: [],
      missingData,
      confidence: 'HIGH', // Alta confianza en que NO son comparables
      dataCompleteness: completeness.status,
      decision: 'NOT_IMPLEMENTED_IN_8B',
    };
  }

  // Paso 4: Interpretación de Rendimiento y Esfuerzo
  const perfEffort = interpretPerformanceAndEffort(currentExecution, reference, compEval, sessionContext);
  evidence.push(...perfEffort.evidence);
  contributingFactors.push(...perfEffort.contributingFactors);
  contradictoryFactors.push(...perfEffort.contradictoryFactors);
  secondaryTags.push(...perfEffort.secondaryTags);

  // Paso 5: Interpretación Longitudinal (Tendencia y Anomalías)
  let finalPrimaryStatus = perfEffort.primaryTag;
  if (historySet && historySet.rollingHistory?.length >= 2) {
    const longEval = interpretLongitudinalTrend(currentExecution, historySet, currentBlock);
    evidence.push(...longEval.evidence);

    if (longEval.isAnomaly) {
      finalPrimaryStatus = 'ISOLATED_PERFORMANCE_ANOMALY';
      secondaryTags.push(perfEffort.primaryTag);
    } else if (longEval.trendTag === 'PLATEAU_CANDIDATE') {
      finalPrimaryStatus = 'PLATEAU_CANDIDATE';
      secondaryTags.push(perfEffort.primaryTag);
    } else if (longEval.trendTag === 'PROGRESSION_OBSERVED' && perfEffort.performanceStatus === 'PERFORMANCE_IMPROVED') {
      finalPrimaryStatus = 'PROGRESSION_OBSERVED';
    }
  }

  // Paso 6: Ponderación de Confianza de la Interpretación
  let confidence: InterpretationConfidence = 'HIGH';
  if (completeness.status === 'DATA_PARTIAL' || compEval.classification === 'CONDITIONALLY_COMPARABLE') {
    confidence = 'MEDIUM';
  }
  if (contradictoryFactors.length > 0 || currentExecution.executionReliability?.confidence === 'UNCERTAIN') {
    confidence = 'LOW';
  }

  return {
    category: 'INTEGRATED',
    primaryStatus: finalPrimaryStatus,
    performanceStatus: perfEffort.performanceStatus,
    effortStatus: perfEffort.effortStatus,
    secondaryTags,
    evidence,
    references,
    contributingFactors,
    contradictoryFactors,
    missingData,
    confidence,
    dataCompleteness: completeness.status,
    decision: 'NOT_IMPLEMENTED_IN_8B',
  };
}

// ============================================================================
// 6. UTILIDADES MATEMÁTICAS INTERNAS PURAS
// ============================================================================

function calculateAverageLoad(sets: ObservedSet[]): number {
  if (!sets || sets.length === 0) return 0;
  const sum = sets.reduce((acc, s) => acc + (s.loadKg || 0), 0);
  return Math.round((sum / sets.length) * 10) / 10;
}

function calculateAverageReps(sets: ObservedSet[]): number {
  if (!sets || sets.length === 0) return 0;
  const sum = sets.reduce((acc, s) => acc + (s.reps || 0), 0);
  return Math.round((sum / sets.length) * 10) / 10;
}

function calculateAverageRir(sets: ObservedSet[]): number | undefined {
  if (!sets || sets.length === 0) return undefined;
  const validRirSets = sets.filter(s => s.rir !== undefined);
  if (validRirSets.length === 0) return undefined;
  const sum = validRirSets.reduce((acc, s) => acc + (s.rir as number), 0);
  return Math.round((sum / validRirSets.length) * 10) / 10;
}

function calculateAverageRest(sets: ObservedSet[]): number {
  if (!sets || sets.length === 0) return 0;
  const validRestSets = sets.filter(s => s.restSecondsAfter !== undefined);
  if (validRestSets.length === 0) return 0;
  const sum = validRestSets.reduce((acc, s) => acc + (s.restSecondsAfter as number), 0);
  return Math.round(sum / validRestSets.length);
}
