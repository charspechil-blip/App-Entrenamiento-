/**
 * ETAPA 8A — MODELO DE DATOS DEL MOTOR DETERMINISTA DE ENTRENO
 * =============================================================
 * 
 * Contrato formal de tipos de datos para la capa de observación, contexto,
 * confiabilidad, comparabilidad y métricas derivadas del Motor Determinista.
 * 
 * REGLA FUNDAMENTAL DE 8A:
 * - NO implementa decisiones automáticas ni algoritmos de prescripción.
 * - Define rigurosamente: QUÉ datos existen, QUÉ significan, CÓMO se relacionan
 *   y QUÉ nivel de confiabilidad poseen.
 * - Conserva la separación canónica:
 *     1. Catálogo Oficial (src/data/ejercicios.json, src/data/muscles.json)
 *     2. Registro / Observación (Ejecución real y contexto)
 *     3. Interpretación / Motor (Cálculo determinista de estímulo)
 */

import type { ExerciseId, ExerciseName } from '../types';

// ============================================================================
// 1. NIVELES DE DATOS (DATA ARCHITECTURE LAYERS)
// ============================================================================

export type DataLevelCategory =
  | 'LEVEL_A_IDENTITY'          // Ejercicio, sesión, bloque, usuario
  | 'LEVEL_B_DIRECT_OBSERVATION'// Peso, reps, series, RIR, descanso, BPM, tiempo
  | 'LEVEL_C_CONTEXT'           // DOMS, dolor, sueño, fatiga, estrés, disponibilidad
  | 'LEVEL_D_DERIVED_VARIABLES' // Volumen, densidad, distribución muscular, tonelaje
  | 'LEVEL_E_INTERPRETATION'    // Progresión observada, estabilidad, signos de fatiga
  | 'LEVEL_F_DECISION';         // Capa futura de prescripción (NO IMPLEMENTAR EN 8A)

// ============================================================================
// 2. CALIDAD DEL DATO Y CONFIABILIDAD DE MEDICIÓN (DATA RELIABILITY)
// ============================================================================

/**
 * Nivel de confiabilidad y precisión de una observación registrada.
 * Permite al futuro motor ponderar la evidencia acumulada sin recurrir a scores negros.
 */
export type MeasurementConfidence =
  | 'CONFIRMED'   // Alta confiabilidad: registrado directamente con verificación (peso real + reps + RIR reportado inmediato)
  | 'ACCEPTABLE'  // Confiabilidad estándar: registro regular sin anomalías, resolución inequívoca de identidad
  | 'UNCERTAIN'   // Confiabilidad baja / incierta: datos reconstruidos, mapeo ambiguo, bodyweight estimado o RIR ausente
  | 'ABSENT';     // Dato ausente / no registrado: la variable no fue capturada

export interface ReliabilityMetadata {
  confidence: MeasurementConfidence;
  source: 'direct_input' | 'sensor_verified' | 'legacy_reconstructed' | 'inferred';
  identityConfidence: MeasurementConfidence; // Certeza sobre el ExerciseId asignado
  notes?: string;
}

// ============================================================================
// 3. ESTRUCTURA DEL SET (SET STRUCTURE AS A FORMAL VARIABLE)
// ============================================================================

/**
 * La estructura del set es una variable biomecánica y fisiológica formal,
 * no una etiqueta cosmética de interfaz.
 */
export type SetStructureType =
  | 'CONVENTIONAL'  // Serie tradicional continua con descanso inter-serie completo
  | 'CLUSTER'       // Microseries intra-set separadas por pausas breves (ej. 4x(2+2+2) con 15s intra-rest)
  | 'MICROSERIES'   // Rest-pause / Myo-reps: serie de activación seguida de micro-descansos y mini-sets
  | 'DROP_SET'      // Serie descendente: reducción inmediata de carga sin descanso
  | 'HYBRID_COMBO'; // Combinación estructurada de técnicas de densidad mecánica

export interface ClusterSubSet {
  microReps: number;
  intraRestSeconds?: number;
  loadKg?: number;
  rpeOrRir?: number;
}

export interface SetStructureDetails {
  type: SetStructureType;
  intraSetPauseSeconds?: number;     // Pausa intra-set en clusters
  microSets?: ClusterSubSet[];       // Detalle de microseries si aplica
  dropCount?: number;                // Número de reducciones de carga en drop-sets
  loadDropPercentage?: number;       // Porcentaje de reducción de carga en drop-sets
}

// ============================================================================
// 4. MODELO DE OBSERVACIÓN (EXERCISE EXECUTION OBSERVATION)
// ============================================================================

/**
 * Observación directa e individual de una serie ejecutada.
 */
export interface ObservedSet {
  setIndex: number;                  // 1-indexed
  structure: SetStructureDetails;    // Estructura formal del set
  loadKg: number;                    // Carga externa en kilogramos (0 para peso corporal estricto)
  reps: number;                      // Repeticiones completadas con rango válido
  timeSeconds?: number;              // Tiempo bajo tensión o duración isométrica (segundos)
  rir?: number;                      // Repeticiones en reserva (Repetitions In Reserve: 0 = fallo técnico)
  rpe?: number;                      // Rating of Perceived Exertion (Borg CR10 modificado: 6.0 a 10.0)
  targetReps?: number;               // Repeticiones programadas o proyectadas para esta serie
  targetLoadKg?: number;             // Carga programada o proyectada
  restSecondsAfter?: number;         // Tiempo de descanso real tras concluir la serie
  avgHeartRateBpm?: number;          // Frecuencia cardíaca media durante la serie
  peakHeartRateBpm?: number;         // Frecuencia cardíaca pico
  reliability: ReliabilityMetadata;  // Calidad del dato de la serie
}

/**
 * Registro completo de la ejecución de un ejercicio en una sesión específica.
 */
export interface ObservedExerciseExecution {
  // Nivel A — Identidad
  id: string;                        // UUID único de la observación
  exerciseId: ExerciseId;            // Identidad canónica universal (SSOT)
  exerciseNameSnapshot: ExerciseName;// Representación visible en el momento de la ejecución
  sessionId: string;                 // Sesión a la que pertenece
  timestamp: string;                 // Fecha y hora ISO 8601
  routineId?: string;                // Rutina de origen
  routineName?: string;
  orderInSession: number;            // Posición de ejecución dentro de la sesión (1-indexed: 1 = primer ejercicio)
  
  // Nivel B — Observación directa de series
  sets: ObservedSet[];
  interExerciseRestSeconds?: number; // Descanso previo antes de iniciar este ejercicio
  sessionElapsedTimeSeconds?: number;// Momento de la sesión en el que se inició el ejercicio

  // Nivel C — Contexto específico del ejercicio
  localizedPainScore?: number;       // Molestia articular o muscular específica (0 = ninguna, 10 = limitante)
  perceivedTechnicalQuality?: 1 | 2 | 3 | 4 | 5; // Calidad técnica subjetiva percibida
  notes?: string;

  // Calidad y procedencia
  executionReliability: ReliabilityMetadata;
}

// ============================================================================
// 5. READINESS Y CONTEXTO PREVIO (PRE-SESSION CONTEXT)
// ============================================================================

export interface LocalizedSymptom {
  muscleId?: string;                 // Token anatómico de muscles.json o región articular
  bodyZone: 'superior' | 'inferior' | 'core' | 'cuerpo_completo';
  intensity: number;                 // Escala 0 a 10
  nature: 'doms' | 'articular_pain' | 'stiffness' | 'cramp' | 'fatigue';
}

/**
 * Contexto multifactorial antes y durante la sesión de entrenamiento.
 * NO se reduce a un score negro de readiness; mantiene cada variable independiente.
 */
export interface SessionContext {
  sessionId: string;
  timestamp: string;

  // Sueño
  sleepHours?: number;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;  // 1 = pésimo, 5 = reparador excelente

  // Fatiga y estrés subjetivo
  generalFatigueLevel?: 1 | 2 | 3 | 4 | 5; // 1 = fresco, 5 = exhausto
  mentalStressLevel?: 1 | 2 | 3 | 4 | 5;   // 1 = muy relajado, 5 = estrés severo
  nutritionalStatus?: 'optimal' | 'adequate' | 'fasted' | 'deficient';

  // Síntomas localizados
  localizedSymptoms: LocalizedSymptom[];

  // Disponibilidad y entorno
  availableTimeMinutes?: number;
  timePressure?: boolean;
  equipmentConstraintsNote?: string;

  // Confiabilidad del contexto
  contextReliability: ReliabilityMetadata;
}

// ============================================================================
// 6. TAXONOMÍA FORMAL DE FATIGA
// ============================================================================

/**
 * Clasificación tripartita de fatiga en el modelo conceptual.
 * No computa puntuaciones en 8A; categoriza las dimensiones de manifestación.
 */
export type FatigueDimension =
  | 'LOCAL_FATIGUE'      // Fatiga periférica neuromuscular en el músculo motor primario
  | 'SYSTEMIC_FATIGUE'   // Fatiga central / neuroendocrina / cardiovascular global
  | 'ACCUMULATED_FATIGUE';// Fatiga residual acumulada a lo largo de días o microciclos

export interface FatigueObservationManifestation {
  dimension: FatigueDimension;
  indicators: {
    rirDropAgainstExpectation?: boolean;      // Caída abrupta de RIR respecto al histórico
    velocityLossObserved?: boolean;           // Pérdida evidente de velocidad intra-serie
    unusuallyHighHeartRateRecoveryLatency?: boolean; // El pulso tarda sensiblemente más en descender
    lingeringDomsPost48h?: boolean;           // Agujetas residuales más allá de la ventana habitual
    perceivedExertionMismatch?: boolean;      // RPE 9 con cargas habitualmente submáximas
  };
  anatomicalFocus?: string[];                 // Tokens musculares si la dimensión es LOCAL
}

// ============================================================================
// 7. BLOQUES DE ENTRENAMIENTO Y PERIODIZACIÓN
// ============================================================================

export type TrainingBlockObjective =
  | 'FUERZA'                // Intensidad alta (% 1RM), volumen moderado-bajo, pausas completas
  | 'HIPERTROFIA'           // Volumen moderado-alto, tensión mecánica acumulada, RIR 0-3
  | 'POTENCIA'              // Velocidad máxima de ejecución, fatiga mínima intra-serie
  | 'RESISTENCIA_MUSCULAR'  // Densidad alta, repeticiones altas, pausas cortas
  | 'AEROBICO'              // Adaptaciones cardiovasculares y mitocondriales
  | 'CAPACIDAD_TRABAJO'     // Preparación física general (GPP), tolerancia a la densidad
  | 'RECUPERACION'          // Descarga activa, reducción sistemática de fatiga acumulada
  | 'HIBRIDO_EXPERIMENTAL'; // Bloque histórico experimental cerrado (NO extrapolable a fuerza)

export interface TrainingBlockContext {
  blockId: string;
  name: string;
  objective: TrainingBlockObjective;
  startDate: string;
  endDate?: string;
  isClosed: boolean;                        // Si está cerrado, es solo histórico
  allowPrescriptionInheritance: boolean;    // Los bloques experimentales cerrados tienen este flag en false
  targetRepRange?: { min: number; max: number };
  targetRirRange?: { min: number; max: number };
}

// ============================================================================
// 8. HISTORIAL, LÍNEA BASE Y COMPARABILIDAD
// ============================================================================

/**
 * Criterios estrictos para determinar si dos ejecuciones son fisiológicamente comparables.
 */
export interface ComparabilityCriteria {
  sameExerciseId: boolean;                  // Mismo ExerciseId canónico estricto
  sameBiomechanicalVariant: boolean;        // Misma variante de agarre, apoyo o implemento
  sameSetStructure: boolean;                // Misma estructura (convencional vs cluster vs drop)
  loadTolerancePercentage: number;          // Margen de carga para considerar el mismo reino de intensidad (ej. ±10%)
  repToleranceDelta: number;                // Margen de repeticiones (ej. ±2 reps)
  restIntervalEquivalence: boolean;         // Descansos comparables (no comparar 60s con 240s)
  sameTrainingBlockObjective: boolean;      // Mismo objetivo de bloque (no comparar híbrido con fuerza pura)
  similarOrderInSession: boolean;           // Primer ejercicio no es comparable con 6to ejercicio post-fatiga
}

export type ComparabilityClassification =
  | 'STRICTLY_COMPARABLE'   // Comparabilidad directa y válida para análisis de progresión
  | 'CONDITIONALLY_COMPARABLE' // Comparables con factores de corrección (ej. ligera variación de descanso)
  | 'NON_COMPARABLE';       // No comparables para inferencia directa de rendimiento

/**
 * Referencias históricas contextuales para el motor determinista.
 */
export interface HistoryReferenceSet {
  baselineExecution?: ObservedExerciseExecution;     // Primera ejecución estable dentro del bloque actual
  previousSessionExecution?: ObservedExerciseExecution; // Inmediata anterior válida
  rollingHistory: ObservedExerciseExecution[];       // Ventana móvil de las últimas 3-5 ejecuciones comparables
  blockHistory: ObservedExerciseExecution[];         // Registro completo dentro del bloque activo
  historicalExperimentalArchive: ObservedExerciseExecution[]; // Bloques cerrados pasados (solo lectura / contexto)
}

// ============================================================================
// 9. FORMALIZACIÓN DEL VOLUMEN (VOLUME CONTRACT)
// ============================================================================

export interface MuscleVolumeFraction {
  muscleToken: string;              // Token canónico de muscles.json
  role: 'motor_primario' | 'sinergista' | 'estabilizador';
  allocationFactor: number;         // 1.0 para motor primario, 0.5 para sinergista, 0.0 para estabilizador
  effectiveSets: number;            // Series que computan para este músculo
}

/**
 * Representación formal del volumen en sus diferentes escalas de agregación.
 */
export interface VolumeBreakdown {
  // Volumen por serie (calculado en cada serie)
  setTonnageKg: number;             // carga * repeticiones
  setEffectiveReps: number;         // repeticiones con RIR <= 4 (estímulo hipertrófico / de fuerza)
  
  // Volumen por ejercicio
  exerciseTotalTonnageKg: number;
  exerciseTotalReps: number;
  exerciseTotalWorkSets: number;    // Series de trabajo efectivas (excluye aproximaciones)

  // Distribución muscular derivada
  muscleDistribution: MuscleVolumeFraction[];
}

// ============================================================================
// 10. ESTADO INTEGRADO DE OBSERVACIÓN PARA EL MOTOR DETERMINISTA
// ============================================================================

/**
 * Contrato de datos completo que recibe la capa de interpretación del Motor Determinista.
 * Representa la agregación pura de hechos y contexto sin saltos prematuros a prescripción.
 */
export interface DeterministicEngineInputContract {
  identity: {
    userId: string;
    sessionId: string;
    timestamp: string;
  };
  block: TrainingBlockContext;
  sessionContext: SessionContext;
  exerciseExecutions: ObservedExerciseExecution[];
  historyReferences: Record<ExerciseId, HistoryReferenceSet>;
}
