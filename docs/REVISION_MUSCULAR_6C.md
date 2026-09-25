# REGISTRO DE REVISIÓN BIOMECÁNICA Y CASOS AMBIGUOS — PUNTO 6C
**Documento Técnico Oficial — Normalización Muscular de los 109 Ejercicios**  
*Catálogo Maestro de Ejercicios — Aplicación Entreno*

---

## 1. INTRODUCCIÓN

Durante la ejecución del **Punto 6C**, cada uno de los 109 ejercicios oficiales del catálogo maestro fue analizado minuciosamente a partir de:
- Su cinemática articular y cadena cinética (abierta, cerrada o mixta).
- El vector de resistencia externo (gravedad, polea o inercia).
- El torque muscular neto demandado en cada articulación clave.
- La función fisiológica real del músculo: motor primario dinámico, co-motor secundario dinámico o fijador/estabilizador isométrico.

El presente documento registra las decisiones técnicas y biomecánicas adoptadas en aquellos ejercicios donde existían controversias habituales en la literatura deportiva o discrepancias con clasificaciones empíricas / EMG de superficie simplistas.

---

## 2. MATRIZ DE CASOS BIOMECÁNICOS DISCUTIBLES

### Caso 1: Peso Muerto Convencional (`peso-muerto-convencional`)
- **Problema:** En muchas bases de datos comerciales, los `erectores_espinales` se catalogan como músculo principal dinámico de tracción ("ejercicio de espalda").
- **Clasificación Aplicada:**
  - `musculos_principales`: `["gluteo_mayor", "isquiotibiales", "cuadriceps"]`
  - `musculos_secundarios`: `["aductor_mayor", "dorsal_ancho", "trapecio"]`
  - `estabilizadores`: `["erectores_espinales", "recto_abdominal", "transverso_abdominal", "flexores_muneca"]`
- **Alternativa Posible:** Incluir `erectores_espinales` en `musculos_principales`.
- **Decisión Adoptada:** Clasificar `erectores_espinales` estrictamente como **estabilizador isométrico**.
- **Justificación Biomecánica:** La técnica ortodoxa del peso muerto exige que la columna vertebral permanezca en neutralidad rígida sin flexo-extensión intervertebral. El trabajo concéntrico dinámico de extensión es generado en la articulación coxofemoral (glúteo e isquiotibiales) y femorotibial (cuádriceps en el despegue). Si los erectores se mueven concéntricamente, hay flexión espinal previa (pérdida de técnica). Su rol es una contracción isométrica máxima anti-flexión para transmitir el torque de la cadera a la barra.

---

### Caso 2: Isquiotibiales en Sentadilla (`sentadilla`, `sentadilla-frontal`, `sentadilla-hack`)
- **Problema:** Se suele incluir a los `isquiotibiales` como músculos secundarios o co-principales en la sentadilla.
- **Clasificación Aplicada:**
  - `musculos_principales`: `["cuadriceps", "gluteo_mayor"]`
  - `musculos_secundarios`: `["aductor_mayor", "soleo"]`
  - `estabilizadores`: `["erectores_espinales", "recto_abdominal", "transverso_abdominal"]`
- **Alternativa Posible:** Mantener `isquiotibiales` en `musculos_secundarios`.
- **Decisión Adoptada:** Excluir `isquiotibiales` como secundarios dinámicos relevantes en la sentadilla bilateral profunda, reconociendo al `aductor_mayor` como el verdadero extensor sinérgico.
- **Justificación Biomecánica (Paradoja de Lombard):** Los isquiotibiales son biarticulares: extienden la cadera pero flexionan la rodilla. Durante la fase concéntrica de la sentadilla, la cadera se extiende (acortamiento proximal) mientras la rodilla se extiende (elongación distal). La longitud neta del músculo casi no varía (contracción cuasi-isométrica estabilizadora). Además, una contracción excesiva del isquiotibial contrarrestaría el torque de extensión del cuádriceps. Estudios de resonancia magnética y EMG funcional confirman una hipertrofia nula o marginal de isquiotibiales tras protocolos de sentadilla. Por el contrario, el `aductor_mayor` (monoarticular en su porción isquiocondílea) posee un brazo de palanca extensor de cadera masivo cuando la cadera flexiona >60°.

---

### Caso 3: Elevación de Talones Sentado (`elevacion-talones-sentado`)
- **Problema:** Bases de datos no diferenciadas asignan `"gemelos"` como principal.
- **Clasificación Aplicada:**
  - `musculos_principales`: `["soleo"]`
  - `musculos_secundarios`: `["gastrocnemio", "tibial_posterior"]`
  - `estabilizadores`: `["tibial_anterior"]`
- **Alternativa Posible:** Clasificar `gastrocnemio` como co-principal.
- **Decisión Adoptada:** Clasificar exclusivamente `soleo` como principal.
- **Justificación Biomecánica:** El gastrocnemio es biarticular y cruza la rodilla. Al sentarse con la rodilla flexionada a ~90°, el gastrocnemio entra en **insuficiencia activa** (acortamiento extremo por su inserción femoral proximal), perdiendo sustancialmente su capacidad para producir tensión activa. El sóleo, siendo monoarticular y anclado únicamente a la tibia/peroné, no se ve afectado por la flexión de rodilla y asume más del 80% del torque de flexión plantar en esta postura.

---

### Caso 4: Dominadas Supinadas (`dominadas-supinadas`) vs Pronadas (`dominadas-pronadas`)
- **Problema:** Discusión sobre si el bíceps braquial es principal o secundario en tracciones verticales.
- **Clasificación Aplicada:**
  - `dominadas-pronadas`: Principales: `["dorsal_ancho"]`, Secundarios: `["braquial", "braquiorradial", "biceps_braquial", "romboides", "trapecio_inferior"]`.
  - `dominadas-supinadas`: Principales: `["dorsal_ancho", "biceps_braquial"]`, Secundarios: `["braquial", "pectoral_mayor", "romboides"]`.
- **Decisión Adoptada:** En dominadas con supinación completa, el bíceps comparte la condición de motor principal junto al dorsal ancho; en agarre prono se relega a secundario, donde el braquial asume la primacía de flexión de codo.
- **Justificación Biomecánica:** La inserción del bíceps en la tuberosidad bicipital del radio enrolla el tendón cuando el antebrazo está en pronación, colocándolo en desventaja mecánica acusada. La supinación desenrolla el tendón y alinea sus fibras en vector óptimo de tracción, permitiendo generar un torque flexor pico que iguala la contribución de tracción vertical.

---

### Caso 5: Elevación de Piernas Colgado (`elevacion-piernas-colgado`)
- **Problema:** Tradicionalmente categorizado como ejercicio exclusivamente de "abdominales inferiores".
- **Clasificación Aplicada:**
  - `musculos_principales`: `["iliopsoas", "recto_abdominal"]`
  - `musculos_secundarios`: `["oblicuo_externo", "tensor_fascia_lata"]`
  - `estabilizadores`: `["dorsal_ancho", "flexores_muneca", "serrato_anterior"]`
- **Alternativa Posible:** Clasificar sólo `recto_abdominal` como principal.
- **Decisión Adoptada:** Reconocer al `iliopsoas` como co-motor principal indispensable.
- **Justificación Biomecánica:** El recto abdominal no se inserta en el fémur; su función es aproximar la sínfisis púbica al esternón (flexión de la columna y retroversión pélvica). El movimiento angular que eleva los muslos desde la vertical hasta ~90° es puramente una flexión coxofemoral producida por el iliopsoas, sartorio y tensor de la fascia lata. El recto abdominal trabaja isométricamente en la primera mitad y se contrae concéntricamente en la segunda mitad para curvar la pelvis hacia arriba.

---

### Caso 6: Extensiones de Tríceps Tras Nuca (`extension-triceps-tras-nuca-mancuerna` y `-polea`)
- **Problema:** Asignar `triceps_braquial` indistinto vs porción anatómica específica (`triceps_cabeza_larga`), y evitar la doble contabilización jerárquica padre/hijo.
- **Clasificación Aplicada:**
  - `musculos_principales`: `["triceps_cabeza_larga"]`
  - `musculos_secundarios`: `[]`
  - `estabilizadores`: `["recto_abdominal", "manguito_rotador"]`
- **Alternativa Posible:** Usar únicamente el grupo padre `triceps_braquial` o incluir simultáneamente padre e hijo en roles distintos.
- **Decisión Adoptada:** Asignar específicamente `triceps_cabeza_larga` como único motor principal y eliminar al grupo padre `triceps_braquial` de `musculos_secundarios` para erradicar la duplicación jerárquica padre/hijo.
- **Justificación Biomecánica:** La cabeza larga del tríceps tiene su origen en el tubérculo infraglenoideo de la escápula. La posición con flexión de hombro a 180° la sitúa en su máxima elongación funcional fisiológica, colocándola en la cresta de la curva longitud-tensión activa e induciendo hipertrofia mediada por estiramiento demostrada en ensayos clínicos. Registrar simultáneamente el grupo padre (`triceps_braquial`) en secundarios generaba una doble contabilización jerárquica padre/hijo prohibida por las reglas de normalización. Siendo un movimiento monoarticular de aislamiento de extensión de codo con los hombros verticalizados, la cabeza larga lidera el torque motor principal sin sinergistas dinámicos secundarios diferenciados.

---

### Caso 7: Ejercicios Unilaterales de Cadera y Rodilla (`sentadilla-bulgara`, `peso-muerto-unilateral`)
- **Problema:** ¿Debe el `gluteo_medio` ser motor principal o estabilizador?
- **Clasificación Aplicada:**
  - `sentadilla-bulgara`: Principales: `["cuadriceps", "gluteo_mayor"]`, Estabilizadores: `["gluteo_medio", "recto_abdominal", "erectores_espinales"]`.
  - `peso-muerto-unilateral`: Principales: `["isquiotibiales", "gluteo_mayor"]`, Estabilizadores: `["gluteo_medio", "cuadrado_lumbar", "erectores_espinales", "recto_abdominal"]`.
- **Alternativa Posible:** Colocar `gluteo_medio` como motor secundario dinámico.
- **Decisión Adoptada:** Clasificar el `gluteo_medio` como **estabilizador isométrico**.
- **Justificación Biomecánica:** En el apoyo monopodal no se realiza una abducción concéntrica activa de la pierna en movimiento. La pelvis intenta caer hacia el lado no apoyado debido a la gravedad (signo de Trendelenburg); el glúteo medio del lado apoyado se contrae fuertemente de forma isométrica para mantener la pelvis horizontal en el plano coronal. Cumple a la perfección la definición 6A de estabilizador pélvico.

---

### Caso 8: Levantamientos Olímpicos (`cargada-de-potencia`, `arrancada-snatch`)
- **Problema:** Límite estándar de 1–3 músculos principales.
- **Clasificación Aplicada:**
  - `cargada-de-potencia`: `["gluteo_mayor", "isquiotibiales", "cuadriceps", "trapecio_superior"]` (4 principales).
  - `arrancada-snatch`: `["gluteo_mayor", "cuadriceps", "isquiotibiales", "trapecio_superior"]` (4 principales).
- **Decisión Adoptada:** Aplicar la excepción autorizada en la norma 6A/6B para levantamientos olímpicos, permitiendo hasta 4 motores primarios.
- **Justificación Biomecánica:** La segunda fase de tirón (second pull) involucra una triple extensión sincronizada y violenta de tobillo, rodilla y cadera, acoplada inmediatamente a una elevación balística escapular (encogimiento de trapecio superior a >2 m/s). Omitir el trapecio superior o la musculatura de cadera/rodilla desvirtuaría la naturaleza mecánica del levantamiento.

---

### Caso 9: Paseo del Granjero (`paseo-del-granjero`)
- **Problema:** En un ejercicio de acarreo donde no hay flexo-extensión articular evidente en las extremidades superiores, ¿cuál es el músculo principal?
- **Clasificación Aplicada:**
  - `musculos_principales`: `["trapecio_superior", "flexores_muneca"]`
  - `musculos_secundarios`: `["cuadriceps", "gluteo_mayor", "gastrocnemio"]`
  - `estabilizadores`: `["cuadrado_lumbar", "gluteo_medio", "recto_abdominal", "erectores_espinales"]`
- **Decisión Adoptada:** Reconocer el `trapecio_superior` (soporte axial anti-depresión escapular) y los `flexores_muneca` (fuerza de prensión) como los generadores principales del objetivo del ejercicio (tolerancia a la tracción gravitatoria de la carga).
- **Justificación Biomecánica:** Aunque la locomoción desplaza la masa, el factor limitante de rendimiento y objetivo neuromuscular del ejercicio es resistir la fuerza de desprendimiento de los dedos y el descenso escapular bajo cargas corporales o supercorporales.

---

### Caso 10: Curl Martillo con Mancuernas (`curl-martillo-mancuernas`)
- **Problema:** ¿Bíceps braquial como principal frente a flexores accesorios?
- **Clasificación Aplicada:**
  - `musculos_principales`: `["braquiorradial", "braquial"]`
  - `musculos_secundarios`: `["biceps_braquial"]`
  - `estabilizadores`: `["deltoides_anterior", "flexores_muneca"]`
- **Alternativa Posible:** Mantener `biceps_braquial` como principal.
- **Decisión Adoptada:** Situar al `braquiorradial` y `braquial` como motores dominantes.
- **Justificación Biomecánica:** El agarre neutro coloca al antebrazo a medio camino entre pronación y supinación. En esta posición anatómica, el radio rota de tal manera que el brazo de palanca del braquiorradial para la flexión alcanza su eficacia óptima. Al mismo tiempo, el bíceps pierde parte de su eficacia de palanca por no estar completamente supinado, y el braquial (que se inserta en el cúbito) genera fuerza constante independientemente de la rotación radiocubital.

---

## 3. CONCLUSIÓN Y ESTADO DEL CATÁLOGO

La resolución de estos 10 casos consolida una base de datos muscular consistente, biomecánicamente defendible y libre de asignaciones dogmáticas o superficiales.
Todos los ejercicios ahora alimentan de forma unívoca el sistema de taxonomía oficial (`src/data/muscles.json`), posibilitando que las subsiguientes etapas de cálculo y arquitectura determinista se construyan sobre cimientos anatómicos fiables.
