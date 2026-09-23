# MARCO BIOMECÁNICO DE REFERENCIA — CATÁLOGO MAESTRO DE ENTRENO
**Fase de Arquitectura:** Punto 3A — Marco Biomecánico de Referencia  
**Estado:** Documento Conceptual Oficial (Sin modificaciones en base de código ni catálogo)  
**Destino:** Especificación de ingeniería conceptual para el futuro Motor Determinista de Entreno  

---

## 1. INTRODUCCIÓN Y PROPÓSITO DEL MARCO

El Catálogo Maestro de Entreno recopila actualmente 109 ejercicios base. Para que este catálogo opere como la base de un **Motor Determinista de Prescripción, Sustitución y Análisis de Fatiga**, es imprescindible dotarlo de un vocabulario formal e inequívoco.

Este marco responde a una necesidad técnica concreta:
* **No pretende ser un tratado enciclopédico de biomecánica de laboratorio**, ni modelar cinemática 3D por captura de movimiento.
* **Pretende definir qué variables físicas y mecánicas son estables, discriminantes y computables** para comparar ejercicios, derivar sustitutos legítimos ante limitaciones lesionales o de material, y calcular la superposición de fatiga articular y muscular.

### La Distinción Fundamental de los Tres Niveles

Para evitar el error común en el software deportivo de fusionar anatomía, taxonomía organizativa y prescripción metodológica en una sola etiqueta (por ejemplo, clasificar un press como "Pecho / Fuerza"), el marco establece tres estratos conceptuales estrictamente aislados:

```
┌────────────────────────────────────────────────────────────────────────┐
│ NIVEL A: BIOMECÁNICA (Hecho Físico Inmutable)                          │
│ Describe cómo interactúa mecánicamente el cuerpo con el entorno.       │
│ • Articulaciones comprometidas y grados de libertad                   │
│ • Movimientos articulares angulares producidos                         │
│ • Cadena cinética (abierta / cerrada) y planos predominantes           │
│ • Naturaleza de la resistencia y vector gravitatorio/externo           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Describe
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ NIVEL B: TAXONOMÍA DEL EJERCICIO (Clasificación Estructural)           │
│ Agrupación lógica y canónica del catálogo para su navegación y reglas. │
│ • Patrón motor fundamental (empuje horizontal, bisagra de cadera...)   │
│ • Familia de movimiento (sentadillas, remos, presses...)               │
│ • Complejidad motora y estructura anatómica diana                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Se utiliza para
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ NIVEL C: FUNCIÓN DEL ENTRENAMIENTO (Prescripción y Adaptación)         │
│ Describe el estímulo biológico y el rol programático en la sesión.     │
│ • Fuerza máxima, hipertrofia sarcoplasmática, potencia, R.O.M.         │
│ • Ubicación en la sesión (ejercicio principal, accesorio, corrector)  │
│ • Volumen prescrito, RIR/RPE y tempo de ejecución                     │
└────────────────────────────────────────────────────────────────────────┘
```

> **Regla de Aislamiento:** Ninguna variable del Nivel A debe depender de cómo el entrenador programe el ejercicio (Nivel C), y ninguna variable del Nivel C debe alterar la cinemática fija del movimiento (Nivel A).

---

## A. FUNDAMENTOS BIOMECÁNICOS

Se definen a continuación los conceptos analíticos que sustentan la descripción del ejercicio:

1. **Cinemática Articular:** Estudio del movimiento osteocinemático relativo entre segmentos óseos adyacentes alrededor de un centro de rotación articular, sin considerar las fuerzas que lo causan. Se expresa en grados angulares y movimientos normalizados (flexión, extensión, abducción, aducción, rotaciones).
2. **Cadena Cinética:** Sistema de segmentos corporales interconectados por articulaciones donde el movimiento de un eslabón puede condicionar o influir en el movimiento de los eslabones continuos.
   * *Cadena Cinética Abierta (CCA):* El segmento terminal distal (mano o pie) es libre de moverse en el espacio respecto al tronco, y la carga se mueve hacia o desde el cuerpo sin fijación distal (ej. curl de bíceps, extensión de cuádriceps en máquina, press con mancuernas).
   * *Cadena Cinética Cerrada (CCC):* El segmento terminal distal se encuentra fijado a una superficie rígida o soporte inamovible (suelo, barra de dominadas, barras paralelas), de modo que el esfuerzo desplaza la masa corporal central sobre los apoyos distales (ej. sentadilla, flexión de brazos, fondos, dominadas).
   * *Cadena Híbrida / Mixta:* Situaciones donde uno de los extremos se desplaza sobre una guía fija o un patín con vector resistido o donde hay apoyo unipodal dinámico (ej. empuje de trineo, zancada caminando, prensa de piernas si se evalúa desde la convención de Steindler frente a la biomecánica contemporánea).
3. **Plano de Movimiento:** Marco de referencia cartesiano tridimensional en posición anatómica:
   * *Plano Sagital:* Divide el cuerpo en mitad izquierda y derecha; alberga movimientos de flexión y extensión (eje perlatrateral o frontal-horizontal).
   * *Plano Frontal (o Coronal):* Divide el cuerpo en mitad anterior y posterior; alberga abducción, aducción y flexión lateral (eje anteroposterior).
   * *Plano Transversal (u Horizontal):* Divide el cuerpo en mitad superior e inferior; alberga rotaciones internas, externas y aducciones/abducciones horizontales (eje longitudinal o vertical).
4. **Acción Muscular:** Término biomecánico riguroso que sustituye a "tipo de contracción" (ya que el músculo siempre genera tensión activa mediante puentes cruzados de actina-miosina, pero no siempre se "contrae" acortando su distancia macroscópica):
   * *Dinámica Concéntrica:* Tensión interna superior al torque de la resistencia externa; la distancia origen-inserción disminuye ($T_{muscular} > T_{resistencia}$).
   * *Dinámica Excéntrica:* Tensión interna inferior al torque externo controlado; la distancia origen-inserción aumenta mientras se frena o disipa energía ($T_{muscular} < T_{resistencia}$).
   * *Isométrica (Estática):* Tensión muscular equivalente al torque externo; la longitud macroscópica músculo-tendinosa se mantiene constante ($T_{muscular} = T_{resistencia}$).
5. **Brazo de Momento ($d_\perp$) y Torque ($\tau$):** 
   * La fuerza muscular no actúa en línea recta sobre los objetos, sino que produce rotación articular: $\tau = F \times d_\perp$, donde $d_\perp$ es la distancia perpendicular más corta entre el eje articular de rotación y la línea de acción de la fuerza externa o de la gravedad.
   * El *perfil de resistencia* del ejercicio nace de cómo varía este brazo de momento a lo largo del arco de recorrido articular (ROM).

---

## B. DIMENSIONES CANDIDATAS PARA EL CATÁLOGO

A continuación se examina sistemáticamente cada dimensión técnica para determinar si debe ser **almacenada explícitamente en el catálogo estático**, **derivada algorítmicamente**, o **reservada para el Motor Determinista**.

| Dimensión | Definición Biomecánica | Ejemplo Práctico | ¿Guardar en Catálogo? | Motivo de la Decisión |
| :--- | :--- | :--- | :--- | :--- |
| **articulaciones_principales** | Articulaciones que experimentan variación angular primaria de alta magnitud bajo carga activa. | Rodilla y Cadera en *Sentadilla*; Hombro y Codo en *Press de Banca*. | **SÍ (Almacenar)** | Fundamental para calcular sobrecarga articular acumulada, sustituciones lesionales y discriminación multi vs. monoarticular. |
| **articulaciones_secundarias** | Articulaciones que sufren variación angular menor de asistencia, o estabilización activa fija. | Tobillo (talocrural) en *Sentadilla*; Escápulo-torácica en *Press Militar*. | **SÍ (Almacenar)** | Previene prescribir ejercicios que comprometan articulaciones doloridas en roles secundarios (ej. dolor de tobillo en sentadilla). |
| **movimientos_articulares** | Acciones osteocinemáticas específicas (flexión, extensión, etc.) producidas en las articulaciones diana. | Extensión de cadera + Extensión de rodilla en sentadilla. | **DERIVAR** | Puede inferirse unívocamente combinando el *patrón motor* y las *articulaciones principales*, evitando redundancia masiva en el JSON. |
| **plano_predominante** | Plano anatómico en el cual se proyecta la mayor excursión angular o vector de fuerza del centro de masas. | *Sagital* en Sentadilla y Curl; *Frontal* en Elevación Lateral; *Transversal* en Aperturas. | **SÍ (Almacenar)** | Esencial para balance programático (evitar rutinas monotemáticas 100% sagitales) y rehabilitación. |
| **planos_secundarios** | Planos en los que ocurren movimientos accesorios concurrentes o anti-movimientos estabilizadores. | *Transversal* en Giros Rusos; *Frontal* en Plancha Lateral. | **NO (Opcional Futuro)** | La inmensa mayoría de ejercicios de fuerza son uniplanares dominantes; saturaría el catálogo en esta fase. |
| **ejes_de_movimiento** | Eje geométrico perpendicular al plano alrededor del cual gira la articulación. | Eje coronal/medio-lateral para flexión de codo. | **NO (Derivar siempre)** | **100% Redundante**: Si el plano es sagital, el eje es transversal/coronal obligatoriamente por geometría euclidiana básica. |
| **cadena_cinetica** | Condición biomecánica del eslabón distal (abierto / móvil vs. cerrado / fijado al soporte o suelo). | *Cerrada* en Sentadilla / Fondos; *Abierta* en Extensiones / Press Mancuerna. | **SÍ (Almacenar)** | Crucial para transferencia funcional, reclutamiento neuromuscular y gestión de cizalla intraarticular. |
| **accion_muscular_inherente** | Comportamiento dinámico o estático canónico con el que fue concebido el ejercicio. | *Dinámico* (concéntrico-excéntrico estándar); *Isométrico* (Plancha, Silla isométrica). | **SÍ (Almacenar simplificado)** | Basta un booleano o selector (`dinamico` vs `isometrico`). El desglose concéntrico/excéntrico es intrínseco a todo movimiento dinámico. |
| **rango_movimiento_inherente** | Amplitud articular angular anatómica estándar completa para la que se prescribe el ejercicio canónico. | *Completo (Full ROM)* en Sentadilla profunda vs. *Acortado* en Bloqueos. | **NO (Almacenar)** | Salvo excepciones (ej. medios remos), los 109 ejercicios oficiales se prescriben a *rango completo seguro*. El ROM parcial real pertenece a la sesión. |
| **velocidad_tempo_inherente** | Cadencia de repetición o carácter de aceleración intrínseco al ejercicio. | *Balístico / Explosivo* en Halterofilia / Saltos vs. *Controlado* en Fuerza. | **SÍ (Como perfil de aceleración)** | Útil solo para etiquetar ejercicios balísticos o de potencia (`balistico` vs `controlado`). El tempo en segundos (3-0-1-0) es variable de sesión. |
| **fuerzas_y_torques** | Valores de Newton y Newton-metro de fuerza resultante sobre los cóndilos o tendones. | 2500 N de compresión patelofemoral. | **NO (Descartar del catálogo)** | Imposible de estandarizar estáticamente: depende de la longitud antropométrica de cada individuo, la técnica y la carga levantada. |
| **perfil_resistencia** | Posición angular del arco de movimiento donde el torque externo alcanza su máximo (curva de resistencia). | *En estiramiento* (Pec Deck, RDL); *En acortamiento* (Hip Thrust, Cruce poleas); *Constante* (Poleas). | **NO (Modelo Futuro)** | Extraordinariamente valioso para hipertrofia avanzada, pero innecesario y complejo para la fase base del catálogo. |
| **demanda_de_estabilidad** | Grado de estabilización intrínseca que el ejecutante debe aportar frente al soporte externo. | *Alta* (Mancuernas a una pierna); *Baja* (Máquinas Smith, Prensa de piernas). | **SÍ (Almacenar discreto)** | Discriminador directo para ordenar ejercicios en fatiga (ejercicios de alta estabilidad al inicio; guiados al final). |
| **demanda_de_equilibrio** | Requerimiento específico de control del centro de gravedad sobre la base de sustentación. | *Monopodal* (Pistol squat, Zancada) vs *Bipodal* (Sentadilla trasera). | **DERIVAR** | Se deriva unívocamente de la dimensión **unilateralidad** y de la **cadena cinética**. No requiere campo aislado. |
| **tipo_resistencia** | Naturaleza biofísica del vector de carga externa aplicada al cuerpo humano. | *Gravedad pura libre*, *Inercia guiada*, *Tensión continua por cable*, *Elástica progresiva*, *Masa corporal*. | **SÍ (Almacenar)** | Separa la herramienta del vector físico: no es lo mismo mover una masa libre vertical contra $g$ que un cable horizontal continuo. |
| **unilateralidad** | Distribución simétrica o asimétrica de la carga y el apoyo corporal durante el ciclo de trabajo. | *Bilateral*, *Unilateral*, *Bilateral-Alterno*, *Asimétrico-Contralateral*. | **SÍ (Almacenar)** | Fundamental para calcular tiempo real por serie (lado izquierdo + lado derecho), equilibrio pélvico/escapular y volumen total. |
| **complejidad_motora** | Cantidad de grados de libertad articulares coordinados simultáneamente y demanda neuromuscular. | *Baja* (Curl bíceps máquina); *Media* (Press militar); *Muy Alta* (Snatch, Levantamiento Turco). | **SÍ (Almacenar discreto)** | Permite al Motor Determinista rechazar ejercicios hipercomplejos cuando el usuario reporta alta fatiga en la sesión. |

---

## C. RELACIONES ENTRE DIMENSIONES: QUÉ SE ALMACENA Y QUÉ SE DERIVA

Uno de los principios de diseño de software más estrictos del Catálogo Maestro es la **No-Redundancia**. Si una propiedad matemática o anatómica se puede inferir con certeza lógica a partir de otras dos, almacenarla de forma estática crea riesgos de desincronización y deuda técnica.

```
                         ┌───────────────────────┐
                         │   PATRÓN DE MOVIMIENTO │
                         │   (Nivel B: Taxonómico)│
                         └───────────┬───────────┘
                                     │
                                     ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│ ARTICULACIONES PRINCIP.  ├───► MOVIMIENTOS ARTICULARES  │
│ (Nivel A: Biomecánico)   │   │ (INFERIDO / DERIVADO)    │
└──────────────────────────┘   └──────────────────────────┘
 (Ej. Rodilla + Cadera)         (Extensión Rodilla + Cadera)
```

### 1. Inferencia del Movimiento Articular
* **Regla:** Si un ejercicio tiene como patrón canónico `sentadilla` y su articulación principal es `rodilla` y `cadera`, el movimiento articular en fase concéntrica es forzosamente:
  * Rodilla: *Extensión*
  * Cadera: *Extensión*
  * Tobillo (secundaria): *Flexión plantar*
* **Decisión:** **NO almacenar un diccionario de `movimientos_articulares` en el JSON**. Es preferible que el catálogo almacene la articulación diana y el patrón motor, y que el motor derive las acciones angulares concretas mediante reglas universales de kinesiología.

### 2. Inferencia de Ejes a través de Planos
* En geometría anatómica cartesiana:
  $$\text{Plano Sagital} \iff \text{Eje Coronal / Medio-lateral}$$
  $$\text{Plano Frontal} \iff \text{Eje Anteroposterior}$$
  $$\text{Plano Transversal} \iff \text{Eje Longitudinal / Vertical}$$
* **Decisión:** Almacenar únicamente el `plano_predominante`. Los ejes de rotación quedan desterrados del catálogo por redundancia euclidiana pura.

### 3. Inferencia de Demanda de Equilibrio
* Si un ejercicio es de apoyo `unilateral` y cadena cinética `cerrada` (ej. sentadilla búlgara, zancada caminando, peso muerto rumano a una pierna), la demanda de equilibrio sobre el tobillo y los abductores de cadera (glúteo medio) es necesariamente **elevada**.
* Si el ejercicio es en máquina o banco apoyado (ej. prensa de piernas unilateral, extensión de cuádriceps unilateral, curl femoral sentado), la demanda de equilibrio es **nula a mínima**.
* **Decisión:** **No crear un campo `equilibrio`**. El Motor Determinista calculará el balance dinámico cruzando `unilateralidad` con `tipo_resistencia` y `cadena_cinetica`.

---

## D. DIMENSIONES QUE NO DEBEN CONFUNDIRSE

Esta sección establece límites léxicos y conceptuales rigurosos. En sistemas mal estructurados, estas variables suelen colapsar en un campo "cajón de sastre". Entreno prohíbe explícitamente esa mezcla.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MAPA DE FRONTERAS CONCEPTUALES                       │
├──────────────────────────┬─────────────────────────────┬───────────────┤
│ Concepto                 │ Responde a la pregunta:     │ Ejemplo       │
├──────────────────────────┼─────────────────────────────┼───────────────┤
│ 1. Movimiento Articular  │ ¿Qué ángulo articular varía?│ Flexión codo  │
│ 2. Patrón de Movimiento  │ ¿Qué gesto global se hace?  │ Tracción horiz│
│ 3. Familia de Ejercicio  │ ¿A qué linaje formal es?   │ Remo con barra│
│ 4. Tipo de Ejercicio     │ ¿Cuántas articulaciones?    │ Multiarticular│
│ 5. Equipamiento          │ ¿Qué implemento se agarra?  │ Barra olímpica│
│ 6. Tipo de Resistencia   │ ¿Cómo se frena el cuerpo?   │ Peso libre (g)│
│ 7. Capacidad Física      │ ¿Qué cualidad bioenergética?│ Fuerza-Potenc.│
│ 8. Nivel / Dificultad    │ ¿Qué destreza previa exige? │ Intermedio    │
│ 9. Objetivo              │ ¿Qué efecto biológico busca?│ Hipertrofia   │
└──────────────────────────┴─────────────────────────────┴───────────────┘
```

### 1. `movimiento_articular` vs. `patron_movimiento`
* **Movimiento Articular (Nivel A):** Es analítico, local y angular. Ocurre en una única cápsula sinovial.  
  *Ejemplo:* Flexión de rodilla, abducción horizontal de hombro.
* **Patrón de Movimiento (Nivel B):** Es sintético, global y coordinativo. Combina múltiples acciones articulares sincronizadas para una función locomotora básica humana.  
  *Ejemplo:* `sentadilla` no es "flexión de rodilla"; la sentadilla involucra extensión sincrónica de rodilla, extensión de cadera y flexión plantar de tobillo contra la carga.

### 2. `patron_movimiento` vs. `familia`
* **Patrón de Movimiento:** Categoría funcional universal independiente del material.  
  *Ejemplo:* `empuje_horizontal`. Abarca tanto el press de banca, como las flexiones en el suelo, como el press de pecho en máquina convergente.
* **Familia de Ejercicio:** Grupo taxonómico canónico para organización humana del catálogo y vinculación de variantes morfológicas directas.  
  *Ejemplo:* Familia `press_banca` (aglrupa variantes de ángulo y agarre de dicho banco); Familia `flexiones` (agrupa flexiones diamante, declinadas, arqueras). Ambos pertenecen al mismo patrón (`empuje_horizontal`), pero sus familias son distintas.

### 3. `equipamiento` vs. `tipo_resistencia`
* **Equipamiento:** Objeto material físico que manipula el atleta (barra, mancuerna, anillas, banda elástica, kettlebell, banco plano).
* **Tipo de Resistencia:** La física del vector que ejerce resistencia sobre el músculo:
  * *Peso Libre:* El vector apunta **siempre estrictamente hacia el centro de la Tierra (gravedad vertical pura)**. La curva de resistencia varía continuamente con el ángulo de la palanca ósea respecto a la vertical.
  * *Polea / Cable:* El vector apunta **hacia la polea de salida**, independientemente de la gravedad. Permite vectores de fuerza horizontales, oblicuos y de tensión constante a lo largo de todo el ROM.
  * *Banda Elástica:* Resistencia proporcional a la deformación del material según la ley de Hooke ($F = -k \cdot \Delta x$). El pico de tensión ocurre exclusivamente al final del movimiento en máximo acortamiento.
  * *Autocarga (Peso Corporal):* Masa corporal propia actuando sobre un fulcro en cadena cerrada.

### 4. `complejidad_motora` vs. `nivel` / `dificultad`
* **Complejidad Motora (Nivel A/B):** Demanda intrínseca de control motor, equilibrio dinámico, coordinación intermuscular y precisión temporal del SNC (Sistema Nervioso Central). Un *Overhead Squat* con barra vacía tiene una complejidad motora máxima aunque la carga externa sea de cero kilos.
* **Nivel / Dificultad (Nivel C):** Atributo de prescripción del usuario. Una persona novata no debe recibir ejercicios de complejidad motora muy alta, pero un levantador avanzado puede realizar ejercicios de complejidad motora mínima (ej. extensiones en polea) a una dificultad / intensidad extrema (RIR 0).

---

## E. MODELO BIOMECÁNICO MÍNIMO RECOMENDADO PARA ENTRENO

Para cumplir con el objetivo de dotar a Entreno de capacidad analítica determinista sin sobrecargar de complejidad la arquitectura, el conjunto biomecánico mínimo que debe describir cada ejercicio en el Catálogo Maestro consta de las siguientes **7 dimensiones nucleares**:

```typescript
// ESPECIFICACIÓN CONCEPTUAL DEL MODELO MÍNIMO (Para fase 3B / 3C)
interface BiomechanicalProfileMinimo {
  // 1. Cadena cinemática básica
  cadena_cinetica: 'abierta' | 'cerrada' | 'mixta';

  // 2. Anatomía funcional primaria bajo tensión directa
  articulaciones_principales: (
    | 'cadera' 
    | 'rodilla' 
    | 'tobillo' 
    | 'hombro' 
    | 'codo' 
    | 'muneca' 
    | 'columna_vertebral'
  )[];

  // 3. Estabilización articular activa y absorción de torque secundario
  articulaciones_secundarias?: (
    | 'cadera' 
    | 'rodilla' 
    | 'tobillo' 
    | 'hombro' 
    | 'codo' 
    | 'muneca' 
    | 'columna_vertebral' 
    | 'escapulo_toracica'
  )[];

  // 4. Orientación espacial del vector de trabajo
  plano_predominante: 'sagital' | 'frontal' | 'transversal' | 'multiplanar';

  // 5. Simetría de carga y apoyo
  unilateralidad: 'bilateral' | 'unilateral' | 'bilateral_alterno';

  // 6. Vector y naturaleza de la fuerza externa opuesta
  tipo_resistencia: 'peso_libre' | 'peso_corporal' | 'polea' | 'maquina_guiada' | 'elastico';

  // 7. Demanda intrínseca de estabilización externa
  demanda_estabilidad: 'baja' | 'media' | 'alta';
}
```

### Justificación del Modelo Mínimo:
1. **Permite sustitución inteligente instantánea:** Si un usuario tiene dolor femororrotuliano al flexionar la rodilla en cadena cerrada (`sentadilla`), el motor puede sugerir una variante en cadena abierta o con menor demanda de estabilización espinal (`prensa_de_piernas`), o cambiar a una bisagra de cadera donde la articulación principal no sea la rodilla.
2. **Permite control de fatiga articular:** Calcula cuántos ejercicios de una sesión impactan simultáneamente la articulación del `hombro` o la `columna_vertebral`, impidiendo saturaciones lesionales.
3. **Evita la redundancia:** Todo lo demás (ejes, contracciones parciales, rangos milimétricos) se deriva o se omite sin pérdida funcional alguna.

---

## F. MODELO BIOMECÁNICO FUTURO (Fase Motor Determinista Avanzado)

Dimensiones que poseen alto valor teórico pero que **no deben incorporarse al catálogo actual** para no frenar la normalización de los 109 ejercicios. Se reservan para una versión 2.0 del motor analítico:

1. **Perfil de Resistencia y Curva de Fuerza (Strength Curve Alignment):**
   * Valores: `pico_en_estiramiento` (ej. sentadilla, peso muerto rumano, cruce de poleas en máxima apertura), `pico_en_acortamiento` (ej. hip thrust, spider curl, elevación lateral en máquina), `pico_en_recorrido_medio` (ej. curl con barra de pie), `tension_uniforme` (ej. poleas con leva concéntrica).
   * *Utilidad Futura:* Maximización de la hipertrofia combinando ejercicios con diferentes curvas de resistencia para un mismo músculo (ej. combinar Sentadilla profunda con Hip Thrust para cubrir todo el sarcómero del glúteo).
2. **Brazo de Momento Espinal Estimado (Demanda de Compresión Axial):**
   * Valores: `nulo` (banco acostado, dominadas colgado), `bajo` (mancuernas con soporte de pecho), `medio` (sentadilla frontal), `alto` (sentadilla trasera barra baja, buenos días).
   * *Utilidad Futura:* Regulación automática del volumen de carga axial acumulado por semana en personas con patología discal lumbar.
3. **Vector de Fuerza Predominante Respecto al Suelo:**
   * Valores: `vertical` (press militar, sentadilla, salto), `horizontal_sagital` (hip thrust, empuje de trineo), `horizontal_frontal` (zancada lateral), `rotacional` (lanzamientos de balón medicinal).
   * *Utilidad Futura:* Transferencia directa a deportes de campo (aceleración horizontal en sprint vs. salto vertical en baloncesto).

---

## G. VARIABLES DINÁMICAS: LO QUE PERTENECE A LA SESIÓN Y AL MOTOR

Uno de los mayores errores arquitectónicos consiste en "ensuciar" el Catálogo Maestro con variables que varían de una repetición a otra o de un usuario a otro.

```
┌───────────────────────────────────────────────┐
│ CATÁLOGO MAESTRO (Entidad Estática)           │
│ • Inmutable durante el entrenamiento          │
│ • Válido para cualquier atleta                │
│ Ejemplos: Patrón, Articulaciones, Cadena,     │
│ Tipo de resistencia, Músculos implicados.     │
└───────────────────────┬───────────────────────┘
                        │ Es instanciado por
                        ▼
┌───────────────────────────────────────────────┐
│ REGISTRO DE ENTRENAMIENTO / SESIÓN (Dinámico) │
│ • Propiedad efímera de la ejecución real      │
│ • Varía según fatiga, día y contexto          │
│ Ejemplos:                                     │
│ - Carga levantada (kg)                        │
│ - Repeticiones reales completadas             │
│ - RIR (Reps in Reserve) / RPE (Borg CR-10)    │
│ - Tempo medido o prescrito (ej. 3-1-1-0)      │
│ - ROM real ejecutado (ej. "paralela", "90°")   │
│ - Velocidad media propulsiva (m/s)            │
│ - Frecuencia cardíaca (BPM)                   │
│ - Escala de dolor reportada (VAS 0-10)        │
│ - Tiempo de descanso entre series (segundos)  │
└───────────────────────────────────────────────┘
```

> **Decisión Canónica:** Ninguna de las variables dinámicas de la caja inferior debe tener columna, campo o atributo dentro de `src/data/ejercicios.json`. Pertenecen exclusivamente al esquema de base de datos de `sesiones`, `series_completadas` y a las métricas del Motor Determinista.

---

## H. AMBIGÜEDADES IDENTIFICADAS Y CRITERIOS DE CONSENSO

En la literatura de biomecánica no existe unanimidad total en ciertos ejercicios de transición. A continuación se documentan las ambigüedades clásicas y la postura unificada adoptada para Entreno:

### 1. El estatus de Cadena Cinética del Press de Banca y Fondos
* **El Debate Académico:** 
  * En el sentido clínico estricto de Steindler (1955), en el *Press de Banca* la mano se mueve en el espacio con la barra, por lo que es técnicamente **Cadena Cinética Abierta (CCA)**. Sin embargo, la escápula y la espalda están ancladas fuertemente a una superficie rígida (el banco) soportando la masa del tronco, y los pies empujan el suelo (leg drive), asemejándose a una condición cerrada modificada.
  * En la *Dominada* y el *Fondo en paralelas*, la mano está fija a la barra/soporte y el cuerpo se desplaza en el espacio: cumple la definición formal contemporánea de **Cadena Cinética Cerrada (CCC)**.
* **Criterio de Decisión Entreno:**
  * Adoptamos la convención moderna dominante en ciencias del ejercicio (Escamilla et al., 2001; Ellenbecker & Davies, 2000):
    * `press-banca`: **Cadena Cinética Abierta (`abierta`)**, pues la resistencia distal no es fija y puede moverse independientemente en 3D.
    * `dominadas` y `fondos-en-paralelas`: **Cadena Cinética Cerrada (`cerrada`)**, pues el segmento distal (agarre) actúa como pivote fijo y el centro de masas corporal se traslada respecto a dicho anclaje.
    * `flexiones-de-brazos`: **Cadena Cinética Cerrada (`cerrada`)**.

### 2. Prensa de Piernas: ¿Abierta, Cerrada o Mixta?
* **El Debate Académico:** Los pies están anclados a una plataforma fija o móvil mientras la espalda reposa en el respaldo. Si la plataforma se mueve y la espalda está quieta, algunos la consideran CCA (el pie empuja el trineo); si el asiento se mueve respecto a la plataforma fija, se asemeja a CCC.
* **Criterio de Decisión Entreno:** Se clasifica funcionalmente como **Cadena Cinética Cerrada (`cerrada`)** o **Mixta (`mixta`)**, pero debido a que el soporte dorsal elimina por completo la estabilización vertebral propia de la sentadilla, la distinción clave en Entreno no será solo la cadena, sino la dimensión `demanda_estabilidad: baja` y `tipo_resistencia: maquina_guiada`.

### 3. Ejercicios Multiplanares y Predominancia
* **El Problema:** Movimientos como el *Levantamiento Turco (Turkish Get Up)* o los *Burpees* cruzan plano sagital, frontal y transversal de forma secuencial durante una sola repetición.
* **Criterio de Decisión Entreno:** 
  * Para los ejercicios estándar de fuerza, se asigna el **plano predominante** donde ocurre la fuerza concéntrica principal (ej. la sentadilla es sagital, aunque haya abducción isométrica en plano frontal para evitar el valgo).
  * Para los ejercicios que transicionan intencionalmente entre varios ejes de movimiento, se utiliza la categoría formal unificada **`multiplanar`**.

---

## I. FUENTES Y REFERENCIAS ACADÉMICAS

Las definiciones y criterios fijados en este marco biomecánico han sido contrastados y fundamentados en la literatura científica y tratados kinesiológicos de referencia internacional:

1. **Neumann, D. A. (2016).** *Kinesiology of the Musculoskeletal System: Foundations for Rehabilitation* (3rd ed.). Mosby / Elsevier.  
   *(Referencia para cinemática articular, definiciones de planos, ejes, torques de fuerza y función muscular).*
2. **Nordin, M., & Frankel, V. H. (2012).** *Basic Biomechanics of the Musculoskeletal System* (4th ed.). Lippincott Williams & Wilkins.  
   *(Referencia para el análisis de cargas articulares, momentos de fuerza internos y externos, y viscoelasticidad).*
3. **Zatsiorsky, V. M., & Kraemer, W. J. (2006).** *Science and Practice of Strength Training* (2nd ed.). Human Kinetics.  
   *(Referencia para clasificación de ejercicios de fuerza, curvas de fuerza-velocidad, y distinción entre estructura biomecánica y prescripción).*
4. **Steindler, A. (1955).** *Kinesiopathology of the human body under normal and pathological conditions*. Charles C Thomas.  
   *(Tratado fundacional histórico para la conceptualización de las cadenas cinemáticas abiertas y cerradas).*
5. **National Strength and Conditioning Association - NSCA (Haff, G. G., & Triplett, N. T., Eds.) (2015).** *Essentials of Strength Training and Conditioning* (4th ed.). Human Kinetics.  
   *(Consenso sobre patrones motores globales, fases del movimiento, ejercicios nucleares vs. asistenciales y biomecánica aplicada a salas de musculación).*
6. **American College of Sports Medicine - ACSM (2021).** *ACSM's Guidelines for Exercise Testing and Prescription* (11th ed.). Wolters Kluwer.  
   *(Marco para la separación entre la descripción estructural del ejercicio y la dosificación fisiológica de la carga).*
7. **Escamilla, R. F., Fleisig, G. S., Zheng, N., et al. (2001).** *Effects of technique variations on knee biomechanics during the squat and leg press*. Medicine & Science in Sports & Exercise, 33(9), 1552-1566.  
   *(Evidencia empírica sobre las diferencias biomecánicas entre ejercicios en cadena abierta y cerrada y su impacto articular).*
