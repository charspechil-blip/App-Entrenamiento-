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
        let subzona = "Piernas";
        let equipamiento = ["Peso corporal (Sin equipo)"];
        let musculos_principales = ["Cuádriceps", "Glúteo mayor"];
        let musculos_secundarios = ["Isquiotibiales", "Core"];
        let muscle_groups = ["quads", "glutes"];

        if (lower.includes("sumo")) {
          zona = "inferior";
          subzona = "Piernas";
          equipamiento = ["Peso corporal (Sin equipo)", "Mancuernas", "Barra olímpica / Discos"];
          musculos_principales = ["Aductor mayor", "Glúteo mayor", "Cuádriceps"];
          musculos_secundarios = ["Isquiotibiales", "Erectores espinales"];
          muscle_groups = ["adductors", "glutes", "quads", "hamstrings"];
        } else if (lower.includes("press") || lower.includes("banca") || lower.includes("flexi") || lower.includes("pecho") || lower.includes("fondo")) {
          zona = "superior";
          subzona = "Torso";
          equipamiento = lower.includes("mancuerna") 
            ? ["Mancuernas"] 
            : lower.includes("barra") 
              ? ["Barra olímpica / Discos"] 
              : ["Peso corporal (Sin equipo)", "Mancuernas", "Barra olímpica / Discos"];
          musculos_principales = ["Pectoral mayor", "Tríceps braquial"];
          musculos_secundarios = ["Deltoides anterior"];
          muscle_groups = ["chest", "triceps", "shoulders_front"];
        } else if (lower.includes("remo") || lower.includes("jal") || lower.includes("espalda") || lower.includes("dominada")) {
          zona = "superior";
          subzona = "Espalda";
          equipamiento = ["Barra olímpica / Discos", "Mancuernas", "Máquinas de gimnasio / Poleas"];
          musculos_principales = ["Dorsal ancho", "Trapecio", "Romboides"];
          musculos_secundarios = ["Bíceps braquial", "Deltoides posterior"];
          muscle_groups = ["lats", "mid_back", "biceps", "traps"];
        } else if (lower.includes("curl") || lower.includes("biceps") || lower.includes("triceps") || lower.includes("brazo")) {
          zona = "superior";
          subzona = "Brazos";
          equipamiento = ["Mancuernas", "Barra olímpica / Discos", "Máquinas de gimnasio / Poleas"];
          musculos_principales = lower.includes("tricep") ? ["Tríceps braquial"] : ["Bíceps braquial"];
          musculos_secundarios = ["Antebrazos"];
          muscle_groups = lower.includes("tricep") ? ["triceps"] : ["biceps", "forearms"];
        } else if (lower.includes("plancha") || lower.includes("crunch") || lower.includes("abdom") || lower.includes("core")) {
          zona = "core";
          subzona = "Core";
          equipamiento = ["Peso corporal (Sin equipo)"];
          musculos_principales = ["Recto abdominal", "Oblicuos"];
          musculos_secundarios = ["Transverso abdominal", "Erectores espinales"];
          muscle_groups = ["abs", "obliques"];
        } else if (lower.includes("hombro") || lower.includes("militar") || lower.includes("elevaci") || lower.includes("lateral")) {
          zona = "superior";
          subzona = "Torso";
          equipamiento = ["Mancuernas", "Barra olímpica / Discos"];
          musculos_principales = ["Deltoides (lateral/anterior)"];
          musculos_secundarios = ["Tríceps braquial", "Trapecio"];
          muscle_groups = ["shoulders", "triceps"];
        }

        return {
          nombre: name.trim(),
          nombres_alternativos: [],
          equipamiento,
          zona,
          subzona,
          musculos_principales,
          musculos_secundarios,
          muscle_groups,
          descripcion: `Ejercicio para el desarrollo de la fuerza y funcionalidad en ${subzona.toLowerCase()}.`,
          ejecucion_pasos: [
            "Colócate en posición inicial manteniendo la columna alineada y estable.",
            "Desciende o tracciona de manera controlada inhalando profundamente.",
            "Llega al rango de movimiento activo óptimo sin perder la tensión muscular.",
            "Regresa a la posición inicial exhalando con fuerza controlada."
          ],
          tipo: "multiarticular",
          nivel: "intermedio",
          patron_movimiento: "general",
          familia: "general"
        };
      };

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({ exercise: buildLocalFallback(exerciseName), source: 'local-fallback' });
      }

      const prompt = `Realiza una búsqueda web exhaustiva sobre el ejercicio de entrenamiento físico: "${exerciseName}".
Extrae con precisión su biomecánica, variantes de equipamiento (si se puede hacer con peso corporal, con mancuernas, con barra olímpica o en máquinas de gimnasio), la zona anatómica, subzona, músculos implicados, descripción y pasos de ejecución.

Devuelve ÚNICAMENTE un objeto JSON válido sin texto adicional, con el siguiente formato exacto:
{
  "nombre": "Nombre formal en español (ej. Sentadilla sumo)",
  "nombres_alternativos": ["Sumo squat", "Sentadilla abierta"],
  "equipamiento": ["Peso corporal (Sin equipo)", "Mancuernas", "Barra olímpica / Discos"],
  "zona": "inferior" | "superior" | "core",
  "subzona": "Piernas" | "Core" | "Torso" | "Brazos" | "Espalda",
  "musculos_principales": ["Músculo principal 1", "Músculo principal 2"],
  "musculos_secundarios": ["Músculo secundario 1", "Músculo secundario 2"],
  "muscle_groups": ["adductors", "glutes", "quads", "hamstrings", "chest", "triceps", "biceps", "lats", "mid_back", "abs", "obliques", "shoulders", "calves_rear"],
  "descripcion": "Explicación concisa y técnica del ejercicio (1 o 2 oraciones).",
  "ejecucion_pasos": [
    "Paso 1...",
    "Paso 2...",
    "Paso 3...",
    "Paso 4..."
  ],
  "tipo": "multiarticular" | "aislamiento",
  "nivel": "principiante" | "intermedio" | "avanzado",
  "patron_movimiento": "sentadilla" | "bisagra_de_cadera" | "empuje_horizontal" | "empuje_vertical" | "traccion_horizontal" | "traccion_vertical" | "anti_extension" | "aislamiento"
}

Importante sobre 'equipamiento': Incluye todas las modalidades habituales en las que se practica (por ejemplo, sentadilla sumo se puede hacer tanto con peso corporal libre como sosteniendo mancuernas, kettlebells o barra olímpica).
Importante sobre 'muscle_groups': Usa únicamente identificadores válidos entre: "quads", "hamstrings", "glutes", "adductors", "calves_rear", "calves_front", "chest", "triceps", "biceps", "shoulders", "shoulders_front", "shoulders_rear", "lats", "mid_back", "lower_back", "traps", "abs", "obliques", "forearms".
`;

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
        if (fs.existsSync(publicPath)) {
          const content = fs.readFileSync(publicPath, 'utf-8');
          catalog = JSON.parse(content);
        } else if (fs.existsSync(srcPath)) {
          const content = fs.readFileSync(srcPath, 'utf-8');
          catalog = JSON.parse(content);
        }
      } catch (readErr) {
        console.warn("Error reading current ejercicios.json:", readErr);
      }

      // Generate kebab-case id
      const generatedId = (exercise.id || exercise.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) || "ejercicio-personalizado";

      const normalizedExercise = {
        id: generatedId,
        nombre: exercise.nombre.trim(),
        nombres_alternativos: exercise.nombres_alternativos || [],
        familia: exercise.familia || exercise.patron_movimiento || "general",
        patron_movimiento: exercise.patron_movimiento || "general",
        zona: exercise.zona || "inferior",
        subzona: exercise.subzona || "",
        musculos_principales: exercise.musculos_principales || [],
        musculos_secundarios: exercise.musculos_secundarios || [],
        muscle_groups: exercise.muscle_groups || [],
        descripcion: exercise.descripcion || `Variante y ejercicio de fuerza enfocado en ${exercise.nombre}.`,
        ejecucion_pasos: exercise.ejecucion_pasos && exercise.ejecucion_pasos.length > 0 
          ? exercise.ejecucion_pasos 
          : ["Ejecuta el ejercicio con postura controlada, rango completo y técnica estricta."],
        equipamiento: exercise.equipamiento && exercise.equipamiento.length > 0 
          ? exercise.equipamiento 
          : ["Peso corporal (Sin equipo)"],
        tipo: exercise.tipo || "multiarticular",
        nivel: exercise.nivel || "intermedio",
        unilateral: Boolean(exercise.unilateral),
        variantes: exercise.variantes || [],
        precauciones: exercise.precauciones || ["Mantener la columna neutra y no bloquear articulaciones bruscamente."],
        tags: exercise.tags || [exercise.zona, exercise.subzona, ...(exercise.equipamiento || [])].filter(Boolean),
        personalizado: true,
        actualizado_en: new Date().toISOString()
      };

      const existingIndex = catalog.ejercicios.findIndex((e: any) => 
        e.id === generatedId || e.nombre.toLowerCase() === normalizedExercise.nombre.toLowerCase()
      );

      if (existingIndex >= 0) {
        catalog.ejercicios[existingIndex] = { ...catalog.ejercicios[existingIndex], ...normalizedExercise };
      } else {
        catalog.ejercicios.push(normalizedExercise);
      }
      catalog.total_ejercicios = catalog.ejercicios.length;

      const outputData = JSON.stringify(catalog, null, 2);

      // Write to public/ejercicios.json
      try {
        fs.writeFileSync(publicPath, outputData, 'utf-8');
      } catch (errPublic) {
        console.warn("Could not write to public/ejercicios.json:", errPublic);
      }

      // Also write to src/data/ejercicios.json
      try {
        if (fs.existsSync(path.dirname(srcPath))) {
          fs.writeFileSync(srcPath, outputData, 'utf-8');
        }
      } catch (errSrc) {
        console.warn("Could not write to src/data/ejercicios.json:", errSrc);
      }

      return res.json({ 
        success: true, 
        exercise: normalizedExercise, 
        total: catalog.total_ejercicios,
        message: "Ejercicio guardado en el archivo JSON correctamente."
      });
    } catch (error: any) {
      console.error("Error in /api/exercises/save-custom:", error);
      res.status(500).json({ error: error?.message || "Error al guardar el ejercicio en el archivo JSON." });
    }
  });

  // Get master exercises catalog
  app.get("/api/exercises", (_req, res) => {
    try {
      const publicPath = path.resolve(process.cwd(), 'public', 'ejercicios.json');
      if (fs.existsSync(publicPath)) {
        const content = fs.readFileSync(publicPath, 'utf-8');
        return res.type('application/json').send(content);
      }
      const srcPath = path.resolve(process.cwd(), 'src', 'data', 'ejercicios.json');
      if (fs.existsSync(srcPath)) {
        const content = fs.readFileSync(srcPath, 'utf-8');
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
