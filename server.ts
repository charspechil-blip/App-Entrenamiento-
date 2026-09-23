import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callGeminiResilient(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    primaryModel?: string;
  }
) {
  const primary = params.primaryModel || 'gemini-3.8-flash';
  const fallbackModel = 'gemini-3.1-flash-lite';

  try {
    return await ai.models.generateContent({
      model: primary,
      contents: params.contents,
      config: params.config,
    });
  } catch (err: any) {
    const isTransient = 
      err?.status === 'UNAVAILABLE' ||
      err?.status === 503 ||
      err?.code === 503 ||
      (err?.message && (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('RESOURCE_EXHAUSTED')));

    if (isTransient) {
      console.warn(`Primary Gemini model (${primary}) unavailable, retrying with fallback model (${fallbackModel})...`);
      try {
        return await ai.models.generateContent({
          model: fallbackModel,
          contents: params.contents,
          config: params.config,
        });
      } catch (fallbackErr: any) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}

function generateFallbackSummary(userProfile: any, sessionLogs: any[], metrics?: any): string {
  if (metrics) {
    const comparisonText = metrics.hasPreviousSession && metrics.loadDensityDiffPercent !== null
      ? (metrics.loadDensityDiffPercent >= 0 
          ? `con un incremento del +${metrics.loadDensityDiffPercent}% en densidad de carga` 
          : `con una densidad de ${metrics.loadDensity} kg/min`)
      : `estableciendo una base de ${metrics.loadDensity} kg/min`;

    return `Buen trabajo manteniendo un ritmo eficiente de **${metrics.loadDensity} kg/min** (${comparisonText}). En la próxima sesión, enfócate en añadir 1 repetición o aumentar 1-2 kg respetando tus descansos para consolidar la sobrecarga progresiva.`;
  }

  const name = userProfile?.name || 'Atleta';
  let totalVolume = 0;
  sessionLogs.forEach((log) => {
    (log.clusters || []).forEach((c: any) => {
      totalVolume += (Number(c.weight) || 0) * (Number(c.reps) || 0);
    });
  });

  return `Gran sesión, **${name}**. Registraste **${totalVolume.toLocaleString('es-ES')} kg** de volumen total; mantén la cadencia y los descansos controlados para tu siguiente entrenamiento.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Workout analysis endpoint
  app.post("/api/gemini/analyze-workout", async (req, res) => {
    try {
      const { userProfile, sessionLogs, metrics } = req.body;
      if (!sessionLogs || !Array.isArray(sessionLogs) || sessionLogs.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron registros de entrenamiento." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        const fallback = generateFallbackSummary(userProfile, sessionLogs, metrics);
        return res.json({ summary: fallback });
      }

      const metricsContext = metrics ? `
Métricas de rendimiento calculadas:
- Volumen total completado: ${metrics.totalVolume} kg
- Volumen por ejercicio:
${(metrics.volumeByExercise || []).map((e: any) => `  * ${e.exerciseName}: ${e.volume} kg (${e.sets} series, ${e.reps} reps)`).join('\n')}
- Tiempo estimado de sesión: ${metrics.estimatedSessionDurationFormatted}
- Total tiempo en descanso: ${metrics.totalRestFormatted}
- Densidad de carga: ${metrics.loadDensity} kg/min ${metrics.hasPreviousSession && metrics.loadDensityDiffPercent !== null ? `(${metrics.loadDensityDiffPercent >= 0 ? '+' : ''}${metrics.loadDensityDiffPercent}% vs. sesión anterior)` : '(Primera sesión)'}
` : '';

      const prompt = `
Eres un entrenador y analista de fuerza de alto rendimiento.
Analiza la siguiente sesión de entrenamiento para ${userProfile?.name || 'el atleta'}:

${metricsContext}
Registros de series completadas:
${sessionLogs.map((log: any) => `- ${log.exerciseName}: ${(log.clusters || []).map((c: any) => `${c.weight > 0 ? `${c.weight}kg x ` : ''}${c.reps} reps`).join(', ')}`).join('\n')}

Instrucciones directas:
Proporciona una conclusión técnica y concisa de 1 o 2 oraciones (máximo 45 palabras).
NO uses saludos genéricos ni párrafos de relleno conversacional.
Sé directo y profesional: destaca el balance entre volumen y densidad de carga, y da una recomendación específica y accionable para la próxima sesión (ej. sobrecarga progresiva o control de descanso).
Usa markdown en negrita (ej. **sobrecarga**) si aporta énfasis. Responde en español.
`;

      try {
        const response = await callGeminiResilient(ai, {
          contents: prompt,
        });

        const text = response.text || generateFallbackSummary(userProfile, sessionLogs, metrics);
        return res.json({ summary: text });
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, falling back to local analysis:", geminiError?.message || geminiError);
        const fallback = generateFallbackSummary(userProfile, sessionLogs, metrics);
        return res.json({ summary: fallback });
      }
    } catch (error: any) {
      console.error("Error in /api/gemini/analyze-workout:", error);
      const fallback = generateFallbackSummary(req.body?.userProfile, req.body?.sessionLogs || [], req.body?.metrics);
      return res.json({ summary: fallback });
    }
  });

  // Rest parser endpoint
  app.post("/api/gemini/parse-rest", async (req, res) => {
    try {
      const { text } = req.body;
      const ai = getGeminiClient();

      if (!ai || !text) {
        return res.json({ restBetweenSets: 60, restBetweenExercises: 180 });
      }

      try {
        const schema = {
          type: Type.OBJECT,
          properties: {
            restBetweenSets: { type: Type.INTEGER, description: "Descanso en segundos entre series." },
            restBetweenExercises: { type: Type.INTEGER, description: "Descanso en segundos entre ejercicios." }
          }
        };

        const response = await callGeminiResilient(ai, {
          contents: `Texto del usuario: "${text}"`,
          config: {
            systemInstruction: "Interpreta el texto del usuario para extraer los tiempos de descanso. El usuario puede usar 'minutos' o 'segundos'. Convierte todo a segundos. Si un valor no se especifica, usa 60 para series y 180 para ejercicios. Devuelve un objeto JSON.",
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });

        const parsed = JSON.parse(response.text || "{}");
        return res.json({
          restBetweenSets: parsed.restBetweenSets || 60,
          restBetweenExercises: parsed.restBetweenExercises || 180
        });
      } catch (err) {
        console.warn("Gemini rest parse fallback:", err);
        return res.json({ restBetweenSets: 60, restBetweenExercises: 180 });
      }
    } catch (error) {
      return res.json({ restBetweenSets: 60, restBetweenExercises: 180 });
    }
  });

  // Goals parser endpoint
  app.post("/api/gemini/parse-goals", async (req, res) => {
    try {
      const { text, selectedExercises } = req.body;
      const ai = getGeminiClient();

      if (!ai || !text || !Array.isArray(selectedExercises)) {
        return res.json({ goals: [] });
      }

      try {
        const schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              exerciseName: { type: Type.STRING },
              goal: {
                type: Type.OBJECT,
                properties: {
                  weight: { type: Type.NUMBER },
                  reps: { type: Type.NUMBER },
                  series: { type: Type.NUMBER }
                }
              }
            }
          }
        };

        const systemInstruction = `
Eres un asistente experto en fitness. Tu tarea es interpretar las metas de entrenamiento del usuario y devolver un array JSON. Debes ser flexible con los nombres de los ejercicios que el usuario te da.

Esta es la lista oficial de ejercicios disponibles en la rutina del usuario:
[${selectedExercises.map((e: string) => `"${e}"`).join(', ')}]

Cuando el usuario mencione un ejercicio (ej. "press banca", "sentadillas", "curl de biceps"), tu trabajo es encontrar la coincidencia más cercana y lógica en la lista oficial.
Para cada meta que identifiques:
1. Encuentra el 'exerciseName' correspondiente de la lista oficial.
2. Extrae los valores para 'weight', 'reps' y 'series'.
3. Si faltan datos, usa estos valores por defecto: series = 3, weight = 0, reps = 10.
4. Si el usuario da una meta general (ej. "3 series de 10 para todo"), aplícala a CADA ejercicio de la lista oficial.
5. El campo 'exerciseName' en tu respuesta JSON DEBE ser uno de los valores exactos de la lista oficial proporcionada.`;

        const response = await callGeminiResilient(ai, {
          contents: `Descripción de metas del usuario: "${text}".`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });

        const parsed = JSON.parse(response.text || "[]");
        return res.json({ goals: parsed });
      } catch (err) {
        console.warn("Gemini goals parse fallback:", err);
        return res.json({ goals: [] });
      }
    } catch (error) {
      return res.json({ goals: [] });
    }
  });

  // Lookup exercise with Gemini web search
  app.post("/api/gemini/lookup-exercise", async (req, res) => {
    try {
      const { exerciseName } = req.body;
      if (!exerciseName || typeof exerciseName !== 'string') {
        return res.status(400).json({ error: "Nombre del ejercicio requerido." });
      }

      const buildLocalFallback = (name: string) => {
        const lower = name.toLowerCase();
        let zona = "inferior";
        let zonas_corporales = ["Tren inferior"];
        let subzona = "Piernas";
        let subzonas = ["Cuádriceps", "Glúteos"];
        let categoria = "Fuerza";
        let categorias_secundarias = ["Hipertrofia"];
        let equipamiento = ["Peso corporal", "Mancuernas"];
        let variantes_equipamiento: string[] = [];
        let sin_equipamiento_posible = true;
        let musculos_principales = ["Cuádriceps", "Glúteo mayor"];
        let musculos_secundarios = ["Isquiotibiales", "Core"];
        let muscle_groups = ["quads", "glutes"];
        let tipo_movimiento = "Sentadilla";
        let patrones_movimiento = ["Sentadilla", "Dominante de rodilla"];
        let lado_cuerpo = "Bilateral";
        let posicion_principal = "De pie";
        let nivel_dificultad = "Intermedio";
        let descripcion_breve = `Ejercicio de tren inferior para desarrollar fuerza y masa muscular en ${name.trim()}.`;
        let descripcion_tecnica = `Colócate en bipedestación con los pies alineados al ancho de los hombros. Desciende flexionando caderas y rodillas de manera controlada hasta romper el paralelo y regresa empujando el suelo.`;
        let errores_comunes = ["Colapso de rodillas en valgo hacia adentro.", "Arquear excesivamente la espalda lumbar.", "Despegar los talones del suelo al descender."];
        let consejos_ejecucion = ["Mantén el pecho erguido y la mirada al frente.", "Contrae el abdomen antes de iniciar el descenso."];
        let precauciones = ["Calentar adecuadamente la articulación de la cadera y rodillas antes de cargar peso."];

        if (lower.includes("elevaci") || lower.includes("lateral") || lower.includes("vuelo")) {
          zona = "superior";
          zonas_corporales = ["Tren superior"];
          subzona = "Hombros";
          subzonas = ["Hombros"];
          categoria = "Aislamiento";
          categorias_secundarias = ["Hipertrofia"];
          equipamiento = ["Mancuernas", "Polea"];
          variantes_equipamiento = ["Polea baja", "Mancuernas sentado"];
          sin_equipamiento_posible = false;
          musculos_principales = ["Deltoides lateral"];
          musculos_secundarios = ["Deltoides anterior", "Trapecio superior", "Supraespinoso"];
          muscle_groups = ["shoulders"];
          tipo_movimiento = "Elevación";
          patrones_movimiento = ["Aislamiento"];
          lado_cuerpo = "Bilateral";
          posicion_principal = "De pie";
          nivel_dificultad = "Intermedio";
          descripcion_breve = "Ejercicio de aislamiento enfocado en el desarrollo de la cabeza lateral del deltoides para amplitud escapular.";
          descripcion_tecnica = "De pie con las mancuernas a los lados, elevar los brazos guiando con los codos hasta la altura de los hombros con una ligera flexión de codo.";
          errores_comunes = ["Utilizar balanceo con el torso o impulso de cadera.", "Encoger el cuello activando en exceso el trapecio.", "Subir las manos por encima de los codos."];
          consejos_ejecucion = ["Piensa en empujar hacia las paredes laterales.", "Mantén una pausa de 1 segundo en el punto de contracción."];
          precauciones = ["Inclinar ligeramente el torso (10-15°) en el plano escapular para evitar pinzamiento subacromial."];
        } else if (lower.includes("sumo")) {
          zona = "inferior";
          zonas_corporales = ["Tren inferior"];
          subzona = "Piernas";
          subzonas = ["Cuádriceps", "Glúteos", "Aductores"];
          categoria = "Fuerza";
          categorias_secundarias = ["Hipertrofia"];
          equipamiento = ["Peso corporal", "Mancuernas", "Barra olímpica"];
          variantes_equipamiento = ["Kettlebell sumo", "Mancuerna en banco elevado"];
          sin_equipamiento_posible = true;
          musculos_principales = ["Aductor mayor", "Glúteo mayor", "Cuádriceps"];
          musculos_secundarios = ["Isquiotibiales", "Erectores espinales"];
          muscle_groups = ["adductors", "glutes", "quads", "hamstrings"];
          tipo_movimiento = "Sentadilla";
          patrones_movimiento = ["Sentadilla", "Apertura amplia"];
          lado_cuerpo = "Bilateral";
          posicion_principal = "De pie";
          nivel_dificultad = "Intermedio";
          descripcion_breve = "Variante de sentadilla con base amplia que enfatiza aductores y glúteos.";
          descripcion_tecnica = "Pies separados a 1.5 veces el ancho de los hombros con puntas a 45°. Desciende verticalmente manteniendo las rodillas abiertas en la línea de los pies.";
          errores_comunes = ["Dejar que las rodillas se cierren hacia adentro.", "Inclinar excesivamente el torso hacia adelante."];
          consejos_ejecucion = ["Abre bien la cadera y empuja el piso separándolo con los pies."];
          precauciones = ["Trabajar la movilidad de aductores antes de usar cargas elevadas."];
        } else if (lower.includes("press") || lower.includes("banca") || lower.includes("flexi") || lower.includes("pecho") || lower.includes("fondo")) {
          zona = "superior";
          zonas_corporales = ["Tren superior"];
          subzona = "Pecho";
          subzonas = ["Pecho", "Tríceps", "Hombros"];
          categoria = "Fuerza";
          categorias_secundarias = ["Hipertrofia"];
          equipamiento = lower.includes("mancuerna") 
            ? ["Mancuernas", "Banco"] 
            : lower.includes("barra") 
              ? ["Barra olímpica", "Banco"] 
              : ["Peso corporal", "Mancuernas", "Banco"];
          variantes_equipamiento = ["Banco inclinado", "Banco plano", "Mancuernas agarre neutro"];
          sin_equipamiento_posible = lower.includes("flexi");
          musculos_principales = ["Pectoral mayor", "Tríceps braquial"];
          musculos_secundarios = ["Deltoides anterior"];
          muscle_groups = ["chest", "triceps", "shoulders_front"];
          tipo_movimiento = "Empuje";
          patrones_movimiento = ["Empuje horizontal"];
          lado_cuerpo = "Bilateral";
          posicion_principal = lower.includes("flexi") ? "Apoyado" : "Acostado";
          nivel_dificultad = "Principiante";
          descripcion_breve = "Movimiento compuesto de empuje para desarrollar masa y potencia en pecho y tríceps.";
          descripcion_tecnica = "Retrae y deprime las escápulas. Baja la carga de forma controlada hasta la línea media del pecho y empuja con potencia manteniendo los codos a 45-60°.";
          errores_comunes = ["Abrir los codos a 90° respecto al torso.", "Despegar los glúteos del banco.", "Rebotar la barra en el esternón."];
          consejos_ejecucion = ["Mantén los pies firmemente clavados en el suelo generando leg drive."];
          precauciones = ["Mantener muñecas neutras y escápulas pegadas al banco durante toda la serie."];
        } else if (lower.includes("remo") || lower.includes("jal") || lower.includes("espalda") || lower.includes("dominada")) {
          zona = "superior";
          zonas_corporales = ["Tren superior"];
          subzona = "Espalda";
          subzonas = ["Espalda", "Bíceps"];
          categoria = "Fuerza";
          categorias_secundarias = ["Hipertrofia"];
          equipamiento = lower.includes("dominada") ? ["Barra de dominadas", "Peso corporal"] : ["Polea", "Mancuernas", "Barra olímpica"];
          variantes_equipamiento = ["Agarre neutro", "Agarre prono ancho", "Polea alta"];
          sin_equipamiento_posible = lower.includes("dominada");
          musculos_principales = ["Dorsal ancho", "Trapecio", "Romboides"];
          musculos_secundarios = ["Bíceps braquial", "Deltoides posterior"];
          muscle_groups = ["lats", "mid_back", "biceps", "traps"];
          tipo_movimiento = "Tirón";
          patrones_movimiento = lower.includes("jal") || lower.includes("dominada") ? ["Tracción vertical"] : ["Tracción horizontal"];
          lado_cuerpo = "Bilateral";
          posicion_principal = lower.includes("dominada") ? "Colgado" : "Sentado";
          nivel_dificultad = "Intermedio";
          descripcion_breve = "Ejercicio de tracción fundamental para densidad y amplitud de la espalda.";
          descripcion_tecnica = "Inicia el movimiento deprimiendo las escápulas y tracciona llevando los codos hacia las caderas, no solo tirando con los brazos.";
          errores_comunes = ["Tironear con impulso lumbar.", "No completar el rango de retracción escapular al final."];
          consejos_ejecucion = ["Imagina que tus manos son solo ganchos y la fuerza proviene de tus codos."];
          precauciones = ["Controlar la fase de estiramiento excéntrico sin soltar de golpe la carga."];
        } else if (lower.includes("curl") || lower.includes("biceps") || lower.includes("triceps") || lower.includes("brazo")) {
          zona = "superior";
          zonas_corporales = ["Tren superior"];
          subzona = "Brazos";
          subzonas = ["Bíceps", "Tríceps", "Antebrazo"];
          categoria = "Aislamiento";
          categorias_secundarias = ["Hipertrofia"];
          equipamiento = ["Mancuernas", "Polea", "Barra olímpica"];
          variantes_equipamiento = ["Barra Z", "Banco scott", "Cuerda en polea"];
          sin_equipamiento_posible = false;
          musculos_principales = lower.includes("tricep") ? ["Tríceps braquial"] : ["Bíceps braquial"];
          musculos_secundarios = ["Antebrazos"];
          muscle_groups = lower.includes("tricep") ? ["triceps"] : ["biceps", "forearms"];
          tipo_movimiento = lower.includes("tricep") ? "Extensión" : "Flexión";
          patrones_movimiento = ["Aislamiento"];
          lado_cuerpo = "Bilateral";
          posicion_principal = "De pie";
          nivel_dificultad = "Principiante";
          descripcion_breve = "Aislamiento analítico de los brazos para desarrollo muscular localizado.";
          descripcion_tecnica = "Fija los codos a los costados del torso y realiza la flexión/extensión completa sin balancear el cuerpo.";
          errores_comunes = ["Mover los codos hacia adelante adelantando los hombros.", "Acortar el recorrido inferior."];
          consejos_ejecucion = ["Aprieta al máximo en la contracción cumbre y frena la bajada."];
          precauciones = ["Evitar hiperextender las muñecas bajo carga."];
        } else if (lower.includes("plancha") || lower.includes("crunch") || lower.includes("abdom") || lower.includes("core")) {
          zona = "core";
          zonas_corporales = ["Core"];
          subzona = "Core";
          subzonas = ["Recto abdominal", "Oblicuos", "Transverso"];
          categoria = "Funcional";
          categorias_secundarias = ["Aislamiento"];
          equipamiento = ["Peso corporal"];
          variantes_equipamiento = ["Con disco de peso", "En balón suizo"];
          sin_equipamiento_posible = true;
          musculos_principales = ["Recto abdominal", "Oblicuos"];
          musculos_secundarios = ["Transverso abdominal", "Lumbar"];
          muscle_groups = ["abs", "obliques"];
          tipo_movimiento = "Isométrico";
          patrones_movimiento = ["Anti-extensión", "Estabilidad central"];
          lado_cuerpo = "Bilateral";
          posicion_principal = "Apoyado";
          nivel_dificultad = "Principiante";
          descripcion_breve = "Trabajo de activación y estabilidad estática o dinámica de la pared abdominal.";
          descripcion_tecnica = "Mantén el cuerpo en una línea recta desde la coronilla hasta los talones, retroversión pélvica activa y respiración diafragmática fluida.";
          errores_comunes = ["Dejar caer la cadera arqueando la espalda lumbar.", "Elevar los glúteos formando una carpa."];
          consejos_ejecucion = ["Aprieta glúteos y empuja el suelo con los antebrazos activando el serrato."];
          precauciones = ["Detener si se siente molestia en la zona baja de la espalda."];
        }

        return {
          nombre: name.trim(),
          name: name.trim(),
          categoria,
          category: categoria,
          categorias_secundarias,
          secondaryCategories: categorias_secundarias,
          descripcion_breve,
          description: descripcion_breve,
          descripcion: descripcion_breve,
          equipamiento,
          equipment: equipamiento,
          variantes_equipamiento,
          equipmentVariants: variantes_equipamiento,
          sin_equipamiento_posible,
          canBeDoneWithoutEquipment: sin_equipamiento_posible,
          zonas_corporales,
          bodyZones: zonas_corporales,
          zona,
          subzona,
          subzonas,
          musculos_principales,
          musculos_secundarios,
          muscles: { primary: musculos_principales, secondary: musculos_secundarios },
          muscle_groups,
          tipo_movimiento,
          movementType: tipo_movimiento,
          patrones_movimiento,
          movementPattern: patrones_movimiento,
          lado_cuerpo,
          laterality: lado_cuerpo,
          posicion_principal,
          position: posicion_principal,
          nivel_dificultad,
          difficulty: nivel_dificultad,
          descripcion_tecnica,
          executionDescription: descripcion_tecnica,
          ejecucion_pasos: [
            "Colócate en la posición inicial alineando articulaciones y activando el core.",
            "Inicia el movimiento con cadencia controlada inhalando profundamente.",
            "Alcanza el rango de recorrido activo sin comprometer la postura.",
            "Regresa al inicio con contracción sostenida y exhala de forma controlada."
          ],
          errores_comunes,
          commonErrors: errores_comunes,
          consejos_ejecucion,
          executionTips: consejos_ejecucion,
          precauciones,
          video_url: ""
        };
      };

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({ exercise: buildLocalFallback(exerciseName), source: 'local-fallback' });
      }

      const prompt = `Investiga con máxima precisión técnica y biomecánica el ejercicio físico: "${exerciseName}".
Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta y rica para catalogarlo en la aplicación Entreno:

{
  "nombre": "Nombre formal en español (ej. Elevación lateral)",
  "categoria": "Fuerza" | "Hipertrofia" | "Aislamiento" | "Funcional" | "Cardio" | "Movilidad" | "Estiramiento" | "Pliometría" | "Potencia" | "Otro",
  "categorias_secundarias": ["Hipertrofia", "Fuerza"],
  "descripcion_breve": "Descripción concisa en español (máximo 200 caracteres) que resuma el objetivo principal del ejercicio.",
  "equipamiento": ["Peso corporal", "Mancuernas", "Barra olímpica", "Máquina", "Polea", "Kettlebell", "Bandas elásticas", "Banco", "Barra de dominadas", "Discos", "TRX", "Otro"],
  "variantes_equipamiento": ["Polea alta", "Mancuerna agarre neutro", "Banco inclinado"],
  "sin_equipamiento_posible": true | false,
  "zonas_corporales": ["Tren superior" | "Tren inferior" | "Core" | "Cuerpo completo"],
  "subzonas": ["Pecho" | "Espalda" | "Hombros" | "Bíceps" | "Tríceps" | "Antebrazo" | "Cuádriceps" | "Isquiotibiales" | "Glúteos" | "Aductores" | "Abductores" | "Gemelos" | "Recto abdominal" | "Oblicuos" | "Transverso" | "Lumbar"],
  "musculos_principales": ["Músculo específico de mayor demanda 1", "Músculo 2"],
  "musculos_secundarios": ["Músculo de apoyo/sinergista 1", "Músculo 2"],
  "muscle_groups": ["quads", "hamstrings", "glutes", "adductors", "calves_rear", "calves_front", "chest", "triceps", "biceps", "shoulders", "shoulders_front", "shoulders_rear", "lats", "mid_back", "lower_back", "traps", "abs", "obliques", "forearms"],
  "tipo_movimiento": "Empuje" | "Tirón" | "Sentadilla" | "Bisagra de cadera" | "Locomoción" | "Rotación" | "Anti-rotación" | "Flexión" | "Extensión" | "Elevación" | "Isométrico" | "Otro",
  "patrones_movimiento": ["Empuje horizontal" | "Tracción vertical" | "Sentadilla" | "Bisagra de cadera" | "Aislamiento" | etc.],
  "lado_cuerpo": "Bilateral" | "Unilateral" | "Alternado",
  "posicion_principal": "De pie" | "Sentado" | "Acostado" | "Arrodillado" | "Colgado" | "Apoyado" | "Otro",
  "nivel_dificultad": "Principiante" | "Intermedio" | "Avanzado",
  "descripcion_tecnica": "Explicación técnica detallada de la trayectoria, alineación y ejecución.",
  "ejecucion_pasos": ["Paso 1...", "Paso 2...", "Paso 3...", "Paso 4..."],
  "errores_comunes": ["Error 1 habitual...", "Error 2 habitual..."],
  "consejos_ejecucion": ["Tip 1 para optimizar el estímulo...", "Tip 2..."],
  "precauciones": ["Precaución de seguridad general sobre la postura o articulaciones (sin afirmaciones médicas)..."],
  "video_url": ""
}

Sé riguroso y objetivo. No utilices diagnósticos médicos.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ exercise: parsed, source: 'gemini-web-search' });
        }
        return res.json({ exercise: buildLocalFallback(exerciseName), source: 'local-fallback' });
      } catch (err: any) {
        console.warn("Gemini search failed, falling back to local analysis:", err?.message || err);
        return res.json({ exercise: buildLocalFallback(exerciseName), source: 'local-fallback' });
      }
    } catch (error: any) {
      console.error("Error in /api/gemini/lookup-exercise:", error);
      res.status(500).json({ error: "Error al analizar el ejercicio." });
    }
  });

  // Save or update custom exercise into public/ejercicios.json and src/data/ejercicios.json
  app.post("/api/exercises/save-custom", async (req, res) => {
    try {
      const exercise = req.body;
      if (!exercise || !exercise.nombre) {
        return res.status(400).json({ error: "Datos del ejercicio requeridos." });
      }

      const publicPath = path.resolve(process.cwd(), 'public', 'ejercicios.json');
      const srcPath = path.resolve(process.cwd(), 'src', 'data', 'ejercicios.json');

      let catalog: { version: string; descripcion: string; total_ejercicios: number; ejercicios: any[] } = {
        version: "1.0.0",
        descripcion: "Catálogo maestro normalizado de ejercicios físicos para la aplicación de entrenamiento",
        total_ejercicios: 0,
        ejercicios: []
      };

      try {
        if (fs.existsSync(srcPath)) {
          const content = fs.readFileSync(srcPath, 'utf-8');
          catalog = JSON.parse(content);
        } else if (fs.existsSync(publicPath)) {
          const content = fs.readFileSync(publicPath, 'utf-8');
          catalog = JSON.parse(content);
        }
      } catch (readErr) {
        console.warn("Error reading current ejercicios.json:", readErr);
      }

      // Generate kebab-case id
      const rawName = exercise.name || exercise.nombre || "ejercicio";
      const generatedId = (exercise.id || rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) || "ejercicio-personalizado";

      const normalizedExercise = {
        id: generatedId,
        nombre: rawName.trim(),
        name: rawName.trim(),
        category: exercise.category || exercise.categoria || "Fuerza",
        categoria: exercise.category || exercise.categoria || "Fuerza",
        secondaryCategories: exercise.secondaryCategories || exercise.categorias_secundarias || [],
        categorias_secundarias: exercise.secondaryCategories || exercise.categorias_secundarias || [],
        description: exercise.description || exercise.descripcion || exercise.descripcion_breve || "",
        descripcion: exercise.description || exercise.descripcion || exercise.descripcion_breve || "",
        descripcion_breve: exercise.description || exercise.descripcion || exercise.descripcion_breve || "",
        image: exercise.image || exercise.imagen || "",
        imagen: exercise.image || exercise.imagen || "",
        equipment: exercise.equipment || exercise.equipamiento || ["Peso corporal"],
        equipamiento: exercise.equipment || exercise.equipamiento || ["Peso corporal"],
        equipmentVariants: exercise.equipmentVariants || exercise.variantes_equipamiento || exercise.variantes || [],
        variantes_equipamiento: exercise.equipmentVariants || exercise.variantes_equipamiento || exercise.variantes || [],
        canBeDoneWithoutEquipment: exercise.canBeDoneWithoutEquipment !== undefined ? Boolean(exercise.canBeDoneWithoutEquipment) : Boolean(exercise.sin_equipamiento_posible),
        sin_equipamiento_posible: exercise.canBeDoneWithoutEquipment !== undefined ? Boolean(exercise.canBeDoneWithoutEquipment) : Boolean(exercise.sin_equipamiento_posible),
        bodyZones: exercise.bodyZones || exercise.zonas_corporales || (exercise.zona ? [exercise.zona] : ["Tren superior"]),
        zonas_corporales: exercise.bodyZones || exercise.zonas_corporales || (exercise.zona ? [exercise.zona] : ["Tren superior"]),
        zona: exercise.zona || (exercise.bodyZones && exercise.bodyZones[0]) || "superior",
        subzone: exercise.subzone || exercise.subzona || (exercise.subzones && exercise.subzones[0]) || "",
        subzona: exercise.subzone || exercise.subzona || (exercise.subzones && exercise.subzones[0]) || "",
        subzones: exercise.subzones || (exercise.subzona ? [exercise.subzona] : []),
        muscles: exercise.muscles || {
          primary: exercise.musculos_principales || [],
          secondary: exercise.musculos_secundarios || []
        },
        musculos_principales: exercise.muscles?.primary || exercise.musculos_principales || [],
        musculos_secundarios: exercise.muscles?.secondary || exercise.musculos_secundarios || [],
        muscle_groups: exercise.muscle_groups || [],
        movementType: exercise.movementType || exercise.tipo_movimiento || exercise.tipo || "Empuje",
        tipo_movimiento: exercise.movementType || exercise.tipo_movimiento || exercise.tipo || "Empuje",
        movementPattern: exercise.movementPattern || exercise.patrones_movimiento || (exercise.patron_movimiento ? [exercise.patron_movimiento] : []),
        patrones_movimiento: exercise.movementPattern || exercise.patrones_movimiento || (exercise.patron_movimiento ? [exercise.patron_movimiento] : []),
        patron_movimiento: (exercise.movementPattern && exercise.movementPattern[0]) || exercise.patron_movimiento || "general",
        laterality: exercise.laterality || exercise.lado_cuerpo || (exercise.unilateral ? "Unilateral" : "Bilateral"),
        lado_cuerpo: exercise.laterality || exercise.lado_cuerpo || (exercise.unilateral ? "Unilateral" : "Bilateral"),
        position: exercise.position || exercise.posicion_principal || "De pie",
        posicion_principal: exercise.position || exercise.posicion_principal || "De pie",
        difficulty: exercise.difficulty || exercise.nivel_dificultad || exercise.nivel || "Intermedio",
        nivel: exercise.difficulty || exercise.nivel_dificultad || exercise.nivel || "intermedio",
        nivel_dificultad: exercise.difficulty || exercise.nivel_dificultad || exercise.nivel || "Intermedio",
        executionDescription: exercise.executionDescription || exercise.descripcion_tecnica || exercise.descripcion || "",
        descripcion_tecnica: exercise.executionDescription || exercise.descripcion_tecnica || exercise.descripcion || "",
        ejecucion_pasos: exercise.executionSteps || exercise.ejecucion_pasos || [],
        executionSteps: exercise.executionSteps || exercise.ejecucion_pasos || [],
        commonErrors: exercise.commonErrors || exercise.errores_comunes || [],
        errores_comunes: exercise.commonErrors || exercise.errores_comunes || [],
        executionTips: exercise.executionTips || exercise.consejos_ejecucion || [],
        consejos_ejecucion: exercise.executionTips || exercise.consejos_ejecucion || [],
        precautions: exercise.precautions || exercise.precauciones || [],
        precauciones: exercise.precautions || exercise.precauciones || [],
        videoUrl: exercise.videoUrl || exercise.video_url || "",
        video_url: exercise.videoUrl || exercise.video_url || "",
        nombres_alternativos: exercise.nombres_alternativos || [],
        tipo: exercise.tipo || "multiarticular",
        unilateral: exercise.laterality === "Unilateral" || Boolean(exercise.unilateral),
        variantes: exercise.variantes || exercise.equipmentVariants || [],
        tags: exercise.tags || [exercise.category, ...(exercise.bodyZones || []), ...(exercise.equipment || [])].filter(Boolean),
        personalizado: true,
        actualizado_en: new Date().toISOString()
      };

      const existingIndex = catalog.ejercicios.findIndex((e: any) => 
        e.id === generatedId || e.nombre.toLowerCase() === normalizedExercise.nombre.toLowerCase()
      );

      const customStorePath = path.resolve(process.cwd(), 'src', 'data', 'user_custom_exercises.json');
      let customCatalog: { ejercicios: any[] } = { ejercicios: [] };
      try {
        if (fs.existsSync(customStorePath)) {
          customCatalog = JSON.parse(fs.readFileSync(customStorePath, 'utf-8'));
        }
      } catch (readCustomErr) {
        console.warn("Could not read user_custom_exercises.json:", readCustomErr);
      }

      const customIndex = customCatalog.ejercicios.findIndex(e => e.id === normalizedExercise.id);
      if (customIndex >= 0) {
        customCatalog.ejercicios[customIndex] = normalizedExercise;
      } else {
        customCatalog.ejercicios.push(normalizedExercise);
      }

      try {
        fs.writeFileSync(customStorePath, JSON.stringify(customCatalog, null, 2), 'utf-8');
      } catch (writeErr) {
        console.warn("Could not write to user_custom_exercises.json:", writeErr);
      }

      return res.json({ 
        success: true, 
        exercise: normalizedExercise, 
        total: catalog.total_ejercicios,
        message: "Ejercicio personalizado guardado correctamente sin modificar el catálogo maestro."
      });
    } catch (error: any) {
      console.error("Error in /api/exercises/save-custom:", error);
      res.status(500).json({ error: error?.message || "Error al guardar el ejercicio en el archivo JSON." });
    }
  });

  // Get master exercises catalog
  app.get("/api/exercises", (_req, res) => {
    try {
      const srcPath = path.resolve(process.cwd(), 'src', 'data', 'ejercicios.json');
      if (fs.existsSync(srcPath)) {
        const content = fs.readFileSync(srcPath, 'utf-8');
        return res.type('application/json').send(content);
      }
      const publicPath = path.resolve(process.cwd(), 'public', 'ejercicios.json');
      if (fs.existsSync(publicPath)) {
        const content = fs.readFileSync(publicPath, 'utf-8');
        return res.type('application/json').send(content);
      }
      return res.json({ total_ejercicios: 0, ejercicios: [] });
    } catch (error) {
      res.status(500).json({ error: "Error al leer el catálogo de ejercicios." });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
