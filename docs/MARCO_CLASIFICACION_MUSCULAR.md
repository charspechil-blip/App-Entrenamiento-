# MARCO DE CLASIFICACIÓN MUSCULAR DEL CATÁLOGO MAESTRO (PUNTO 6A)

**Documento:** Marco Conceptual y Metodológico de Clasificación Muscular  
**Proyecto:** Entreno — Catálogo Maestro de Ejercicios  
**Fase:** PUNTO 6A (Exclusivamente Conceptual — Sin alteración de base de datos)  
**Versión:** 1.0.0  
**Fecha de Publicación:** 22 de Septiembre de 2026  
**Dependencias:** Punto 3A (Marco Biomecánico), Punto 3B (Taxonomía), Punto 3C (Normalización Canónica)  

---

## 1. INTRODUCCIÓN Y ALCANCE

El presente documento establece el **Marco Científico, Biomecánico y Kinesiológico** que rige la determinación de la función muscular en el Catálogo Maestro de Ejercicios de Entreno.

Tradicionalmente, las aplicaciones de entrenamiento cometen uno de dos errores estructurales:
1. **Reduccionismo hipertrofiado:** Catalogan como "músculo principal" a cualquier músculo que registre señal electromiográfica o sensación de fatiga subjetiva, desdibujando la arquitectura motriz real del ejercicio.
2. **Ambigüedad funcional:** Agrupan bajo una misma etiqueta músculos que producen el par de torsión (torque) dinámico necesario para vencer la resistencia externa junto con aquellos que únicamente fijan la postura esquelética de soporte.

El objetivo de este marco es proporcionar un **sistema determinista, verificable y reproducible** para distinguir:
- Qué músculos son los **motores principales** de la acción (responsables del torque angular primario).
- Qué músculos son **secundarios** (asistentes mecánicos directos o co-motores sinérgicos).
- Qué músculos actúan como **estabilizadores** (fijadores articulares, estabilizadores posturales y co-contracciones de seguridad articular).

> **REGLA DE CONSERVACIÓN:** Este documento es estrictamente conceptual. Ningún archivo JSON del catálogo ni relación existente es modificada en esta fase.

---

## 2. FUNDAMENTOS CIENTÍFICOS Y MARCO KINESIOLÓGICO

Este marco se sustenta en los principios de la mecánica musculoesquelética clásica y la kinesiología moderna, integrando la literatura biomecánica de referencia:

1. **Biomecánica Articular y Mecánica Muscular:**
   - *Neumann, D. A. (2016).* Kinesiology of the Musculoskeletal System: Foundations for Rehabilitation. Mosby/Elsevier.
   - *Kapandji, I. A. (2019).* Fisiología Articular (Tomos 1, 2 y 3). Editorial Médica Panamericana.
   - *Nordin, M., & Frankel, V. H. (2012).* Basic Biomechanics of the Musculoskeletal System. Lippincott Williams & Wilkins.
   - *Zatsiorsky, V. M., & Prilutsky, B. I. (2012).* Biomechanics of Skeletal Muscles. Human Kinetics.
2. **Entrenamiento de Fuerza y Adaptación Estructural:**
   - *Schoenfeld, B. J. (2020).* Science and Development of Muscle Hypertrophy. Human Kinetics.
   - *Zatsiorsky, V. M., & Kraemer, W. J. (2006).* Science and Practice of Strength Training. Human Kinetics.
3. **Análisis Crítico de la Electromiografía (EMG):**
   - *Vigotsky, A. D., Halperin, I., Lehman, G. J., Trajano, G. S., & Vieira, T. M. (2018).* Interpreting Signal Ampitude in Surface Electromyography Studies in Sport and Rehabilitation Sciences. *Frontiers in Physiology*, 8, 985.
   - *De Luca, C. J. (1997).* The use of surface electromyography in biomechanics. *Journal of Applied Biomechanics*, 13(2), 135-163.

---

## 3. ELECTROMIOGRAFÍA (EMG) VS. FUNCIÓN MECÁNICA

Un principio biomecánico cardinal de este marco es que **la amplitud de la señal electromiográfica de superficie (sEMG) NO determina la condición de músculo principal**.

### 3.1. ¿Por qué EMG ≠ Contribución Mecánica?

La sEMG registra la actividad bioeléctrica que despolariza el sarcolema (potenciales de acción de unidades motoras), pero no mide la fuerza de salida ni el momento articular neto por las siguientes razones físicas y fisiológicas:

1. **Relación Longitud-Tensión Sarcómerica:**  
   Un músculo acortado activamente (por ejemplo, los isquiotibiales en flexión máxima de rodilla y cadera neutra) puede registrar una amplitud EMG masiva debido al reclutamiento neural compensatorio para sostener la tensión en un estado de insuficiencia activa, a pesar de que su capacidad real para producir fuerza útil o torque sobre la articulación está profundamente deprimida.
2. **Brazo de Momento Interno ($d_{\perp}$):**  
   El torque articular ($\tau$) es el producto de la fuerza muscular por la distancia perpendicular desde la línea de acción tendinosa al eje de rotación articular ($\tau = F_{musc} \cdot d_{\perp}$). Un músculo con gran actividad EMG pero un brazo de momento milimétrico produce una fracción minúscula del torque de la articulación comparado con un músculo con mayor ventaja mecánica.
3. **Velocidad de Acortamiento (Curva Fuerza-Velocidad de Hill):**  
   A altas velocidades dinámicas o en desaceleraciones excéntricas, la amplitud EMG varía sustancialmente sin correlacionar linealmente con la tensión intramioplasmática o la tensión pasiva del tejido conectivo (titina, colágeno epimisial).
4. **Diafonía (*Crosstalk*) y Espesor del Tejido Subcutáneo:**  
   Electrodos de superficie capturan señales procedentes de vientres musculares adyacentes, y la impedancia de la grasa subcutánea atenúa la señal de músculos profundos (p. ej., vasto intermedio, psoas mayor, transverso abdominal) mientras sobrestima la de superficiales (p. ej., recto anterior, tensor de la fascia lata).

### 3.2. Criterio de Selección del Catálogo
Para clasificar un músculo como principal o secundario, el Catálogo Maestro de Entreno utiliza la **función mecánica y el momento articular generado**, evaluado mediante:
$$\tau_{articular} = \sum (\vec{F}_{muscular} \times \vec{r})$$
donde la capacidad de un músculo de generar trabajo mecánico contra la resistencia externa y su ventaja de brazo de palanca priman sobre picos de amplitud electrofisiológica aislada.

---

## 4. DEFINICIONES OPERATIVAS Y TAXONOMÍA DE LAS TRES CATEGORÍAS

El modelo divide la participación muscular en tres categorías de datos en el catálogo:

```
                  ┌─────────────────────────────────┐
                  │    PARTICIPACIÓN MUSCULAR       │
                  └────────────────┬────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     MÚSCULO     │       │     MÚSCULO     │       │                 │
│    PRINCIPAL    │       │   SECUNDARIO    │       │  ESTABILIZADOR  │
│  (Motor Primario│       │  (Co-motor /    │       │ (Fijador /      │
│   / Agonista)   │       │   Sinergista)   │       │  Soporte)       │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### 4.1. Músculo Principal (`musculos_principales`)

> **Definición Operativa:**  
> Es aquel músculo (o grupo funcional sinérgico indivisible) cuya contracción genera la **fuerza impulsora predominante** y el **mayor porcentaje del torque articular neto** requerido para desplazar la carga o realizar la acción objetivo del ejercicio a través del rango de movimiento previsto.

#### Criterios de Inclusión:
1. **Línea de acción óptima:** Su orientación fascicular coincide directamente con el plano de movimiento del ejercicio.
2. **Gran brazo de palanca interno:** Posee una ventaja mecánica angular sustancial respecto al eje articular implicado.
3. **Foco del ejercicio:** Es el objetivo anatómico primario para el cual biomecánicamente se prescribe el ejercicio en los programas de hipertrofia o fuerza.
4. **Dependencia crítica:** Si este músculo sufriera una denervación o parálisis, el ejercicio sería biomecánicamente imposible de ejecutar en su patrón motriz característico.

### 4.2. Músculo Secundario (`musculos_secundarios`)

> **Definición Operativa:**  
> Es aquel músculo que contribuye activamente de forma dinámica a la aceleración angular o desaceleración controlada de una o más articulaciones involucradas en el ejercicio, pero cuya **magnitud de torque producido es complementaria**, actúa en una articulación satélite dentro de una cadena multiarticular, o asiste al motor principal en ángulos específicos del rango de movimiento.

#### Criterios de Inclusión:
1. **Sinergia motriz dinámica:** Produce movimiento angular concéntrico/excéntrico en una articulación activa.
2. **Subordinación mecánica:** Aporta una fracción menor del trabajo mecánico neto respecto al músculo principal, o comparte el torque de extensión/flexión en una articulación secundaria de la cadena cinética.
3. **Capacidad de sustitución compensatoria:** Si el motor principal se fatiga, el secundario incrementa su reclutamiento, pero por sí solo no puede sostener la cinemática óptima del ejercicio sin alterar la trayectoria.

### 4.3. Estabilizador (`estabilizadores`)

> **Definición Operativa:**  
> Es aquel músculo cuya función predominante durante el ejercicio es **isométrica o cuasi-isométrica**, actuando para mantener la alineación esquelética, neutralizar momentos de traslación o rotación no deseados producidos por los motores primarios, o transferir fuerzas de manera rígida entre cadenas cinéticas sin producir desplazamiento angular significativo en su articulación de anclaje.

#### Criterios de Inclusión:
1. **Acción isométrica dominante:** No modifica significativamente su longitud fascicular macroscópica durante el ciclo de repetición.
2. **Neutralización de fuerzas parasitarias:** Contrarresta momentos de cizallamiento o momentos rotacionales espurios (ej. glúteo medio en plano frontal durante sentadilla búlgara; transverso y oblicuos en flexiones).
3. **Rigidez estructural y anclaje proximal:** Provee una base sólida (*proximal stability for distal mobility*) sobre la cual los músculos motores pueden traccionar eficazmente (ej. manguito rotador estabilizando la cabeza humeral durante el press de banca; erectores espinales sosteniendo el raquis en peso muerto).

---

## 5. RESOLUCIÓN DE CONCEPTOS INTERMEDIOS: SINERGISTAS Y FIJADORES

La literatura kinesiológica clásica (Neumann, Rasch & Burke, Kapandji) menciona con frecuencia términos como *sinergista asistente*, *sinergista verdadero*, *neutralizador* y *fijador*. Es indispensable definir cómo se mapean estos conceptos al Catálogo Maestro:

| Concepto Clásico | Definición Mecánica | Categoría Canónica en Entreno | Justificación Arquitectural |
| :--- | :--- | :--- | :--- |
| **Agonista Primario** | Motor angular primario | `musculos_principales` | Núcleo del estímulo de fuerza/hipertrofia. |
| **Sinergista Concurrente / Asistente** | Ayuda al motor primario en el mismo movimiento angular | `musculos_secundarios` | Es un productor de movimiento dinámico; separar sinergistas en un cuarto array generaría complejidad innecesaria sin valor computacional añadido. |
| **Sinergista Neutralizador** | Contrarresta movimientos articulares accesorios no deseados generados por el agonista | `estabilizadores` | Su trabajo es predominantemente isométrico/estabilizador. |
| **Fijador (*Fixator*)** | Ancla el origen óseo de un músculo para que la inserción traccione con eficacia | `estabilizadores` | Un fijador es la definición técnica por excelencia de un estabilizador proximal. |

> **Decisión Arquitectónica:**  
> El Catálogo Maestro mantendrá **exactamente 3 dimensiones musculares**:  
> `musculos_principales`, `musculos_secundarios` y `estabilizadores`.  
> No se creará una colección separada para "sinergistas" ni "fijadores". Los sinergistas de propulsión dinámica se integran en `musculos_secundarios`, y los fijadores/neutralizadores se integran en `estabilizadores`.

---

## 6. ANÁLISIS DE CASOS COMPLEJOS Y TIPOLOGÍAS DE EJERCICIO

### 6.1. Ejercicios Multiarticulares Complejos
En movimientos compuestos multiarticulares, múltiples palancas óseas rotan al unísono. Clasificar todos los músculos activos como "principales" destruiría la utilidad del catálogo.

- **Sentadilla Trasera con Barra:**
  - *Extensión de rodilla + Extensión de cadera:*
  - `musculos_principales`: `cuadriceps`, `gluteo_mayor` (producen los mayores momentos de extensión articular del tren inferior).
  - `musculos_secundarios`: `aductor_mayor` (potente extensor de cadera en flexión profunda), `isquiotibiales` (co-contracción de protección del ligamento cruzado anterior y extensión tardía de cadera).
  - `estabilizadores`: `erectores_espinales` (mantienen la lordosis lumbar contra el momento flexor del tronco), `recto_abdominal`, `transverso_abdominal` (presión intraabdominal), `gluteo_medio` (evita el valgo dinámico de rodilla).
- **Paradoja de Lombard en Sentadilla y Peso Muerto:**  
  Los isquiotibiales y el recto femoral son biarticulares y se cruzan en cadera y rodilla con acciones opuestas. En la sentadilla, la variación del brazo de palanca según la flexión permite la co-contracción sin anular el movimiento: el cuádriceps posee mayor brazo de momento en la rodilla y el glúteo mayor/aductor mayor en la cadera. Por ello, los isquiotibiales actúan como sinergistas estabilizadores y no como motores primarios en la fase concéntrica de la sentadilla profunda.
- **Press de Banca Plano:**
  - `musculos_principales`: `pectoral_mayor` (porción esternal y clavicular).
  - `musculos_secundarios`: `triceps_braquial` (extensión de codo), `deltoides_anterior` (flexión de hombro).
  - `estabilizadores`: `manguito_rotador` (centrado de cabeza humeral en cavidad glenoidea), `serrato_anterior`, `romboides` (fijación escapular en retracción y depresión).

### 6.2. Ejercicios de Aislamiento (Monoarticulares)
En ejercicios monoarticulares, la cinemática articular está restringida a un único eje de giro.
- **Regla General:** Normalmente poseen **1 único músculo principal** (o un grupo anatómico sinérgico unificado, como el bíceps braquial + braquial anterior en el curl).
- **Curl de Bíceps con Barra:**
  - `musculos_principales`: `biceps_braquial`, `braquial_anterior`.
  - `musculos_secundarios`: `braquiorradial`, `pronador_redondo`.
  - `estabilizadores`: `deltoides_anterior` (fija el brazo contra el torso), `flexores_de_la_muneca`, `recto_abdominal` (evita hiperextensión lumbar de inercia).
- **Extensión de Cuádriceps en Máquina:**
  - `musculos_principales`: `cuadriceps` (vasto lateral, vasto medial, vasto intermedio, recto femoral).
  - `musculos_secundarios`: ninguno (movimiento puramente monoarticular guiado).
  - `estabilizadores`: `recto_abdominal` (anclaje de pelvis al respaldo mediante el agarre de manos).

### 6.3. Ejercicios Isométricos Estáticos
En los ejercicios isométricos no existe un cambio en el ángulo articular macroscópico, por lo que el criterio tradicional de "motor del movimiento" parecería no aplicar si se define solo como movimiento dinámico.
- **Criterio Biomecánico Operativo para Isometría:**
  $$\sum \vec{M} = 0 \quad (\text{Equilibrio estático de momentos})$$
  El músculo principal en una isometría es aquel que genera la **fuerza interna de resistencia contra la fuerza gravitatoria o de palanca externa que intenta romper la postura**.
- **Plancha Abdominal Frontal (*Front Plank*):**
  - La gravedad crea un momento de extensión de la columna lumbar y anteversión pélvica.
  - `musculos_principales`: `recto_abdominal`, `transverso_abdominal` (generan el momento anti-extensión y retroversión pélvica indispensable).
  - `musculos_secundarios`: `oblicuo_externo`, `oblicuo_interno`, `iliopsoas`.
  - `estabilizadores`: `cuadriceps` (mantiene rodillas en extensión), `serrato_anterior` (evita escápula alada), `gluteo_mayor`.
- **Sentadilla Isométrica en Pared (*Wall Sit*):**
  - La gravedad genera un momento flexor en rodillas y caderas.
  - `musculos_principales`: `cuadriceps`.
  - `musculos_secundarios`: `gluteo_mayor`.
  - `estabilizadores`: `gemelos`, `soleo`, `tibial_anterior`.

### 6.4. Ejercicios Específicos de Core: Anti-Movimiento vs. Dinámicos
El "core" o complejo lumbo-pélvico-femoral desempeña funciones duales:
1. **Acción de Anti-Movimiento (Anti-extensión, Anti-rotación, Anti-flexión lateral):**
   - Aquí los músculos de la pared abdominal son los **principales ejecutores del objetivo del ejercicio**, a pesar de actuar isométricamente, porque la demanda de resistencia externa está calculada para sobrecargar precisamente su capacidad de fijación raquídea.
   - *Press Pallof:* `oblicuo_interno`, `oblicuo_externo`, `transverso_abdominal` son `musculos_principales` (momento anti-rotacional); `gluteo_medio` y `deltoides` son `estabilizadores`.
   - *Rueda Abdominal (*Ab Wheel*):* `recto_abdominal` es `musculo_principal` (anti-extensión masiva); `dorsal_ancho` y `triceps` son `musculos_secundarios` (extensión de hombro); `gluteo_mayor` es `estabilizador`.
2. **Acción Dinámica del Tronco:**
   - *Crunch Abdominal:* `recto_abdominal` es `musculo_principal` (flexión espinal dinámica concéntrica/excéntrica); `oblicuos` son `musculos_secundarios`.
   - *Giros Rusos:* `oblicuo_externo` y `oblicuo_interno` son `musculos_principales` (rotación axial dinámica).

### 6.5. Ejercicios Unilaterales y Demandas Asimétricas
Al pasar de un ejercicio bilateral a uno unilateral (ej. de sentadilla trasera a sentadilla búlgara o zancada):
1. **Aparición de Momentos en el Plano Frontal y Transversal:**
   En un apoyo monopodal, la gravedad tracciona la hemipelvis libre hacia abajo (momento aductor y de caída pélvica Trendelenburg).
2. **Reconfiguración Muscular:**
   - El `gluteo_medio` y el `tensor_de_la_fascia_lata` del lado de apoyo pasan de ser estabilizadores menores en la sentadilla bilateral a **estabilizadores críticos de alto reclutamiento** o sinergistas indispensables en la versión unilateral.
   - La musculatura contralateral del tronco (`cuadrado_lumbar`, `oblicuos`) se activa fuertemente como estabilizador para evitar la inclinación lateral del raquis.
3. **Mantenimiento del Motor:**
   Los motores primarios articulares de extensión de rodilla y cadera (`cuadriceps`, `gluteo_mayor`) se mantienen como `musculos_principales`, pero la lista de `estabilizadores` se enriquece con la musculatura pélvica lateral y abdominal oblicua.

### 6.6. Ejercicios Multiplanares y Cadenas Complejas
En movimientos tridimensionales con fases articuladas sucesivas (ej. *Turkish Get-Up* o levantamiento turco):
- No es biomecánicamente correcto forzar un único músculo principal. El movimiento transiciona de una flexión de tronco a una elevación de cadera, zancada y bipedestación con sostén cenital de carga.
- En estos casos, se definen como `musculos_principales` los núcleos funcionales de mayor demanda integrada (`deltoides`, `oblicuo_externo`, `gluteo_mayor`, `cuadriceps`), asignando a `estabilizadores` las articulaciones de soporte (`manguito_rotador`, `erectores_espinales`, `gluteo_medio`).

---

## 7. DINÁMICA CONTEXTUAL Y RELATIVIDAD MUSCULAR

Un postulado esencial de este marco es que **ningún músculo tiene asignada una función intrínseca o absoluta en el vacío; su rol depende exclusivamente de la arquitectura del ejercicio**.

### Matriz de Relatividad Funcional:
| Músculo | Como Motor Principal | Como Músculo Secundario | Como Estabilizador |
| :--- | :--- | :--- | :--- |
| **Deltoides Anterior** | *Press Militar*, *Elevaciones Frontales* | *Press de Banca Plano*, *Fondos en Paralelas* | *Sentadilla Frontal* (soporte de barra) |
| **Dorsal Ancho** | *Dominadas*, *Jalón al Pecho*, *Pull-over* | *Remo con Barra*, *Remo Gironda* | *Peso Muerto* (bloqueo de barra contra espinillas) |
| **Erectores Espinales** | *Extensiones de Espalda en Banco 45°* | *Buenos Días*, *Peso Muerto Rumano* | *Sentadilla Trasera*, *Press Militar de Pie* |
| **Glúteo Mayor** | *Hip Thrust*, *Puente de Glúteos* | *Sentadilla Trasera*, *Prensa de Piernas* | *Plancha Abdominal Frontal*, *Paseo del Granjero* |
| **Tríceps Braquial** | *Press Francés*, *Extensiones en Polea* | *Press de Banca*, *Fondos en Paralelas* | *Lanzamiento de Balón Medicinal* |
| **Glúteo Medio** | *Abducción de Cadera en Polea* | *Sentadilla Búlgara*, *Step-up* | *Sentadilla Trasera*, *Paseo del Granjero*, *Press Pallof* |

---

## 8. FASES DEL MOVIMIENTO: ¿MODELO ESTÁTICO O MODELO POR FASES?

La activación y el tipo de tensión muscular varían significativamente a lo largo del ciclo de repetición:
- **Fase Excéntrica:** Desaceleración y acumulación de energía elástica tendinosa con elongación muscular.
- **Fase Concéntrica:** Aceleración angular contra la resistencia con acortamiento sarcomérico activo.
- **Fase Isométrica de Transición:** Punto de inversión articular (*sticking point*).

### Decisión de Arquitectura:
- **Para el Catálogo Maestro:** Se almacena la **función macroscópica unificada** del ejercicio. Introducir subdivisiones por fase (`musculos_principales_fase_concentrica` vs `fase_excentrica`) sobrecargaría el catálogo estático y complicaría la búsqueda, el filtrado y la representación en la UI.
- **Para el Futuro Motor Determinista:** El motor computará, a nivel de ejecución dinámica en tiempo de rutina, cómo varía la tensión en estiramiento según el perfil de resistencia de la máquina o peso libre (ej. mayor tensión excéntrica en peso muerto rumano vs. pico concéntrico en hip thrust).

---

## 9. CRITERIO JERÁRQUICO Y LÍMITES DE CARDINALIDAD

Para garantizar que los datos sean computables y descriptivos, se fijan directrices de cardinalidad por ejercicio:

```
┌────────────────────────────────────────────────────────┐
│              LÍMITES DE CARDINALIDAD                   │
├──────────────────────────┬─────────────────────────────┤
│ musculos_principales     │  1 a 3 músculos (máximo 4   │
│                          │  en olímpicos/complejos)    │
├──────────────────────────┼─────────────────────────────┤
│ musculos_secundarios     │  0 a 5 músculos             │
├──────────────────────────┼─────────────────────────────┤
│ estabilizadores          │  1 a 5 músculos             │
└──────────────────────────┴─────────────────────────────┘
```

### Justificación de los Límites:
1. **Evitar la Dilución Informativa:** Si un ejercicio declara 10 músculos principales, la métrica pierde poder resolutivo: para el algoritmo de volumen semanal, parecería que el ejercicio entrena por igual todas esas regiones.
2. **Prioridad Mecánica:**  
   $$\text{MÚSCULO PRINCIPAL} > \text{MÚSCULO SECUNDARIO} > \text{ESTABILIZADOR}$$
   Un músculo solo asciende a principal si su contribución es insustituible y primordial para el torque neto del ejercicio.

---

## 10. PRINCIPIOS DE VOCABULARIO CONTROLADO Y GRANULARIDAD

En el Punto 6B se normalizará la taxonomía de identificadores de músculos. El presente marco establece las directrices que deberá respetar:

1. **Nivel Anatómico Apropiado:**  
   Ni hiper-académico molecular ni vulgarmente impreciso.
   - *Inadecuado por exceso de descomposición:* Tratar `vasto_lateral`, `vasto_medial`, `vasto_intermedio` y `recto_femoral` como músculos principales separados en la sentadilla. Se utiliza el grupo funcional canónico `cuadriceps` cuando todos sus componentes actúan al unísono.
   - *Inadecuado por defecto de precisión:* Utilizar `"pierna"`, `"espalda"`, `"brazo"` o `"core"`. El término `"core"` **no es un músculo**; es una región funcional compuesta por transverso, recto abdominal, oblicuos, multífidos y erectores.
2. **Distinción Anatómica Obligatoria donde la Mecánica Difiera:**
   - Hombro: `deltoides_anterior`, `deltoides_lateral`, `deltoides_posterior` (tienen líneas de tracción y momentos completamente opuestos).
   - Glúteo: `gluteo_mayor` (extensión sagital potente) vs. `gluteo_medio` (abducción frontal y estabilidad pélvica).
   - Abdomen: `recto_abdominal` vs. `transverso_abdominal` vs. `oblicuo_externo` / `oblicuo_interno`.
3. **Formato Sintáctico:**
   - Singular canónico (`cuadriceps`, `dorsal_ancho`, `biceps_braquial`, `mancuerna`).
   - `snake_case` sin caracteres especiales ni tildes para uso programático seguro.

---

## 11. FRONTERA DE SEPARACIÓN: CATÁLOGO ESTÁTICO VS. MOTOR DINÁMICO

Es crítico preservar la pureza del Catálogo Maestro frente a las variables del registro dinámico de sesión.

| Variable | Pertenece al Catálogo Maestro | Pertenece al Registro de Sesión / Motor | Justificación |
| :--- | :---: | :---: | :--- |
| **Músculo Principal / Secundario** | **SÍ** | No | Propiedad biomecánica intrínseca del movimiento. |
| **Estabilizadores Principales** | **SÍ** | No | Arquitectura postural estructural constante. |
| **Lateralidad del Ejercicio (`unilateral`)** | **SÍ** | No | Característica del diseño del ejercicio. |
| **Lado trabajado (Derecho vs Izquierdo)** | No | **SÍ** | Dato coyuntural de la sesión del usuario. |
| **Fatiga Muscular Acumulada** | No | **SÍ** | Estado biológico temporal dependiente de series y RIR. |
| **Grado de Activación Percibida (RPE/DOMS)**| No | **SÍ** | Fenómeno subjetivo y variable entre individuos. |
| **Volumen de Series Efectivas por Músculo** | No | **SÍ** | Métrica calculada por el Motor Determinista. |
| **Asimetrías de Fuerza (izq vs der)** | No | **SÍ** | Resultado empírico del análisis de rendimiento. |

---

## 12. IMPACTO Y PREPARACIÓN PARA EL MOTOR DETERMINISTA

Al estructurar formalmente las tres categorías de participación muscular (`principales`, `secundarios`, `estabilizadores`), el Catálogo Maestro deja sentadas las bases para que el **futuro Motor Determinista de Entreno** pueda realizar análisis algorítmicos avanzados sin heurísticas improvisadas:

1. **Cálculo de Volumen Semanal Efectivo (Series Directas vs. Indirectas):**
   - Músculos Principales: $1.0$ serie directa.
   - Músculos Secundarios: Factor de ponderación fraccionaria determinista (p. ej., $0.5$ series indirectas).
   - Estabilizadores: Factor de estrés postural o índice de fatiga isométrica (p. ej., control de carga lumbar axial).
2. **Prevención de Fatiga Muscular Cruzada e Interferencia:**
   - Si un usuario realiza `press-militar-barra` el lunes (tríceps como secundario y deltoides anterior como principal), el motor puede alertar o dosificar inteligentemente la carga de `press-banca-plano-barra` el martes.
3. **Mapeo de Solapamiento y Cobertura de Rutina:**
   - Determinación matemática de si una rutina semanal cubre equilibradamente la musculatura agonista y antagonista sin desbalances posturales crónicos.

---

## 13. CONCLUSIONES Y PASOS SIGUIENTES

El **Punto 6A** dota al proyecto Entreno de un marco biomecánico riguroso, respaldado por la literatura científica y libre de la falacia reduccionista del "EMG = músculo principal".

### Hoja de Ruta Inmediata:
1. **Punto 6B — Taxonomía Muscular y Vocabulario Controlado:**  
   Definir el listado canónico exhaustivo de identificadores musculares permitidos (`cuadriceps`, `gluteo_mayor`, `deltoides_anterior`, etc.), sus sinónimos y su correspondencia anatómica.
2. **Punto 6C — Normalización Muscular de los 109 Ejercicios:**  
   Auditar y actualizar con precisión las listas `musculos_principales`, `musculos_secundarios` y `estabilizadores` en `src/data/ejercicios.json`, verificando la coherencia con `scripts/validateCatalog.js` y sincronizando con `public/ejercicios.json`.
