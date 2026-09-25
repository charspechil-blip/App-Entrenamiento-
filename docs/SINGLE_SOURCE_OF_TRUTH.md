# ARQUITECTURA SINGLE SOURCE OF TRUTH (SSOT) — ENTRENO
**Punto 7 — Definición Formal de Fuentes Canónicas, Flujos de Datos y Auditoría de Servicios**  
*Catálogo Maestro de Ejercicios y Sistema de Entrenamiento*

---

## 1. OBJETIVO Y PRINCIPIO RECTOR

El propósito de esta arquitectura es erradicar de forma definitiva cualquier duplicación, divergencia o manipulación manual redundante de la información dentro del ecosistema de la aplicación **Entreno**.

> **Principio Fundamental del SSOT:**  
> Cada entidad, parámetro o taxonomía tiene **un único lugar físico y conceptual donde vive y donde puede ser editada** (Fuente Canónica). Toda otra representación en la aplicación es:
> 1. Un artefacto publicado de distribución (ej. `public/ejercicios.json`).
> 2. Una proyección en memoria generada dinámicamente por código (ej. getters, derivadas, mapas de UI).
> 3. Un adaptador de compatibilidad tipado hacia componentes heredados.
>
> **Bajo ninguna circunstancia se mantienen manualmente dos representaciones de la misma información.**

---

## 2. CIERRE DEFINITIVO DE LA AUDITORÍA 6C

Antes de establecer formalmente las fuentes canónicas del Punto 7, se auditaron y corrigieron con precisión matemática los dos puntos observados sobre el Catálogo Maestro:

### 2.1. Erradicación de Doble Contabilización Padre/Hijo
- **Ejercicios Auditados:**
  1. `extension-triceps-tras-nuca-mancuerna`
  2. `extension-triceps-tras-nuca-polea`
- **Problema previo:** Ambos ejercicios listaban simultáneamente a `triceps_cabeza_larga` como motor principal y al grupo padre `triceps_braquial` como secundario. Según la jerarquía oficial de `src/data/muscles.json`, la cabeza larga es una porción anatómica hija de `triceps_braquial`. Registrar a ambos creaba una doble contabilización jerárquica padre/hijo.
- **Corrección aplicada en `src/data/ejercicios.json` y `scripts/normalizeMuscles6C.js`:**
  - `musculos_principales`: `["triceps_cabeza_larga"]`
  - `musculos_secundarios`: `[]`
  - `estabilizadores`: `["recto_abdominal", "manguito_rotador"]`
- **Justificación biomecánica:** La flexión de hombro a 180° sitúa a la cabeza larga (biarticular) en su máxima elongación funcional fisiológica, colocándola en la cresta de la curva longitud-tensión activa. Siendo un ejercicio monoarticular de aislamiento de extensión de codo en posición vertical, la cabeza larga asume la primacía del torque sin sinergistas secundarios diferenciados. Se mantiene la decisión 6C de especificar la cabeza larga sin registrar su grupo padre.

### 2.2. Auditoría Forense de las 2 Relaciones Adicionales en `ejercicios_relacionados` (107 vs 105)
La etapa 4 había documentado inicialmente 99 variantes genuinas y 105 relaciones relacionadas. La auditoría sobre `src/data/ejercicios.json` detectó 107 relaciones.
El análisis del histórico de migración (`scripts/migrateVariantRelations.js`) identificó exactamente las 2 relaciones adicionales:

| # | Ejercicio Origen | Ejercicio Relacionado | Clasificación en Punto 4 | Confianza | Justificación Técnica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `levantamiento-turco` | `kettlebell-swing` | `PENDIENTE_REVISION` | BAJA | Solo comparten el implemento (kettlebell); la cinemática, planos y demandas metabólicas son totalmente dispares. |
| **2** | `dislocaciones-de-hombro-con-banda` | `gato-camello` | `PENDIENTE_REVISION` | BAJA | Movilidad de cintura escapular frente a flexoextensión segmentaria de columna; relación histórica sin transfer biomecánico directo. |

- **Cuándo fueron introducidas:** Durante la migración algorítmica de variantes del Punto 4 (`scripts/migrateVariantRelations.js`). En dicho script se aplicó una regla conservadora de no pérdida de datos históricos: los 105 pares categorizados como `RELACIONADO` de alta/media confianza fueron asignados a `ejercicios_relacionados`, y los 2 casos catalogados como `PENDIENTE_REVISION` fueron igualmente preservados en `ejercicios_relacionados` con flag de revisión en lugar de ser eliminados silenciosamente (105 + 2 = 107).
- **Decisión de gobierno de datos:** Permanecen registradas en `ejercicios_relacionados` dentro de `src/data/ejercicios.json` para mantener la estabilidad del catálogo validado y la trazabilidad histórica de relaciones previas, sin alterar las 99 variantes genuinas de la familia.

---

## 3. MAPA DE FUENTES CANÓNICAS DEL SISTEMA

| Tipo de Información | Archivo / Ubicación Canónica | Responsable / Rol | Políticas de Modificación |
| :--- | :--- | :--- | :--- |
| **Catálogo Maestro de Ejercicios** (109 oficiales) | `src/data/ejercicios.json` | Single Source of Truth del Catálogo | **ÚNICA FUENTE DE EDICIÓN**. Contiene los 109 ejercicios oficiales, sus dimensiones biomecánicas (3A/3B/3C), variantes y relaciones (4) y normalización muscular (6C). Versión activa: `1.3.0`. |
| **Taxonomía Muscular Oficial** (84 entidades) | `src/data/muscles.json` | Single Source of Truth Anatómico | Vocabulario controlado de grupos, músculos y porciones anatómicas con jerarquía `padre` / `hijos`. Los identificadores de músculos en `src/data/ejercicios.json` deben pertenecer estrictamente a este vocabulario. |
| **Marco Biomecánico y Taxonómico** | `docs/MARCO_BIOMECANICO.md` | Marco Conceptual de Ejercicios | Define patrones de movimiento, cinemática articular, cadenas cinéticas, planos y criterios de familias. |
| **Marco de Clasificación Muscular** | `docs/MARCO_CLASIFICACION_MUSCULAR.md` | Marco Conceptual Muscular | Criterios funcionales estrictos para distinguir motores primarios, secundarios dinámicos y estabilizadores isométricos. |
| **Taxonomía Muscular Documentada** | `docs/TAXONOMIA_MUSCULAR.md` | Especificación de Entidades | Documentación descriptiva de los 84 identificadores musculares, relaciones sinérgicas y planos de acción. |
| **Relaciones Biomecánicas** (Variantes / Relacionados / Sustitutos) | `src/data/ejercicios.json` | Propiedades internas de cada ejercicio | Viven **dentro del objeto JSON de cada ejercicio** (`variantes`, `ejercicios_relacionados`, `sustitutos`). No se permite la creación de archivos maestros paralelos para estas relaciones. |
| **Ejercicios Personalizados del Usuario** | `src/data/user_custom_exercises.json` (servidor) + `localStorage` (cliente) | Persistencia aislada de usuario | Se guardan de forma totalmente aislada. **NUNCA modifican ni contaminan los 109 ejercicios oficiales de `src/data/ejercicios.json`**. |

---

## 4. CICLO DE VIDA Y FLUJO DE DATOS (DATA PIPELINE)

```
                         ┌───────────────────────────────┐
                         │   docs/MARCO_BIOMECANICO.md   │
                         │   docs/TAXONOMIA_MUSCULAR.md  │
                         └───────────────┬───────────────┘
                                         │  (Reglas y Especificación)
                                         ▼
   ┌───────────────────────┐            ┌───────────────────────┐
   │ src/data/muscles.json │◄───────────┤src/data/ejercicios.json│
   │  (Taxonomía Canónica) │            │ (Catálogo Canónico)   │
   └───────────┬───────────┘            └───────────┬───────────┘
               │                                    │
               │ (Validación 100% tokens)           │ (Lectura y Build)
               ▼                                    ▼
       npm run catalog:validate             scripts/buildCatalog.js
                                                    │
                                                    ▼
                                         ┌───────────────────────┐
                                         │public/ejercicios.json │  (Copia Publicada)
                                         └───────────┬───────────┘
                                                     │
                         ┌───────────────────────────┴───────────────────────────┐
                         ▼                                                       ▼
                Backend (server.ts)                                     Frontend Runtime
                • GET /api/exercises                                    • services/exerciseCatalog.ts
                • GET /api/health                                       • Proyecciones dinámicas
                                                                        • App.tsx, Modales, Mapas
```

### 4.1. Regla de Publicación hacia `public/ejercicios.json`
- `public/ejercicios.json` es estrictamente un **artefacto derivado de distribución**.
- **Dirección única del flujo:**
  $$\text{src/data/ejercicios.json} \xrightarrow{\text{scripts/buildCatalog.js}} \text{public/ejercicios.json}$$
- **Prohibición absoluta:** Nunca editar manualmente `public/ejercicios.json`. Cualquier edición manual sería sobrescrita en el siguiente proceso de build/validación.
- El comando `npm run catalog:build`:
  1. Ejecuta `scripts/validateCatalog.js` asegurando integridad total (109 ejercicios, vocabulario muscular válido, sin duplicaciones).
  2. Lee `src/data/ejercicios.json`.
  3. Escribe la copia sincronizada en `public/ejercicios.json`.

---

## 5. AUDITORÍA EXHAUSTIVA DE `services/exerciseCatalog.ts`

El servicio `services/exerciseCatalog.ts` actúa como el adaptador entre la fuente canónica `src/data/ejercicios.json` y la interfaz gráfica de usuario.

### Criterios de Clasificación
- **A — Canónico:** El dato pertenece al Catálogo Maestro `src/data/ejercicios.json`.
- **B — Derivado:** El dato se calcula dinámicamente en memoria a partir de una fuente canónica.
- **C — Compatibilidad:** Existe para que componentes legacy de la interfaz continúen funcionando sin romperse.
- **D — Obsoleto:** No tiene consumidores reales en la aplicación y se sanea/elimina.

### Tabla de Auditoría de Propiedades y Estructuras

| Elemento | Tipo | Consumidores Reales | Fuente Real | Acción Implementada en Punto 7 |
| :--- | :---: | :--- | :--- | :--- |
| `id` | **A** | App, enrutamiento, modales, logs de entrenamiento | `src/data/ejercicios.json` (`id`) | **Canónico primordial**. Conservar como clave única kebab-case inmutable. |
| `nombre` | **A** | `ManualLogModal`, `SetupWizard`, `RestTimerModal`, `App.tsx` | `src/data/ejercicios.json` (`nombre`) | **Canónico oficial**. Conservar como nombre estándar en español. |
| `name` | **C** | `CustomExerciseModal` (formulario heredado) | Derivado de `nombre` | **Compatibilidad derivada**. Proyectar como alias en tiempo de lectura (`name = nombre`). |
| `nombres_alternativos`| **A** | `findExerciseByName` (búsqueda inteligente con alias) | `src/data/ejercicios.json` | **Canónico**. Conservar para coincidencia de búsqueda tolerante. |
| `familia` | **A** | Filtros taxonómicos, clasificación biomecánica | `src/data/ejercicios.json` | **Canónico**. Conservar. |
| `patron_movimiento` | **A** | Filtros motores, sugerencias de rutina | `src/data/ejercicios.json` | **Canónico**. Conservar según taxonomía 3B. |
| `zona` | **A** | `workoutFlowUtils.ts` (`normalizeZone`), filtros somáticos | `src/data/ejercicios.json` | **Canónico**. Cuatro zonas oficiales: `inferior`, `superior`, `core`, `cuerpo_completo`. |
| `subzona` | **A** | Filtros anatómicos regionales | `src/data/ejercicios.json` | **Canónico**. Conservar. |
| `musculos_principales`| **A** | `RestTimerModal`, `workoutFlowUtils`, `CustomExerciseModal` | `src/data/ejercicios.json` | **Canónico**. Motores primarios normalizados en 6C (vocabulario 6B). |
| `musculos_secundarios`| **A** | `RestTimerModal`, `CustomExerciseModal`, mapas musculares | `src/data/ejercicios.json` | **Canónico**. Sinergistas dinámicos normalizados en 6C. |
| `estabilizadores` | **A** | Ficha técnica biomecánica, reportes anatómicos | `src/data/ejercicios.json` | **Canónico**. Fijadores y estabilizadores posturales de 6C. |
| `muscle_groups` | **B** | `constants/muscles.ts` (mapa SVG corporal) | Calculado vía `extractMuscleGroups()` | **Derivado en runtime**. Se calcula automáticamente a partir de músculos principales y secundarios; no se persiste duplicado en JSON. |
| `muscles.primary` | **C** | `CustomExerciseModal.tsx` | Proyección de `musculos_principales` | **Compatibilidad proyectada**. Generar dinámicamente como `{ primary, secondary }`. |
| `muscles.secondary`| **C** | `CustomExerciseModal.tsx` | Proyección de `musculos_secundarios` | **Compatibilidad proyectada**. Generar dinámicamente. |
| `ANATOMY_TO_MUSCLE_GROUP`| **B** | `extractMuscleGroups()` en `services/exerciseCatalog.ts` | Diccionario estático de mapeo somático | **Mapeador interno**. Mantiene correspondencia entre tokens de `muscles.json` y las 20 regiones visuales `MuscleGroup`. |
| `extractMuscleGroups()` | **B** | Inicializador del catálogo y modales | Función pura de transformación | **Utilidad derivada**. Extrae de forma determinista los grupos somáticos. |
| `normalizeEquipmentTags()`| **B** | `constants/equipment.ts`, filtros de UI | Función pura de presentación | **Proyector de vista**. Transforma equipamiento técnico a etiquetas de interfaz amigables. |
| `equipamiento` | **A** | `workoutFlowUtils`, modales de ejercicio | `src/data/ejercicios.json` | **Canónico**. Equipamiento normalizado en singular. |
| `equipment` | **C** | `CustomExerciseModal`, `workoutFlowUtils` | Proyección de `equipamiento` | **Compatibilidad derivada**. Se asigna a partir de `equipamiento`. |
| `descripcion` | **A** | Tarjetas de ejercicio, vistas de detalle | `src/data/ejercicios.json` | **Canónico**. Descripción formal del ejercicio. |
| `description` / `descripcion_breve` | **C** | Modales de ejercicio | Proyección de `descripcion` | **Compatibilidad derivada**. Se proyectan como alias de `descripcion`. |
| `ejecucion_pasos` | **A** | Modales de ejecución paso a paso | `src/data/ejercicios.json` | **Canónico**. Lista ordenada de pasos técnicos. |
| `executionSteps` | **C** | `CustomExerciseModal` | Proyección de `ejecucion_pasos` | **Compatibilidad derivada**. Proyectar como alias. |
| `errores_comunes` / `commonErrors` | **A / C** | Modales de técnica y seguridad | `src/data/ejercicios.json` | `errores_comunes` es **Canónico**; `commonErrors` se proyecta como alias. |
| `consejos_ejecucion` / `executionTips` | **A / C** | Consejos de coaching | `src/data/ejercicios.json` | `consejos_ejecucion` es **Canónico**; `executionTips` se proyecta como alias. |
| `precauciones` / `precautions` | **A / C** | Indicaciones de salud articular | `src/data/ejercicios.json` | `precauciones` es **Canónico**; `precautions` se proyecta como alias. |
| `video_url` / `videoUrl` | **A / C** | Reproductor multimedia | `src/data/ejercicios.json` | `video_url` es **Canónico**; `videoUrl` se proyecta como alias. |
| `imagen` / `image` | **A / C** | Miniaturas de ejercicio | `src/data/ejercicios.json` | `imagen` es **Canónico**; `image` se proyecta como alias. |
| `variantes` | **A** | Motor de sustituciones y progresiones | `src/data/ejercicios.json` | **Canónico**. Lista de IDs de la misma familia biomecánica (99 variantes). |
| `ejercicios_relacionados` | **A** | Navegación conceptual y ejercicios afines | `src/data/ejercicios.json` | **Canónico**. Lista de IDs afines (107 relaciones). |
| `sustitutos` | **A** | Reemplazos por lesión o equipo ausente | `src/data/ejercicios.json` | **Canónico**. 0 sustitutos directos oficiales en esta etapa. |
| `tipo` / `tipo_ejercicio` | **A** | Filtros multiarticular / aislamiento | `src/data/ejercicios.json` | `tipo` es **Canónico**; `tipo_ejercicio` se mantiene como alias canónico de 3B. |
| `unilateral` | **B** | Checkbox de lateralidad en modales | Derivado de `unilateralidad` | **Derivado en runtime**. `unilateral = (unilateralidad === 'unilateral' \|\| unilateralidad === 'alternado')`. |
| `sin_equipamiento_posible` / `canBeDoneWithoutEquipment` | **B** | Filtro de entrenamiento en casa | Derivado de `equipamiento` | **Derivado en runtime**. `true` si `equipamiento.includes('peso_corporal')`. |
| `zonas_corporales` / `bodyZones` | **D** | Eliminadas del almacenamiento maestro | Derivado de `zona` | **Obsoleto en JSON maestro / Proyectado para compatibilidad UI**. Se deriva como `[zona]` para evitar rupturas de tipos. |
| `subzonas` / `subzones` | **D** | Eliminadas del almacenamiento maestro | Derivado de `subzona` | **Obsoleto en JSON maestro / Proyectado para compatibilidad UI**. Se deriva como `[subzona]`. |
| `movementType` / `movementPattern` | **D** | Eliminadas del almacenamiento maestro | Derivado de `patron_movimiento` | **Obsoleto en JSON maestro / Proyectado para compatibilidad UI**. Se deriva como `[patron_movimiento]`. |
| `lado_cuerpo` / `laterality` | **D** | Eliminadas del almacenamiento maestro | Derivado de `unilateralidad` | **Obsoleto en JSON maestro / Proyectado para compatibilidad UI**. Se deriva de `unilateralidad`. |

---

## 6. ARQUITECTURA DE AISLAMIENTO PARA EJERCICIOS DE USUARIO

Para cumplir estrictamente con el principio de inmutabilidad del Catálogo Maestro:

1. **Catálogo Maestro Inmutable:**  
   `src/data/ejercicios.json` representa exclusivamente los **109 ejercicios oficiales certificados**. Ningún usuario, sesión o guardado dinámico puede escribir directamente en él durante la ejecución normal de la aplicación.
2. **Almacenamiento Separado de Personalizados:**  
   - En el cliente: `localStorage` bajo la clave `user_custom_exercises_catalog`.
   - En el servidor: `src/data/user_custom_exercises.json`.
3. **Fusión Determinista en Runtime:**  
   Al arrancar la aplicación, `initializeExerciseCatalog()` combina:
   $$\text{Catálogo Maestro (109)} \cup \text{Ejercicios Personalizados (Usuario)}$$
   priorizando la versión personalizada únicamente si el usuario ha creado una sobreescritura explícita, y manteniendo siempre el flag `personalizado: true` para distinguir los ejercicios de usuario de los oficiales.

---

## 7. VERIFICACIÓN Y COMPROBACIÓN DE INTEGRIDAD

El sistema cuenta con scripts automatizados de aseguramiento de calidad:

| Comando | Función en el SSOT |
| :--- | :--- |
| `npm run catalog:validate` | Verifica que `src/data/ejercicios.json` cumpla el esquema 1.3, contenga exactamente los 109 ejercicios oficiales, no tenga IDs duplicados, respete la jerarquía muscular y coincida con `public/ejercicios.json`. |
| `npm run muscles:validate` | Valida que todos los identificadores musculares de los 109 ejercicios existan en la taxonomía canónica `src/data/muscles.json` y que las jerarquías padre/hijo no presenten colisiones. |
| `npm run catalog:build` | Valida y publica deterministamente el catálogo maestro hacia `public/ejercicios.json`. |
| `npm run lint` | Valida tipos TypeScript en todo el proyecto (`tsc --noEmit`), garantizando que la refactorización no introdujo errores de tipos. |
| `npm run build` | Compila el bundle de producción de Vite y el servidor backend de Express/Node.js. |

---

## 8. CONCLUSIÓN

Con la implementación del **Punto 7 — Single Source of Truth**:
1. Toda la verdad del catálogo reside sin ambigüedad en `src/data/ejercicios.json`.
2. Toda la verdad muscular reside en `src/data/muscles.json`.
3. `public/ejercicios.json` es un artefacto de distribución generado por build, nunca modificado a mano.
4. `services/exerciseCatalog.ts` queda saneado como una capa de proyección y compatibilidad fuertemente tipada, libre de duplicaciones manuales.
5. El sistema está blindado contra divergencias de datos y listo para las etapas subsiguientes de cálculo de volumen y prescripción de entrenamiento.
