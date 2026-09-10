import express from "express";
import path from "path";
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

function generateFallbackSummary(userProfile: any, sessionLogs: any[]): string {
  const name = userProfile?.name || 'Atleta';
  let totalVolume = 0;
  let totalReps = 0;
  let bestExercise = '';
  let maxWeight = 0;

  sessionLogs.forEach((log) => {
    let exWeight = 0;
    (log.clusters || []).forEach((c: any) => {
      const w = Number(c.weight) || 0;
      const r = Number(c.reps) || 0;
      totalVolume += w * r;
      totalReps += r;
      if (w > exWeight) exWeight = w;
      if (w > maxWeight) {
        maxWeight = w;
        bestExercise = log.exerciseName;
      }
    });
  });

  if (!bestExercise && sessionLogs.length > 0) {
    bestExercise = sessionLogs[0].exerciseName;
  }

  const highlight = maxWeight > 0
    ? `Destacó tu desempeño en **${bestExercise}** moviendo hasta **${maxWeight} kg**.`
    : `Completaste con éxito tus series de **${bestExercise}** con gran enfoque y ritmo.`;

  return `¡Gran trabajo en esta sesión, **${name}**! Completaste un volumen total de **${totalVolume.toLocaleString('es-ES')} kg** y **${totalReps} repeticiones** a lo largo de ${sessionLogs.length} ejercicios. ${highlight} Recuerda hidratarte bien y consumir suficientes proteínas para una recuperación muscular óptima antes de tu siguiente sesión.`;
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
      const { userProfile, sessionLogs } = req.body;
      if (!sessionLogs || !Array.isArray(sessionLogs) || sessionLogs.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron registros de entrenamiento." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        const fallback = generateFallbackSummary(userProfile, sessionLogs);
        return res.json({ summary: fallback });
      }

      const prompt = `
Eres un entrenador de fitness positivo y motivador llamado 'Gem'. Analiza esta sesión de entrenamiento para un usuario con el siguiente perfil:
- Nombre: ${userProfile?.name || 'Atleta'}
- Edad: ${userProfile?.age || 'N/A'}
- Peso: ${userProfile?.weight || 'N/A'} kg

Estos son los registros de su última sesión de entrenamiento:
${sessionLogs.map((log: any) => `- ${log.exerciseName}: ${(log.clusters || []).map((c: any) => `${c.weight > 0 ? `${c.weight}kg x ` : ''}${c.reps} reps`).join(', ')}`).join('\n')}

Proporciona un resumen breve y alentador (2-3 frases). Destaca un logro específico (como un gran esfuerzo en peso, repeticiones o volumen para un ejercicio). Ofrece un consejo práctico para la recuperación o para la próxima sesión. Mantén un tono amigable y de apoyo. Usa markdown para dar énfasis con negrita (ej. **logro increíble**). Responde en español.
`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const text = response.text || generateFallbackSummary(userProfile, sessionLogs);
        return res.json({ summary: text });
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, falling back to local analysis:", geminiError?.message || geminiError);
        const fallback = generateFallbackSummary(userProfile, sessionLogs);
        return res.json({ summary: fallback });
      }
    } catch (error: any) {
      console.error("Error in /api/gemini/analyze-workout:", error);
      const fallback = generateFallbackSummary(req.body?.userProfile, req.body?.sessionLogs || []);
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

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
