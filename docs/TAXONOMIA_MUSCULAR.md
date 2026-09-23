# TAXONOMÍA MUSCULAR Y VOCABULARIO CONTROLADO DE ENTRENO
**Documento Técnico Oficial — Versión 1.0.0 (Punto 6B)**  
*Catálogo Maestro de Ejercicios y Arquitectura del Futuro Motor Determinista*

---

## 1. INTRODUCCIÓN Y ALCANCE

El presente documento formaliza la **Taxonomía Muscular Canónica** y el **Vocabulario Anatómico Controlado** de la aplicación **Entreno**. Esta taxonomía constituye la base semántica y estructural para:
1. **La catalogación estandarizada** de los ejercicios físicos (en articulación con el *Marco de Clasificación Muscular 6A*).
2. **Los algoritmos de búsqueda, filtrado y recomendación** de ejercicios y sustitutos biomecánicos.
3. **El futuro Motor Determinista de Entreno**, permitiendo la agregación de series, volumen de entrenamiento y fatiga acumulada a través de árboles jerárquicos padre-hijo sin incurrir en doble cómputo.

### Principio de Invarianza (Punto 6B)
> **Regla de Oro:** Este documento y su diccionario asociado (`src/data/muscles.json`) establecen el marco de referencia previo a la normalización práctica. **Ninguno de los 109 ejercicios oficiales existentes en `src/data/ejercicios.json` ha sido modificado en esta etapa.** La migración y asignación sistemática de músculos se ejecutará de forma controlada y validada en el **Punto 6C**.

---

## A. PRINCIPIOS DE LA TAXONOMÍA MUSCULAR

La taxonomía muscular de Entreno se rige por cinco pilares fundamentales:

1. **Unicidad e Inequívoca Identidad:**
   Cada entidad biológica reconocida posee un único identificador canónico en formato `snake_case`, minúsculas, sin tildes, sin diacríticos ni espacios (ej. `recto_abdominal`, `deltoides_anterior`).
2. **Distinción Multinivel:**
   El sistema separa estrictamente entre:
   - **El Concepto Biológico/Anatómico** (descripción médica e inserciones).
   - **El Identificador Canónico** (clave primaria del software: `id`).
   - **El Nombre de Visualización** (`nombre` formateado para la interfaz humana).
   - **Los Alias y Sinónimos** (variantes léxicas, vulgares, históricas o en otros idiomas para indexación).
   - **La Jerarquía Estructural** (relaciones de ascendencia y descendencia).
3. **Pertinencia Funcional frente a Falsa Precisión:**
   No se crean entidades atómicas que no puedan ser aisladas o discriminadas mecánicamente en el entrenamiento de fuerza (ej. no se catalogan de forma separada las cabezas individuales del gastrocnemio —medial vs lateral— porque responden conjuntamente a la flexión plantar), pero se preservan porciones anatómicas cuando sus líneas de tracción divergen sustancialmente (ej. `deltoides_anterior`, `deltoides_lateral`, `deltoides_posterior`).
4. **Relación Jerárquica Unívoca y Cero Ciclos:**
   Todo elemento secundario desciende de exactamente un elemento padre directo (`padre`), formando un grafo acíclico dirigido (DAG restringido a árbol jerárquico).
5. **Agnosticismo de Sesión (Separación Estático vs. Dinámico):**
   La lateralidad (`derecho` / `izquierdo`), el dolor residual (DOMS), la fatiga o el esfuerzo percibido (RPE/RIR) jamás forman parte del identificador anatómico.

---

## B. DEFINICIÓN DE GRUPO MUSCULAR

> **Grupo Muscular (`tipo: "grupo_muscular"`):**  
> Entidad anatomo-funcional compuesta por múltiples vientres musculares o músculos discretos que comparten una inserción tendinosa común, una sinergia motriz dominante y/o una activación conjunta habitual en los patrones de movimiento humano.

### Criterios para catalogar como Grupo Muscular:
- **Unidad de prescripción estándar:** Cuando la enorme mayoría de prescripciones deportivas y científicas apuntan al complejo global sin requerir disección analítica (ej. `cuadriceps` en una sentadilla o prensa, `isquiotibiales` en un peso muerto rumano).
- **Agrupador funcional:** Cuando los músculos que lo integran cumplen funciones coadyuvantes sobre la misma palanca osteoarticular (ej. `aductores_cadera`, `manguito_rotador`, `erectores_espinales`).
- **Agrupador jerárquico de interfaz:** Entidades como `gluteos`, `antebrazo` o `triceps_sural`, que actúan como nodo contenedor para simplificar filtros y visualizaciones de alto nivel.

---

## C. DEFINICIÓN DE MÚSCULO INDIVIDUAL Y PORCIÓN ANATÓMICA

### 1. Músculo Individual (`tipo: "musculo_individual"`)
> **Definición:** Estructura muscular anatómicamente continua y delimitada por su propio epimisio, dotada de origen(es) e inserción definidos y con inervación específica (ej. `gluteo_mayor`, `dorsal_ancho`, `braquial`, `braquiorradial`, `serrato_anterior`, `soleo`, `tibial_anterior`).

### 2. Porción Anatómica (`tipo: "porcion_anatomica"`)
> **Definición:** Subdivisión funcional y arquitectónica de un músculo individual o grupo con orígenes diferenciados y fibras que discurren en ángulos o planos biomecánicos sensiblemente distintos, permitiendo reclutamiento preferente mediante variaciones posturales o del vector de fuerza.
> 
> *Ejemplos obligatorios:*
> - `deltoides_anterior`, `deltoides_lateral`, `deltoides_posterior`.
> - `pectoral_mayor_clavicular`, `pectoral_mayor_esternal`.
> - `trapecio_superior`, `trapecio_medio`, `trapecio_inferior`.
> - `triceps_cabeza_larga`, `triceps_cabeza_lateral`, `triceps_cabeza_medial`.
> - `recto_femoral`, `vasto_lateral`, `vasto_medial`, `vasto_intermedio`.

---

## D. REGLAS PADRE / HIJO Y NIVELES DE CATALOGACIÓN

Cada entrada del diccionario muscular define un `nivel_catalogacion` normativo:

| Nivel | Rol en el Sistema | Uso en `ejercicios.json` | Ejemplo |
| :--- | :--- | :--- | :--- |
| `operativo_recomendado` | Identificador estándar preferido para ejercicios comunes. | **Permitido y recomendado** | `cuadriceps`, `gluteo_mayor`, `dorsal_ancho`, `deltoides_anterior`, `isquiotibiales` |
| `especifico_avanzado` | Identificador de alta resolución para ejercicios de aislamiento o análisis biomecánico fino. | **Permitido con justificación técnica** | `pectoral_mayor_clavicular`, `recto_femoral`, `triceps_cabeza_larga`, `braquiorradial` |
| `agrupador_jerarquico` | Contenedor macro para visualización, estadísticas agregadas y filtros de UI. | **Prohibido como motor en ejercicios específicos** | `gluteos`, `antebrazo`, `triceps_sural` |

### Reglas Estructurales de Validación:
1. **Correspondencia Bidireccional:** Si el músculo $A$ tiene `padre: "B"`, el músculo $B$ DEBE contener `"A"` en su lista de `hijos`. Si $B$ contiene `"A"` en `hijos`, el músculo $A$ DEBE tener `padre: "B"`.
2. **Unicidad de Ascendencia:** Un músculo o porción no puede pertenecer a dos padres directos distintos.
3. **Ausencia de Ciclos:** Ningún músculo puede descender directa o indirectamente de sí mismo ($A \rightarrow B \rightarrow A$ es un error fatal).

---

## E. VOCABULARIO CANÓNICO Y FORMATEO DE IDENTIFICADORES

Todos los identificadores de músculos y grupos en Entreno deben cumplir la siguiente especificación estricta:
- **Expresión Regular:** `^[a-z0-9]+(_[a-z0-9]+)*$`
- Minúsculas universales.
- Separación exclusiva por guión bajo (`_`).
- Cero caracteres acentuados (á $\rightarrow$ a, é $\rightarrow$ e, í $\rightarrow$ i, ó $\rightarrow$ o, ú $\rightarrow$ u, ñ $\rightarrow$ n).
- Sin espacios ni caracteres especiales.
- Términos en singular anatómico estándar (salvo grupos plurales reconocidos como `isquiotibiales`, `erectores_espinales`, `peroneos`).

---

## F. SISTEMA DE ALIASES Y SINÓNIMOS

El sistema implementa un array `aliases` para cada identificador canónico.
- **Función:** Permite resolver entradas libres del usuario, términos coloquiales ("pecho", "femorales", "gemelos", "pantorrillas", "abs", "lumbares", "traps"), términos médicos en latín (*Musculus pectoralis major*), términos en inglés (*quads*, *hamstrings*, *lats*, *rear delts*) e importación de bases de datos antiguas.
- **Regla de Oro de Colisión:** Ningún alias de un músculo puede ser igual al `id` canónico de otro músculo. Los alias no pueden ser ambiguos entre dos músculos distintos.

---

## G. ESTRUCTURA ANATÓMICA Y RESOLUCIÓN DE CASOS COMPLEJOS

A continuación se detallan las decisiones biomecánicas tomadas para cada región anatómica clave:

### 1. Deltoides
- **Contenedor:** `deltoides` (`tipo: "grupo_muscular"`, `agrupador_jerarquico`).
- **Nivel Operativo Estándar:** `deltoides_anterior`, `deltoides_lateral`, `deltoides_posterior`.
- **Criterio Biomecánico:** Las tres porciones poseen vectores de momento articulares completamente distintos:
  * El deltoides anterior es flexor y rotador interno (plano sagital/horizontal).
  * El deltoides lateral es abductor puro (plano frontal/escapular).
  * El deltoides posterior es extensor y rotador externo (plano transversal).
  * En ejercicios de aislamiento y empujes/tirones, se emplean las porciones canónicas. La búsqueda de "deltoides" en la interfaz agrupa automáticamente las tres.

### 2. Pectoral
- **Contenedor y Músculo General:** `pectoral_mayor` (`operativo_recomendado`).
- **Porciones Anatómicas:** `pectoral_mayor_clavicular` (haz superior) y `pectoral_mayor_esternal` (haz medio e inferior).
- **Estabilizador Escapular:** `pectoral_menor` (músculo individual).
- **Criterio Biomecánico:** Para press de banca plano, flexiones y fondos, `pectoral_mayor` es la asignación operativa óptima. Para press inclinado (30-45°), la tracción clavicular es selectiva, justificando el uso de `pectoral_mayor_clavicular`. `pectoral_menor` no mueve el húmero; actúa exclusivamente sobre la apófisis coracoides de la escápula como estabilizador/depresor.

### 3. Cuádriceps
- **Identificador Operativo Principal:** `cuadriceps` (`operativo_recomendado`).
- **Hijos Anatómicos:** `recto_femoral`, `vasto_lateral`, `vasto_medial`, `vasto_intermedio`.
- **Criterio Biomecánico:** En sentadillas, zancadas, prensa y extensiones de rodilla comunes, los tres vastos y el recto femoral actúan sinérgicamente para la extensión de la tibia. Solo en variantes con extensión forzada de cadera y flexión simultánea de rodilla (sissy squat, curl nórdico inverso) o flexión aislada de cadera se justifica discriminar el `recto_femoral`.

### 4. Isquiotibiales
- **Identificador Operativo Principal:** `isquiotibiales` (`operativo_recomendado`).
- **Hijos Anatómicos:** `biceps_femoral`, `semitendinoso`, `semimembranoso`.
- **Criterio Biomecánico:** En peso muerto rumano, peso muerto tradicional, curl de piernas y buenos días, el complejo actúa como una unidad biarticular extensora de cadera y flexora de rodilla. El uso de `isquiotibiales` evita falsa precisión en la catalogación general, manteniendo los hijos disponibles para análisis biomecánico específico.

### 5. Glúteos
- **Agrupador Jerárquico:** `gluteos`.
- **Identificadores Operativos Canónicos:**
  * `gluteo_mayor` (extensión sagital potente y rotación externa).
  * `gluteo_medio` (abducción frontal y estabilización horizontal pélvica).
  * `gluteo_menor` (sinergista abductor y rotador interno profundo).
- **Criterio Biomecánico:** **PROHIBIDO unificar glúteo mayor y glúteo medio en un único token funcional.** En zancadas o sentadilla búlgara, el glúteo mayor es *motor principal* de extensión, mientras que el glúteo medio es *estabilizador crítico* contra la inclinación de la pelvis contralateral.

### 6. Tríceps Braquial
- **Identificador Operativo Principal:** `triceps_braquial`.
- **Porciones Anatómicas:** `triceps_cabeza_larga` (biarticular), `triceps_cabeza_lateral`, `triceps_cabeza_medial`.
- **Criterio Biomecánico:** En empujes horizontales y verticales, las tres cabezas extienden el codo coordinadamente (`triceps_braquial`). En extensiones por encima de la cabeza (*overhead extensions*), la cabeza larga experimenta elongación previa en flexión de hombro, optimizando su longitud activa; en este caso puede catalogarse específicamente `triceps_cabeza_larga`.

### 7. Espalda y Tronco
- `dorsal_ancho`: Motor primario de tracción glenohumeral (aducción y extensión).
- `trapecio`: Dividido jerárquicamente en:
  * `trapecio_superior`: Elevación escapular (encogimientos).
  * `trapecio_medio`: Retracción escapular pura (remos horizontales).
  * `trapecio_inferior`: Depresión y báscula externa escapular (dominadas, face pulls).
- `romboides`: Grupo funcional integrado por romboides mayor y menor.
- `serrato_anterior`: Músculo individual crítico para protracción escapular (flexión con plus) y soporte torácico dinámico.

### 8. Core y Pared Abdominal
- **PROHIBIDO el uso de `"core"` como músculo anatómico.**
- **Vocabulario Canónico Acreditado:**
  * `recto_abdominal`: Flexión espinal toracolumbar y soporte anti-extensión.
  * `oblicuo_externo`: Rotación contralateral, flexión lateral y anti-rotación.
  * `oblicuo_interno`: Rotación ipsilateral y contención parietal.
  * `transverso_abdominal`: Faja profunda, aumento de presión intraabdominal (IAP) y coactivación con la fascia toracolumbar.
  * `erectores_espinales`: Grupo extensor espinal compuesto por iliocostal, longísimo y espinoso.
  * `cuadrado_lumbar`: Flexor lateral, estabilizador frontal lumbopélvico y fijador de la costilla 12.
  * `multifidos`: Estabilizadores intervertebrales profundos segmentarios.
  * `diafragma` y `suelo_pelvico`: Techo y base manométrica del cilindro de estabilidad central.

### 9. Antebrazo
- **Agrupador Jerárquico:** `antebrazo`.
- **Identificadores Operativos Canónicos:**
  * `flexores_muneca`: Flexión de muñeca y flexión de los dedos (fuerza de agarre o prensión).
  * `extensores_muneca`: Extensión de muñeca y estabilización de la mano en agarres de tracción.
  * `braquiorradial`: Flexión de codo con antebrazo en neutro (curl martillo).
  * `pronadores_antebrazo` y `supinador`: Control de rotación radioulnar.

### 10. Pantorrilla
- **Agrupador Jerárquico:** `triceps_sural` (`aliases: ["pantorrillas", "calves"]`).
- **Porciones Anatómicas Canónicas:**
  * `gastrocnemio`: Biarticular (rodilla + tobillo). Predomina mecánicamente cuando la rodilla se encuentra extendida (elevaciones de talones de pie). Alias oficial: `gemelos`.
  * `soleo`: Monoarticular (sólo tobillo). Predomina mecánicamente cuando la rodilla se encuentra flexionada a 90° (elevaciones de talones sentado).
  * `tibial_anterior`: Dorsiflexor e inversor del tobillo; estabilizador anterior.

### 11. Cadera Profunda y Pelvis
- `iliopsoas`: Complejo psoas mayor e ilíaco; flexor principal coxofemoral.
- `aductores_cadera`: Grupo conteniendo `aductor_mayor`, `aductor_largo`, `aductor_corto`, `gracil`, `pectineo`. En sentadilla profunda, el `aductor_mayor` es un extensor masivo primario de la cadera junto al glúteo.
- `tensor_fascia_lata` (`tfl`): Abductor y estabilizador anterolateral de rodilla/cadera.
- `sartorio`: Biarticular flexor/abductor/rotador externo de cadera.
- `rotadores_cadera_profundos`: Músculos pelvitrocantéreos (piriforme, obturadores, gemelos pélvicos, cuadrado femoral).

### 12. Manguito Rotador
- **Grupo Funcional y Estabilizador:** `manguito_rotador`.
- **Músculos Individuales Integrantes:** `supraespinoso`, `infraespinoso`, `redondo_menor`, `subescapular`.

---

## H. REGLAS DE NORMALIZACIÓN PARA EL PUNTO 6C

Cuando se realice la normalización de los 109 ejercicios en el Punto 6C:

1. **Sustitución de Tokens Vulgares o Plurales Desordenados:**
   - `"gemelos"` $\rightarrow$ `gastrocnemio` (si es de pie) o `soleo` (si es sentado).
   - `"pantorrillas"` $\rightarrow$ `gastrocnemio` / `soleo`.
   - `"antebrazos"` $\rightarrow$ `flexores_muneca` (en agarres de tracción/paseos del granjero) o `braquiorradial` (en curl martillo).
   - `"pecho"` $\rightarrow$ `pectoral_mayor`.
   - `"femorales"` $\rightarrow$ `isquiotibiales`.
   - `"abdominales"` $\rightarrow$ `recto_abdominal`.
   - `"lumbares"` $\rightarrow$ `erectores_espinales`.
2. **Revisión de Estabilizadores:**
   Todo elemento en `estabilizadores` deberá pertenecer obligatoriamente a este diccionario canónico oficial.

---

## I. REGLAS DE LATERALIDAD

1. **Agnosticismo Anatómico:**  
   Los identificadores musculares NO llevan sufijos de lateralidad:
   - Correcto: `gluteo_medio`
   - Incorrecto: `gluteo_medio_derecho`, `gluteo_medio_izquierdo`
2. **Registro Dinámico:**  
   En la ejecución de ejercicios unilaterales (ej. búlgaras, split squats), la aplicación registra:
   ```json
   {
     "ejercicio_id": "sentadilla-bulgara",
     "musculos_principales": ["cuadriceps", "gluteo_mayor"],
     "estabilizadores": ["gluteo_medio", "cuadrado_lumbar"],
     "ejecucion_sesion": {
       "lado": "derecho",
       "series": 3
     }
   }
   ```
   Esto asegura que los catálogos y diccionarios se mantengan limpios, neutrales y portables.

---

## J. REGLAS PARA ESTADÍSTICAS Y AGREGACIÓN EN EL MOTOR DETERMINISTA

El Motor Determinista de Entreno utilizará las relaciones padre-hijo del diccionario para calcular métricas de volumen (series semanales por grupo muscular) sin incurrir en duplicaciones:

### 1. Regla de Agregación Ascendente (*Rollup*):
Si un ejercicio impacta a un músculo específico o porción anatómica (ej. `vasto_lateral` o `deltoides_anterior`), su volumen se computa al músculo específico y **se agrega automáticamente al grupo padre** (`cuadriceps` o `deltoides`).

### 2. Regla Anti-Doble Conteo (*De-duplication per Set*):
Una única serie de un ejercicio sólo computa **1 vez por grupo muscular padre**.
- *Ejemplo:* Si un ejercicio multiarticular involucra `deltoides_anterior` como principal y `deltoides_lateral` como secundario, la serie computa para `deltoides_anterior` (1 serie) y `deltoides_lateral` (0.5 series secundarias), pero al agregarse a nivel macro de `deltoides`, el volumen total derivado de esa serie no puede exceder el factor unitario de la serie (1.0).

### 3. Asignación Descendente Prohibida:
Si un ejercicio está catalogado a nivel general de `cuadriceps` (ej. sentadilla con barra), **NO se asigna 25% arbitrario a cada vasto individual**. El volumen se mantiene en el nivel funcional en el que fue prescrito.

---

## K. CASOS AMBIGUOS Y DECISIONES BIOMECÁNICAS

| Caso | Duda Común | Decisión Oficial de Entreno | Justificación Biomecánica |
| :--- | :--- | :--- | :--- |
| **Aductor Mayor en Sentadilla** | ¿Es sólo secundario de aducción? | **Principal/Secundario clave** en flexión profunda | En flexión de cadera >60°, el aductor mayor posee un brazo de palanca extensor de cadera comparable al del glúteo mayor (Neumann, 2016). |
| **Bíceps en Dominadas** | ¿Es principal o secundario? | **Secundario** en pronación, **Co-principal** en supinación | La pronación atenúa el torque flexor del bíceps (insuficiencia de supinación), transfiriendo el trabajo al braquial y braquiorradial. |
| **Psoas en Elevaciones de Piernas** | ¿Es abdominal o flexor de cadera? | **Iliopsoas: Principal**, **Recto Abdominal: Estabilizador/Isométrico** | El recto abdominal no se inserta en el fémur; la elevación del muslo es mecánicamente producida por el iliopsoas. El abdomen sostiene la pelvis en retroversión. |
| **Face Pull** | ¿Deltoides o espalda? | **Deltoides posterior y rotadores externos: Principales**; trapecio medio/romboides: secundarios | El vector de tracción hacia el rostro enfatiza la abducción horizontal y rotación externa glenohumeral. |

---

## L. LISTA COMPLETA DE IDENTIFICADORES CANÓNICOS (84 ENTIDADES)

### 1. Zona Superior (40 entidades)
- **Pecho (5):** `pectoral_mayor`, `pectoral_mayor_clavicular`, `pectoral_mayor_esternal`, `pectoral_menor`, `subclavio`.
- **Hombro (9):** `deltoides`, `deltoides_anterior`, `deltoides_lateral`, `deltoides_posterior`, `manguito_rotador`, `supraespinoso`, `infraespinoso`, `redondo_menor`, `subescapular`.
- **Espalda (10):** `dorsal_ancho`, `redondo_mayor`, `trapecio`, `trapecio_superior`, `trapecio_medio`, `trapecio_inferior`, `romboides`, `romboides_mayor`, `romboides_menor`, `elevador_escapula`, `serrato_anterior`.
- **Brazo (9):** `biceps_braquial`, `biceps_cabeza_larga`, `biceps_cabeza_corta`, `braquial`, `coracobraquial`, `triceps_braquial`, `triceps_cabeza_larga`, `triceps_cabeza_lateral`, `triceps_cabeza_medial`, `anconeo`.
- **Antebrazo (6):** `antebrazo`, `braquiorradial`, `flexores_muneca`, `extensores_muneca`, `pronadores_antebrazo`, `supinador`.

### 2. Zona Inferior (31 entidades)
- **Glúteos (4):** `gluteos`, `gluteo_mayor`, `gluteo_medio`, `gluteo_menor`.
- **Muslo Anterior / Cuádriceps (5):** `cuadriceps`, `recto_femoral`, `vasto_lateral`, `vasto_medial`, `vasto_intermedio`.
- **Muslo Posterior / Isquiotibiales (4):** `isquiotibiales`, `biceps_femoral`, `semitendinoso`, `semimembranoso`.
- **Cadera y Pelvis (11):** `aductores_cadera`, `aductor_mayor`, `aductor_largo`, `aductor_corto`, `gracil`, `pectineo`, `iliopsoas`, `psoas_mayor`, `iliaco`, `tensor_fascia_lata`, `sartorio`, `rotadores_cadera_profundos`.
- **Pierna y Tobillo (7):** `triceps_sural`, `gastrocnemio`, `soleo`, `tibial_anterior`, `tibial_posterior`, `peroneos`.

### 3. Zona Core (10 entidades)
- **Pared Abdominal (4):** `recto_abdominal`, `oblicuo_externo`, `oblicuo_interno`, `transverso_abdominal`.
- **Raquis Posterior (3):** `erectores_espinales`, `multifidos`, `cuadrado_lumbar`.
- **Cilindro Manométrico (2):** `diafragma`, `suelo_pelvico`.

### 4. Zona Cuello (3 entidades)
- **Cervical (3):** `esternocleidomastoideo`, `esplenio_cabeza`, `escalenos`.

---

## M. EJEMPLOS DE NORMALIZACIÓN DE CARA AL PUNTO 6C

A modo de demostración de cómo el vocabulario canónico se aplicará en el Punto 6C sin alterar la identidad de los ejercicios:

### Ejemplo 1: `press-de-banca`
- **Antes:**
  - `musculos_principales`: `["pectoral_mayor"]`
  - `musculos_secundarios`: `["deltoides_anterior", "triceps_braquial"]`
  - `estabilizadores`: `["manguito_rotador", "serrato_anterior"]`
- **Evaluación:** Perfectamente alineado con el vocabulario canónico.

### Ejemplo 2: `elevacion-de-talones-de-pie`
- **Antes:**
  - `musculos_principales`: `["gemelos"]`
  - `musculos_secundarios`: `["soleo"]`
  - `estabilizadores`: `["tibial_anterior"]`
- **Normalización 6C:**
  - `musculos_principales`: `["gastrocnemio"]`
  - `musculos_secundarios`: `["soleo"]`
  - `estabilizadores`: `["tibial_anterior"]`

### Ejemplo 3: `curl-martillo-con-mancuernas`
- **Antes:**
  - `musculos_principales`: `["biceps_braquial"]`
  - `musculos_secundarios`: `["antebrazos"]`
- **Normalización 6C:**
  - `musculos_principales`: `["braquiorradial", "braquial"]`
  - `musculos_secundarios`: `["biceps_braquial", "flexores_muneca"]`

---

## 2. INTEGRIDAD Y CONTROL DE CALIDAD

1. **Archivo de Datos Oficial:** `src/data/muscles.json` (Versión 1.0.0, 84 entidades validadas).
2. **Validador Automatizado:** `scripts/validateMuscles.js` (`npm run muscles:validate`).
3. **Catálogo Maestro:** Los 109 ejercicios oficiales en `src/data/ejercicios.json` se preservan intactos con total sincronización con `public/ejercicios.json`.
