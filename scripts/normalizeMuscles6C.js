import fs from 'fs';
import path from 'path';

/**
 * Script de Normalización Muscular Oficial (Punto 6C) — Entreno
 * 
 * Aplica la taxonomía muscular oficial (6B, src/data/muscles.json) a los 109 ejercicios oficiales
 * en src/data/ejercicios.json, fundamentado en el marco biomecánico (6A, docs/MARCO_CLASIFICACION_MUSCULAR.md).
 * 
 * Principios aplicados:
 * 1. Músculos principales (1-3, hasta 4 en levantamientos olímpicos): motores primarios que generan el torque articular dominante.
 * 2. Músculos secundarios (0-5): co-motores dinámicos activos en articulaciones satélites o coadyuvantes.
 * 3. Estabilizadores (1-5): contracción isométrica/cuasi-isométrica para rigidez proximal, fijación articular o neutralización.
 * 4. Eliminación total de tokens no anatómicos (cero "core", cero "gemelos", cero "pantorrillas", cero "antebrazos", cero "pecho").
 * 5. Cero duplicidades en las tres listas para el mismo ejercicio.
 * 6. Identificadores canónicos estrictos de muscles.json.
 */

const CANONICAL_SRC = path.resolve('src', 'data', 'ejercicios.json');
const MUSCLES_JSON_PATH = path.resolve('src', 'data', 'muscles.json');

// Cargar diccionario canónico de músculos
const musclesData = JSON.parse(fs.readFileSync(MUSCLES_JSON_PATH, 'utf-8'));
const validMuscleIds = new Set(musclesData.musculos.map(m => m.id));

// Matriz canónica de los 109 ejercicios oficiales
export const MUSCLE_NORMALIZATION_MAP = {
  // 1. Sentadillas (10)
  "sentadilla": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["aductor_mayor", "soleo"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "transverso_abdominal"],
    "justificacion": "El cuádriceps genera extensión de rodilla y el glúteo mayor extensión de cadera. El aductor mayor es un potente extensor en flexión >60°. Los erectores y pared abdominal proveen rigidez lumbopélvica isométrica."
  },
  "sentadilla-frontal": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["aductor_mayor", "soleo"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "deltoides_anterior", "trapecio_superior"],
    "justificacion": "Torso más vertical incrementa el brazo de palanca sobre la rodilla (demanda de cuádriceps). La carga frontal requiere estabilización isométrica torácica y escapular."
  },
  "sentadilla-goblet": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["aductor_mayor", "soleo"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales", "biceps_braquial", "deltoides_anterior"],
    "justificacion": "La carga sostenida al pecho exige estabilización isométrica de brazos y core anterior anti-flexión."
  },
  "sentadilla-sumo": {
    "principales": ["gluteo_mayor", "aductor_mayor", "cuadriceps"],
    "secundarios": ["isquiotibiales", "soleo"],
    "estabilizadores": ["erectores_espinales", "transverso_abdominal", "recto_abdominal"],
    "justificacion": "Base ancha y rotación externa enfatizan el momento extensor y aductor en el plano sagital y frontal de glúteo mayor y aductor mayor."
  },
  "sentadilla-bulgara": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["aductor_mayor", "isquiotibiales"],
    "estabilizadores": ["gluteo_medio", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Apoyo unipodal genera momento de caída pélvica contralateral resistido isométricamente por el glúteo medio ipsilateral."
  },
  "sentadilla-aerea": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["aductor_mayor", "soleo"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales"],
    "justificacion": "Patrón motor básico de flexo-extensión con masa corporal; cuádriceps y glúteo mayor lideran la propulsión concéntrica."
  },
  "sentadilla-pistola": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["iliopsoas", "aductor_mayor", "soleo"],
    "estabilizadores": ["gluteo_medio", "tibial_anterior", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Máxima demanda de estabilidad unipodal y dorsiflexión de tobillo. La pierna suspendida activa iliopsoas."
  },
  "prensa-de-piernas": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["aductor_mayor"],
    "estabilizadores": ["recto_abdominal"],
    "justificacion": "Cadena cerrada guiada con respaldo lumbar; elimina la demanda estabilizadora del raquis posterior."
  },
  "sentadilla-hack": {
    "principales": ["cuadriceps"],
    "secundarios": ["gluteo_mayor", "aductor_mayor"],
    "estabilizadores": ["transverso_abdominal"],
    "justificacion": "Ángulo guiado y apoyo dorsal focalizan el torque en la articulación de la rodilla con extensión cuacricipital pura."
  },
  "sentadilla-isometrica-pared": {
    "principales": ["cuadriceps"],
    "secundarios": ["gluteo_mayor"],
    "estabilizadores": ["recto_abdominal", "tibial_anterior"],
    "justificacion": "Contracción isométrica mantenida a 90° de flexión de rodilla contra el momento gravitatorio flexor."
  },

  // 2. Bisagra de Cadera & Extensión de Cadera (10)
  "peso-muerto-convencional": {
    "principales": ["gluteo_mayor", "isquiotibiales", "cuadriceps"],
    "secundarios": ["aductor_mayor", "dorsal_ancho", "trapecio"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "transverso_abdominal", "flexores_muneca"],
    "justificacion": "Cuádriceps inicia el despegue, glúteo e isquiotibiales bloquean la cadera. Los erectores espinales y flexores de dedos actúan como estabilizadores isométricos críticos."
  },
  "peso-muerto-sumo": {
    "principales": ["gluteo_mayor", "cuadriceps", "aductor_mayor"],
    "secundarios": ["isquiotibiales", "dorsal_ancho"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "transverso_abdominal", "flexores_muneca"],
    "justificacion": "Torso más vertical reduce el brazo de momento lumbar; mayor torque de extensión de rodilla y aducción/extensión coxofemoral."
  },
  "peso-muerto-rumano-barra": {
    "principales": ["isquiotibiales", "gluteo_mayor"],
    "secundarios": ["aductor_mayor", "dorsal_ancho"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "flexores_muneca", "trapecio_medio"],
    "justificacion": "Rodillas semi-fijas trasladan todo el brazo de palanca a la articulación coxofemoral en elongación excéntrica máxima de isquiotibiales."
  },
  "peso-muerto-rumano-mancuernas": {
    "principales": ["isquiotibiales", "gluteo_mayor"],
    "secundarios": ["aductor_mayor"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "flexores_muneca", "romboides"],
    "justificacion": "Similar al rumano con barra pero con agarre neutro lateral y mayor libertad de trayectoria articular."
  },
  "peso-muerto-unilateral": {
    "principales": ["isquiotibiales", "gluteo_mayor"],
    "secundarios": ["aductor_mayor"],
    "estabilizadores": ["gluteo_medio", "cuadrado_lumbar", "erectores_espinales", "recto_abdominal"],
    "justificacion": "El glúteo medio y cuadrado lumbar impiden la rotación pélvica y basculación contralateral en plano frontal y transversal."
  },
  "hip-thrust-barra": {
    "principales": ["gluteo_mayor"],
    "secundarios": ["isquiotibiales", "aductor_mayor", "cuadriceps"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales"],
    "justificacion": "Brazo de palanca máximo para glúteo mayor al final del recorrido (cadera en extensión completa con rodillas a 90°)."
  },
  "hip-thrust-unilateral": {
    "principales": ["gluteo_mayor"],
    "secundarios": ["isquiotibiales", "aductor_mayor"],
    "estabilizadores": ["gluteo_medio", "cuadrado_lumbar", "recto_abdominal"],
    "justificacion": "Extensión monopodal de cadera con necesidad de fijar la hemipelvis en horizontal mediante abductores y core lateral."
  },
  "puente-de-gluteos": {
    "principales": ["gluteo_mayor"],
    "secundarios": ["isquiotibiales", "aductor_mayor"],
    "estabilizadores": ["transverso_abdominal", "erectores_espinales"],
    "justificacion": "Extensión de cadera en suelo con rango acortado respecto al hip thrust; activación aislada de glúteo mayor."
  },
  "buenos-dias": {
    "principales": ["isquiotibiales", "gluteo_mayor"],
    "secundarios": ["aductor_mayor"],
    "estabilizadores": ["erectores_espinales", "transverso_abdominal", "recto_abdominal"],
    "justificacion": "Barra en espalda alta genera un enorme brazo de momento flexor sobre la columna vertebral, resistido isométricamente por los erectores."
  },
  "kettlebell-swing": {
    "principales": ["gluteo_mayor", "isquiotibiales"],
    "secundarios": ["cuadriceps", "deltoides_anterior"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "dorsal_ancho", "flexores_muneca"],
    "justificacion": "Movimiento balístico de bisagra. La inercia de la pesa es propulsada por la cadera, no elevada por los hombros."
  },

  // 3. Zancada, Locomoción y Aislamiento de Pierna (10)
  "zancadas-caminando": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["isquiotibiales", "aductor_mayor", "soleo"],
    "estabilizadores": ["gluteo_medio", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Transición dinámica entre apoyos unipotales con deceleración excéntrica y propulsión combinada."
  },
  "zancadas-estaticas": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["aductor_mayor", "soleo"],
    "estabilizadores": ["gluteo_medio", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Apoyo bipodal asimétrico en plano sagital; motor principal dividido entre pierna adelantada y asistencia trasera."
  },
  "zancadas-inversas": {
    "principales": ["gluteo_mayor", "cuadriceps"],
    "secundarios": ["isquiotibiales", "aductor_mayor", "soleo"],
    "estabilizadores": ["gluteo_medio", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Paso hacia atrás reduce la fuerza de cizalla anterior sobre la rodilla y enfatiza la extensión glútea."
  },
  "step-up-banco": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["isquiotibiales", "aductor_mayor", "gastrocnemio"],
    "estabilizadores": ["gluteo_medio", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Ascenso unilateral con superación de altura; demanda concéntrica de cuádriceps y glúteo mayor."
  },
  "extension-cuadriceps-maquina": {
    "principales": ["cuadriceps"],
    "secundarios": [],
    "estabilizadores": ["recto_abdominal"],
    "justificacion": "Aislamiento monoarticular en cadena abierta exclusivo para extensores de rodilla."
  },
  "curl-femoral-tumbado": {
    "principales": ["isquiotibiales"],
    "secundarios": ["gastrocnemio"],
    "estabilizadores": ["erectores_espinales"],
    "justificacion": "Flexión monoarticular de rodilla con cadera en extensión neutra; asistencia sinérgica del gastrocnemio biarticular."
  },
  "curl-femoral-sentado": {
    "principales": ["isquiotibiales"],
    "secundarios": ["gastrocnemio"],
    "estabilizadores": ["recto_abdominal"],
    "justificacion": "Cadera flexionada a 90° coloca a los isquiotibiales en elongación previa óptima según la relación longitud-tensión."
  },
  "curl-nordico": {
    "principales": ["isquiotibiales"],
    "secundarios": ["gastrocnemio"],
    "estabilizadores": ["gluteo_mayor", "erectores_espinales", "recto_abdominal"],
    "justificacion": "Sobrecarga excéntrica supramáxima de flexores de rodilla manteniendo la cadera y el torso rígidos en extensión."
  },
  "elevacion-talones-de-pie": {
    "principales": ["gastrocnemio", "soleo"],
    "secundarios": ["tibial_posterior"],
    "estabilizadores": ["tibial_anterior", "cuadriceps"],
    "justificacion": "Rodilla extendida permite al gastrocnemio biarticular operar con máxima ventaja mecánica junto al sóleo."
  },
  "elevacion-talones-sentado": {
    "principales": ["soleo"],
    "secundarios": ["gastrocnemio", "tibial_posterior"],
    "estabilizadores": ["tibial_anterior"],
    "justificacion": "Rodilla en flexión a 90° induce insuficiencia activa en el gastrocnemio, delegando el torque flexor plantar casi enteramente al sóleo."
  },

  // 4. Empuje Horizontal (13)
  "press-banca-plano-barra": {
    "principales": ["pectoral_mayor"],
    "secundarios": ["deltoides_anterior", "triceps_braquial"],
    "estabilizadores": ["manguito_rotador", "serrato_anterior", "dorsal_ancho"],
    "justificacion": "Aducción horizontal del húmero impulsada por el pectoral mayor; tríceps extiende codo y deltoides anterior asiste la flexión."
  },
  "press-banca-inclinado-barra": {
    "principales": ["pectoral_mayor_clavicular", "deltoides_anterior"],
    "secundarios": ["triceps_braquial", "pectoral_mayor_esternal"],
    "estabilizadores": ["manguito_rotador", "serrato_anterior", "trapecio_medio"],
    "justificacion": "Inclinación a 30-45° desplaza el vector hacia la flexión superior, reclutando selectivamente el haz clavicular y deltoides anterior."
  },
  "press-banca-declinado-barra": {
    "principales": ["pectoral_mayor_esternal"],
    "secundarios": ["triceps_braquial", "deltoides_anterior"],
    "estabilizadores": ["manguito_rotador", "serrato_anterior"],
    "justificacion": "Vector de empuje caudal enfatiza las fibras esternocostales e inferiores del pectoral mayor con menor demanda del deltoides anterior."
  },
  "press-banca-plano-mancuernas": {
    "principales": ["pectoral_mayor"],
    "secundarios": ["deltoides_anterior", "triceps_braquial"],
    "estabilizadores": ["manguito_rotador", "serrato_anterior"],
    "justificacion": "Mayor recorrido articular y demanda de estabilización glenohumeral por libertad de movimiento independiente."
  },
  "press-banca-inclinado-mancuernas": {
    "principales": ["pectoral_mayor_clavicular", "deltoides_anterior"],
    "secundarios": ["triceps_braquial", "pectoral_mayor_esternal"],
    "estabilizadores": ["manguito_rotador", "serrato_anterior"],
    "justificacion": "Énfasis superior pectoral con mancuernas; control tridimensional de la trayectoria humeral."
  },
  "press-pecho-maquina": {
    "principales": ["pectoral_mayor"],
    "secundarios": ["deltoides_anterior", "triceps_braquial"],
    "estabilizadores": ["manguito_rotador"],
    "justificacion": "Empuje horizontal guiado que minimiza demandas de estabilización del hombro."
  },
  "flexiones-de-brazos": {
    "principales": ["pectoral_mayor"],
    "secundarios": ["deltoides_anterior", "triceps_braquial"],
    "estabilizadores": ["recto_abdominal", "transverso_abdominal", "serrato_anterior", "cuadriceps"],
    "justificacion": "Cadena cinética cerrada donde la pared abdominal y serrato anterior fijan la pelvis y escápulas respectivamente."
  },
  "flexiones-diamante": {
    "principales": ["triceps_braquial", "pectoral_mayor"],
    "secundarios": ["deltoides_anterior"],
    "estabilizadores": ["recto_abdominal", "serrato_anterior", "transverso_abdominal"],
    "justificacion": "Base estrecha aumenta el momento flexor sobre el codo, elevando al tríceps braquial a co-motor principal."
  },
  "flexiones-declinadas": {
    "principales": ["pectoral_mayor_clavicular", "deltoides_anterior"],
    "secundarios": ["triceps_braquial"],
    "estabilizadores": ["recto_abdominal", "serrato_anterior", "transverso_abdominal"],
    "justificacion": "Pies elevados desplazan el centro de masa hacia la cintura escapular, reclutando el haz clavicular pectoral."
  },
  "flexiones-arqueras": {
    "principales": ["pectoral_mayor", "triceps_braquial"],
    "secundarios": ["deltoides_anterior"],
    "estabilizadores": ["recto_abdominal", "oblicuo_externo", "serrato_anterior"],
    "justificacion": "Sobrecarga asimétrica con abducción del brazo contralateral; torque rotacional resistido por el core lateral."
  },
  "aperturas-mancuernas-plano": {
    "principales": ["pectoral_mayor"],
    "secundarios": ["deltoides_anterior"],
    "estabilizadores": ["manguito_rotador", "biceps_braquial", "serrato_anterior"],
    "justificacion": "Aducción horizontal aislada en banco plano. El bíceps sostiene isométricamente el codo semi-flexionado."
  },
  "cruce-de-poleas": {
    "principales": ["pectoral_mayor_esternal"],
    "secundarios": ["deltoides_anterior", "pectoral_menor"],
    "estabilizadores": ["manguito_rotador", "recto_abdominal"],
    "justificacion": "Tracción diagonal de arriba a abajo que activa intensamente las porciones medias e inferiores del pectoral."
  },
  "contractora-pec-deck": {
    "principales": ["pectoral_mayor"],
    "secundarios": ["deltoides_anterior"],
    "estabilizadores": ["manguito_rotador"],
    "justificacion": "Aislamiento guiado de aducción horizontal pura con brazo de palanca constante en todo el recorrido."
  },

  // 5. Empuje Vertical y Abducción de Hombro (11)
  "fondos-en-paralelas": {
    "principales": ["pectoral_mayor", "triceps_braquial"],
    "secundarios": ["deltoides_anterior"],
    "estabilizadores": ["manguito_rotador", "romboides", "recto_abdominal"],
    "justificacion": "Extensión de codo combinada con aducción/depresión glenohumeral contra el peso corporal suspendido."
  },
  "fondos-en-banco": {
    "principales": ["triceps_braquial"],
    "secundarios": ["deltoides_anterior", "pectoral_mayor"],
    "estabilizadores": ["manguito_rotador", "romboides"],
    "justificacion": "Extensión de codo con hombro en extensión previa; mayor foco analítico sobre el tríceps."
  },
  "fondos-en-anillas": {
    "principales": ["pectoral_mayor", "triceps_braquial"],
    "secundarios": ["deltoides_anterior"],
    "estabilizadores": ["manguito_rotador", "serrato_anterior", "recto_abdominal", "romboides"],
    "justificacion": "Inestabilidad multiaxial que multiplica la activación estabilizadora del manguito y fijadores escapulares."
  },
  "press-militar-barra": {
    "principales": ["deltoides_anterior", "triceps_braquial"],
    "secundarios": ["deltoides_lateral", "pectoral_mayor_clavicular", "trapecio_superior"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "gluteo_mayor", "manguito_rotador"],
    "justificacion": "Flexión glenohumeral y extensión de codo sobre la cabeza; la postura bípeda requiere anclaje lumbopélvico."
  },
  "press-hombros-mancuernas": {
    "principales": ["deltoides_anterior", "triceps_braquial"],
    "secundarios": ["deltoides_lateral", "trapecio_superior"],
    "estabilizadores": ["manguito_rotador", "serrato_anterior", "erectores_espinales"],
    "justificacion": "Plano escapular con libertad rotacional para la articulación del hombro."
  },
  "press-arnold": {
    "principales": ["deltoides_anterior", "deltoides_lateral", "triceps_braquial"],
    "secundarios": ["trapecio_superior"],
    "estabilizadores": ["manguito_rotador", "erectores_espinales", "recto_abdominal"],
    "justificacion": "Rotación simultánea de supino a prono durante el empuje que activa secuencialmente porción anterior y lateral."
  },
  "push-press": {
    "principales": ["deltoides_anterior", "cuadriceps", "triceps_braquial"],
    "secundarios": ["gluteo_mayor", "soleo", "trapecio_superior"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "manguito_rotador"],
    "justificacion": "Patrón de potencia híbrido donde el impulso triple de piernas asiste la fase inicial del empuje vertical."
  },
  "flexiones-hspu": {
    "principales": ["deltoides_anterior", "triceps_braquial"],
    "secundarios": ["deltoides_lateral", "trapecio_superior"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales", "serrato_anterior", "manguito_rotador"],
    "justificacion": "Empuje vertical inverso con inversión gravitatoria; máxima demanda de rigidez troncal isométrica."
  },
  "pike-push-ups": {
    "principales": ["deltoides_anterior", "triceps_braquial"],
    "secundarios": ["trapecio_superior", "serrato_anterior"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales"],
    "justificacion": "Regresión del pino que orienta el vector de empuje hacia el eje cráneo-caudal con apoyo en pies."
  },
  "elevaciones-laterales-mancuernas": {
    "principales": ["deltoides_lateral"],
    "secundarios": ["supraespinoso", "trapecio_superior"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal"],
    "justificacion": "Abducción pura en el plano frontal/escapular; el deltoides lateral genera el torque primario superados los 15°."
  },
  "elevaciones-laterales-polea": {
    "principales": ["deltoides_lateral"],
    "secundarios": ["supraespinoso", "trapecio_superior"],
    "estabilizadores": ["recto_abdominal", "oblicuo_externo"],
    "justificacion": "Resistencia continua desde el inicio del movimiento gracias a la línea de fuerza oblicua del cable."
  },

  // 6. Tracción Horizontal y Deltoides Posterior (9)
  "pajaros-posteriores-mancuernas": {
    "principales": ["deltoides_posterior"],
    "secundarios": ["romboides", "trapecio_medio", "infraespinoso"],
    "estabilizadores": ["erectores_espinales", "isquiotibiales"],
    "justificacion": "Abducción horizontal del húmero en posición inclinada con activación primaria de la porción espinal del deltoides."
  },
  "face-pull-polea": {
    "principales": ["deltoides_posterior", "infraespinoso"],
    "secundarios": ["trapecio_medio", "romboides", "redondo_menor"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales"],
    "justificacion": "Tracción hacia el rostro que combina abducción horizontal con rotación externa máxima del húmero."
  },
  "remo-con-barra-inclinado": {
    "principales": ["dorsal_ancho", "romboides", "trapecio_medio"],
    "secundarios": ["deltoides_posterior", "biceps_braquial", "braquial"],
    "estabilizadores": ["erectores_espinales", "isquiotibiales", "gluteo_mayor", "recto_abdominal"],
    "justificacion": "Retracción escapular y aducción/extensión glenohumeral soportando flexión de cadera en bisagra isométrica."
  },
  "remo-pendlay": {
    "principales": ["dorsal_ancho", "romboides", "trapecio_medio"],
    "secundarios": ["deltoides_posterior", "biceps_braquial", "braquial"],
    "estabilizadores": ["erectores_espinales", "isquiotibiales", "gluteo_mayor"],
    "justificacion": "Salida explosiva desde el suelo con torso estrictamente paralelo; minimiza el rebote inercial."
  },
  "remo-con-mancuerna-a-una-mano": {
    "principales": ["dorsal_ancho"],
    "secundarios": ["romboides", "deltoides_posterior", "biceps_braquial", "braquial"],
    "estabilizadores": ["oblicuo_externo", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Tracción unilateral con apoyo en tres puntos; control anti-rotacional del tronco por oblicuo contralateral."
  },
  "remo-en-polea-baja-gironda": {
    "principales": ["dorsal_ancho", "romboides"],
    "secundarios": ["trapecio_medio", "biceps_braquial", "deltoides_posterior"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal"],
    "justificacion": "Tracción horizontal sentado en polea con vector continuo perpendicular al torso."
  },
  "remo-t-con-apoyo-al-pecho": {
    "principales": ["dorsal_ancho", "romboides", "trapecio_medio"],
    "secundarios": ["deltoides_posterior", "biceps_braquial", "braquial"],
    "estabilizadores": ["manguito_rotador"],
    "justificacion": "El apoyo esternal desactiva la demanda estabilizadora sobre la columna lumbar e isquiotibiales."
  },
  "remo-invertido": {
    "principales": ["dorsal_ancho", "romboides", "trapecio_medio"],
    "secundarios": ["biceps_braquial", "deltoides_posterior"],
    "estabilizadores": ["recto_abdominal", "gluteo_mayor", "erectores_espinales"],
    "justificacion": "Cadena cinética cerrada donde la cadena posterior y anterior mantienen alineado el cuerpo en plancha supina."
  },
  "remo-en-anillas": {
    "principales": ["dorsal_ancho", "romboides", "trapecio_medio"],
    "secundarios": ["biceps_braquial", "deltoides_posterior"],
    "estabilizadores": ["recto_abdominal", "gluteo_mayor", "manguito_rotador"],
    "justificacion": "Inestabilidad de anillas que exige estabilización dinámica glenohumeral durante la tracción horizontal."
  },

  // 7. Tracción Vertical (7)
  "dominadas-pronadas": {
    "principales": ["dorsal_ancho"],
    "secundarios": ["braquial", "braquiorradial", "biceps_braquial", "romboides", "trapecio_inferior"],
    "estabilizadores": ["recto_abdominal", "transverso_abdominal", "manguito_rotador"],
    "justificacion": "Aducción frontal pura del húmero; antebrazo en pronación favorece la tracción del braquial y dorsal ancho."
  },
  "dominadas-supinadas": {
    "principales": ["dorsal_ancho", "biceps_braquial"],
    "secundarios": ["braquial", "pectoral_mayor", "romboides"],
    "estabilizadores": ["recto_abdominal", "manguito_rotador"],
    "justificacion": "Extensión en plano sagital y supinación colocan al bíceps en posición biomecánicamente óptima de fuerza."
  },
  "dominadas-neutras": {
    "principales": ["dorsal_ancho", "braquial"],
    "secundarios": ["biceps_braquial", "braquiorradial", "romboides"],
    "estabilizadores": ["recto_abdominal", "manguito_rotador"],
    "justificacion": "Posición semiprona de máximo confort articular con gran participación sinérgica del braquial y dorsal."
  },
  "jalon-al-pecho-polea": {
    "principales": ["dorsal_ancho"],
    "secundarios": ["biceps_braquial", "braquial", "romboides", "trapecio_inferior"],
    "estabilizadores": ["recto_abdominal", "manguito_rotador"],
    "justificacion": "Tracción vertical abierta sentado con rodillos estabilizadores femorales."
  },
  "jalon-agarre-estrecho-polea": {
    "principales": ["dorsal_ancho"],
    "secundarios": ["biceps_braquial", "braquial", "pectoral_mayor"],
    "estabilizadores": ["recto_abdominal", "manguito_rotador"],
    "justificacion": "Tracción en plano sagital con mayor recorrido de extensión glenohumeral."
  },
  "pull-over-en-polea-alta": {
    "principales": ["dorsal_ancho"],
    "secundarios": ["redondo_mayor", "triceps_cabeza_larga", "pectoral_menor"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales"],
    "justificacion": "Extensión aislada monoarticular glenohumeral sin intervención de la flexión de codo."
  },
  "muscle-up": {
    "principales": ["dorsal_ancho", "pectoral_mayor", "triceps_braquial"],
    "secundarios": ["biceps_braquial", "deltoides_anterior", "braquiorradial"],
    "estabilizadores": ["recto_abdominal", "manguito_rotador", "flexores_muneca"],
    "justificacion": "Transición biomecánica explosiva de tracción vertical a fondo de empuje en barra."
  },

  // 8. Flexión/Extensión de Codo y Antebrazo (10)
  "press-frances-barra-z": {
    "principales": ["triceps_braquial"],
    "secundarios": [],
    "estabilizadores": ["deltoides_anterior", "flexores_muneca", "manguito_rotador"],
    "justificacion": "Extensión pura de codo con hombro flexionado a 90°, implicando intensamente las tres cabezas del tríceps."
  },
  "extension-triceps-polea-alta": {
    "principales": ["triceps_braquial"],
    "secundarios": ["anconeo"],
    "estabilizadores": ["deltoides_anterior", "recto_abdominal"],
    "justificacion": "Extensión de codo con brazos pegados al torso, maximizando la tensión en cabeza lateral y medial."
  },
  "extension-triceps-tras-nuca-mancuerna": {
    "principales": ["triceps_cabeza_larga"],
    "secundarios": [],
    "estabilizadores": ["recto_abdominal", "manguito_rotador"],
    "justificacion": "Flexión de hombro a 180° elonga la cabeza larga biarticular, incrementando su contribución contráctil como motor primario principal. Se excluye el grupo padre triceps_braquial para evitar doble contabilización jerárquica."
  },
  "extension-triceps-tras-nuca-polea": {
    "principales": ["triceps_cabeza_larga"],
    "secundarios": [],
    "estabilizadores": ["recto_abdominal", "manguito_rotador"],
    "justificacion": "Sobrecarga de la cabeza larga en posición de estiramiento con curva de resistencia continua en polea. Se excluye el grupo padre triceps_braquial para evitar doble contabilización jerárquica."
  },
  "curl-biceps-barra": {
    "principales": ["biceps_braquial"],
    "secundarios": ["braquial", "braquiorradial"],
    "estabilizadores": ["deltoides_anterior", "flexores_muneca", "erectores_espinales"],
    "justificacion": "Flexión de codo con antebrazo en supinación rígida que enfatiza el bíceps braquial sobre el braquial."
  },
  "curl-biceps-mancuernas-alterno": {
    "principales": ["biceps_braquial"],
    "secundarios": ["braquial", "braquiorradial"],
    "estabilizadores": ["deltoides_anterior", "recto_abdominal", "oblicuo_externo"],
    "justificacion": "Supinación dinámica durante la flexión; activación progresiva del bíceps desde posición neutra."
  },
  "curl-martillo-mancuernas": {
    "principales": ["braquiorradial", "braquial"],
    "secundarios": ["biceps_braquial"],
    "estabilizadores": ["deltoides_anterior", "flexores_muneca"],
    "justificacion": "Agarre neutro semi-prono desactiva parcialmente la ventaja del bíceps, trasladando el torque al braquiorradial y braquial."
  },
  "curl-predicador-banco-scott": {
    "principales": ["braquial", "biceps_braquial"],
    "secundarios": ["braquiorradial"],
    "estabilizadores": ["flexores_muneca"],
    "justificacion": "El apoyo del brazo anula la ayuda del deltoides y enfatiza el torque en la porción inicial del rango."
  },
  "curl-spider-en-banco": {
    "principales": ["biceps_braquial"],
    "secundarios": ["braquial"],
    "estabilizadores": ["deltoides_anterior"],
    "justificacion": "Flexión de hombro vertical en banco prono que focaliza el pico de contracción en acortamiento."
  },
  "curl-de-muneca-antebrazo": {
    "principales": ["flexores_muneca"],
    "secundarios": ["braquiorradial"],
    "estabilizadores": ["biceps_braquial"],
    "justificacion": "Flexión monoarticular de carpo y dedos para hipertrofia del compartimento anterior del antebrazo."
  },

  // 9. Core y Anti-movimiento (11)
  "plancha-abdominal-frontal": {
    "principales": ["recto_abdominal", "transverso_abdominal"],
    "secundarios": ["oblicuo_externo", "cuadriceps"],
    "estabilizadores": ["serrato_anterior", "deltoides_anterior", "gluteo_mayor"],
    "justificacion": "Resistencia isométrica contra la extensión lumbar provocada por la gravedad (anti-extensión)."
  },
  "plancha-lateral": {
    "principales": ["oblicuo_externo", "cuadrado_lumbar"],
    "secundarios": ["oblicuo_interno", "gluteo_medio"],
    "estabilizadores": ["deltoides_anterior", "serrato_anterior", "tensor_fascia_lata"],
    "justificacion": "Anti-flexión lateral del tronco en plano frontal sostenida por la cadena lateral inferior."
  },
  "rueda-abdominal": {
    "principales": ["recto_abdominal", "transverso_abdominal"],
    "secundarios": ["dorsal_ancho", "pectoral_mayor"],
    "estabilizadores": ["serrato_anterior", "triceps_braquial", "gluteo_mayor"],
    "justificacion": "Demanda extrema de torque anti-extensión al alejarse los brazos del centro de gravedad."
  },
  "hollow-body-hold": {
    "principales": ["recto_abdominal", "transverso_abdominal"],
    "secundarios": ["iliopsoas", "oblicuo_externo"],
    "estabilizadores": ["cuadriceps", "aductor_mayor"],
    "justificacion": "Retroversion pélvica forzada y flexión torácica isométrica eliminando cualquier hueco lumbar contra el suelo."
  },
  "elevacion-piernas-colgado": {
    "principales": ["iliopsoas", "recto_abdominal"],
    "secundarios": ["oblicuo_externo", "tensor_fascia_lata"],
    "estabilizadores": ["dorsal_ancho", "flexores_muneca", "serrato_anterior"],
    "justificacion": "El iliopsoas eleva los muslos; el recto abdominal flexiona la pelvis hacia el esternón en la mitad superior."
  },
  "crunch-abdominal-suelo": {
    "principales": ["recto_abdominal"],
    "secundarios": ["oblicuo_externo", "oblicuo_interno"],
    "estabilizadores": ["transverso_abdominal"],
    "justificacion": "Flexión segmentaria de columna dorsal-lumbar aproximando esternón al pubis sin flexionar cadera."
  },
  "crunch-en-polea-alta": {
    "principales": ["recto_abdominal"],
    "secundarios": ["oblicuo_externo", "oblicuo_interno"],
    "estabilizadores": ["dorsal_ancho", "flexores_muneca"],
    "justificacion": "Flexión de columna con sobrecarga progresiva guiada desde polea alta."
  },
  "dead-bug": {
    "principales": ["transverso_abdominal", "recto_abdominal"],
    "secundarios": ["oblicuo_externo", "iliopsoas"],
    "estabilizadores": ["multifidos", "suelo_pelvico"],
    "justificacion": "Control anti-extensión y disociación cruzada de extremidades manteniendo el raquis lumbar fijo."
  },
  "bird-dog": {
    "principales": ["gluteo_mayor", "erectores_espinales"],
    "secundarios": ["deltoides_posterior", "isquiotibiales"],
    "estabilizadores": ["recto_abdominal", "oblicuo_externo", "serrato_anterior"],
    "justificacion": "Extensión diagonal en cuadrupedia que requiere co-contracción anti-rotacional de core anterior y posterior."
  },
  "press-pallof": {
    "principales": ["oblicuo_externo", "transverso_abdominal"],
    "secundarios": ["oblicuo_interno", "recto_abdominal"],
    "estabilizadores": ["gluteo_medio", "deltoides_anterior", "cuadrado_lumbar"],
    "justificacion": "Isometría anti-rotacional pura contra un momento torsor perpendicular al plano sagital."
  },
  "giros-rusos": {
    "principales": ["oblicuo_externo", "oblicuo_interno"],
    "secundarios": ["recto_abdominal", "iliopsoas"],
    "estabilizadores": ["transverso_abdominal", "erectores_espinales"],
    "justificacion": "Rotación dinámica controlada del tronco manteniendo el soporte isométrico de flexión de cadera."
  },

  // 10. Potencia y Levantamientos Olímpicos (6)
  "cargada-de-potencia": {
    "principales": ["gluteo_mayor", "isquiotibiales", "cuadriceps", "trapecio_superior"],
    "secundarios": ["soleo", "gastrocnemio", "deltoides_anterior", "braquial"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "transverso_abdominal", "flexores_muneca"],
    "justificacion": "Triple extensión explosiva de cadera, rodilla y tobillo finalizada con encogimiento escapular y recepción."
  },
  "dos-tiempos-clean-and-jerk": {
    "principales": ["gluteo_mayor", "cuadriceps", "deltoides_anterior", "triceps_braquial"],
    "secundarios": ["isquiotibiales", "trapecio_superior", "soleo"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "transverso_abdominal", "manguito_rotador"],
    "justificacion": "Levantamiento olímpico completo combinando cargada y empuje de envión (jerk)."
  },
  "arrancada-snatch": {
    "principales": ["gluteo_mayor", "cuadriceps", "isquiotibiales", "trapecio_superior"],
    "secundarios": ["deltoides_anterior", "soleo", "triceps_braquial"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "manguito_rotador", "serrato_anterior"],
    "justificacion": "Propulsión vertical ininterrumpida de barra desde el suelo a brazos extendidos sobre la cabeza."
  },
  "salto-al-cajon": {
    "principales": ["cuadriceps", "gluteo_mayor"],
    "secundarios": ["gastrocnemio", "soleo", "isquiotibiales"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales", "tibial_anterior"],
    "justificacion": "Ciclo estiramiento-acortamiento pliométrico de triple extensión con amortiguación excéntrica."
  },
  "lanzamiento-balon-al-suelo": {
    "principales": ["recto_abdominal", "dorsal_ancho"],
    "secundarios": ["triceps_braquial", "pectoral_mayor"],
    "estabilizadores": ["cuadriceps", "gluteo_mayor", "erectores_espinales"],
    "justificacion": "Flexión violenta del tronco y hombros en aceleración terminal descendente contra el suelo."
  },

  // 11. Locomoción y Condicionamiento (9)
  "paseo-del-granjero": {
    "principales": ["trapecio_superior", "flexores_muneca"],
    "secundarios": ["cuadriceps", "gluteo_mayor", "gastrocnemio"],
    "estabilizadores": ["cuadrado_lumbar", "gluteo_medio", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Carga pesada isométrica para trapecio y agarre; control frontal pélvico paso a paso."
  },
  "empuje-de-trineo": {
    "principales": ["cuadriceps", "gluteo_mayor", "gastrocnemio"],
    "secundarios": ["soleo", "isquiotibiales", "pectoral_mayor"],
    "estabilizadores": ["recto_abdominal", "deltoides_anterior", "erectores_espinales"],
    "justificacion": "Propulsión concéntrica pura de triple extensión contra resistencia horizontal constante."
  },
  "burpees": {
    "principales": ["cuadriceps", "gluteo_mayor", "pectoral_mayor"],
    "secundarios": ["triceps_braquial", "deltoides_anterior", "gastrocnemio"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales"],
    "justificacion": "Secuencia cíclica multiarticular de flexión de brazos, sentadilla y salto vertical."
  },
  "mountain-climbers": {
    "principales": ["iliopsoas", "recto_abdominal"],
    "secundarios": ["cuadriceps", "oblicuo_externo"],
    "estabilizadores": ["deltoides_anterior", "serrato_anterior", "transverso_abdominal"],
    "justificacion": "Flexión alternada rápida de cadera en postura de plancha alta isométrica."
  },
  "levantamiento-turco": {
    "principales": ["deltoides_anterior", "gluteo_mayor", "recto_abdominal"],
    "secundarios": ["cuadriceps", "oblicuo_externo", "triceps_braquial"],
    "estabilizadores": ["manguito_rotador", "gluteo_medio", "serrato_anterior", "cuadrado_lumbar"],
    "justificacion": "Transición multiplanar del suelo a bípedo sosteniendo una carga cenital con el brazo bloqueado."
  },
  "saltos-con-cuerda": {
    "principales": ["gastrocnemio", "soleo"],
    "secundarios": ["cuadriceps", "tibial_anterior"],
    "estabilizadores": ["recto_abdominal", "flexores_muneca"],
    "justificacion": "Rebotes pliométricos continuos sobre el antepié mediante la elasticidad del tendón de Aquiles."
  },
  "saltos-en-tijera": {
    "principales": ["gastrocnemio", "deltoides_lateral"],
    "secundarios": ["gluteo_medio", "cuadriceps", "soleo"],
    "estabilizadores": ["recto_abdominal", "tibial_anterior"],
    "justificacion": "Coordinación rítmica de saltos con abducción/aducción de brazos y piernas."
  },
  "remoergometro": {
    "principales": ["cuadriceps", "gluteo_mayor", "dorsal_ancho"],
    "secundarios": ["isquiotibiales", "biceps_braquial", "romboides"],
    "estabilizadores": ["erectores_espinales", "recto_abdominal", "flexores_muneca"],
    "justificacion": "Secuencia rítmica de empuje con piernas (drive) y tracción con tronco y brazos."
  },
  "carrera-en-cinta": {
    "principales": ["gluteo_mayor", "cuadriceps", "gastrocnemio"],
    "secundarios": ["isquiotibiales", "soleo", "iliopsoas"],
    "estabilizadores": ["gluteo_medio", "recto_abdominal", "erectores_espinales"],
    "justificacion": "Locomoción continua cíclica con fase aérea; desaceleración y propulsión unilateral alternada."
  },

  // 12. Movilidad (4)
  "gato-camello": {
    "principales": ["recto_abdominal", "erectores_espinales"],
    "secundarios": ["multifidos", "oblicuo_externo"],
    "estabilizadores": ["serrato_anterior", "deltoides_anterior"],
    "justificacion": "Flexo-extensión segmentaria activa de la columna vertebral en descarga sobre cuadrupedia."
  },
  "rotacion-de-cadera-90-90": {
    "principales": ["rotadores_cadera_profundos", "gluteo_medio"],
    "secundarios": ["gluteo_mayor", "tensor_fascia_lata", "iliopsoas"],
    "estabilizadores": ["recto_abdominal", "erectores_espinales"],
    "justificacion": "Movilización activa simultánea de rotación interna en una cadera y externa en la contralateral."
  },
  "perro-boca-abajo": {
    "principales": ["serrato_anterior", "deltoides_anterior"],
    "secundarios": ["trapecio_superior", "triceps_braquial"],
    "estabilizadores": ["recto_abdominal", "tibial_anterior", "cuadriceps"],
    "justificacion": "Mantenimiento isométrico de empuje escapular en elevación con elongación de la cadena posterior."
  },
  "dislocaciones-de-hombro-con-banda": {
    "principales": ["deltoides_anterior", "pectoral_mayor"],
    "secundarios": ["deltoides_posterior", "trapecio_superior"],
    "estabilizadores": ["manguito_rotador", "romboides", "recto_abdominal"],
    "justificacion": "Control cinemático de circunducción escapulohumeral a lo largo de todo el rango sagital y coronal."
  }
};

export function runNormalization() {
  console.log('='.repeat(65));
  console.log('  NORMALIZACIÓN MUSCULAR DE LOS 109 EJERCICIOS — ENTRENO (6C)');
  console.log('='.repeat(65));

  if (!fs.existsSync(CANONICAL_SRC)) {
    throw new Error(`Archivo no encontrado: ${CANONICAL_SRC}`);
  }

  const catalog = JSON.parse(fs.readFileSync(CANONICAL_SRC, 'utf-8'));
  const exercises = catalog.ejercicios || [];

  if (exercises.length !== 109) {
    throw new Error(`El catálogo debe tener exactamente 109 ejercicios. Encontrados: ${exercises.length}`);
  }

  // Validar que los 109 ejercicios están presentes en el mapa de normalización
  const mapKeys = Object.keys(MUSCLE_NORMALIZATION_MAP);
  console.log(`▶ Total ejercicios en mapa de normalización: ${mapKeys.length} / 109`);

  const missingInMap = exercises.filter(e => !MUSCLE_NORMALIZATION_MAP[e.id]);
  if (missingInMap.length > 0) {
    throw new Error(`Faltan ejercicios en el mapa de normalización: ${missingInMap.map(e => e.id).join(', ')}`);
  }

  // Validar tokens contra muscles.json
  const invalidTokens = new Set();
  Object.entries(MUSCLE_NORMALIZATION_MAP).forEach(([id, norm]) => {
    [...norm.principales, ...norm.secundarios, ...norm.estabilizadores].forEach(t => {
      if (!validMuscleIds.has(t)) {
        invalidTokens.add(t);
      }
    });
  });

  if (invalidTokens.size > 0) {
    throw new Error(`Tokens no válidos según muscles.json encontrados en mapa: ${[...invalidTokens].join(', ')}`);
  }

  let totalUpdated = 0;
  const legacyTokensRemoved = new Set();
  const canonicalTokensUsed = new Set();

  exercises.forEach((ex, idx) => {
    const norm = MUSCLE_NORMALIZATION_MAP[ex.id];
    if (!norm) return;

    // Detectar legacy tokens
    (ex.musculos_principales || []).forEach(t => {
      if (!validMuscleIds.has(t) || t === 'gemelos' || t === 'pantorrillas' || t === 'antebrazos') legacyTokensRemoved.add(t);
    });
    (ex.musculos_secundarios || []).forEach(t => {
      if (!validMuscleIds.has(t) || t === 'gemelos' || t === 'pantorrillas' || t === 'antebrazos') legacyTokensRemoved.add(t);
    });
    (ex.estabilizadores || []).forEach(t => {
      if (!validMuscleIds.has(t) || t === 'gemelos' || t === 'pantorrillas' || t === 'antebrazos') legacyTokensRemoved.add(t);
    });

    // Actualizar campos normalizados
    ex.musculos_principales = [...norm.principales];
    ex.musculos_secundarios = [...norm.secundarios];
    ex.estabilizadores = [...norm.estabilizadores];

    norm.principales.forEach(t => canonicalTokensUsed.add(t));
    norm.secundarios.forEach(t => canonicalTokensUsed.add(t));
    norm.estabilizadores.forEach(t => canonicalTokensUsed.add(t));

    totalUpdated++;
  });

  catalog.version = "1.3.0";
  catalog.schema_version = "1.3";
  catalog.descripcion = "Catálogo maestro oficial normalizado biomecánicamente (3A/3B/3C/4/5/6A/6B/6C)";
  catalog.ultima_actualizacion = new Date().toISOString().split('T')[0];

  fs.writeFileSync(CANONICAL_SRC, JSON.stringify(catalog, null, 2), 'utf-8');

  console.log(`✔ Normalización completada con éxito: ${totalUpdated} / 109 ejercicios actualizados.`);
  console.log(`✔ Tokens canónicos únicos utilizados: ${canonicalTokensUsed.size}`);
  console.log(`✔ Tokens legacy obsoletos reemplazados: ${[...legacyTokensRemoved].join(', ')}`);
  console.log('='.repeat(65));
}

// Ejecución directa
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('normalizeMuscles6C.js') || 
  process.argv[1].includes('normalizeMuscles6C')
);

if (isDirectRun) {
  try {
    runNormalization();
    process.exit(0);
  } catch (err) {
    console.error('Error durante la normalización:', err.message);
    process.exit(1);
  }
}
