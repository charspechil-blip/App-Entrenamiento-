# ETAPA 8A — MODELO DE DATOS DEL MOTOR DETERMINISTA DE ENTRENO
**Definición Formal de Entidades, Variables, Niveles de Datos, Confiabilidad y Contrato Arquitectónico**  
*Aplicación Entreno — Sistema de Entrenamiento Personal*

---

## 1. OBJETIVO DE LA ETAPA 8A

La **Etapa 8A** establece la base arquitectónica y el modelo de datos conceptual del futuro **Motor Determinista de Entrenamiento** de la aplicación Entreno.

### 1.1 Qué ES la Etapa 8A
- Es la **definición del contrato de datos**: especifica rigurosamente qué información existe en el sistema, qué significa biomecánica y fisiológicamente cada variable, cómo se interrelacionan las entidades y qué grado de confiabilidad posee cada observación.
- Es la **formalización de las estructuras de observación**: transforma lo que antes eran campos planos o etiquetas visuales en variables de entrenamiento científicamente estructuradas (ej. series convencionales vs. clusters vs. drop-sets).
- Es el **marco de comparabilidad**: delimita con precisión cuándo dos sesiones o series pueden compararse legítimamente y cuándo dicha comparación carece de validez metodológica.

### 1.2 Qué NO ES la Etapa 8A (Restricciones Taxativas)
- **NO implementa algoritmos de decisión ni prescripción:** No decide si el usuario debe subir o bajar peso, aumentar repeticiones o cambiar de ejercicio.
- **NO crea scores negros:** No genera un "readiness score" opaco de 0 a 100 ni un "fatigue index" ficticio que oculte las variables reales observadas.
- **NO implementa IA generativa ni heurísticas predictivas:** El motor se fundamenta en reglas deterministas y relaciones causales basadas en evidencia acumulada.
- **NO altera el Catálogo Oficial (SSOT):** No modifica los 109 ejercicios oficiales de `src/data/ejercicios.json` ni las 84 entidades anatómicas de `src/data/muscles.json`.
- **NO rompe la compatibilidad histórica:** Respeta la coexistencia de `exerciseId` (identidad canónica) y `exerciseName` (representación visible y registros históricos).

---

## 2. PRINCIPIOS FUNDAMENTALES DEL MOTOR DETERMINISTA

### 2.1 El Ciclo Fisiológico Determinista
El motor se rige por un bucle continuo de retroalimentación empírica:

$$\text{OBSERVE} \longrightarrow \text{INTERPRET} \longrightarrow \text{DECIDE} \longrightarrow \text{ACT} \longrightarrow \text{MEASURE} \longrightarrow \text{LEARN}$$

1. **OBSERVE (Observar):** Captura métricas objetivas de ejecución (carga, repeticiones, tiempo, descansos, frecuencia cardíaca) y el contexto previo (sueño, DOMS, molestias, estrés).
2. **INTERPRET (Interpretar):** Analiza la respuesta observada a la luz de la línea base, la estructura del set, el bloque activo y la fatiga acumulada.
3. **DECIDE (Decidir — *Capa Futura 8B/8C*):** Emite prescripciones algorítmicas claras cuando la evidencia acumulada alcanza el umbral de certeza requerido.
4. **ACT (Actuar):** El usuario ejecuta la sesión guiada con las variables prescritas.
5. **MEASURE (Medir):** Se registran las discrepancias entre lo prescrito y lo ejecutado.
6. **LEARN (Aprender/Ajustar):** El sistema recalibra la tasa de adaptación individual del atleta sin alterar las leyes biomecánicas universales.

### 2.2 Evidencia Acumulada frente a Variables Aisladas
Una sesión anómala (positiva o negativa) es un punto de datos, no una tendencia. El motor determinista prohíbe terminantemente tomar decisiones prescriptivas agresivas basadas en una única serie o variable aislada. Se requiere una ventana mínima de observaciones comparables (*Rolling History*) para validar una trayectoria adaptativa.

---

## 3. SEPARACIÓN DE LAS TRES CAPAS DEL SISTEMA

Para garantizar la integridad arquitectónica, el sistema distingue con total claridad tres capas independientes que jamás deben solaparse:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CATÁLOGO OFICIAL (SSOT Semántico)                        │
│    Archivo: "src/data/ejercicios.json"                      │
│    ¿Qué ES el ejercicio? (Anatomía, biomecánica, variantes)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Describe propiedades estáticas
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. REGISTRO / OBSERVACIÓN (Hechos Fácticos de Sesión)       │
│    Entidad: ObservedExerciseExecution                       │
│    ¿Qué OCURRIÓ en la sesión? (Cargas, reps, RIR, contexto) │
└──────────────────────────────┬──────────────────────────────┘
                               │ Aporta datos empíricos
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. INTERPRETACIÓN / MOTOR (Cálculo Fisiológico)              │
│    Entidad: DeterministicEngineInputContract                │
│    ¿Qué ESTÍMULO produjo esa ejecución en ese contexto?     │
└─────────────────────────────────────────────────────────────┘
```

1. **El Catálogo describe QUÉ ES el ejercicio:** Es universal, atemporal y canónico. Define que la *Sentadilla con barra* (`sentadilla`) es un movimiento multiarticular de tren inferior, con cadena cinética cerrada, plano sagital, motor primario en cuádriceps y glúteo mayor, y estabilizadores espinales.
2. **El Registro describe QUÉ OCURRIÓ durante la ejecución:** Es un hecho histórico inmutable. Registra que el atleta realizó 4 series de 8 repeticiones con 100 kg con RIR 2, descanso de 150 segundos y 7 horas de sueño previo.
3. **El Motor calcula QUÉ ESTÍMULO se produjo:** Es la capa de inferencia determinista. Analiza si esos 100 kg con RIR 2 en la semana 3 del bloque de hipertrofia representan sobrecarga progresiva efectiva o acumulación de fatiga central respecto a la línea base del bloque.

---

## 4. NIVELES DE DATOS (DATA ARCHITECTURE LAYERS)

El modelo de datos se organiza jerárquicamente en seis niveles estandarizados:

| Nivel | Categoría | Descripción | Ejemplos de Variables |
| :--- | :--- | :--- | :--- |
| **Nivel A** | **Identidad** | Coordenadas unívocas del registro en el espacio y tiempo del sistema. | `exerciseId`, `sessionId`, `blockId`, `userId`, timestamp ISO 8601. |
| **Nivel B** | **Observación Directa** | Hechos fácticos medidos directamente durante la ejecución física de la serie. | Carga externa (kg), repeticiones completadas, tiempo bajo tensión (s), RIR reportado, descanso (s), BPM. |
| **Nivel C** | **Contexto** | Variables fisiológicas, psicológicas y ambientales que modulan la capacidad de rendimiento. | Horas de sueño, calidad de sueño, DOMS por grupo muscular, dolor/molestia articular (0-10), estrés mental, tiempo disponible. |
| **Nivel D** | **Variables Derivadas** | Agregaciones matemáticas deterministas calculadas a partir de Nivel B y Nivel A. | Tonelaje por serie (carga × reps), repeticiones efectivas (RIR ≤ 4), volumen por grupo muscular (fraccionado), densidad (tonelaje/minuto). |
| **Nivel E** | **Interpretación** | Juicios analíticos sobre la dirección y estabilidad del rendimiento respecto a referencias. | Desviación respecto a línea base, tasa de pérdida de velocidad intra-serie, signo de fatiga periférica vs. sistémica, estabilidad técnica. |
| **Nivel F** | **Decisión (Futura)** | Capa de prescripción y ajuste normativo. **(NO implementada en 8A)**. | Prescripción de carga próxima sesión, incremento de microciclo, descarga programada, sustitución biomecánica. |

---

## 5. MODELO DE OBSERVACIÓN Y ESTRUCTURA DEL SET

### 5.1 La Estructura del Set como Variable Formal
En la ciencia del entrenamiento de fuerza, la fatiga metabólica, el reclutamiento de unidades motoras y el daño muscular varían radicalmente según la distribución temporal de las repeticiones. Por ello, la **Estructura del Set (`SetStructureType`)** deja de ser una etiqueta cosmética y pasa a ser una variable formal del modelo:

1. **`CONVENTIONAL` (Serie Tradicional):** Repeticiones continuas con cadencia controlada seguidas de un descanso completo inter-serie (ej. 8 reps con 180s de descanso).
2. **`CLUSTER` (Series Clúster):** Descomposición de la serie en microseries separadas por pausas intra-serie breves (ej. 3 microseries de 2 repeticiones con 20s intra-rest). Permite mantener una velocidad de barra más alta y reducir el lactato sanguíneo con cargas altas.
3. **`MICROSERIES` (Rest-Pause / Myo-reps):** Serie de activación cercana al fallo técnico seguida de pausas breves de 10-15s y mini-series de 2-3 repeticiones manteniendo un reclutamiento motor completo.
4. **`DROP_SET` (Series Descendentes):** Ejecución hasta o cerca del fallo, reducción inmediata de la carga (15-25%) sin pausa y continuación del esfuerzo para maximizar el estrés metabólico.
5. **`HYBRID_COMBO`:** Combinación explícitamente parametrizada de técnicas mecánicas y de densidad.

### 5.2 Entidad `ObservedSet`
Cada serie ejecutada registra:
```typescript
interface ObservedSet {
  setIndex: number;                  // Índice ordenado (1, 2, 3...)
  structure: SetStructureDetails;    // Tipo formal, pausas intra-set, % drop
  loadKg: number;                    // Carga externa (kg)
  reps: number;                      // Repeticiones válidas completadas
  timeSeconds?: number;              // Tiempo bajo tensión (s)
  rir?: number;                      // Repeticiones en reserva (0 = fallo técnico)
  rpe?: number;                      // RPE Borg CR10 modificado (6.0 - 10.0)
  targetReps?: number;               // Objetivo planificado
  targetLoadKg?: number;             // Carga planificada
  restSecondsAfter?: number;         // Tiempo real de descanso posterior
  avgHeartRateBpm?: number;          // FC media
  peakHeartRateBpm?: number;         // FC máxima en la serie
  reliability: ReliabilityMetadata;  // Nivel de confianza del dato
}
```

---

## 6. FORMALIZACIÓN DEL VOLUMEN DE ENTRENAMIENTO

El modelo formaliza el volumen en múltiples niveles de resolución, desterrando dos asunciones simplistas:
- *"Más volumen = mejor resultado"* (falacia: ignora la curva de rendimiento invertida de volumen máximo recuperable).
- *"Menos volumen = fatiga acumulada"* (falacia: puede deberse a restricción deliberada de tiempo o cambio de bloque a potencia).

### 6.1 Niveles de Agregación del Volumen
1. **Volumen por Serie:**
   - **Tonelaje:** $\text{Carga (kg)} \times \text{Repeticiones}$.
   - **Repeticiones Efectivas:** Repeticiones realizadas en la proximidad del fallo mecánico ($\text{RIR} \leq 4$).
2. **Volumen por Ejercicio:**
   - Sumatorio de series de trabajo efectivas (*work sets*), excluyendo series de aproximación o calentamiento.
   - Tonelaje total acumulado en el ejercicio.
3. **Volumen por Sesión:**
   - Cómputo global de series de trabajo y tonelaje total levantado en la sesión.
4. **Volumen por Grupo Muscular (Distribución Fraccionada Oficial):**
   Para no inflar artificialmente el volumen de músculos sinergistas o estabilizadores, el motor utiliza la clasificación taxonómica oficial derivada de `src/data/ejercicios.json` y `src/data/muscles.json`:
   - **Músculo Motor Primario (`musculos_principales`):** Imputación de **1.0 serie efectiva**.
   - **Músculo Sinergista Dinámico (`musculos_secundarios`):** Imputación de **0.5 series efectivas**.
   - **Fijador / Estabilizador (`estabilizadores`):** Imputación de **0.0 series efectivas directas** (se registra como tensión isométrica estabilizadora, no como serie de hipertrofia dinámica).

*Ejemplo:* 4 series de *Press de banca plano con barra* (`press-banca-plano-barra`):
- Pectoral mayor (motor primario): 4 series ($4 \times 1.0$).
- Tríceps braquial (sinergista): 2 series ($4 \times 0.5$).
- Deltoides anterior (sinergista): 2 series ($4 \times 0.5$).
- Manguito rotador / Serrato (estabilizadores): 0 series directas.

---

## 7. CALIDAD DEL DATO Y CONFIABILIDAD DE MEDICIÓN (MEASUREMENT CONFIDENCE)

Cada observación en el sistema lleva asociado un metadato explícito de confiabilidad (`MeasurementConfidence`). Esto permite al motor saber cuánta certeza existe sobre la medición antes de emitir interpretaciones:

| Nivel de Confiabilidad | Criterio de Asignación | Comportamiento del Motor |
| :--- | :--- | :--- |
| **`CONFIRMED`** | Entrada directa verificada: carga en barra, repeticiones completadas, RIR ingresado inmediatamente tras la serie y/o pulsómetro sincronizado. | Máximo peso en el análisis de progresión. Se utiliza para actualizar líneas base. |
| **`ACCEPTABLE`** | Registro manual habitual sin anomalías temporales ni valores atípicos; identidad canónica resuelta 1:1. | Válido para comparaciones y tendencias continuas. |
| **`UNCERTAIN`** | Carga corporal estimada sin pesaje reciente; registro reconstruido desde texto legacy o notas ambiguas; descansos no medidos o tiempos inverosímiles. | Se toma en cuenta con reserva; **no** se permite que un dato incierto dispare descargas o alertas críticas. |
| **`ABSENT`** | Variable no capturada por el usuario (ej. omitió el RIR o no usó sensor de pulso). | El motor asume ausencia de dato; **nunca** inventa un valor medio ni asume valores por defecto en cálculos críticos. |

---

## 8. READINESS Y CONTEXTO PREVIO (SIN SCORES NEGROS)

### 8.1 Rechazo de la "Caja Negra"
Tradicionalmente, diversas aplicaciones combinan sueño, estrés y dolor en un único "Readiness Score" del 1 al 100. Esta práctica oculta información crítica:
- Un atleta con 95/100 de readiness pero con **dolor patelar agudo (8/10)** no debería realizar sentadillas pesadas, a pesar de que su "score" global parezca óptimo.
- Un atleta con 6 horas de sueño (subóptimo) pero sin ninguna molestia articular y con alta motivación puede rendir con total normalidad en un bloque de fuerza submáxima.

### 8.2 Estructura Multifactorial de Contexto
El modelo conserva cada variable individualmente en la entidad `SessionContext`:
- **Parámetros de Sueño:** Horas de sueño (continuo) y calidad subjetiva (escala 1 a 5).
- **Fatiga Central / Mental:** Nivel de fatiga percibida (1 a 5) y nivel de estrés mental/cognitivo (1 a 5).
- **Síntomas Localizados (`LocalizedSymptom`):**
  - Músculo o articulación afectada (vinculada al token de `muscles.json`).
  - Naturaleza del síntoma: `doms` (agujetas), `articular_pain` (dolor articular/tendinoso), `stiffness` (rigidez), `cramp` (calambre).
  - Intensidad numérica: escala clínica de 0 a 10.
- **Disponibilidad y Tiempo:** Minutos disponibles para entrenar y presión temporal subjetiva (`timePressure`).

---

## 9. TAXONOMÍA FORMAL DE FATIGA

El modelo formaliza la fatiga diferenciando rigurosamente tres dimensiones fisiológicas que requieren interpretaciones independientes:

```
                          DIMENSIONES DE FATIGA
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
  FATIGA LOCAL               FATIGA SISTÉMICA            FATIGA ACUMULADA
(Periférica / Muscular)     (Central / Nerviosa)       (Residual / Crónica)
- Caída velocidad barra     - Aumento pulso basal       - Agujetas post 48h
- Fallo en músculo motor    - Recuperación lenta FC     - RIR decreciente semanal
- DOMS local intenso        - RPE desproporcionado      - Rendimiento decreciente
```

1. **Fatiga Local (Periférica):** Agotamiento neuromuscular concentrado en un grupo muscular específico (ej. fallo concéntrico en cuádriceps tras extensiones de piernas). Se resuelve típicamente en 48-72 horas y no compromete el entrenamiento de grupos musculares no relacionados (ej. press de banca).
2. **Fatiga Sistémica (Central / Autonómica):** Compromiso del sistema nervioso central y del sistema cardiovascular global, inducido típicamente por ejercicios con alta demanda axial y de masa muscular (peso muerto convencional, sentadillas pesadas). Compromete la capacidad global de reclutamiento de unidades motoras en cualquier ejercicio posterior de la sesión.
3. **Fatiga Acumulada (Residual / Microciclo):** Desbalance crónico entre el estímulo y la recuperación a lo largo de varios microciclos. Se manifiesta cuando el atleta rinde sistemáticamente por debajo de su línea base con RIRs decrecientes y RPEs crecientes a igualdad de carga.

---

## 10. CRITERIOS ESTRICTOS DE COMPARABILIDAD

Para que el motor pueda contrastar el rendimiento entre dos observaciones, ambas deben satisfacer criterios formales de equivalencia. Si dos registros no son comparables, cualquier inferencia de "progreso" o "regresión" es científicamente inválida.

### 10.1 Requisitos de Comparabilidad Estricta (`STRICTLY_COMPARABLE`)
1. **Identidad Canónica Idéntica:** Ambas sesiones deben compartir el mismo `exerciseId` (ej. `press-banca-plano-barra`). No basta con que ambas se llamen "Press de banca".
2. **Misma Variante Biomecánica:** Mismo ancho de agarre, posición de pies o accesorio (ej. agarre prono vs. supino no son comparables directamente).
3. **Misma Estructura de Set:** Una serie convencional de 5 reps no es directamente comparable con un clúster 2+2+2, incluso con la misma carga total.
4. **Reino de Intensidad Homogéneo:** Cargas dentro de una tolerancia fisiológica comparable (ej. ±10% de carga relativa).
5. **Rango de Repeticiones Homogéneo:** Comparar 3 reps pesadas con 15 reps metabólicas mide adaptaciones energéticas y neuromusculares distintas.
6. **Equivalencia de Intervalos de Descanso:** No es comparable una serie tras 60 segundos de pausa que una tras 240 segundos.
7. **Posición en la Sesión:** Un ejercicio realizado en primer lugar cuando el sistema neuromuscular está fresco no puede compararse sin corrección con el mismo ejercicio ejecutado en 6º lugar tras 45 minutos de fatiga acumulada.
8. **Mismo Objetivo de Bloque:** El rendimiento en un bloque de fuerza máxima tiene una lectura fisiológica distinta que en un bloque de resistencia muscular.

---

## 11. BLOQUES DE ENTRENAMIENTO Y PERIODIZACIÓN

El modelo de datos exige que cada sesión esté adscrita a un **Bloque de Entrenamiento Activo (`TrainingBlockContext`)**. El bloque define la lente de interpretación fisiológica:

| Bloque | Objetivo Principal | Rango Típico Reps | RIR Objetivo | Pausas Típicas |
| :--- | :--- | :--- | :--- | :--- |
| **`FUERZA`** | Reclutamiento neuromuscular y tensión mecánica máxima | 1 a 6 | 1 a 3 | 180s – 300s |
| **`HIPERTROFIA`** | Tensión mecánica acumulada y volumen efectivo | 6 a 15 | 0 a 3 | 90s – 180s |
| **`POTENCIA`** | Tasa de desarrollo de la fuerza (RFD), velocidad máxima | 1 a 5 | 3 a 5 | 180s – 300s |
| **`RESISTENCIA_MUSCULAR`** | Tolerancia al lactato y capacidad buffer | 15 a 30 | 0 a 2 | 30s – 60s |
| **`AEROBICO`** | Adaptaciones mitocondriales y gasto cardíaco | Continuo / Tiempo | N/A | Variable |
| **`CAPACIDAD_TRABAJO`** | Preparación física general (GPP) y densidad | 8 a 15 | 2 a 4 | 45s – 90s |
| **`RECUPERACION`** | Disipación de fatiga (descarga / deload) | 5 a 10 | 4 a 6 | 120s – 180s |
| **`HIBRIDO_EXPERIMENTAL`** | **Historial cerrado de pruebas (solo lectura)** | Mixto | Mixto | Mixto |

### 11.1 Aislamiento del Bloque Híbrido Experimental Cerrado
Queda formalmente ratificada la regla de arquitectura del proyecto:  
**Los datos de entrenamiento pertenecientes al Bloque Híbrido Experimental Cerrado NO se utilizan de forma automática para calcular líneas base ni prescribir cargas en el Bloque de Fuerza o Hipertrofia.** Permanecen archivados como contexto histórico longitudinal en `historicalExperimentalArchive`.

---

## 12. HISTORIAL Y SISTEMA DE REFERENCIAS (BASELINE & HISTORICAL TIERS)

Para evaluar una ejecución observada, el motor determinista dispondrá de cinco capas de referencia histórica:

1. **`Baseline` (Línea Base del Bloque Activo):** La primera ejecución estable y consolidada del ejercicio dentro del bloque actual. Sirve como anclaje de referencia para medir la progresión neta del ciclo.
2. **`Previous Session` (Sesión Previa Comparable):** La última ejecución directamente comparable en el tiempo. Permite evaluar la respuesta aguda inmediata.
3. **`Rolling History` (Ventana Móvil):** Conjunto ordenado de las últimas 3 a 5 sesiones comparables. Permite calcular pendientes de progresión, varianza de carga y consistencia en el RIR.
4. **`Block History` (Historial Completo del Bloque):** Todas las ejecuciones del ejercicio desde el inicio del bloque activo.
5. **`Historical Experimental Archive` (Archivo Histórico Pasado):** Registros de bloques cerrados o fases experimentales previas. Solo se consultan para visualización a largo plazo o patrones globales de adherencia, nunca para algoritmos de ajuste automático de carga.

---

## 13. REGLAS CONTRA DECISIONES PREMATURAS

Uno de los errores más graves en sistemas de entrenamiento automatizados es la reacción precipitada ante variaciones transitorias. El motor determinista incorpora una **regla de protección ontológica contra decisiones prematuras**.

### 13.1 Caso Paradigmático: "Repeticiones < Objetivo"
Si un usuario tenía como objetivo realizar 10 repeticiones con 80 kg y completa 8 repeticiones:
- **Respuesta Prematura Incorrecta:** "Completó 8 en lugar de 10 $\rightarrow$ Bajar peso a 75 kg inmediatamente".
- **Respuesta Determinista Rigurosa:** El motor debe ejecutar el protocolo de triaje multifactorial antes de considerar cualquier cambio:

```
                       ¿REPETICIONES < OBJETIVO?
                                   │
                                   ▼
                       [1. ANÁLISIS DE RIR]
                 ¿El RIR reportado fue el previsto?
                                   │
                                   ▼
                    [2. ANÁLISIS DE ESTRUCTURA]
           ¿Se acortó el descanso entre series accidentalmente?
                                   │
                                   ▼
                      [3. ANÁLISIS DE CONTEXTO]
          ¿Hubo restricción de sueño (<5h) o estrés agudo?
          ¿Existe dolor articular agudo reportado en la zona?
                                   │
                                   ▼
                     [4. ANÁLISIS DE HISTORIAL]
         ¿Es una anomalía aislada o la 3ª sesión con caída?
                                   │
                                   ▼
                   [5. CONFIABILIDAD DEL DATO]
        ¿El dato proviene de sensor verificado o es estimado?
                                   │
                                   ▼
                    [6. EVALUACIÓN DETERMINISTA]
```

Si el descanso fue de 60s en lugar de los 150s pautados debido a prisa del usuario, la caída a 8 reps es una respuesta fisiológica esperada a la densidad, no una pérdida de fuerza. **Bajar la carga en ese escenario sería un error técnico.**

---

## 14. CONSUMO DEL CATÁLOGO OFICIAL Y TAXONOMÍA MUSCULAR

El motor determinista obtiene la información estática del ejercicio exclusivamente de los archivos maestros normalizados:
- **`src/data/ejercicios.json` (109 ejercicios oficiales, versión 1.3.0):** Aporta patrón de movimiento (`patron_movimiento`), familia biomecánica (`familia`), zona corporal (`zona`), capacidad física (`capacidad_fisica`), cadena cinética (`cadena_cinetica`), unilateralidad (`unilateralidad`), equipamiento necesario (`equipamiento`), variantes (`variantes`), relaciones (`ejercicios_relacionados`) y sustitutos (`sustitutos`).
- **`src/data/muscles.json` (84 entidades anatómicas oficiales):** Aporta la definición canónica de motores primarios, secundarios y estabilizadores.

El motor **NO crea catálogos paralelos**. Consume las propiedades semánticas como lectura inmutable para interpretar el estímulo.

---

## 15. EJEMPLOS CONCRETOS DE FLUJO DE DATOS EN ETAPA 8A

### Ejemplo 1: Serie Convencional en Bloque de Fuerza
- **Nivel A:** `exerciseId: "press-banca-plano-barra"`, `blockId: "bloque-fuerza-2026-q1"`.
- **Nivel B:** Serie 3, `loadKg: 100`, `reps: 5`, `rir: 2`, `restSecondsAfter: 210`, `avgHeartRateBpm: 138`.
- **Nivel C:** `sleepHours: 7.5`, `localizedPainScore: 0`, `timePressure: false`.
- **Nivel D:** Tonelaje serie = 500 kg; Reps efectivas = 5; Distribución muscular: Pectoral mayor (1.0 serie), Tríceps braquial (0.5 series), Deltoides anterior (0.5 series).
- **Confiabilidad:** `MeasurementConfidence: "CONFIRMED"`.
- **Comparabilidad:** Válida frente a la sesión previa (100 kg × 5 @ RIR 1).

### Ejemplo 2: Registro Histórico Reconstruido (Migración Legacy)
- **Nivel A:** `exerciseId: "flexiones-de-brazos"` (resuelto deterministamente de `"Flexión / Inver"`), `sessionId: "legacy-session-2025"`.
- **Nivel B:** `loadKg: 0` (peso corporal), `reps: 15`, `rir: undefined` (no capturado en versión antigua).
- **Nivel C:** No disponible (`ABSENT`).
- **Confiabilidad:** `MeasurementConfidence: "UNCERTAIN"` (identidad confirmada mediante alias, pero RIR y descanso ausentes).
- **Tratamiento:** Se conserva en el historial como referencia longitudinal, pero se excluye de cálculos de progresión de carga estricta.

---

## 16. DECISIONES PENDIENTES PARA LA ETAPA 8B

Para la posterior **Etapa 8B (Lógica de Inferencia e Interpretación del Motor)**, quedan delimitadas las siguientes decisiones:
1. **Fórmulas Matemáticas de Fatiga:** Formalizar los algoritmos deterministas para computar el ratio agudo/crónico de carga de trabajo (*ACWR*) y los índices de pérdida de velocidad sin caer en heurísticas probabilísticas opacas.
2. **Definición de Umbrales Numéricos:** Calibrar las bandas de tolerancia porcentual (±5%, ±10%) para clasificar automáticamente series como `STRICTLY_COMPARABLE` o `CONDITIONALLY_COMPARABLE`.
3. **Ponderación de Progresión:** Establecer las reglas explícitas de sobrecarga progresiva (ej. doble progresión: consolidar repeticiones antes de incrementar carga externa).
4. **Mecanismos de Captura de Contexto en UI:** Diseñar los puntos de entrada mínimos y no invasivos en la interfaz para registrar sueño, molestias musculares localizadas y RIR sin entorpecer el flujo ágil de la sesión.

---

**FIN DEL DOCUMENTO TÉCNICO DE ETAPA 8A**
