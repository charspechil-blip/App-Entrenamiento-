# INFORME OFICIAL DE NORMALIZACIÓN TAXONÓMICA Y BIOMECÁNICA — PUNTO 3C

**Proyecto:** Entreno — Catálogo Maestro de Ejercicios  
**Fase:** PUNTO 3C — Normalización Real de los 109 Ejercicios Oficiales  
**Versión del Catálogo:** `1.2.0` (schema: `1.2`)  
**Fuente Canónica:** `src/data/ejercicios.json`  
**Copia Derivada de Publicación:** `public/ejercicios.json`  
**Estado:** VALIDACIÓN EXITOSA — CATÁLOGO MAESTRO ÍNTEGRO (0 errores, 0 advertencias)

---

## 1. RESUMEN EJECUTIVO

En cumplimiento de las directrices del **Punto 3C**, se ha ejecutado la normalización integral de los **109 ejercicios oficiales** del Catálogo Maestro de Entreno, aplicando los fundamentos conceptuales definidos en el **Marco Biomecánico de Referencia (Punto 3A)** y las **Reglas de Clasificación Taxonómica (Punto 3B)**.

### Principios Fundamentales Cumplidos:
1. **Inmutabilidad de Identidades:** 
   - 0 IDs modificados.
   - 0 ejercicios eliminados (exactamente 109 ejercicios).
   - 0 alteraciones en nombres principales, nombres alternativos, descripciones o pasos de ejecución.
2. **Separación Estricta de 3 Niveles (Modelo Biomecánico vs Taxonomía vs Función):**
   - Eliminación total de variables funcionales/metabólicas (`cardiovascular`, `movilidad`) dentro de la dimensión estructural/anatómica `zona`.
   - Eliminación total de variables de cualidad física (`potencia`, `acondicionamiento`, `cardiovascular`, `movilidad`) dentro de la dimensión estructural articular `tipo` / `tipo_ejercicio`.
3. **Incorporación del Modelo Biomecánico Mínimo (7 Dimensiones):**
   - `cadena_cinetica`: abierta, cerrada, mixta.
   - `articulaciones_principales` y `articulaciones_secundarias`: anatómicas y específicas.
   - `plano_predominante`: sagital, frontal, transversal, multiplanar.
   - `unilateralidad`: bilateral, unilateral, alternado, asimetrico (con preservación del booleano `unilateral` para compatibilidad).
   - `tipo_resistencia`: peso_libre, peso_corporal, polea, maquina_guiada, elastico.
   - `demanda_estabilidad`: baja, media, alta.
   - `capacidad_fisica`: fuerza, hipertrofia, potencia, resistencia_muscular, cardiovascular, movilidad.
   - `estabilizadores`: musculatura activa de soporte isométrico.
4. **Normalización de Equipamiento:**
   - Unificación a vocabulario singular controlado (`mancuerna`, `disco`, etc.).
5. **Sincronización Automática:**
   - Publicación derivada (`public/ejercicios.json`) sincronizada 100% mediante `npm run catalog:build`.
   - Script de normalización reproducible creado en `scripts/normalizeCatalog.js` y expuesto vía `npm run catalog:normalize`.

---

## 2. COMPARATIVA ESTADÍSTICA: ANTES VS DESPUÉS

| Dimensión | Estado Previo (Legacy) | Estado Normalizado (Punto 3C) | Cambio Conceptual |
| :--- | :--- | :--- | :--- |
| **Total Ejercicios** | 109 | 109 | Ninguno (identidad intacta) |
| **Distribución `zona`** | `inferior`: 26<br>`superior`: 49<br>`core`: 11<br>`cuerpo_completo`: 14<br>`cardiovascular`: 5 ⚠️<br>`movilidad`: 4 ⚠️ | `inferior`: 31<br>`superior`: 50<br>`core`: 13<br>`cuerpo_completo`: 15<br>`cardiovascular`: 0 ✔️<br>`movilidad`: 0 ✔️ | Eliminadas categorías no anatómicas; reasignadas a sus regiones somáticas reales. |
| **Distribución `tipo`** | `multiarticular`: 63<br>`aislamiento`: 28<br>`potencia`: 9 ⚠️<br>`cardiovascular`: 5 ⚠️<br>`movilidad`: 4 ⚠️ | `multiarticular`: 73<br>`aislamiento`: 36<br>`potencia`: 0 ✔️<br>`cardiovascular`: 0 ✔️<br>`movilidad`: 0 ✔️ | Estructura estrictamente monoarticular vs multiarticular. |
| **`capacidad_fisica`** | No estructurada formalmente | `hipertrofia`: 45<br>`fuerza`: 25<br>`resistencia_muscular`: 15<br>`potencia`: 10<br>`cardiovascular`: 6<br>`movilidad`: 8 | Nueva dimensión funcional independiente de la anatomía. |
| **`cadena_cinetica`** | No existía en el esquema | `cerrada`: 46<br>`abierta`: 42<br>`mixta`: 21 | Dimensión física del extremo distal del segmento. |
| **`plano_predominante`**| No existía en el esquema | `sagital`: 87<br>`frontal`: 8<br>`transversal`: 7<br>`multiplanar`: 7 | Dimensión cinemática de la trayectoria motriz. |
| **`unilateralidad`** | Booleano simplificado (`true`/`false`) | `bilateral`: 84<br>`unilateral`: 10<br>`alternado`: 13<br>`asimetrico`: 2 | Distinción precisa entre trabajo unilateral puro, cíclico alterno y carga asimétrica. |
| **Equipamiento** | Plurales (`mancuernas`, `discos`) mezclados | Singular normalizado (`mancuerna`, `disco`) | Vocabulario homogéneo y canónico. |
| **Relaciones (Punto 4)**| 99 variantes, 107 relacionados, 0 sustitutos | 99 variantes, 107 relacionados, 0 sustitutos | Preservadas íntegramente sin regresión. |

---

## 3. AUDITORÍA DE LOS 15 CASOS DE PRUEBA DE CONTROL

| # | Ejercicio ID | Zona Anatómica | Tipo Ejercicio | Capacidad Física | Patrón Motor | Cadena | Plano | Unilateralidad | Resistencia | Estabilidad |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `sentadilla` | `inferior` | `multiarticular` | `fuerza` | `sentadilla` | `cerrada` | `sagital` | `bilateral` | `peso_libre` | `media` |
| 2 | `peso-muerto-convencional` | `cuerpo_completo` | `multiarticular` | `fuerza` | `bisagra_de_cadera` | `cerrada` | `sagital` | `bilateral` | `peso_libre` | `media` |
| 3 | `zancadas-caminando` | `inferior` | `multiarticular` | `hipertrofia` | `zancada` | `mixta` | `sagital` | `alternado` | `peso_libre` | `alta` |
| 4 | `press-banca-plano-barra` | `superior` | `multiarticular` | `fuerza` | `empuje_horizontal` | `abierta` | `sagital` | `bilateral` | `peso_libre` | `media` |
| 5 | `press-militar-barra` | `superior` | `multiarticular` | `fuerza` | `empuje_vertical` | `abierta` | `sagital` | `bilateral` | `peso_libre` | `media` |
| 6 | `remo-con-barra-inclinado` | `superior` | `multiarticular` | `hipertrofia` | `traccion_horizontal` | `abierta` | `sagital` | `bilateral` | `peso_libre` | `media` |
| 7 | `dominadas-pronadas` | `superior` | `multiarticular` | `fuerza` | `traccion_vertical` | `cerrada` | `frontal` | `bilateral` | `peso_corporal`| `media` |
| 8 | `curl-biceps-barra` | `superior` | `aislamiento` | `hipertrofia` | `flexion_de_codo` | `abierta` | `sagital` | `bilateral` | `peso_libre` | `baja` |
| 9 | `extension-triceps-polea-alta`| `superior` | `aislamiento` | `hipertrofia` | `extension_de_codo` | `abierta` | `sagital` | `bilateral` | `polea` | `baja` |
| 10 | `extension-cuadriceps-maquina`| `inferior` | `aislamiento` | `hipertrofia` | `extension_de_rodilla`| `abierta` | `sagital` | `bilateral` | `maquina_guiada`| `baja` |
| 11 | `sentadilla-bulgara` | `inferior` | `multiarticular` | `hipertrofia` | `sentadilla` | `cerrada` | `sagital` | `unilateral` | `peso_libre` | `alta` |
| 12 | `plancha-abdominal-frontal` | `core` | `aislamiento` | `resistencia_muscular` | `anti_extension` | `cerrada` | `sagital` | `bilateral` | `peso_corporal`| `media` |
| 13 | `sentadilla-isometrica-pared` | `inferior` | `multiarticular` | `resistencia_muscular` | `sentadilla` | `cerrada` | `sagital` | `bilateral` | `peso_corporal`| `baja` |
| 14 | `carrera-en-cinta` | `inferior` | `multiarticular` | `cardiovascular` | `locomocion` | `mixta` | `sagital` | `alternado` | `maquina_guiada`| `media` |
| 15 | `dos-tiempos-clean-and-jerk` | `cuerpo_completo` | `multiarticular` | `potencia` | `potencia` | `mixta` | `multiplanar`| `bilateral` | `peso_libre` | `alta` |

---

## 4. RESOLUCIÓN DE CASOS ESPECIALES Y AMBIGÜEDADES

1. **Ejercicios con Zona "Cardiovascular":**
   - `mountain-climbers`: Zona reasignada a `core` (plancha isométrica dinámica con flexión alterna coxofemoral). Capacidad física asignada: `cardiovascular` / `resistencia_muscular`.
   - `saltos-con-cuerda`: Zona reasignada a `inferior` (reactividad del complejo gastrosóleo-tendón de Aquiles y flexores plantares). Capacidad física: `cardiovascular`.
   - `saltos-en-tijera`: Zona reasignada a `cuerpo_completo` (sincronía de extremidades superiores e inferiores en plano frontal). Capacidad física: `cardiovascular`.
   - `remoergometro`: Zona reasignada a `cuerpo_completo` (empuje de piernas + bisagra + tracción escapular/brazos). Capacidad física: `cardiovascular`.
   - `carrera-en-cinta`: Zona reasignada a `inferior` (locomoción bípeda cíclica). Capacidad física: `cardiovascular`.

2. **Ejercicios con Zona "Movilidad":**
   - `gato-camello`: Zona reasignada a `core` (movilidad flexo-extensora raquídea y lumbo-pélvica). Capacidad física: `movilidad`.
   - `rotacion-de-cadera-90-90`: Zona reasignada a `inferior` (rotación interna/externa coxofemoral). Tipo: `aislamiento` articular. Capacidad física: `movilidad`.
   - `perro-boca-abajo`: Zona reasignada a `cuerpo_completo` (estiramiento y estabilización integrada de cadena posterior). Capacidad física: `movilidad`.
   - `dislocaciones-de-hombro-con-banda`: Zona reasignada a `superior` (circunducción de la cintura escapular). Capacidad física: `movilidad`.

3. **Ejercicios de Potencia y Acondicionamiento clasificados erróneamente como Tipo:**
   - `kettlebell-swing`, `push-press`, `muscle-up`, `cargada-de-potencia`, `dos-tiempos-clean-and-jerk`, `arrancada-snatch`, `salto-al-cajon`, `lanzamiento-balon-al-suelo`, `empuje-de-trineo`, `burpees`:  
     Todos fueron normalizados estructuralmente a `tipo: "multiarticular"` (movilizan 2 o más articulaciones simultáneas) y su cualidad dinámica asignada a `capacidad_fisica: "potencia"` o `"cardiovascular"`.

4. **Depuración de Músculos:**
   - Se removió el valor genérico `"core"` de `musculos_secundarios` en `dos-tiempos-clean-and-jerk`, sustituyéndolo por su musculatura anatómica real (`recto_abdominal`, `erectores_espinales`).

---

## 5. REVISIÓN Y VALIDACIÓN SEMÁNTICA DEL CATÁLOGO

El script `scripts/validateCatalog.js` ha sido enriquecido con validaciones semánticas estrictas:
1. `zona` y `zona_anatomica`: Únicamente valores anatómicos autorizados (`inferior`, `superior`, `core`, `cuerpo_completo`).
2. `tipo` y `tipo_ejercicio`: Únicamente valores estructurales autorizados (`multiarticular`, `aislamiento`).
3. `capacidad_fisica`: Vocabulario controlado (`fuerza`, `hipertrofia`, `potencia`, `resistencia_muscular`, `cardiovascular`, `movilidad`).
4. `cadena_cinetica`: `abierta`, `cerrada`, `mixta`.
5. `plano_predominante`: `sagital`, `frontal`, `transversal`, `multiplanar`.
6. `unilateralidad`: `bilateral`, `unilateral`, `alternado`, `asimetrico`.
7. `demanda_estabilidad`: `baja`, `media`, `alta`.
8. `tipo_resistencia`: `peso_libre`, `peso_corporal`, `polea`, `maquina_guiada`, `elastico`.

**Resultado del Test:**
```
=================================================================
  ESTADO: VALIDACIÓN EXITOSA — CATÁLOGO MAESTRO ÍNTEGRO
=================================================================
✔ Publicación exitosa:
  - Fuente canónica: src/data/ejercicios.json
  - Copia derivada : public/ejercicios.json
  - Total ejercicios: 109 (Versión 1.2.0)
```

**Resultado de TypeScript y Compilación:**
- `npm run lint`: 0 errores.
- `compile_applet`: Compilación exitosa sin incidencias.
- Compatibilidad 100% con componentes de interfaz y servicios de la aplicación.
