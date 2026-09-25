import fs from 'fs';
import path from 'path';

const SRC_PATH = path.resolve('src', 'data', 'ejercicios.json');
const cat = JSON.parse(fs.readFileSync(SRC_PATH, 'utf-8'));
const exercises = cat.ejercicios;
const allIds = new Set(exercises.map(e => e.id));

// Exact classification rules based on official definitions:
// VARIANTE: misma cinemática fundamental (cambio de barra a mancuerna, ángulo de banco, agarre pronado/supino, unilateral vs bilateral directo, pies en banco).
// RELACIONADO: relación relevante por patrón, músculo, máquina vs peso libre, calistenia vs barra, pero distinta identidad biomecánica.
// PENDIENTE_REVISION: relaciones dudosas o históricas sin justificación clara.

const classificationMap = new Map();

function setClass(s, t, type, conf, just) {
  classificationMap.set(`${s}->${t}`, { type, conf, just });
}

// Sentadilla
setClass('sentadilla', 'sentadilla-frontal', 'VARIANTE', 'ALTA', 'Variante con barra en posición anterior.');
setClass('sentadilla', 'sentadilla-goblet', 'VARIANTE', 'ALTA', 'Variante con carga anterior en mancuerna o kettlebell.');
setClass('sentadilla', 'sentadilla-sumo', 'VARIANTE', 'ALTA', 'Variante con apertura amplia y rotación externa de caderas.');
setClass('sentadilla', 'sentadilla-aerea', 'VARIANTE', 'ALTA', 'Variante con autocarga / peso corporal.');
setClass('sentadilla', 'sentadilla-bulgara', 'RELACIONADO', 'ALTA', 'Split squat unilateral con pie trasero elevado en banco.');

setClass('sentadilla-frontal', 'sentadilla', 'VARIANTE', 'ALTA', 'Variante con barra trasera.');
setClass('sentadilla-frontal', 'sentadilla-goblet', 'VARIANTE', 'ALTA', 'Variante anterior con mancuerna.');

setClass('sentadilla-goblet', 'sentadilla', 'VARIANTE', 'ALTA', 'Variante con barra.');
setClass('sentadilla-goblet', 'sentadilla-aerea', 'VARIANTE', 'ALTA', 'Variante sin sobrecarga externa.');
setClass('sentadilla-goblet', 'sentadilla-frontal', 'VARIANTE', 'ALTA', 'Variante anterior con barra.');

setClass('sentadilla-sumo', 'sentadilla', 'VARIANTE', 'ALTA', 'Variante con apertura estándar.');
setClass('sentadilla-sumo', 'peso-muerto-sumo', 'RELACIONADO', 'ALTA', 'Distinto patrón (sentadilla vs bisagra de cadera).');

setClass('sentadilla-bulgara', 'zancadas-estaticas', 'RELACIONADO', 'ALTA', 'Zancada estática en suelo vs split squat en banco.');
setClass('sentadilla-bulgara', 'sentadilla', 'RELACIONADO', 'ALTA', 'Unilateral vs bilateral.');
setClass('sentadilla-bulgara', 'step-up-banco', 'RELACIONADO', 'ALTA', 'Ascenso a escalón vs split squat.');

setClass('sentadilla-aerea', 'sentadilla', 'VARIANTE', 'ALTA', 'Variante con sobrecarga.');
setClass('sentadilla-aerea', 'sentadilla-goblet', 'VARIANTE', 'ALTA', 'Variante con mancuerna.');
setClass('sentadilla-aerea', 'sentadilla-pistola', 'RELACIONADO', 'ALTA', 'Sentadilla monopodal avanzada con altísima exigencia de equilibrio.');

setClass('sentadilla-pistola', 'sentadilla-aerea', 'RELACIONADO', 'ALTA', 'Regresión a bilateral básica.');
setClass('sentadilla-pistola', 'sentadilla-bulgara', 'RELACIONADO', 'ALTA', 'Ejercicio unilateral con apoyo.');

setClass('prensa-de-piernas', 'sentadilla', 'RELACIONADO', 'ALTA', 'Empuje en máquina guiada sin carga axial sobre la columna.');
setClass('prensa-de-piernas', 'sentadilla-hack', 'RELACIONADO', 'ALTA', 'Máquinas de empuje de piernas con diferente plano.');

setClass('sentadilla-hack', 'prensa-de-piernas', 'RELACIONADO', 'ALTA', 'Máquinas guiadas de empuje de pierna.');
setClass('sentadilla-hack', 'sentadilla', 'RELACIONADO', 'ALTA', 'Máquina inclinada guiada vs sentadilla libre.');

setClass('sentadilla-isometrica-pared', 'sentadilla-aerea', 'RELACIONADO', 'ALTA', 'Isometría contra pared vs sentadilla dinámica.');

// Peso muerto
setClass('peso-muerto-convencional', 'peso-muerto-sumo', 'VARIANTE', 'ALTA', 'Variante con postura amplia y agarre interno.');
setClass('peso-muerto-convencional', 'peso-muerto-rumano-barra', 'VARIANTE', 'ALTA', 'Variante de bisagra enfocada en isquiotibiales.');

setClass('peso-muerto-sumo', 'peso-muerto-convencional', 'VARIANTE', 'ALTA', 'Variante de postura estándar.');
setClass('peso-muerto-sumo', 'sentadilla-sumo', 'RELACIONADO', 'ALTA', 'Bisagra de cadera vs sentadilla.');

setClass('peso-muerto-rumano-barra', 'peso-muerto-rumano-mancuernas', 'VARIANTE', 'ALTA', 'Variante con mancuernas.');
setClass('peso-muerto-rumano-barra', 'peso-muerto-convencional', 'VARIANTE', 'ALTA', 'Variante completa desde suelo.');
setClass('peso-muerto-rumano-barra', 'buenos-dias', 'RELACIONADO', 'ALTA', 'Bisagra con barra en hombros.');

setClass('peso-muerto-rumano-mancuernas', 'peso-muerto-rumano-barra', 'VARIANTE', 'ALTA', 'Variante con barra.');
setClass('peso-muerto-rumano-mancuernas', 'peso-muerto-unilateral', 'RELACIONADO', 'ALTA', 'Variación monopodal.');

setClass('peso-muerto-unilateral', 'peso-muerto-rumano-mancuernas', 'RELACIONADO', 'ALTA', 'Bilateral vs unilateral.');

setClass('hip-thrust-barra', 'hip-thrust-unilateral', 'VARIANTE', 'ALTA', 'Variante unilateral del empuje de cadera.');
setClass('hip-thrust-barra', 'puente-de-gluteos', 'VARIANTE', 'ALTA', 'Variante en suelo.');

setClass('hip-thrust-unilateral', 'hip-thrust-barra', 'VARIANTE', 'ALTA', 'Variante bilateral.');
setClass('hip-thrust-unilateral', 'puente-de-gluteos', 'VARIANTE', 'ALTA', 'Variante en suelo.');

setClass('puente-de-gluteos', 'hip-thrust-barra', 'VARIANTE', 'ALTA', 'Variante con sobrecarga en banco.');
setClass('puente-de-gluteos', 'hip-thrust-unilateral', 'VARIANTE', 'ALTA', 'Variante unilateral.');

setClass('buenos-dias', 'peso-muerto-rumano-barra', 'RELACIONADO', 'ALTA', 'Bisagra con diferente palanca de carga.');
setClass('kettlebell-swing', 'peso-muerto-convencional', 'RELACIONADO', 'ALTA', 'Extensión balística de cadera a alta velocidad vs tracción estricta.');

// Zancadas y piernas
setClass('zancadas-caminando', 'zancadas-estaticas', 'VARIANTE', 'ALTA', 'Variante estática del mismo paso.');
setClass('zancadas-caminando', 'zancadas-inversas', 'VARIANTE', 'ALTA', 'Variante hacia atrás.');
setClass('zancadas-caminando', 'sentadilla-bulgara', 'RELACIONADO', 'ALTA', 'Zancada dinámica vs split squat en banco.');

setClass('zancadas-estaticas', 'zancadas-caminando', 'VARIANTE', 'ALTA', 'Variante con desplazamiento.');
setClass('zancadas-estaticas', 'zancadas-inversas', 'VARIANTE', 'ALTA', 'Variante con paso hacia atrás.');
setClass('zancadas-estaticas', 'sentadilla-bulgara', 'RELACIONADO', 'ALTA', 'Suelo vs banco.');

setClass('zancadas-inversas', 'zancadas-estaticas', 'VARIANTE', 'ALTA', 'Variante estática.');
setClass('zancadas-inversas', 'zancadas-caminando', 'VARIANTE', 'ALTA', 'Variante hacia adelante.');

setClass('step-up-banco', 'sentadilla-bulgara', 'RELACIONADO', 'ALTA', 'Subida a cajón vs split squat.');
setClass('step-up-banco', 'zancadas-caminando', 'RELACIONADO', 'ALTA', 'Ascenso vertical vs zancada.');

setClass('extension-cuadriceps-maquina', 'sentadilla-hack', 'RELACIONADO', 'ALTA', 'Aislamiento de rodilla vs empuje multiarticular.');
setClass('extension-cuadriceps-maquina', 'prensa-de-piernas', 'RELACIONADO', 'ALTA', 'Aislamiento monoarticular vs empuje compuesto.');

setClass('curl-femoral-tumbado', 'curl-femoral-sentado', 'VARIANTE', 'ALTA', 'Variante de flexión de rodilla modificando el ángulo de cadera.');
setClass('curl-femoral-tumbado', 'curl-nordico', 'RELACIONADO', 'ALTA', 'Máquina guiada vs calistenia excéntrica avanzada.');

setClass('curl-femoral-sentado', 'curl-femoral-tumbado', 'VARIANTE', 'ALTA', 'Variante en prono.');
setClass('curl-femoral-sentado', 'curl-nordico', 'RELACIONADO', 'ALTA', 'Máquina vs peso corporal excéntrico.');

setClass('curl-nordico', 'curl-femoral-tumbado', 'RELACIONADO', 'ALTA', 'Calistenia excéntrica vs máquina guiada.');
setClass('curl-nordico', 'peso-muerto-rumano-barra', 'RELACIONADO', 'ALTA', 'Flexión de rodilla vs bisagra de cadera.');

setClass('elevacion-talones-de-pie', 'elevacion-talones-sentado', 'VARIANTE', 'ALTA', 'Variante con rodilla flexionada (sóleo) vs extendida (gastrocnemio).');
setClass('elevacion-talones-sentado', 'elevacion-talones-de-pie', 'VARIANTE', 'ALTA', 'Variante con rodilla extendida.');

// Pectorales y empujes
setClass('press-banca-plano-barra', 'press-banca-inclinado-barra', 'VARIANTE', 'ALTA', 'Variación de ángulo inclinada en press de banca.');
setClass('press-banca-plano-barra', 'press-banca-declinado-barra', 'VARIANTE', 'ALTA', 'Variación de ángulo declinada en press de banca.');
setClass('press-banca-plano-barra', 'press-banca-plano-mancuernas', 'VARIANTE', 'ALTA', 'Variación a mancuernas con trayectoria convergente.');
setClass('press-banca-plano-barra', 'flexiones-de-brazos', 'RELACIONADO', 'ALTA', 'Cadena cinética abierta (barra) vs cerrada (peso corporal en suelo).');

setClass('press-banca-inclinado-barra', 'press-banca-plano-barra', 'VARIANTE', 'ALTA', 'Variación a plano.');
setClass('press-banca-inclinado-barra', 'press-banca-inclinado-mancuernas', 'VARIANTE', 'ALTA', 'Variación a mancuernas.');

setClass('press-banca-declinado-barra', 'press-banca-plano-barra', 'VARIANTE', 'ALTA', 'Variación a plano.');
setClass('press-banca-declinado-barra', 'fondos-en-paralelas', 'RELACIONADO', 'ALTA', 'Press horizontal declinado vs empuje vertical en paralelas.');

setClass('press-banca-plano-mancuernas', 'press-banca-plano-barra', 'VARIANTE', 'ALTA', 'Variación a barra.');
setClass('press-banca-plano-mancuernas', 'press-banca-inclinado-mancuernas', 'VARIANTE', 'ALTA', 'Variación de ángulo.');

setClass('press-banca-inclinado-mancuernas', 'press-banca-inclinado-barra', 'VARIANTE', 'ALTA', 'Variación a barra.');
setClass('press-banca-inclinado-mancuernas', 'press-banca-plano-mancuernas', 'VARIANTE', 'ALTA', 'Variación a plano.');

setClass('press-pecho-maquina', 'press-banca-plano-barra', 'RELACIONADO', 'ALTA', 'Empuje guiado en máquina vs barra libre inestable.');
setClass('press-pecho-maquina', 'press-banca-plano-mancuernas', 'RELACIONADO', 'ALTA', 'Máquina con trayectoria fija vs mancuernas libres.');

setClass('flexiones-de-brazos', 'flexiones-diamante', 'VARIANTE', 'ALTA', 'Variante con manos juntas.');
setClass('flexiones-de-brazos', 'flexiones-declinadas', 'VARIANTE', 'ALTA', 'Variante con pies elevados.');
setClass('flexiones-de-brazos', 'flexiones-arqueras', 'VARIANTE', 'ALTA', 'Variante asimétrica/unilateral.');
setClass('flexiones-de-brazos', 'press-banca-plano-barra', 'RELACIONADO', 'ALTA', 'Cadena cinética cerrada vs barra libre.');

setClass('flexiones-diamante', 'flexiones-de-brazos', 'VARIANTE', 'ALTA', 'Variante clásica.');
setClass('flexiones-diamante', 'fondos-en-paralelas', 'RELACIONADO', 'ALTA', 'Empuje en suelo vs empuje en paralelas.');

setClass('flexiones-declinadas', 'flexiones-de-brazos', 'VARIANTE', 'ALTA', 'Variante en suelo plano.');
setClass('flexiones-declinadas', 'pike-push-ups', 'RELACIONADO', 'ALTA', 'Empuje horizontal declinado vs empuje vertical pike.');

setClass('flexiones-arqueras', 'flexiones-de-brazos', 'VARIANTE', 'ALTA', 'Variante clásica.');

setClass('fondos-en-paralelas', 'fondos-en-banco', 'VARIANTE', 'ALTA', 'Variante con pies en banco reduciendo intensidad.');
setClass('fondos-en-paralelas', 'fondos-en-anillas', 'VARIANTE', 'ALTA', 'Variante en anillas con gran inestabilidad.');
setClass('fondos-en-paralelas', 'flexiones-diamante', 'RELACIONADO', 'ALTA', 'Empuje vertical en paralelas vs flexiones horizontales.');

setClass('fondos-en-banco', 'fondos-en-paralelas', 'VARIANTE', 'ALTA', 'Variante suspendida con peso corporal completo.');
setClass('fondos-en-banco', 'flexiones-diamante', 'RELACIONADO', 'ALTA', 'Fondos vs flexiones en suelo.');

setClass('fondos-en-anillas', 'fondos-en-paralelas', 'VARIANTE', 'ALTA', 'Variante sobre soporte rígido.');

// Hombros
setClass('press-militar-barra', 'press-hombros-mancuernas', 'VARIANTE', 'ALTA', 'Variante con mancuernas.');
setClass('press-militar-barra', 'push-press', 'RELACIONADO', 'ALTA', 'Press estricto vs movimiento balístico con impulso de piernas.');
setClass('press-militar-barra', 'press-arnold', 'VARIANTE', 'ALTA', 'Variante con rotación de antebrazos.');

setClass('press-hombros-mancuernas', 'press-militar-barra', 'VARIANTE', 'ALTA', 'Variante con barra.');
setClass('press-hombros-mancuernas', 'press-arnold', 'VARIANTE', 'ALTA', 'Variante con rotación.');

setClass('press-arnold', 'press-hombros-mancuernas', 'VARIANTE', 'ALTA', 'Variante estándar.');
setClass('press-arnold', 'press-militar-barra', 'VARIANTE', 'ALTA', 'Variante con barra.');

setClass('push-press', 'press-militar-barra', 'RELACIONADO', 'ALTA', 'Movimiento con ayuda de cadera vs press estricto.');

setClass('flexiones-hspu', 'pike-push-ups', 'VARIANTE', 'ALTA', 'Regresión con pies apoyados en suelo o cajón.');
setClass('flexiones-hspu', 'press-militar-barra', 'RELACIONADO', 'ALTA', 'Invertida con peso corporal vs press con barra de pie.');

setClass('pike-push-ups', 'flexiones-hspu', 'VARIANTE', 'ALTA', 'Progresión hacia flexión de pino completa.');
setClass('pike-push-ups', 'flexiones-de-brazos', 'RELACIONADO', 'ALTA', 'Empuje vertical invertido vs empuje horizontal.');

setClass('aperturas-mancuernas-plano', 'cruce-de-poleas', 'RELACIONADO', 'ALTA', 'Mancuernas libres vs poleas de tensión continua.');
setClass('aperturas-mancuernas-plano', 'contractora-pec-deck', 'RELACIONADO', 'ALTA', 'Peso libre vs máquina guiada.');

setClass('cruce-de-poleas', 'aperturas-mancuernas-plano', 'RELACIONADO', 'ALTA', 'Poleas vs mancuernas.');
setClass('cruce-de-poleas', 'contractora-pec-deck', 'RELACIONADO', 'ALTA', 'Poleas libres vs máquina pec deck.');

setClass('contractora-pec-deck', 'cruce-de-poleas', 'RELACIONADO', 'ALTA', 'Máquina vs poleas.');
setClass('contractora-pec-deck', 'aperturas-mancuernas-plano', 'RELACIONADO', 'ALTA', 'Máquina vs peso libre.');

setClass('elevaciones-laterales-mancuernas', 'elevaciones-laterales-polea', 'VARIANTE', 'ALTA', 'Variante con polea baja.');
setClass('elevaciones-laterales-polea', 'elevaciones-laterales-mancuernas', 'VARIANTE', 'ALTA', 'Variante con mancuernas.');

setClass('pajaros-posteriores-mancuernas', 'face-pull-polea', 'RELACIONADO', 'ALTA', 'Abducción horizontal con mancuernas vs tracción con rotación en polea.');
setClass('face-pull-polea', 'pajaros-posteriores-mancuernas', 'RELACIONADO', 'ALTA', 'Tracción en polea vs mancuernas.');

// Tríceps
setClass('press-frances-barra-z', 'extension-triceps-polea-alta', 'RELACIONADO', 'ALTA', 'Press supino libre con barra Z vs extensión vertical en polea.');
setClass('press-frances-barra-z', 'extension-triceps-tras-nuca-mancuerna', 'VARIANTE', 'ALTA', 'Variante overhead aumentando estiramiento de cabeza larga.');

setClass('extension-triceps-polea-alta', 'press-frances-barra-z', 'RELACIONADO', 'ALTA', 'Polea de pie vs barra Z en banco.');
setClass('extension-triceps-polea-alta', 'extension-triceps-tras-nuca-polea', 'VARIANTE', 'ALTA', 'Variante con brazos sobre la cabeza en polea.');

setClass('extension-triceps-tras-nuca-mancuerna', 'press-frances-barra-z', 'VARIANTE', 'ALTA', 'Variante acostada con barra.');
setClass('extension-triceps-tras-nuca-mancuerna', 'extension-triceps-tras-nuca-polea', 'VARIANTE', 'ALTA', 'Variante con polea.');

setClass('extension-triceps-tras-nuca-polea', 'extension-triceps-tras-nuca-mancuerna', 'VARIANTE', 'ALTA', 'Variante con mancuerna.');
setClass('extension-triceps-tras-nuca-polea', 'extension-triceps-polea-alta', 'VARIANTE', 'ALTA', 'Variante con brazos junto al tronco.');

// Espalda / Tracción
setClass('remo-con-barra-inclinado', 'remo-pendlay', 'VARIANTE', 'ALTA', 'Variante estricta con parada en suelo en cada repetición.');
setClass('remo-con-barra-inclinado', 'remo-con-mancuerna-a-una-mano', 'VARIANTE', 'ALTA', 'Variante unilateral con mancuerna y banco.');
setClass('remo-con-barra-inclinado', 'remo-en-polea-baja-gironda', 'RELACIONADO', 'ALTA', 'Remo libre con flexión de cadera vs polea sentada sin sobrecarga lumbar.');

setClass('remo-pendlay', 'remo-con-barra-inclinado', 'VARIANTE', 'ALTA', 'Variante con tensión sostenida.');

setClass('remo-con-mancuerna-a-una-mano', 'remo-con-barra-inclinado', 'VARIANTE', 'ALTA', 'Variante bilateral con barra.');
setClass('remo-con-mancuerna-a-una-mano', 'remo-en-polea-baja-gironda', 'RELACIONADO', 'ALTA', 'Mancuerna libre vs polea baja.');

setClass('remo-en-polea-baja-gironda', 'remo-con-barra-inclinado', 'RELACIONADO', 'ALTA', 'Polea guiada sentado vs remo libre.');
setClass('remo-en-polea-baja-gironda', 'remo-con-mancuerna-a-una-mano', 'RELACIONADO', 'ALTA', 'Polea baja vs mancuerna.');

setClass('remo-t-con-apoyo-al-pecho', 'remo-con-barra-inclinado', 'VARIANTE', 'ALTA', 'Variante con apoyo torácico que elimina ayuda de piernas y zona lumbar.');
setClass('remo-t-con-apoyo-al-pecho', 'remo-en-polea-baja-gironda', 'RELACIONADO', 'ALTA', 'Banco inclinado de remo T vs polea horizontal.');

setClass('remo-invertido', 'remo-en-anillas', 'VARIANTE', 'ALTA', 'Variante con anillas inestables.');
setClass('remo-invertido', 'dominadas-pronadas', 'RELACIONADO', 'ALTA', 'Tracción horizontal vs tracción vertical.');

setClass('remo-en-anillas', 'remo-invertido', 'VARIANTE', 'ALTA', 'Variante en barra fija.');

setClass('dominadas-pronadas', 'dominadas-supinadas', 'VARIANTE', 'ALTA', 'Variante con agarre supino.');
setClass('dominadas-pronadas', 'dominadas-neutras', 'VARIANTE', 'ALTA', 'Variante con agarre neutro.');
setClass('dominadas-pronadas', 'jalon-al-pecho-polea', 'RELACIONADO', 'ALTA', 'Cadena cinética cerrada vs abierta en polea.');

setClass('dominadas-supinadas', 'dominadas-pronadas', 'VARIANTE', 'ALTA', 'Variante con agarre pronado.');
setClass('dominadas-supinadas', 'dominadas-neutras', 'VARIANTE', 'ALTA', 'Variante con agarre neutro.');

setClass('dominadas-neutras', 'dominadas-pronadas', 'VARIANTE', 'ALTA', 'Variante pronada.');
setClass('dominadas-neutras', 'dominadas-supinadas', 'VARIANTE', 'ALTA', 'Variante supinada.');

setClass('jalon-al-pecho-polea', 'dominadas-pronadas', 'RELACIONADO', 'ALTA', 'Polea guiada vs tracción corporal.');
setClass('jalon-al-pecho-polea', 'jalon-agarre-estrecho-polea', 'VARIANTE', 'ALTA', 'Variante de agarre estrecho en misma polea.');

setClass('jalon-agarre-estrecho-polea', 'jalon-al-pecho-polea', 'VARIANTE', 'ALTA', 'Variante con agarre ancho.');

setClass('pull-over-en-polea-alta', 'jalon-al-pecho-polea', 'RELACIONADO', 'ALTA', 'Aislamiento monoarticular vs compuesto multiarticular.');

setClass('muscle-up', 'dominadas-pronadas', 'RELACIONADO', 'ALTA', 'Movimiento gimnástico avanzado que integra dominada y fondo.');
setClass('muscle-up', 'fondos-en-paralelas', 'RELACIONADO', 'ALTA', 'Fase de empuje en paralelas.');

// Bíceps
setClass('curl-biceps-barra', 'curl-biceps-mancuernas-alterno', 'VARIANTE', 'ALTA', 'Variante con mancuernas.');
setClass('curl-biceps-barra', 'curl-martillo-mancuernas', 'VARIANTE', 'ALTA', 'Variante con agarre neutro.');
setClass('curl-biceps-barra', 'curl-predicador-banco-scott', 'VARIANTE', 'ALTA', 'Variante con soporte de codos en banco Scott.');

setClass('curl-biceps-mancuernas-alterno', 'curl-biceps-barra', 'VARIANTE', 'ALTA', 'Variante con barra.');
setClass('curl-biceps-mancuernas-alterno', 'curl-martillo-mancuernas', 'VARIANTE', 'ALTA', 'Variante neutra.');

setClass('curl-martillo-mancuernas', 'curl-biceps-mancuernas-alterno', 'VARIANTE', 'ALTA', 'Variante con supinación.');
setClass('curl-martillo-mancuernas', 'curl-biceps-barra', 'VARIANTE', 'ALTA', 'Variante con barra.');

setClass('curl-predicador-banco-scott', 'curl-biceps-barra', 'VARIANTE', 'ALTA', 'Variante libre.');
setClass('curl-predicador-banco-scott', 'curl-spider-en-banco', 'VARIANTE', 'ALTA', 'Variante en banco prono cambiando pico de tensión.');

setClass('curl-spider-en-banco', 'curl-predicador-banco-scott', 'VARIANTE', 'ALTA', 'Variante en banco Scott.');

setClass('curl-de-muneca-antebrazo', 'curl-martillo-mancuernas', 'RELACIONADO', 'ALTA', 'Flexión de muñeca vs flexión de codo.');

// Core
setClass('plancha-abdominal-frontal', 'plancha-lateral', 'RELACIONADO', 'ALTA', 'Anti-extensión sagital vs anti-flexión frontal.');
setClass('plancha-abdominal-frontal', 'rueda-abdominal', 'RELACIONADO', 'ALTA', 'Estática de palanca corta vs rodamiento dinámico.');
setClass('plancha-abdominal-frontal', 'hollow-body-hold', 'RELACIONADO', 'ALTA', 'Prono vs supino.');

setClass('plancha-lateral', 'plancha-abdominal-frontal', 'RELACIONADO', 'ALTA', 'Anti-flexión lateral vs anti-extensión.');
setClass('plancha-lateral', 'press-pallof', 'RELACIONADO', 'ALTA', 'Gravedad lateral vs vector anti-rotación.');

setClass('rueda-abdominal', 'plancha-abdominal-frontal', 'RELACIONADO', 'ALTA', 'Dinámico avanzado vs isometría básica.');
setClass('rueda-abdominal', 'hollow-body-hold', 'RELACIONADO', 'ALTA', 'Prono dinámico vs supino estático.');
setClass('rueda-abdominal', 'dead-bug', 'RELACIONADO', 'ALTA', 'Estabilización del core con mecánicas totalmente distintas.');

setClass('hollow-body-hold', 'plancha-abdominal-frontal', 'RELACIONADO', 'ALTA', 'Supino vs prono.');
setClass('hollow-body-hold', 'dead-bug', 'RELACIONADO', 'ALTA', 'Isometría en barca vs coordinación alternada.');

setClass('elevacion-piernas-colgado', 'crunch-abdominal-suelo', 'RELACIONADO', 'ALTA', 'Flexión inferior de cadera/pelvis vs flexión craneal.');
setClass('elevacion-piernas-colgado', 'crunch-en-polea-alta', 'RELACIONADO', 'ALTA', 'Elevación colgado vs flexión con cable.');

setClass('crunch-abdominal-suelo', 'crunch-en-polea-alta', 'VARIANTE', 'ALTA', 'Variante con sobrecarga de polea para la misma flexión de tronco.');
setClass('crunch-abdominal-suelo', 'elevacion-piernas-colgado', 'RELACIONADO', 'ALTA', 'Flexión craneal vs flexión de cadera.');

setClass('crunch-en-polea-alta', 'crunch-abdominal-suelo', 'VARIANTE', 'ALTA', 'Variante en suelo.');

setClass('dead-bug', 'bird-dog', 'RELACIONADO', 'ALTA', 'Patrón coordinativo en supino vs cuadrúpedia.');
setClass('dead-bug', 'plancha-abdominal-frontal', 'RELACIONADO', 'ALTA', 'Supino con movimiento recíproco vs plancha prona.');

setClass('bird-dog', 'dead-bug', 'RELACIONADO', 'ALTA', 'Cuadrúpedia vs supino.');

setClass('press-pallof', 'plancha-lateral', 'RELACIONADO', 'ALTA', 'Anti-rotación con cable vs anti-flexión lateral.');

setClass('giros-rusos', 'press-pallof', 'RELACIONADO', 'ALTA', 'Rotación activa dinámica vs anti-rotación isométrica.');

// Potencia
setClass('cargada-de-potencia', 'dos-tiempos-clean-and-jerk', 'RELACIONADO', 'ALTA', 'Fase clean vs movimiento completo de dos tiempos.');
setClass('cargada-de-potencia', 'arrancada-snatch', 'RELACIONADO', 'ALTA', 'Cargada a hombros vs levantamiento continuo en un tiempo.');
setClass('cargada-de-potencia', 'kettlebell-swing', 'RELACIONADO', 'ALTA', 'Halterofilia con barra vs swing balístico con kettlebell.');

setClass('dos-tiempos-clean-and-jerk', 'cargada-de-potencia', 'RELACIONADO', 'ALTA', 'Levantamiento completo vs cargada.');
setClass('dos-tiempos-clean-and-jerk', 'arrancada-snatch', 'RELACIONADO', 'ALTA', 'Dos tiempos vs arrancada.');
setClass('dos-tiempos-clean-and-jerk', 'push-press', 'RELACIONADO', 'ALTA', 'Envión completo vs push press.');

setClass('arrancada-snatch', 'cargada-de-potencia', 'RELACIONADO', 'ALTA', 'Arrancada vs cargada.');
setClass('arrancada-snatch', 'dos-tiempos-clean-and-jerk', 'RELACIONADO', 'ALTA', 'Arrancada vs dos tiempos.');

setClass('salto-al-cajon', 'sentadilla-aerea', 'RELACIONADO', 'ALTA', 'Pliometría explosiva vs sentadilla autocarga.');

setClass('lanzamiento-balon-al-suelo', 'kettlebell-swing', 'RELACIONADO', 'ALTA', 'Flexión balística anterior con balón vs extensión posterior con kettlebell.');

setClass('paseo-del-granjero', 'empuje-de-trineo', 'RELACIONADO', 'ALTA', 'Transporte bípedo de carga estática vs empuje horizontal resistido.');
setClass('empuje-de-trineo', 'paseo-del-granjero', 'RELACIONADO', 'ALTA', 'Empuje vs transporte.');

// Cardio y movilidad
setClass('burpees', 'mountain-climbers', 'RELACIONADO', 'ALTA', 'Calistenia global con salto vs carrera en plancha.');
setClass('burpees', 'saltos-en-tijera', 'RELACIONADO', 'ALTA', 'Acondicionamiento global vs salto ligero.');

setClass('mountain-climbers', 'burpees', 'RELACIONADO', 'ALTA', 'Carrera en plancha vs burpees.');
setClass('mountain-climbers', 'plancha-abdominal-frontal', 'RELACIONADO', 'ALTA', 'Flexión dinámica alterna de cadera vs sostén estático.');

setClass('levantamiento-turco', 'kettlebell-swing', 'PENDIENTE_REVISION', 'BAJA', 'Solo comparten el implemento (kettlebell); cinemática y planos totalmente dispares.');

setClass('saltos-con-cuerda', 'saltos-en-tijera', 'VARIANTE', 'MEDIA', 'Variante de salto continuo de bajo impacto para acondicionamiento cardiovascular.');
setClass('saltos-en-tijera', 'saltos-con-cuerda', 'VARIANTE', 'MEDIA', 'Variante de salto coordinativo.');
setClass('saltos-en-tijera', 'burpees', 'RELACIONADO', 'ALTA', 'Salto continuo vs burpee.');

setClass('remoergometro', 'carrera-en-cinta', 'RELACIONADO', 'ALTA', 'Ergómetro de tracción sentada vs locomoción bípeda en cinta.');
setClass('carrera-en-cinta', 'remoergometro', 'RELACIONADO', 'ALTA', 'Carrera vs remo.');

setClass('gato-camello', 'rotacion-de-cadera-90-90', 'RELACIONADO', 'ALTA', 'Columna vs cadera.');
setClass('gato-camello', 'perro-boca-abajo', 'RELACIONADO', 'ALTA', 'Movilidad segmental de columna vs estiramiento estático global.');

setClass('rotacion-de-cadera-90-90', 'gato-camello', 'RELACIONADO', 'ALTA', 'Cadera vs columna.');
setClass('perro-boca-abajo', 'gato-camello', 'RELACIONADO', 'ALTA', 'Extensión global vs movilidad articular de columna.');

setClass('dislocaciones-de-hombro-con-banda', 'gato-camello', 'PENDIENTE_REVISION', 'BAJA', 'Movilidad de cintura escapular vs flexoextensión de columna; relación histórica dudosa.');

// Apply to all 109 exercises only when executed directly from CLI
import { fileURLToPath } from 'url';

function runMigration() {
  let totalVariantsCount = 0;
  let totalRelatedCount = 0;
  let totalReviewCount = 0;

  exercises.forEach(ex => {
    const currentVariants = ex.variantes || [];
    const trueVariants = [];
    const related = [];
    const substitutes = []; // conservative initialization

    currentVariants.forEach(targetId => {
      const key = `${ex.id}->${targetId}`;
      const cl = classificationMap.get(key);
      if (!cl) {
        console.warn('Missing classification for:', key);
        return;
      }
      if (cl.type === 'VARIANTE') {
        trueVariants.push(targetId);
        totalVariantsCount++;
      } else if (cl.type === 'RELACIONADO') {
        related.push(targetId);
        totalRelatedCount++;
      } else if (cl.type === 'PENDIENTE_REVISION') {
        // Conservative handling as per section 13:
        // Keep in related with flag or in document
        related.push(targetId);
        totalReviewCount++;
      }
    });

    ex.variantes = trueVariants;
    ex.ejercicios_relacionados = related;
    ex.sustitutos = substitutes;
  });

  console.log('Processed exercises:', exercises.length);
  console.log('Total True Variants kept in variantes:', totalVariantsCount);
  console.log('Total Related moved to ejercicios_relacionados:', totalRelatedCount);
  console.log('Total Pending Review kept in ejercicios_relacionados:', totalReviewCount);
  console.log('Total sum of relations:', totalVariantsCount + totalRelatedCount + totalReviewCount);

  // Save updated JSON
  fs.writeFileSync(SRC_PATH, JSON.stringify(cat, null, 2), 'utf-8');
  console.log('Updated', SRC_PATH);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runMigration();
}
