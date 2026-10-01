# ETAPA 8B — LÓGICA DE INTERPRETACIÓN DEL MOTOR DETERMINISTA
**Especificación Arquitectónica del Motor de Inferencia Determinista y Trazabilidad Causal**  
*Aplicación Entreno — Sistema de Entrenamiento Personal*

---

## 1. OBJETIVO DE LA ETAPA 8B

La **Etapa 8B** define y formaliza la capa de **INTERPRETACIÓN DETERMINISTA** del sistema Entreno. Su propósito exclusivo es transformar la información fáctica capturada:

$$\text{OBSERVACIONES (8A)} + \text{CONTEXTO (8A)} + \text{HISTORIAL (8A)} \longrightarrow \text{INTERPRETACIONES DETERMINISTAS (8B)}$$

### 1.1 Qué HACE la Etapa 8B
- Responde objetivamente a la pregunta:  
  **«¿Qué interpretación está rigurosamente respaldada por los datos disponibles?»**
- Evalúa la completitud y confiabilidad de los datos antes de emitir juicios.
- Aplica criterios biomecánicos y fisiológicos estrictos de comparabilidad entre sesiones.
- Separa el rendimiento externo (carga × repeticiones) del esfuerzo interno (proximidad al fallo / RIR).
- Identifica factores explicativos o atenuantes (descansos reducidos, dolor articular, anomalías aisladas).
- Entrega un resultado estructurado (`InterpretationResult`) con trazabilidad causal total.

### 1.2 Regla Fundamental de Delimitación: Qué NO HACE la Etapa 8B
- **NO toma decisiones de prescripción:** No sube ni baja cargas, no ajusta repeticiones objetivo, no programa descargas (*deloads*), no cambia ejercicios ni modifica volúmenes semanales.
- **Toda decisión prescriptiva pertenece exclusivamente a la ETAPA 8C (`DECIDE`).**
- En todo el flujo de 8B, la propiedad de salida de decisión es invariable:
  $$\text{decision} = \text{"NOT\_IMPLEMENTED\_IN\_8B"}$$

---

## 2. PRINCIPIOS FUNDAMENTALES DE LA INTERPRETACIÓN DETERMINISTA

### 2.1 Determinismo y Trazabilidad Total
El motor de interpretación es una función pura:
$$\text{Interpretación} = f(\text{Observación Actual}, \text{Referencia Histórica}, \text{Contexto Previo}, \text{Bloque Activo})$$
- **Idénticos datos + idéntico contexto + idéntica historia = idéntica interpretación.**
- Quedan prohibidas las cajas negras probabilísticas, los modelos estocásticos y las respuestas no reproducibles.
- Toda interpretación debe documentar sus 6 pilares de trazabilidad:
  1. **Qué datos utilizó** (carga, reps, RIR, descansos).
  2. **Qué referencia utilizó** (sesión previa, línea base del bloque, archivo histórico).
  3. **Qué comparación realizó** (delta de carga, delta de reps, delta de RIR, delta de descanso).
  4. **Qué regla determinista aplicó** (ej. regla de preservación de esfuerzo, regla de atenuación por densidad).
  5. **Qué datos faltaban** (variables secundarias no capturadas).
  6. **Cuál es el nivel de confianza** (`HIGH`, `MEDIUM`, `LOW`).

### 2.2 Separación del Ciclo Adaptativo
El flujo macroscópico del motor queda articulado en fases independientes:
$$\text{OBSERVE (8A)} \longrightarrow \text{INTERPRET (8B)} \longrightarrow \text{DECIDE (8C)} \longrightarrow \text{ACT} \longrightarrow \text{MEASURE} \longrightarrow \text{LEARN}$$

---

## 3. FLUJO GENERAL DE INTERPRETACIÓN

El motor procesa cada ejecución mediante una canalización modular secuencial:

```
[ EJECUCIÓN OBSERVADA + CONTEXTO + HISTORIAL ]
                     │
                     ▼
       ┌───────────────────────────┐
       │ 1. Calidad y Completitud  │ ──► [DATA_INSUFFICIENT] ──► Retorno sin comparar
       └─────────────┬─────────────┘
                     ▼ (DATA_SUFFICIENT o DATA_PARTIAL)
       ┌───────────────────────────┐
       │ 2. Comparabilidad Fáctica │ ──► [NON_COMPARABLE] ────► Retorno sin inferencia
       └─────────────┬─────────────┘
                     ▼ (STRICTLY o CONDITIONALLY_COMPARABLE)
       ┌───────────────────────────┐
       │ 3. Rendimiento vs Esfuerzo│ ──► PerformanceStatus + EffortStatus
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ 4. Factores Contextuales  │ ──► Dolor, descanso alterado, sueño, estrés
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ 5. Tendencia Longitudinal │ ──► Progresión vs Estancamiento vs Anomalía
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ 6. Ponderación Confianza  │ ──► HIGH / MEDIUM / LOW
       └─────────────┬─────────────┘
                     │
                     ▼
         [ INTERPRETATION RESULT ]
         decision = "NOT_IMPLEMENTED_IN_8B"
```

---

## 4. CAPA 1: CALIDAD Y COMPLETITUD DE DATOS

Antes de contrastar dos sesiones, el motor evalúa si los hechos observados tienen suficiente entidad metodológica:

| Estado | Criterio Objetivo | Comportamiento del Motor |
| :--- | :--- | :--- |
| **`DATA_SUFFICIENT`** | Series válidas ($>0$), carga, reps, RIR/RPE y descanso registrados con `identityConfidence: CONFIRMED`. | Permite interpretaciones firmes con nivel de confianza `HIGH`. |
| **`DATA_PARTIAL`** | Faltan variables secundarias (ej. RIR ausente, contexto previo no completado o descanso no cronometrado). | Permite interpretaciones preliminares, pero degrada la confianza máxima a `MEDIUM`. |
| **`DATA_INSUFFICIENT`** | Sin series registradas, repeticiones en 0 o identidad de ejercicio no confirmada. | **Detiene la interpretación.** Emite `PERFORMANCE_UNEVALUATED` con confianza `LOW`. |

---

## 5. CAPA 2: EVALUACIÓN ESTRICTA DE COMPARABILIDAD

Siguiendo el contrato de la Etapa 8A, dos ejecuciones solo pueden contrastarse si cumplen las condiciones de equivalencia:

1. **Mismo `exerciseId` Canónico:** No se permite comparar dos registros únicamente porque compartan `exerciseName` o nombre visible. Si los IDs difieren (ej. `sentadilla` vs. `sentadilla-bulgara`), el resultado es taxativamente **`NON_COMPARABLE`**.
2. **Aislamiento del Bloque Experimental Cerrado:** Si la referencia histórica procede de un bloque cerrado con `allowPrescriptionInheritance: false` (o `HIBRIDO_EXPERIMENTAL`), la comparación queda invalidada: **`NO_DIRECT_PRESCRIPTION_REFERENCE`**.
3. **Misma Estructura de Set:** No se comparan series tradicionales (`CONVENTIONAL`) con series en clúster (`CLUSTER`) o series descendentes (`DROP_SET`).
4. **Reino de Intensidad Homogéneo:** Variaciones de carga mayores al 25% invalidan la comparación directa (miden adaptaciones en extremos opuestos de la curva fuerza-velocidad).

---

## 6. CAPA 3: INTERPRETACIÓN DE RENDIMIENTO EXTERNO

El rendimiento externo cuantifica el trabajo mecánico completado ($\text{Carga} \times \text{Repeticiones}$):

- **`PERFORMANCE_IMPROVED`:**
  - Más carga con iguales o más repeticiones a igualdad de RIR.
  - Misma carga con más repeticiones a igualdad de RIR.
- **`PERFORMANCE_STABLE`:**
  - Misma carga y mismas repeticiones dentro de la tolerancia estándar ($\pm 1\%$).
- **`PERFORMANCE_DECLINED`:**
  - Menos repeticiones con la misma carga o menor carga para el mismo rango de repeticiones.
- **`PERFORMANCE_MIXED`:**
  - Incremento de carga pero con caída severa en repeticiones totales que altera el estímulo objetivo del bloque.

---

## 7. CAPA 4: SEPARACIÓN DE RENDIMIENTO Y ESFUERZO

El coste biológico de una serie no se deduce únicamente de los kilogramos levantados. El sistema trata el **rendimiento externo** y el **esfuerzo interno** como dos dimensiones independientes:

$$\text{Rendimiento Externo} = (\text{Carga}, \text{Repeticiones}, \text{Series})$$
$$\text{Esfuerzo Interno} = (\text{RIR}, \text{RPE}, \text{Frecuencia Cardíaca})$$

### Escenario Crítico: Misma Carga, Mismas Reps, Menor RIR
- **Sesión A:** 80 kg × 8 @ RIR 2
- **Sesión B:** 80 kg × 8 @ RIR 0 (fallo técnico alcanzado)
- **Interpretación 8B:**
  - `performanceStatus`: `PERFORMANCE_STABLE`
  - `effortStatus`: `EFFORT_MAXIMAL` / `EFFORT_INCREASED`
  - `primaryStatus`: **`PERFORMANCE_STABLE_WITH_HIGHER_EFFORT`**
- **Fundamento Fisiológico:** El atleta completó el mismo tonelaje, pero agotó su reserva neuromuscular. No existe progreso de fuerza real; existe una mayor demanda metabólica y fatiga central.

---

## 8. ESTRUCTURA DEL SET COMO VARIABLE CAUSAL

La estructura del set modula la pérdida de velocidad y el aclaramiento de lactato:
- **`CONVENTIONAL`:** Máxima acumulación de metabolitos intra-serie.
- **`CLUSTER` (con pausas intra-serie de 15–25s):** Menor pérdida de velocidad y mayor potencia media para igual carga y volumen.
- **`DROP_SET`:** Estrés metabólico concentrado y vaciado glucolítico rápido.

**Regla de Interpretación:** Si una sesión cambia de estructura (ej. de convencional a clúster), el motor no interpreta un mayor número de repeticiones como un aumento súbito de la fuerza máxima del atleta, sino como un efecto inducido por la fragmentación del esfuerzo.

---

## 9. EL DESCANSO COMO VARIABLE INTERPRETATIVA (DENSIDAD)

El tiempo de descanso real entre series modula directamente la resíntesis de fosfocreatina (PCr):
- **Sesión Referencia:** 100 kg × 10 (descanso real 180s)
- **Sesión Actual:** 100 kg × 7 (descanso real 60s)

**Regla de Interpretación:**
- El descenso de repeticiones **NO** se clasifica como pérdida de capacidad muscular.
- Se emite la etiqueta específica: **`PERFORMANCE_DECLINE_WITH_REDUCED_REST`**.
- Factores contribuyentes: *"La caída de repeticiones se asocia con un aumento de densidad y una incompleta recuperación de sustratos energéticos."*

---

## 10. CONTEXTO PREVIO Y SÍNTOMAS MULTIFACTORIALES

El contexto se evalúa como variables continuas independientes, **sin comprimirlas en un readiness score artificial**:
- **Sueño:** Horas de sueño y calidad subjetiva (1 a 5).
- **Estrés Mental y Fatiga:** Escalas subjetivas independientes.
- **Ventana Nutricional:** Ayuno o ingesta deficiente previa a la sesión.
- **Presión Temporal:** Minutos disponibles y prisa reportada.

Cuando el rendimiento desciende en presencia de contexto adverso (ej. sueño $< 5$ horas o estrés mental severo), el motor incorpora el factor atenuante: **`POSSIBLE_CONTEXT_EFFECT`**.

---

## 11. DOLOR Y MOLESTIAS (SIN DIAGNÓSTICOS MÉDICOS)

El motor distingue cuatro naturalezas clínicas de síntomas reportados en `LocalizedSymptom`:
1. **`doms` (Agujetas):** Dolor muscular tardío difuso normal post-entrenamiento.
2. **`articular_pain` (Dolor articular/tendinoso):** Molestia puntual en articulación o inserción tendinosa.
3. **`stiffness` (Rigidez):** Pérdida transitoria de rango de movimiento.
4. **`cramp` (Espasmo/calambre):** Contracción involuntaria aguda.

### Frontera con el Diagnóstico Clínico
- **8B NUNCA afirma:** *"El usuario tiene tendinitis patelar"* ni emite diagnósticos médicos.
- **8B identifica formalmente:** **`PAIN_CONTEXT_PRESENT`**.
- Si el rendimiento en sentadilla cae acompañado de dolor articular patelar $\geq 3/10$, la interpretación prioriza el contexto de dolor sobre cualquier inferencia de fatiga o estancamiento.

---

## 12. TAXONOMÍA FORMAL DE FATIGA

| Dimensión | Evidencia Requerida en Datos | Etiqueta Resultante |
| :--- | :--- | :--- |
| **Fatiga Local** | Caída de rendimiento concentrada en un ejercicio o grupo muscular, con RIR menor y DOMS localizado, mientras otros grupos musculares rinden estables. | **`POSSIBLE_LOCAL_FATIGUE`** |
| **Fatiga Sistémica** | Caída generalizada en múltiples ejercicios no relacionados, latencia elevada de recuperación de frecuencia cardíaca y RPE desproporcionado. | **`POSSIBLE_SYSTEMIC_FATIGUE`** |
| **Fatiga Acumulada** | Tendencia descendente mantenida a lo largo de $\geq 3$ sesiones comparables, con RIR decreciente por debajo de la línea base del bloque. | **`POSSIBLE_ACCUMULATED_FATIGUE`** |

**Regla de Causalidad:** Se prohíbe emitir `POSSIBLE_ACCUMULATED_FATIGUE` a partir de una única sesión. Requiere evidencia longitudinal.

---

## 13. PROGRESIÓN SOSTENIDA

Para registrar la etiqueta **`PROGRESSION_OBSERVED`**, el motor exige:
1. Comparación frente a la **Línea Base (`baselineExecution`)** del bloque activo.
2. Incremento medible en carga a igualdad de repeticiones y RIR, o incremento en repeticiones a igualdad de carga y RIR.
3. Descarte de factores atenuantes (no haber tomado descansos el doble de largos).

---

## 14. ESTANCAMIENTO: CONCEPTO DE "PLATEAU_CANDIDATE"

El estancamiento no se declara por una sesión sin progreso.
- **Requisitos para `PLATEAU_CANDIDATE`:**
  1. Al menos **3 sesiones consecutivas comparables** dentro del mismo bloque.
  2. Mismo `exerciseId` y misma estructura de set.
  3. Carga idéntica o con variación menor a 1 kg.
  4. Repeticiones idénticas o con variación menor a 1 rep.
  5. Ausencia de dolor agudo o reducción drástica de descanso que lo justifique.
- **Distinción Formal:**  
  `PLATEAU_CANDIDATE` es una observación de estabilidad prolongada; **NO es una confirmación de fracaso ni prescribe una descarga**. Esa valoración corresponde a 8C.

---

## 15. ANOMALÍA AISLADA FRENTE A TENDENCIA

Una fluctuación aguda debe aislarse de la trayectoria global:
- **Historial:** 10 reps, 10 reps, 10 reps.
- **Sesión Actual:** 7 reps.
- **Interpretación 8B:** **`ISOLATED_PERFORMANCE_ANOMALY`**.
- **Fundamento:** El motor detecta que la sesión actual rompe la estabilidad histórica sin evidencia longitudinal previa. Protege al sistema de sobrerreaccionar a un mal día aislado.

---

## 16. DENSIDAD DE ENTRENAMIENTO

La densidad ($\text{Tonelaje} / \text{Tiempo total}$) no tiene una valencia moral intrínseca:
- Mayor densidad **no** es intrínsecamente mejor (en un bloque de fuerza máxima perjudica la recuperación neuromuscular).
- Menor densidad **no** es intrínsecamente peor (en fuerza permite disipar la fatiga central entre series pesadas).
- La densidad se interpreta estrictamente a la luz del objetivo del bloque (`TrainingBlockObjective`).

---

## 17. VOLUMEN Y DISTRIBUCIÓN MUSCULAR

8B interpreta la distribución del volumen efectivo:
- Verifica si el volumen semanal por grupo muscular se encuentra balanceado o hipertrofiado hacia una zona específica.
- Aplica las fracciones oficiales: $1.0$ (motor primario), $0.5$ (sinergista), $0.0$ (estabilizador).
- **Prohibición de 8B:** No dictamina si el volumen es "insuficiente" o "excesivo"; documenta cuántas series efectivas recibió cada estructura anatómica.

---

## 18. GESTIÓN DE CONTRADICCIONES EN LOS DATOS

Cuando las variables apuntan en direcciones divergentes:
- *Ejemplo:* Más repeticiones completadas, pero con RIR menor (fallo muscular) y tras solo 4 horas de sueño.
- **Comportamiento Determinista:**
  - El motor **no elige arbitrariamente** una explicación optimista ni pesimista.
  - Registra formalmente la etiqueta: **`CONFLICTING_EVIDENCE`**.
  - Documenta los factores contradictorios en `contradictoryFactors`.
  - Degrada el nivel de confianza de la interpretación a `LOW`.

---

## 19. REGLA ESTRICTA DE CAUSALIDAD CIENTÍFICA

El motor distingue cuatro niveles epistemológicos en sus reportes:
1. **Hecho / Observación:** *"Las repeticiones disminuyeron de 10 a 7."*
2. **Asociación Temporal:** *"La disminución coincidió con una reducción del descanso de 180s a 60s."*
3. **Hipótesis Explicativa:** *"La reducción del descanso constituye un factor atenuante plausible debido a la densidad."*
4. **Causalidad Fuerte:** Solo se asume cuando se controlan experimentalmente todas las variables secundarias (requisito casi imposible en entrenamiento libre de usuario; por tanto, 8B utiliza siempre lenguaje probabilístico y asociativo riguroso).

---

## 20. PONDERACIÓN DE LA CONFIANZA DE LA INTERPRETACIÓN

La confianza de la interpretación (`InterpretationConfidence`) se calibra según la solidez del conjunto probatorio:
- **`HIGH`:** `DATA_SUFFICIENT` + `STRICTLY_COMPARABLE` + ausencia de factores contradictorios + identidad confirmada.
- **`MEDIUM`:** `DATA_PARTIAL` o comparabilidad condicionada (`CONDITIONALLY_COMPARABLE`) por ligeras variaciones de descanso o contexto.
- **`LOW`:** Confiabilidad fáctica `UNCERTAIN`, presencia de `CONFLICTING_EVIDENCE` o datos insuficientes.

---

## 21. ESTRUCTURA DE SALIDA: CONTRATO `InterpretationResult`

```typescript
interface InterpretationResult {
  category: 'PERFORMANCE' | 'EFFORT' | 'CONTEXT' | 'FATIGUE' | 'LONGITUDINAL' | 'INTEGRATED';
  primaryStatus: InterpretationTag;
  performanceStatus: PerformanceStatus;
  effortStatus: EffortStatus;
  secondaryTags: InterpretationTag[];
  
  evidence: string[];                 // Hechos fácticos de soporte
  references: string[];               // Puntos de referencia utilizados
  contributingFactors: string[];      // Factores atenuantes o explicativos
  contradictoryFactors: string[];     // Señales en dirección contraria
  missingData: string[];              // Variables ausentes
  
  confidence: InterpretationConfidence;// Confianza metodológica
  dataCompleteness: DataCompletenessStatus;
  
  decision: 'NOT_IMPLEMENTED_IN_8B';  // Frontera explícita con 8C
}
```

---

## 22. VALIDACIÓN EXPERIMENTAL: 10 ESCENARIOS COMPROBADOS

La suite automatizada `scripts/testDeterministicInterpretation8B.ts` valida el comportamiento del motor en los 10 escenarios obligatorios:

| Caso | Escenario Físico | Entrada | Salida Determinista Esperada | Estado |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Mismo rendimiento | Carga, reps y RIR idénticos | `PERFORMANCE_STABLE` | **APROBADO** |
| **2** | Sobrecarga lograda | Mayor carga con mismas reps y RIR equivalente | `PERFORMANCE_IMPROVED` | **APROBADO** |
| **3** | Descanso alterado | Caída de reps tras reducir descanso a 60s (vs 180s) | `PERFORMANCE_DECLINE_WITH_REDUCED_REST` | **APROBADO** |
| **4** | Sesión atípica | 10, 10, 10 reps seguidas de una sesión de 7 reps | `ISOLATED_PERFORMANCE_ANOMALY` | **APROBADO** |
| **5** | Falta de avance | 4 sesiones consecutivas con misma carga y reps | `PLATEAU_CANDIDATE` | **APROBADO** |
| **6** | Coste aumentado | Mismas reps pero alcanzando RIR 0 (vs RIR 2) | `PERFORMANCE_STABLE_WITH_HIGHER_EFFORT` | **APROBADO** |
| **7** | Falsa homonimia | Mismo nombre visible pero `exerciseId` distinto | `NON_COMPARABLE` | **APROBADO** |
| **8** | Bloque cerrado | Referencia en bloque híbrido cerrado hacia fuerza | `NO_DIRECT_PRESCRIPTION_REFERENCE` | **APROBADO** |
| **9** | Dolor localizado | Caída de reps en press francés con dolor de codo 5/10 | `PAIN_CONTEXT_PRESENT` | **APROBADO** |
| **10**| Datos incompletos | Registro sin RIR ni descansos cronometrados | `DATA_PARTIAL` | **APROBADO** |

---

## 23. LÍMITES ESTRICTOS DE LA ETAPA 8B

Para preservar la pureza de la arquitectura, 8B tiene prohibido:
1. Emitir recomendaciones de entrenamiento al usuario.
2. Calcular o sugerir incrementos de peso en kilogramos.
3. Decidir la descarga de una rutina o ejercicio.
4. Sustituir ejercicios por lesiones (solo señala la presencia de dolor).
5. Asignar puntuaciones arbitrarias globales tipo "readiness score".
6. Utilizar modelos probabilísticos o redes neuronales generativas.

---

## 24. DECISIONES PENDIENTES PARA LA ETAPA 8C

Quedan formalmente delegadas a la **Etapa 8C (`DECIDE`)**:
1. **Árboles de Decisión de Prescripción:** Reglas para convertir `PERFORMANCE_IMPROVED` en incrementos específicos de carga externa (ej. doble progresión: subir reps hasta el techo del rango antes de subir kg).
2. **Protocolos de Gestión del Estancamiento:** Acciones a tomar cuando `PLATEAU_CANDIDATE` persiste por $\geq 4$ microciclos (descarga, cambio de variante biomecánica o rotación de rango de repeticiones).
3. **Algoritmos de Autoregulación Diaria:** Modulación de la carga prescrita en la sesión del día cuando se detecta `PAIN_CONTEXT_PRESENT` o `POSSIBLE_SYSTEMIC_FATIGUE`.
4. **Criterios de Sustitución:** Mapeo automatizado hacia sustitutos oficiales de `src/data/ejercicios.json` ante banderas clínicas persistentes.

---

**FIN DEL DOCUMENTO TÉCNICO DE ETAPA 8B**
