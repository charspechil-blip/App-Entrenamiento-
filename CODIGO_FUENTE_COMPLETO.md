# CÓDIGO FUENTE COMPLETO DEL PROYECTO

Este archivo contiene el código fuente completo de todos los archivos del proyecto.

## Archivo: `package.json`

```json
{
  "name": "exercise-monitor",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.27.0",
    "chart.js": "^4.5.1",
    "express": "^5.2.1",
    "jspdf": "^4.2.1",
    "lucide-react": "^1.44.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "recharts": "^3.3.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/express": "^5.0.6",
    "@types/node": "^22.14.0",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^5.0.0",
    "esbuild": "^0.28.2",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.23.13",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}

```

---

## Archivo: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "types": [
      "node",
      "react",
      "react-dom"
    ],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

---

## Archivo: `vite.config.ts`

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [tailwindcss(), react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

```

---

## Archivo: `server.ts`

```typescript
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

```

---

## Archivo: `.env.example`

```example
GEMINI_API_KEY=

```

---

## Archivo: `index.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exercise Monitor</title>
  <meta name="description" content="A simple and elegant web application to track your squat and bicep curl workouts. Log weight, repetitions, and sets to monitor your progress over time." />
  <meta property="og:title" content="Exercise Monitor" />
  <meta property="og:description" content="A simple and elegant web application to track your squat and bicep curl workouts. Log weight, repetitions, and sets to monitor your progress over time." />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0f172a">
  <script>
    // Clean up any stale service workers and caches immediately
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (var i = 0; i < regs.length; i++) {
          regs[i].unregister();
        }
      }).catch(function(e) { console.warn('SW cleanup:', e); });
    }

    // Global error listener to display any early script failure
    function showFatalError(msg) {
      var fallback = document.getElementById('loading-fallback');
      if (fallback) {
        fallback.innerHTML = '<div style="color:#f87171;text-align:center;padding:20px;max-width:400px;font-family:system-ui,sans-serif;">' +
          '<div style="font-size:32px;margin-bottom:12px;">⚠️</div>' +
          '<h2 style="font-size:18px;font-weight:bold;margin-bottom:8px;color:#38bdf8;">Error al iniciar la aplicación</h2>' +
          '<p style="font-size:13px;color:#cbd5e1;margin-bottom:16px;">' + (msg || 'Error de carga de scripts') + '</p>' +
          '<button onclick="try{localStorage.clear();sessionStorage.clear();}catch(e){}location.reload()" style="background:#0284c7;color:white;border:none;padding:10px 18px;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">Reiniciar y Limpiar Caché</button>' +
          '</div>';
      }
    }

    window.addEventListener('error', function(e) {
      showFatalError(e.message || 'Error inesperado');
    });

    window.addEventListener('unhandledrejection', function(e) {
      showFatalError(e.reason && e.reason.message ? e.reason.message : 'Error en promesa asíncrona');
    });

    // Safety timeout: if after 7 seconds the fallback is still displayed, offer reload button
    setTimeout(function() {
      var fallback = document.getElementById('loading-fallback');
      if (fallback && fallback.parentElement) {
        var subText = fallback.querySelector('p');
        if (subText) {
          subText.innerHTML = 'La carga está demorando más de lo esperado.<br><a href="javascript:location.reload()" style="display:inline-block;margin-top:12px;background:#0284c7;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;">Recargar Aplicación</a>';
        }
      }
    }, 7000);
  </script>
</head>
<body class="bg-slate-900 text-white min-h-screen">
  <div id="root">
    <!-- Initial fallback visible while React bundles parse and mount -->
    <div id="loading-fallback" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f172a;color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;">
      <div style="width:54px;height:54px;border:3px solid #334155;border-top-color:#38bdf8;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:20px;"></div>
      <h1 style="font-size:20px;font-weight:bold;margin:0 0 8px 0;color:#38bdf8;">Monitor de Ejercicio</h1>
      <p style="font-size:14px;color:#94a3b8;margin:0 0 24px 0;">Cargando tu sesión de entrenamiento...</p>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </div>
  </div>
  <script type="module" src="/index.tsx"></script>
</body>
</html>

```

---

## Archivo: `index.css`

```css
@import "tailwindcss";

/* Custom scrollbars and animations */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}

```

---

## Archivo: `index.tsx`

```typescript

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(err => {
    console.warn('Could not unregister service workers:', err);
  });
}
```

---

## Archivo: `App.tsx`

```typescript

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ExerciseLog, Goals, UserProfile, RoutineType, UserRoutine, RoutineFocus, ExerciseName, RestSettings, SavedRoutine, TrainingType } from './types';
import { SetupWizard } from './components/SetupWizard';
import { Dashboard } from './components/Dashboard';
import { HistoryScreen } from './components/HistoryScreen';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PREDEFINED_EXERCISES } from './constants/exercises';
import { SaveRoutineModal } from './components/SaveRoutineModal';
import { generateUUID } from './utils/uuid';
import { safeStorage } from './utils/storage';

// Custom hook declared at module level for stable React hook rules
const useDebouncedSave = (key: string, value: any, profileId: string | null, enabled: boolean) => {
    useEffect(() => {
        if (!enabled || !profileId) return;
        const handler = setTimeout(() => {
            try {
                safeStorage.setItem(`${key}_${profileId}`, JSON.stringify(value));
            } catch (error) {
                console.error(`Failed to save ${key} to storage:`, error);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [key, value, profileId, enabled]);
};

// Safe helpers to read storage synchronously on component creation
const getInitialProfiles = (): UserProfile[] => {
    try {
        const profilesStr = safeStorage.getItem('userProfiles');
        return profilesStr ? JSON.parse(profilesStr) : [];
    } catch {
        return [];
    }
};

const getInitialSavedRoutines = (): SavedRoutine[] => {
    try {
        const routinesStr = safeStorage.getItem('savedRoutines');
        return routinesStr ? JSON.parse(routinesStr) : [];
    } catch {
        return [];
    }
};

const getInitialActiveProfile = (_profiles: UserProfile[]): UserProfile | null => {
    // La pantalla inicial siempre debe ser la pantalla de selección de perfil (WelcomeScreen)
    return null;
};

const App: React.FC = () => {
    const initialProfiles = useMemo(() => getInitialProfiles(), []);
    const initialSavedRoutines = useMemo(() => getInitialSavedRoutines(), []);
    const initialActiveProfile = useMemo(() => getInitialActiveProfile(initialProfiles), [initialProfiles]);

    const [allProfiles, setAllProfiles] = useState<UserProfile[]>(initialProfiles);
    const [activeProfile, setActiveProfile] = useState<UserProfile | null>(initialActiveProfile);
    const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>(initialSavedRoutines);

    const [logs, setLogs] = useState<ExerciseLog[]>(() => {
        if (!initialActiveProfile) return [];
        try {
            const logsStr = safeStorage.getItem(`exerciseLogs_${initialActiveProfile.id}`);
            const loadedLogs: ExerciseLog[] = logsStr ? JSON.parse(logsStr) : [];
            loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return loadedLogs;
        } catch {
            return [];
        }
    });

    const [goals, setGoals] = useState<Goals>(() => {
        if (!initialActiveProfile) return {};
        try {
            const goalsStr = safeStorage.getItem(`exerciseGoals_${initialActiveProfile.id}`);
            return goalsStr ? JSON.parse(goalsStr) : {};
        } catch {
            return {};
        }
    });

    const [userRoutine, setUserRoutine] = useState<UserRoutine | null>(() => {
        if (!initialActiveProfile) return null;
        try {
            const routineStr = safeStorage.getItem(`userRoutine_${initialActiveProfile.id}`);
            if (routineStr) {
                const parsed = JSON.parse(routineStr);
                return {
                    ...parsed,
                    exercises: Array.isArray(parsed.exercises) ? parsed.exercises : []
                };
            }
        } catch {}
        return null;
    });

    const [restSettings, setRestSettings] = useState<RestSettings>(() => {
        if (!initialActiveProfile) {
            return { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' };
        }
        try {
            const restStr = safeStorage.getItem(`restSettings_${initialActiveProfile.id}`);
            return restStr ? JSON.parse(restStr) : { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' };
        } catch {
            return { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' };
        }
    });

    const [trainingType, setTrainingType] = useState<TrainingType>('Normal');

    const [showHistory, setShowHistory] = useState(false);
    const [isReconfiguring, setIsReconfiguring] = useState(false);
    const [needsInitialSetup, setNeedsInitialSetup] = useState<boolean>(initialProfiles.length === 0);
    const [wizardStartStep, setWizardStartStep] = useState(1);
    
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    
    // Keep profiles and saved routines persisted
    useEffect(() => {
        try {
            safeStorage.setItem('userProfiles', JSON.stringify(allProfiles));
        } catch (e) {
            console.error('Failed to save userProfiles:', e);
        }
    }, [allProfiles]);

    useEffect(() => {
        try {
            safeStorage.setItem('savedRoutines', JSON.stringify(savedRoutines));
        } catch (e) {
            console.error('Failed to save savedRoutines:', e);
        }
    }, [savedRoutines]);

    // Load logs only when activeProfile changes to prevent race conditions
    useEffect(() => {
        if (!activeProfile) return;
        try {
            const logsStr = safeStorage.getItem(`exerciseLogs_${activeProfile.id}`);
            const loadedLogs: ExerciseLog[] = logsStr ? JSON.parse(logsStr) : [];
            loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(loadedLogs);
        } catch (error) {
            console.error(`Failed to load logs for profile ${activeProfile.id}:`, error);
        }
    }, [activeProfile]);

    // Load other settings based on more complex dependencies
    useEffect(() => {
        if (!activeProfile) return;

        // Conditional loading to not overwrite settings during an active session or reconfiguration
        if (!sessionStartTime) {
            try {
                const goalsStr = safeStorage.getItem(`exerciseGoals_${activeProfile.id}`);
                setGoals(goalsStr ? JSON.parse(goalsStr) : {});
                
                if (!isReconfiguring) {
                    const routineStr = safeStorage.getItem(`userRoutine_${activeProfile.id}`);
                    if (routineStr) {
                        const parsed = JSON.parse(routineStr);
                        setUserRoutine({
                            ...parsed,
                            exercises: Array.isArray(parsed.exercises) ? parsed.exercises : []
                        });
                    } else {
                        setUserRoutine(null);
                    }
                }
                
                const restStr = safeStorage.getItem(`restSettings_${activeProfile.id}`);
                setRestSettings(restStr ? JSON.parse(restStr) : { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' });
            } catch (error) {
                console.error(`Failed to load settings for profile ${activeProfile.id}:`, error);
            }
        }
    }, [activeProfile, isReconfiguring, sessionStartTime]);

    // Save data when it changes
    useDebouncedSave('exerciseLogs', logs, activeProfile?.id || null, !!activeProfile);
    useDebouncedSave('exerciseGoals', goals, activeProfile?.id || null, !!activeProfile);
    useDebouncedSave('userRoutine', userRoutine, activeProfile?.id || null, !!activeProfile);
    useDebouncedSave('restSettings', restSettings, activeProfile?.id || null, !!activeProfile);

    const handleLogin = (profileId: string) => {
        const profile = allProfiles.find(p => p.id === profileId);
        if (profile) {
            setActiveProfile(profile);
            safeStorage.setItem('activeProfileId', profileId);
            setSessionStartTime(new Date());
        }
    };

    const handleSelectProfile = (profileId: string) => {
        handleLogin(profileId);
        setIsReconfiguring(false);
        setNeedsInitialSetup(false);
        setShowHistory(false);
        try {
            const routineStr = safeStorage.getItem(`userRoutine_${profileId}`);
            if (routineStr) {
                const parsed = JSON.parse(routineStr);
                setUserRoutine({
                    ...parsed,
                    exercises: Array.isArray(parsed.exercises) ? parsed.exercises : []
                });
            } else {
                setUserRoutine(null);
            }
            const goalsStr = safeStorage.getItem(`exerciseGoals_${profileId}`);
            if (goalsStr) setGoals(JSON.parse(goalsStr));
            const restStr = safeStorage.getItem(`restSettings_${profileId}`);
            if (restStr) setRestSettings(JSON.parse(restStr));
        } catch (e) {
            console.error('Failed to load profile details:', e);
        }
    };

    const handleStartNewRoutine = (profileId: string) => {
        handleLogin(profileId);
        setUserRoutine(null);
        setGoals({});
        setIsReconfiguring(true);
        setWizardStartStep(2);
    };

    const handleStartSavedRoutine = (profileId: string, routine: SavedRoutine) => {
        handleLogin(profileId);
        setUserRoutine({ type: 'Personalizado', focus: 'Mixto', exercises: Array.isArray(routine.exercises) ? routine.exercises : [] });
        setGoals(routine.goals || {});
        setRestSettings(routine.restSettings);
        setTrainingType(routine.trainingType);
        setSessionStartTime(new Date());
        setIsReconfiguring(false);
        setNeedsInitialSetup(false);
    };
    
    const handleViewHistory = (profileId: string) => {
        handleLogin(profileId);
        setShowHistory(true);
    };
    
    const handleReturnToDashboard = useCallback(() => {
        // Reset the state of the current active session to provide a clean slate
        setSessionStartTime(null);
        setUserRoutine(null);
        setGoals({});
        setTrainingType('Normal');
        
        // Navigate back to the dashboard view
        setShowHistory(false);
    }, []);

    const handleLogout = useCallback(() => {
        setActiveProfile(null);
        safeStorage.removeItem('activeProfileId');
        setLogs([]);
        setGoals({});
        setUserRoutine(null);
        setShowHistory(false);
        setSessionStartTime(null);
        setIsReconfiguring(false);
        setNeedsInitialSetup(allProfiles.length === 0);
    }, [allProfiles]);
    
    const handleCreateProfile = useCallback(() => {
        setNeedsInitialSetup(true);
        setIsReconfiguring(false);
        setActiveProfile(null);
        setWizardStartStep(1);
    }, []);
    
    const handleDeleteProfile = useCallback((profileId: string) => {
        if(window.confirm("¿Estás seguro de que quieres eliminar este perfil y todos sus datos? Esta acción no se puede deshacer.")) {
            const newProfiles = allProfiles.filter(p => p.id !== profileId);
            setAllProfiles(newProfiles);
            setSavedRoutines(prev => prev.filter(r => r.profileId !== profileId));
            safeStorage.removeItem(`exerciseLogs_${profileId}`);
            safeStorage.removeItem(`exerciseGoals_${profileId}`);
            safeStorage.removeItem(`userRoutine_${profileId}`);
            safeStorage.removeItem(`restSettings_${profileId}`);
            if (activeProfile?.id === profileId) {
                handleLogout();
            }
        }
    }, [activeProfile, handleLogout, allProfiles]);

    const handleCompleteWizard = useCallback((
        profileData: Omit<UserProfile, 'id'>, 
        routine: RoutineType, 
        focus: RoutineFocus, 
        exercises: ExerciseName[],
        favoriteExercises: ExerciseName[],
        aiConfig?: {
            trainingType: TrainingType;
            restSettings: RestSettings;
            goals: Goals;
        },
        equipment?: string[]
    ) => {
        let updatedProfile: UserProfile;
        const profilePayload = { 
          ...profileData, 
          favoriteExercises,
          availableEquipment: equipment || profileData.availableEquipment 
        };

        if (isReconfiguring && activeProfile) {
            updatedProfile = { ...activeProfile, ...profilePayload };
            setAllProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
        } else {
            updatedProfile = { id: generateUUID(), ...profilePayload };
            setAllProfiles(prev => [...prev, updatedProfile]);
            setLogs([]);
        }
        
        const rawPredefined = PREDEFINED_EXERCISES[routine]?.[focus] || [];
        const finalExercises = Array.isArray(exercises) && exercises.length > 0 ? exercises : rawPredefined;
        const newRoutine: UserRoutine = { type: routine, focus, exercises: finalExercises, equipment };

        setUserRoutine(newRoutine);

        if (aiConfig) {
            setTrainingType(aiConfig.trainingType);
            setRestSettings(aiConfig.restSettings);
            setGoals(aiConfig.goals);
        } else {
            // Reset to default if no AI config is provided (manual completion)
            setGoals({});
            setRestSettings({ restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' });
            setTrainingType('Normal');
        }

        try {
            safeStorage.setItem(`userRoutine_${updatedProfile.id}`, JSON.stringify(newRoutine));
        } catch (error) {
            console.error("Failed to save new routine immediately:", error);
        }
        
        safeStorage.setItem('activeProfileId', updatedProfile.id);
        setActiveProfile(updatedProfile);
        setSessionStartTime(new Date());
        
        setNeedsInitialSetup(false);
        setIsReconfiguring(false);
        setShowHistory(false);
    }, [isReconfiguring, activeProfile]);

    const handleGoToSettings = useCallback(() => {
        setIsReconfiguring(true);
        setWizardStartStep(1);
    }, []);
    
    const handleEditTodaysRoutine = useCallback(() => {
        if (userRoutine && userRoutine.type === 'Personalizado' && (!Array.isArray(userRoutine.exercises) || userRoutine.exercises.length === 0)) {
            setIsReconfiguring(true);
            setWizardStartStep(2); 
        } else {
            setIsReconfiguring(true);
            setWizardStartStep(3);
        }
    }, [userRoutine]);
    
    const handleGoToRoutineSelection = useCallback(() => {
        setIsReconfiguring(true);
        setWizardStartStep(2);
    }, []);

    const handleLogExercise = useCallback((logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => {
        setSessionStartTime(prev => prev || new Date());
        const newLog: ExerciseLog = {
            id: generateUUID(),
            timestamp: new Date().toISOString(),
            ...logData
        };
        setLogs(prev => [...prev, newLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, []);
    
    const handleAddLogs = useCallback((logsToAdd: ExerciseLog[]) => {
        setLogs(prev => 
            [...prev, ...logsToAdd].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        );
    }, []);

    const handleSaveRoutine = useCallback((name: string) => {
        if (!activeProfile || !userRoutine) return;
        const newSavedRoutine: SavedRoutine = {
            id: generateUUID(),
            profileId: activeProfile.id,
            name,
            exercises: Array.isArray(userRoutine.exercises) ? userRoutine.exercises : [],
            goals,
            restSettings,
            trainingType,
        };
        setSavedRoutines(prev => [...prev, newSavedRoutine]);
    }, [activeProfile, userRoutine, goals, restSettings, trainingType]);
    
    const handleDeleteRoutine = useCallback((routineId: string) => {
        if(window.confirm("¿Estás seguro de que quieres eliminar esta rutina guardada?")) {
            setSavedRoutines(prev => prev.filter(r => r.id !== routineId));
        }
    }, []);
    
    const handleSaveManualLog = useCallback((
        wizardProfileData: Omit<UserProfile, 'id'> | null,
        logsToAdd: ExerciseLog[]
    ) => {
        if (!isReconfiguring && wizardProfileData) {
            const newProfile: UserProfile = { id: generateUUID(), ...wizardProfileData };
            setAllProfiles(prev => [...prev, newProfile]);
            
            const defaultRoutine: UserRoutine = { type: 'Personalizado', focus: 'Mixto', exercises: [] };
            const sortedLogs = logsToAdd.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            safeStorage.setItem(`userRoutine_${newProfile.id}`, JSON.stringify(defaultRoutine));
            safeStorage.setItem(`exerciseLogs_${newProfile.id}`, JSON.stringify(sortedLogs));
            safeStorage.setItem('activeProfileId', newProfile.id);

            setActiveProfile(newProfile);
        } else {
            handleAddLogs(logsToAdd);
        }
        
        setShowHistory(true);
        setIsReconfiguring(false);
        setNeedsInitialSetup(false);
    }, [activeProfile, isReconfiguring, handleAddLogs]);


    const handleSaveProfile = useCallback((profileData: UserProfile) => {
        setActiveProfile(profileData);
        setAllProfiles(prev => prev.map(p => p.id === profileData.id ? profileData : p));
    }, []);

    const sessionLogs = useMemo(() => {
        if (sessionStartTime) {
            return logs.filter(log => new Date(log.timestamp) >= sessionStartTime);
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return logs.filter(log => new Date(log.timestamp) >= todayStart);
    }, [logs, sessionStartTime]);

    if (!activeProfile && !needsInitialSetup) {
        return (
            <WelcomeScreen 
                profiles={allProfiles}
                savedRoutines={savedRoutines}
                onSelectProfile={handleSelectProfile}
                onStartNewRoutine={handleStartNewRoutine}
                onStartSavedRoutine={handleStartSavedRoutine}
                onCreateProfile={handleCreateProfile}
                onDeleteProfile={handleDeleteProfile}
                onDeleteRoutine={handleDeleteRoutine}
                onViewHistory={handleViewHistory}
            />
        );
    }
    
    if (needsInitialSetup || isReconfiguring) {
        return (
            <SetupWizard 
                onComplete={handleCompleteWizard}
                initialProfile={isReconfiguring ? activeProfile : null}
                initialRoutine={isReconfiguring ? userRoutine : null}
                onCancel={handleLogout}
                startStep={wizardStartStep}
                onSaveManualLog={handleSaveManualLog}
            />
        );
    }
    
    if (activeProfile) {
        return (
            <>
                <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-8">
                  <Header 
                    title={showHistory ? 'Historial de Rutinas' : 'Panel de Rutina'}
                    userName={activeProfile.name}
                    showHistory={showHistory}
                    onNavigateHome={handleReturnToDashboard}
                    onViewHistory={() => setShowHistory(true)}
                    onGoToSettings={handleGoToSettings}
                    onEditRoutine={handleEditTodaysRoutine}
                    onLogout={handleLogout}
                    onGoToRoutineSelection={handleGoToRoutineSelection}
                    onOpenSaveRoutineModal={() => setIsSaveModalOpen(true)}
                  />
                  <main className="mt-8">
                    {showHistory ? (
                      <HistoryScreen 
                        logs={logs}
                        goals={goals}
                        userProfile={activeProfile}
                        userRoutine={userRoutine}
                        onDelete={(idsToDelete) => setLogs(prev => prev.filter(log => !idsToDelete.includes(log.id)))}
                        onAddLogs={handleAddLogs}
                      />
                    ) : (
                      <Dashboard
                        logs={sessionLogs}
                        goals={goals}
                        userProfile={activeProfile}
                        userRoutine={userRoutine}
                        restSettings={restSettings}
                        onLog={handleLogExercise}
                        onSetGoals={setGoals}
                        onSaveProfile={handleSaveProfile}
                        onSaveRestSettings={setRestSettings}
                        onViewHistory={() => setShowHistory(true)}
                        onGoToSettings={handleGoToSettings}
                        onEditRoutine={handleEditTodaysRoutine}
                        trainingType={trainingType}
                        onSetTrainingType={setTrainingType}
                      />
                    )}
                  </main>
                </div>
                <SaveRoutineModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    onSave={(name) => {
                        handleSaveRoutine(name);
                        setIsSaveModalOpen(false);
                    }}
                />
            </>
          );
    }

    return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-red-500">Error: Estado de la aplicación inválido.</div>;
};

export default App;

```

---

## Archivo: `types.ts`

```typescript
export type ExerciseName = 
  // Calistenia
  'Flexión / Inver' | 'Dominadas' | 'Fondos en paralelas' | 'Pike Push-ups' | 'Remo invertido' | 'Muscle-ups (si aplica)' | 'Flexiones diamante' | 'Flexiones arqueras' | 'Face pull con anillas' | 'L-Sit' |
  'Sentadilla' | 'Zancadas' | 'Sentadilla búlgara' | 'Elevación de talones' | 'Puente de glúteos' | 'Sentadilla pistola (si aplica)' | 'Nordic curls (si aplica)' | 'Saltos al cajón' | 'Sentadilla isométrica (wall sit)' |
  'Plancha' | 'Elevación de piernas colgado' | 'Dragon Flag (si aplica)' | 'Abdominales en V (V-ups)' | 'Plancha lateral' | 'Hollow body hold' | 'Giros rusos' | 'Mountain climbers' | 'Toes-to-bar' |
  'Burpees' | 'Elevación de rodillas' | 'Saltos de tijera' | 'Fondos en banco' |
  // Gym
  'Curl / Biceps' | 'Press de banca' | 'Remo / Inclina' | 'Press militar' | 'Elev / Lat' | 'Press francés' | 'Jalón al pecho (pulldown)' | 'Aperturas con mancuernas' | 'Face pull con polea' | 'Encogimientos de hombros' | 'Extensiones de tríceps en polea' |
  'Peso muerto' | 'Prensa de piernas' | 'Extensiones de cuádrigratis' | 'Curl femoral' | 'Zancadas con mancuernas' | 'Hip thrust' | 'Abductores en máquina' | 'Aductores en máquina' |
  'Plancha con peso' | 'Elevación de piernas en silla romana' | 'Crunch en polea alta' | 'Giros rusos con disco' | 'Leñador (woodchopper) en polea' | 'Ab wheel' | 'Hiperextensiones' |
  'Clean and Jerk' | 'Snatch' | 'Dominadas con lastre' | 'Thrusters' | 'Paseo del granjero' | (string & {});

export type RoutineType = 'Calistenia' | 'Gym' | 'Personalizado';

export type RoutineFocus = 'Core' | 'Tren Superior' | 'Tren Inferior' | 'Mixto';

export type TrainingType = 'Normal' | 'Clúster' | 'Drop';

export interface UserRoutine {
  type: RoutineType;
  focus: RoutineFocus;
  exercises: ExerciseName[];
  equipment?: string[];
}

export interface Cluster {
  weight: number;
  reps: number;
  time?: number;
}

export interface ExerciseLog {
  id: string;
  timestamp: string;
  exerciseName: ExerciseName;
  clusters: Cluster[];
  heartRate?: number;
  perceivedExertion?: number;
}

export interface ExerciseGoal {
  weight: number;
  reps: number;
  series: number;
  totalTime: number;
  tempo: string;
  isWeighted?: boolean;
  useTempo?: boolean;
  clusterGoals?: Cluster[];
}

export type Goals = Partial<Record<ExerciseName, ExerciseGoal>>;

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  restingHeartRate?: number;
  favoriteExercises?: ExerciseName[];
  availableEquipment?: string[];
}

export interface RestSettings {
  restBetweenSets: number;
  restBetweenExercises: number;
  mode: 'auto' | 'manual';
}

export interface ColorTheme {
    text: string;
    bg: string;
    hoverBg: string;
    ring: string;
    border: string;
    shadow: string;
}

export interface SavedRoutine {
    id: string;
    profileId: string;
    name: string;
    exercises: ExerciseName[];
    goals: Goals;
    restSettings: RestSettings;
    trainingType: TrainingType;
}
```

---

## Archivo: `colors.ts`

```typescript
import type { ExerciseName, ColorTheme } from './types';

const defaultColor: ColorTheme = {
    text: 'text-slate-300',
    bg: 'bg-slate-700',
    hoverBg: 'hover:bg-slate-600',
    ring: 'focus:ring-slate-500',
    border: 'border-slate-500',
    shadow: 'shadow-slate-500/20'
};

const colors: Record<string, ColorTheme> = {
    cyan: {
        text: 'text-cyan-400',
        bg: 'bg-cyan-600',
        hoverBg: 'hover:bg-cyan-500',
        ring: 'focus:ring-cyan-500',
        border: 'border-cyan-500',
        shadow: 'hover:shadow-cyan-500/30'
    },
    indigo: {
        text: 'text-indigo-400',
        bg: 'bg-indigo-600',
        hoverBg: 'hover:bg-indigo-500',
        ring: 'focus:ring-indigo-500',
        border: 'border-indigo-500',
        shadow: 'hover:shadow-indigo-500/30'
    },
    emerald: {
        text: 'text-emerald-400',
        bg: 'bg-emerald-600',
        hoverBg: 'hover:bg-emerald-500',
        ring: 'focus:ring-emerald-500',
        border: 'border-emerald-500',
        shadow: 'hover:shadow-emerald-500/30'
    },
    rose: {
        text: 'text-rose-400',
        bg: 'bg-rose-600',
        hoverBg: 'hover:bg-rose-500',
        ring: 'focus:ring-rose-500',
        border: 'border-rose-500',
        shadow: 'hover:shadow-rose-500/30'
    },
    amber: {
        text: 'text-amber-400',
        bg: 'bg-amber-600',
        hoverBg: 'hover:bg-amber-500',
        ring: 'focus:ring-amber-500',
        border: 'border-amber-500',
        shadow: 'hover:shadow-amber-500/30'
    },
    violet: {
        text: 'text-violet-400',
        bg: 'bg-violet-600',
        hoverBg: 'hover:bg-violet-500',
        ring: 'focus:ring-violet-500',
        border: 'border-violet-500',
        shadow: 'hover:shadow-violet-500/30'
    },
};

const colorMapping: Partial<Record<ExerciseName, ColorTheme>> = {
    'Press de banca': colors.cyan,
    'Sentadilla': colors.indigo,
    'Peso muerto': colors.rose,
    'Dominadas': colors.emerald,
    'Press militar': colors.amber,
    'Remo / Inclina': colors.violet,
    'Flexión / Inver': colors.cyan,
    'Fondos en paralelas': colors.indigo,
    'Plancha': colors.emerald,
    'Curl / Biceps': colors.amber,
};

export const getExerciseColor = (exerciseName: ExerciseName): ColorTheme => {
    return colorMapping[exerciseName] || colors.cyan; // default to cyan
};

export const COLOR_THEMES = colors;

```

---

## Archivo: `manifest.json`

```json
{
  "name": "Exercise Monitor",
  "short_name": "ExerMon",
  "description": "A simple and elegant web application to track your squat and bicep curl workouts. Log weight, repetitions, and sets to monitor your progress over time.",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/vite.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "icon-192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "icon-512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ]
}
```

---

## Archivo: `metadata.json`

```json
{
  "name": "Remix Exercise Monitor",
  "description": "A simple and elegant web application to track your squat and bicep curl workouts. Log weight, repetitions, and sets to monitor your progress over time.",
  "requestFramePermissions": [],
  "majorCapabilities": [
    "MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"
  ]
}
```

---

## Archivo: `constants/equipment.ts`

```typescript
import type { ExerciseName } from '../types';

export interface EquipmentDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'libre' | 'calistenia' | 'maquinas' | 'accesorios';
}

export const DEFAULT_EQUIPMENT_LIST: EquipmentDefinition[] = [
  { id: 'bodyweight', name: 'Peso corporal (Sin equipo)', icon: '🤸', description: 'Ejercicios libres sin material', category: 'calistenia' },
  { id: 'dumbbells', name: 'Mancuernas', icon: '🏋️', description: 'Mancuernas ajustables o fijas', category: 'libre' },
  { id: 'barbell', name: 'Barra olímpica / Discos', icon: '⚡', description: 'Barra recta, discos olímpicos o estándar', category: 'libre' },
  { id: 'pullup_bar', name: 'Barra de dominadas', icon: '🧗', description: 'Barra fija para colgarse', category: 'calistenia' },
  { id: 'parallel_bars', name: 'Paralelas / Anillas', icon: '⚖️', description: 'Barras paralelas, estación de fondos o anillas', category: 'calistenia' },
  { id: 'bench', name: 'Banco de pesas', icon: '🛋️', description: 'Banco plano, inclinado o multiposición', category: 'libre' },
  { id: 'jump_rope', name: 'Cuerda de saltar', icon: '🪢', description: 'Para calentamiento o trabajo metabólico', category: 'accesorios' },
  { id: 'resistance_bands', name: 'Bandas elásticas', icon: '🎗️', description: 'Bandas de resistencia o tubos de látex', category: 'accesorios' },
  { id: 'kettlebells', name: 'Pesas rusas / Kettlebells', icon: '🔔', description: 'Kettlebells de diferentes pesos', category: 'libre' },
  { id: 'pulley_machine', name: 'Máquina de poleas / Smith', icon: '⚙️', description: 'Torre de poleas, cruces de poleas o jaula Smith', category: 'maquinas' },
  { id: 'leg_machines', name: 'Máquinas de piernas', icon: '🦵', description: 'Prensa, sillón de cuádriceps, femoral, abductores', category: 'maquinas' },
  { id: 'ab_wheel', name: 'Rueda abdominal (Ab wheel)', icon: '🔘', description: 'Rueda para extensión de abdomen', category: 'accesorios' },
  { id: 'home_machine', name: 'Máquina multifunción / Gimnasio en casa', icon: '🏠', description: 'Estación multifuncional o aparato casero', category: 'maquinas' },
];

/**
 * Mapeo del equipamiento necesario o compatible para cada ejercicio.
 * Si un ejercicio tiene múltiples arrays alternativos, cualquiera de ellos lo hace posible.
 */
export const EXERCISE_EQUIPMENT_MAP: Record<string, string[]> = {
  // Calistenia - Tren Superior
  'Flexión / Inver': ['Peso corporal (Sin equipo)'],
  'Dominadas': ['Barra de dominadas'],
  'Fondos en paralelas': ['Paralelas / Anillas', 'Banco de pesas'],
  'Pike Push-ups': ['Peso corporal (Sin equipo)'],
  'Remo invertido': ['Paralelas / Anillas', 'Barra olímpica / Discos', 'Barra de dominadas'],
  'Muscle-ups (si aplica)': ['Barra de dominadas', 'Paralelas / Anillas'],
  'Flexiones diamante': ['Peso corporal (Sin equipo)'],
  'Flexiones arqueras': ['Peso corporal (Sin equipo)'],
  'Face pull con anillas': ['Paralelas / Anillas', 'Bandas elásticas'],
  'Fondos en banco': ['Banco de pesas', 'Peso corporal (Sin equipo)'],

  // Calistenia - Tren Inferior
  'Sentadilla': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Barra olímpica / Discos', 'Pesas rusas / Kettlebells'],
  'Zancadas': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Pesas rusas / Kettlebells'],
  'Sentadilla búlgara': ['Peso corporal (Sin equipo)', 'Banco de pesas', 'Mancuernas'],
  'Elevación de talones': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Barra olímpica / Discos'],
  'Puente de glúteos': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Barra olímpica / Discos', 'Bandas elásticas'],
  'Sentadilla pistola (si aplica)': ['Peso corporal (Sin equipo)'],
  'Nordic curls (si aplica)': ['Peso corporal (Sin equipo)'],
  'Saltos al cajón': ['Peso corporal (Sin equipo)', 'Banco de pesas'],
  'Sentadilla isométrica (wall sit)': ['Peso corporal (Sin equipo)'],

  // Calistenia - Core
  'Plancha': ['Peso corporal (Sin equipo)'],
  'Elevación de piernas colgado': ['Barra de dominadas'],
  'Dragon Flag (si aplica)': ['Banco de pesas', 'Peso corporal (Sin equipo)'],
  'Abdominales en V (V-ups)': ['Peso corporal (Sin equipo)'],
  'Plancha lateral': ['Peso corporal (Sin equipo)'],
  'Hollow body hold': ['Peso corporal (Sin equipo)'],
  'Giros rusos': ['Peso corporal (Sin equipo)', 'Mancuernas', 'Pesas rusas / Kettlebells', 'Barra olímpica / Discos'],
  'Mountain climbers': ['Peso corporal (Sin equipo)'],
  'Toes-to-bar': ['Barra de dominadas'],
  'L-Sit': ['Paralelas / Anillas', 'Peso corporal (Sin equipo)'],

  // Calistenia - Mixto / Cardio
  'Burpees': ['Peso corporal (Sin equipo)', 'Cuerda de saltar'],
  'Elevación de rodillas': ['Peso corporal (Sin equipo)'],
  'Saltos de tijera': ['Peso corporal (Sin equipo)', 'Cuerda de saltar'],

  // Gym - Tren Superior
  'Press de banca': ['Barra olímpica / Discos', 'Banco de pesas', 'Mancuernas', 'Máquina multifunción / Gimnasio en casa', 'Máquina de poleas / Smith'],
  'Remo / Inclina': ['Barra olímpica / Discos', 'Mancuernas', 'Máquina de poleas / Smith', 'Bandas elásticas'],
  'Press militar': ['Barra olímpica / Discos', 'Mancuernas', 'Máquina de poleas / Smith', 'Pesas rusas / Kettlebells'],
  'Elev / Lat': ['Mancuernas', 'Bandas elásticas', 'Máquina de poleas / Smith'],
  'Curl / Biceps': ['Mancuernas', 'Barra olímpica / Discos', 'Bandas elásticas', 'Máquina de poleas / Smith'],
  'Press francés': ['Barra olímpica / Discos', 'Mancuernas', 'Banco de pesas'],
  'Jalón al pecho (pulldown)': ['Máquina de poleas / Smith', 'Bandas elásticas', 'Máquina multifunción / Gimnasio en casa', 'Barra de dominadas'],
  'Aperturas con mancuernas': ['Mancuernas', 'Banco de pesas'],
  'Face pull con polea': ['Máquina de poleas / Smith', 'Bandas elásticas'],
  'Encogimientos de hombros': ['Mancuernas', 'Barra olímpica / Discos', 'Pesas rusas / Kettlebells'],
  'Extensiones de tríceps en polea': ['Máquina de poleas / Smith', 'Bandas elásticas'],

  // Gym - Tren Inferior
  'Peso muerto': ['Barra olímpica / Discos', 'Mancuernas', 'Pesas rusas / Kettlebells'],
  'Prensa de piernas': ['Máquinas de piernas', 'Máquina multifunción / Gimnasio en casa'],
  'Extensiones de cuádriceps': ['Máquinas de piernas', 'Máquina multifunción / Gimnasio en casa', 'Bandas elásticas'],
  'Curl femoral': ['Máquinas de piernas', 'Máquina multifunción / Gimnasio en casa', 'Mancuernas', 'Bandas elásticas'],
  'Zancadas con mancuernas': ['Mancuernas', 'Pesas rusas / Kettlebells'],
  'Hip thrust': ['Barra olímpica / Discos', 'Banco de pesas', 'Mancuernas', 'Bandas elásticas'],
  'Abductores en máquina': ['Máquinas de piernas', 'Bandas elásticas'],
  'Aductores en máquina': ['Máquinas de piernas', 'Bandas elásticas'],

  // Gym - Core
  'Plancha con peso': ['Barra olímpica / Discos', 'Mancuernas', 'Peso corporal (Sin equipo)'],
  'Elevación de piernas en silla romana': ['Paralelas / Anillas', 'Barra de dominadas'],
  'Crunch en polea alta': ['Máquina de poleas / Smith', 'Bandas elásticas'],
  'Giros rusos con disco': ['Barra olímpica / Discos', 'Mancuernas', 'Pesas rusas / Kettlebells'],
  'Leñador (woodchopper) en polea': ['Máquina de poleas / Smith', 'Bandas elásticas'],
  'Ab wheel': ['Rueda abdominal (Ab wheel)'],
  'Hiperextensiones': ['Banco de pesas', 'Peso corporal (Sin equipo)'],

  // Gym - Mixto / Olímpico
  'Clean and Jerk': ['Barra olímpica / Discos', 'Pesas rusas / Kettlebells'],
  'Snatch': ['Barra olímpica / Discos', 'Pesas rusas / Kettlebells', 'Mancuernas'],
  'Dominadas con lastre': ['Barra de dominadas', 'Mancuernas', 'Barra olímpica / Discos'],
  'Thrusters': ['Barra olímpica / Discos', 'Mancuernas', 'Pesas rusas / Kettlebells'],
  'Paseo del granjero': ['Mancuernas', 'Pesas rusas / Kettlebells', 'Barra olímpica / Discos'],
};

/**
 * Retorna las etiquetas de equipamiento compatibles para un ejercicio.
 */
export const getEquipmentForExercise = (exerciseName: string): string[] => {
  if (EXERCISE_EQUIPMENT_MAP[exerciseName]) {
    return EXERCISE_EQUIPMENT_MAP[exerciseName];
  }
  // Si no se encuentra especificado, inferir por nombre
  const lower = exerciseName.toLowerCase();
  if (lower.includes('mancuerna')) return ['Mancuernas'];
  if (lower.includes('barra') || lower.includes('olímp')) return ['Barra olímpica / Discos'];
  if (lower.includes('polea')) return ['Máquina de poleas / Smith'];
  if (lower.includes('cuerda') || lower.includes('saltar')) return ['Cuerda de saltar'];
  if (lower.includes('máquina')) return ['Máquina multifunción / Gimnasio en casa'];
  if (lower.includes('kettlebell') || lower.includes('pesa rusa')) return ['Pesas rusas / Kettlebells'];
  if (lower.includes('dominada')) return ['Barra de dominadas'];
  return ['Peso corporal (Sin equipo)'];
};

/**
 * Determina si un ejercicio se puede realizar con el equipamiento disponible seleccionado por el usuario.
 */
export const canPerformExerciseWithEquipment = (
  exerciseName: string,
  availableEquipment: string[]
): boolean => {
  if (!availableEquipment || availableEquipment.length === 0) return true;
  const required = getEquipmentForExercise(exerciseName);
  // Si alguno de los elementos requeridos/compatibles está en la lista de disponibles del usuario
  return required.some(req => availableEquipment.includes(req));
};

```

---

## Archivo: `constants/exercises.ts`

```typescript
import type { ExerciseName, RoutineFocus, RoutineType } from '../types';

export const PREDEFINED_EXERCISES: Record<RoutineType, Partial<Record<RoutineFocus, ExerciseName[]>>> = {
    Calistenia: {
        'Tren Superior': ['Flexión / Inver', 'Dominadas', 'Fondos en paralelas', 'Pike Push-ups', 'Remo invertido', 'Muscle-ups (si aplica)', 'Flexiones diamante', 'Flexiones arqueras', 'Face pull con anillas', 'Fondos en banco'],
        'Tren Inferior': ['Sentadilla', 'Zancadas', 'Sentadilla búlgara', 'Elevación de talones', 'Puente de glúteos', 'Sentadilla pistola (si aplica)', 'Nordic curls (si aplica)', 'Saltos al cajón', 'Sentadilla isométrica (wall sit)'],
        'Core': ['Plancha', 'Elevación de piernas colgado', 'Dragon Flag (si aplica)', 'Abdominales en V (V-ups)', 'Plancha lateral', 'Hollow body hold', 'Giros rusos', 'Mountain climbers', 'Toes-to-bar', 'L-Sit'],
        'Mixto': ['Burpees', 'Flexión / Inver', 'Sentadilla', 'Plancha', 'Dominadas', 'Zancadas'],
    },
    Gym: {
        'Tren Superior': ['Press de banca', 'Remo / Inclina', 'Press militar', 'Elev / Lat', 'Curl / Biceps', 'Press francés', 'Jalón al pecho (pulldown)', 'Aperturas con mancuernas', 'Face pull con polea', 'Encogimientos de hombros', 'Extensiones de tríceps en polea'],
        'Tren Inferior': ['Sentadilla', 'Peso muerto', 'Prensa de piernas', 'Extensiones de cuádriceps', 'Curl femoral', 'Zancadas con mancuernas', 'Hip thrust', 'Elevación de talones', 'Abductores en máquina', 'Aductores en máquina'],
        'Core': ['Elevación de piernas en silla romana', 'Crunch en polea alta', 'Giros rusos con disco', 'Leñador (woodchopper) en polea', 'Ab wheel', 'Hiperextensiones', 'Plancha con peso'],
        'Mixto': ['Clean and Jerk', 'Snatch', 'Thrusters', 'Paseo del granjero', 'Press de banca', 'Peso muerto'],
    },
    Personalizado: {
        'Tren Superior': [],
        'Tren Inferior': [],
        'Core': [],
        'Mixto': [],
    }
};

export const BODYWEIGHT_EXERCISES: ExerciseName[] = [
  'Flexión / Inver', 'Dominadas', 'Fondos en paralelas', 'Pike Push-ups', 'Remo invertido', 'Muscle-ups (si aplica)', 'Flexiones diamante', 'Flexiones arqueras', 'Face pull con anillas', 'L-Sit',
  'Sentadilla', 'Zancadas', 'Sentadilla búlgara', 'Elevación de talones', 'Puente de glúteos', 'Sentadilla pistola (si aplica)', 'Nordic curls (si aplica)', 'Saltos al cajón', 'Sentadilla isométrica (wall sit)',
  'Plancha', 'Elevación de piernas colgado', 'Dragon Flag (si aplica)', 'Abdominales en V (V-ups)', 'Plancha lateral', 'Hollow body hold', 'Giros rusos', 'Mountain climbers', 'Toes-to-bar',
  'Burpees', 'Elevación de rodillas', 'Saltos de tijera', 'Fondos en banco',
];

export const TIME_BASED_EXERCISES: ExerciseName[] = ['Plancha'];

```

---

## Archivo: `constants/muscles.ts`

```typescript

import type { ExerciseName } from '../types';

export type MuscleGroup =
  | 'neck'
  | 'shoulders'
  | 'shoulders_front'
  | 'shoulders_rear'
  | 'chest'
  | 'biceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'adductors'
  | 'calves_front'
  | 'traps'
  | 'triceps'
  | 'lats'
  | 'mid_back'
  | 'lower_back'
  | 'glutes'
  | 'hamstrings'
  | 'calves_rear';

export const MUSCLE_GROUP_MAPPING: Partial<Record<ExerciseName, MuscleGroup[]>> = {
  // Calistenia - Tren Superior
  'Flexión / Inver': ['chest', 'shoulders_front', 'triceps'],
  'Dominadas': ['lats', 'biceps', 'mid_back'],
  'Fondos en paralelas': ['triceps', 'chest', 'shoulders_front'],
  'Pike Push-ups': ['shoulders', 'triceps'],
  'Remo invertido': ['mid_back', 'biceps', 'lats'],
  'Muscle-ups (si aplica)': ['lats', 'biceps', 'triceps', 'chest', 'shoulders'],
  'Flexiones diamante': ['triceps', 'chest'],
  'Flexiones arqueras': ['chest', 'shoulders_front', 'triceps'],
  'Face pull con anillas': ['shoulders_rear', 'mid_back', 'traps'],
  'Fondos en banco': ['triceps'],
  // Calistenia - Tren Inferior
  'Sentadilla': ['quads', 'glutes', 'hamstrings', 'adductors'],
  'Zancadas': ['quads', 'glutes'],
  'Sentadilla búlgara': ['quads', 'glutes'],
  'Elevación de talones': ['calves_rear', 'calves_front'],
  'Puente de glúteos': ['glutes', 'hamstrings'],
  'Sentadilla pistola (si aplica)': ['quads', 'glutes'],
  'Nordic curls (si aplica)': ['hamstrings'],
  'Saltos al cajón': ['quads', 'glutes', 'calves_rear'],
  'Sentadilla isométrica (wall sit)': ['quads', 'glutes'],
  // Calistenia - Core
  'Plancha': ['abs', 'lower_back'],
  'Elevación de piernas colgado': ['abs', 'obliques'],
  'Dragon Flag (si aplica)': ['abs', 'lower_back'],
  'Abdominales en V (V-ups)': ['abs'],
  'Plancha lateral': ['obliques'],
  'Hollow body hold': ['abs'],
  'Giros rusos': ['obliques'],
  'Mountain climbers': ['abs', 'quads'],
  'Toes-to-bar': ['abs', 'lats'],
  'L-Sit': ['abs', 'quads', 'triceps'],
  // Calistenia - Mixto
  'Burpees': ['chest', 'quads', 'glutes', 'shoulders', 'abs'],
  'Elevación de rodillas': ['abs', 'quads'],
  'Saltos de tijera': ['calves_rear', 'quads'],

  // Gym - Tren Superior
  'Press de banca': ['chest', 'shoulders_front', 'triceps'],
  'Remo / Inclina': ['mid_back', 'lats', 'biceps'],
  'Press militar': ['shoulders', 'triceps'],
  'Elev / Lat': ['shoulders'],
  'Curl / Biceps': ['biceps'],
  'Press francés': ['triceps'],
  'Jalón al pecho (pulldown)': ['lats', 'mid_back', 'biceps'],
  'Aperturas con mancuernas': ['chest'],
  'Face pull con polea': ['shoulders_rear', 'traps', 'mid_back'],
  'Encogimientos de hombros': ['traps'],
  'Extensiones de tríceps en polea': ['triceps'],
  // Gym - Tren Inferior
  'Peso muerto': ['hamstrings', 'glutes', 'lower_back', 'traps'],
  'Prensa de piernas': ['quads', 'glutes', 'hamstrings'],
  'Extensiones de cuádriceps': ['quads'],
  'Curl femoral': ['hamstrings'],
  'Zancadas con mancuernas': ['quads', 'glutes'],
  'Hip thrust': ['glutes', 'hamstrings'],
  'Abductores en máquina': ['glutes'],
  'Aductores en máquina': ['adductors'],
  // Gym - Core
  'Plancha con peso': ['abs', 'lower_back'],
  'Elevación de piernas en silla romana': ['abs'],
  'Crunch en polea alta': ['abs'],
  'Giros rusos con disco': ['obliques'],
  'Leñador (woodchopper) en polea': ['obliques', 'abs'],
  'Ab wheel': ['abs', 'lats'],
  'Hiperextensiones': ['lower_back', 'glutes'],
  // Gym - Mixto
  'Clean and Jerk': ['quads', 'glutes', 'hamstrings', 'lower_back', 'traps', 'shoulders', 'triceps'],
  'Snatch': ['quads', 'glutes', 'hamstrings', 'lower_back', 'traps', 'shoulders'],
  'Dominadas con lastre': ['lats', 'biceps', 'mid_back'],
  'Thrusters': ['quads', 'shoulders', 'glutes', 'triceps'],
  'Paseo del granjero': ['forearms', 'traps', 'abs', 'calves_rear']
};
```

---

## Archivo: `utils/uuid.ts`

```typescript
/**
 * Utility to generate unique IDs safely in any environment (including non-secure contexts or webviews).
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if crypto.randomUUID fails
    }
  }

  // RFC4122 version 4 compliant UUID fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

```

---

## Archivo: `utils/storage.ts`

```typescript
// Safe storage wrapper that falls back to in-memory storage if localStorage is blocked (e.g. in cross-origin iframes)
const memoryStore = new Map<string, string>();

let isLocalStorageAvailable = false;
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
  }
} catch (e) {
  isLocalStorageAvailable = false;
  console.warn('localStorage is not available, falling back to memory storage:', e);
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (isLocalStorageAvailable) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`safeStorage.getItem error for key "${key}":`, e);
    }
    return memoryStore.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (isLocalStorageAvailable) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`safeStorage.setItem error for key "${key}":`, e);
    }
    memoryStore.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (isLocalStorageAvailable) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`safeStorage.removeItem error for key "${key}":`, e);
    }
    memoryStore.delete(key);
  },

  clear: (): void => {
    try {
      if (isLocalStorageAvailable) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('safeStorage.clear error:', e);
    }
    memoryStore.clear();
  },
};

```

---

## Archivo: `utils/exerciseUtils.ts`

```typescript
import type { ExerciseName, ExerciseGoal, TrainingType } from '../types';
import { TIME_BASED_EXERCISES, BODYWEIGHT_EXERCISES } from '../constants/exercises';

/**
 * Checks if an exercise is time-based (e.g., Plank).
 */
export const isTimeBased = (exerciseName: ExerciseName): boolean => {
    return TIME_BASED_EXERCISES.includes(exerciseName);
};

/**
 * Checks if an exercise is typically performed with bodyweight.
 */
export const isBodyweight = (exerciseName: ExerciseName): boolean => {
    return BODYWEIGHT_EXERCISES.includes(exerciseName);
};

/**
 * Determines if an exercise should be treated as purely repetition-based for logging purposes.
 * This is true for bodyweight exercises that are not time-based and have no intention of using added weight.
 * The intention to use weight is inferred from the training goal ('Con Lastre') or the training type ('Clúster').
 */
export const isEffectivelyRepBased = (
    exerciseName: ExerciseName,
    goal?: ExerciseGoal,
    trainingType?: TrainingType
): boolean => {
    if (isTimeBased(exerciseName)) {
        return false;
    }
    if (!isBodyweight(exerciseName)) {
        return false;
    }

    // Check for weight intent in the goal or training type
    const hasWeightIntentInGoal = (goal?.isWeighted === true) ||
                                 (!!goal?.weight && goal.weight > 0) ||
                                 (trainingType === 'Clúster' && !!goal?.clusterGoals && goal.clusterGoals.some(c => c.weight > 0));

    return !hasWeightIntentInGoal;
};

```

---

## Archivo: `services/pdfGenerator.ts`

```typescript
import type { ExerciseLog, Goals, UserProfile, ExerciseName, Cluster } from '../types';
import { isTimeBased, isBodyweight } from '../utils/exerciseUtils';
import { jsPDF } from 'jspdf';

// Helper functions moved from HistoryLog
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDuration = (milliseconds: number): string => {
    if (isNaN(milliseconds) || milliseconds < 0) return '0s';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0 || result === '') result += `${seconds}s`;
    
    return result.trim();
};


export const generateHistoryPdf = (logs: ExerciseLog[], goals: Goals, userProfile: UserProfile | null, sessionKeys: string[]) => {
    const doc = new jsPDF();
    let y = 15;

    const checkY = () => {
        if (y > 280) {
            doc.addPage();
            y = 15;
        }
    };

    const logsBySession = logs.reduce((acc, log) => {
        const dateKey = formatDate(log.timestamp);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(log);
        return acc;
    }, {} as Record<string, ExerciseLog[]>);

    doc.setFontSize(22);
    doc.text('Historial de Entrenamiento', 105, y, { align: 'center' });
    y += 10;

    if (userProfile) {
        doc.setFontSize(12);
        doc.text(`Perfil: ${userProfile.name}`, 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.text(`Edad: ${userProfile.age} | Peso: ${userProfile.weight}kg | Altura: ${userProfile.height}cm`, 14, y);
        y += 10;
    }

    sessionKeys.forEach(sessionKey => {
        checkY();
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, 196, y);
        y += 8;
        checkY();
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(sessionKey, 14, y);
        y += 8;

        const sessionLogs = logsBySession[sessionKey];
        
        const exercisesInSession = sessionLogs.reduce((acc, log) => {
            let exercise = acc.find(e => e.exerciseName === log.exerciseName);
            if (!exercise) {
                exercise = { exerciseName: log.exerciseName, clusters: [], heartRates: [], RPEs: [] };
                acc.push(exercise);
            }
            exercise.clusters.push(...log.clusters);
            if (log.heartRate) exercise.heartRates.push(log.heartRate);
            if (log.perceivedExertion) exercise.RPEs.push(log.perceivedExertion);
            return acc;
        }, [] as { exerciseName: ExerciseName, clusters: Cluster[], heartRates: number[], RPEs: number[] }[]);

        exercisesInSession.forEach(({ exerciseName, clusters, heartRates, RPEs }) => {
            checkY();
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(exerciseName, 14, y);
            y += 6;

            const goal = goals[exerciseName];
            const isClusterWorkout = goal && !!goal.clusterGoals && goal.clusterGoals.length > 0;
            const avgHeartRate = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : 0;
            const avgRPE = RPEs.length > 0 ? (RPEs.reduce((a, b) => a + b, 0) / RPEs.length).toFixed(1) : 0;


            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            if(isClusterWorkout) {
                // Detailed cluster breakdown of work done
                clusters.forEach((cluster, index) => {
                    checkY();
                    doc.text(`- Clúster ${index + 1}: ${cluster.weight} kg x ${cluster.reps} reps`, 18, y);
                    y += 5;
                });
            } else {
                // Original summary logic
                const totalVolume = clusters.reduce((sum, c) => sum + (c.weight * c.reps), 0);
                const totalReps = clusters.reduce((sum, c) => sum + c.reps, 0);
                const totalTime = clusters.reduce((sum, c) => sum + (c.time || 0), 0);
                const numSets = clusters.length;
                
                let summaryLine = `- ${numSets} serie(s), `;
                if (totalTime > 0) summaryLine += `Tiempo total: ${formatDuration(totalTime * 1000)}.`;
                else if (totalVolume > 0) summaryLine += `${totalReps} reps totales. Volumen: ${totalVolume}kg.`;
                else summaryLine += `${totalReps} reps totales.`;
                doc.text(summaryLine, 18, y);
                y += 5;
            }

            let optionalDataLine = [];
            if (avgHeartRate > 0) {
                optionalDataLine.push(`FC Media: ${avgHeartRate} PPM`);
            }
            if (Number(avgRPE) > 0) {
                optionalDataLine.push(`RPE Medio: ${avgRPE}/10`);
            }

            if (optionalDataLine.length > 0) {
                checkY();
                doc.text(optionalDataLine.join(' | '), 18, y);
                y += 8;
            }

            if (goal) {
                doc.setFont('helvetica', 'bold');
                doc.text('Meta vs. Logrado:', 22, y);
                y += 5;
                doc.setFont('helvetica', 'normal');

                let goalStr = '', achievedStr = '', percentage = 0;
                const isClusterGoal = !!goal.clusterGoals && goal.clusterGoals.length > 0;
                
                // Recalculate achieved values here for clarity
                const totalVolume = clusters.reduce((sum, c) => sum + (c.weight * c.reps), 0);
                const totalReps = clusters.reduce((sum, c) => sum + c.reps, 0);
                const totalTime = clusters.reduce((sum, c) => sum + (c.time || 0), 0);
                const numSets = clusters.length;


                if (isTimeBased(exerciseName)) {
                    goalStr = `Tiempo: ${goal.totalTime}s`;
                    achievedStr = `Logrado: ${totalTime}s`;
                    percentage = goal.totalTime && goal.totalTime > 0 ? (totalTime / goal.totalTime) * 100 : 0;
                } else {
                    const isBody = isBodyweight(exerciseName) && !isTimeBased(exerciseName) && !goal.isWeighted && !isClusterGoal;
                    let goalVol = 0;
                    let goalReps = 0;
                    let goalSeriesCount = 0;

                    if (isClusterGoal) {
                        goalSeriesCount = goal.clusterGoals!.length;
                        goalVol = goal.clusterGoals!.reduce((s, c) => s + (c.weight * (c.reps || 0)), 0);
                        goalReps = goal.clusterGoals!.reduce((s, c) => s + (c.reps || 0), 0);
                    } else {
                        goalSeriesCount = goal.series || 0;
                        goalVol = (goal.weight || 0) * (goal.reps || 0) * goalSeriesCount;
                        goalReps = (goal.reps || 0) * goalSeriesCount;
                    }
                    
                    if (isBody) {
                         goalStr = `Series: ${goalSeriesCount}, Reps: ${goalReps}`;
                         achievedStr = `Logrado: ${numSets} series, ${totalReps} reps`;
                         percentage = goalReps > 0 ? (totalReps / goalReps) * 100 : 0;
                    } else {
                         goalStr = `Series: ${goalSeriesCount}, Volumen: ${goalVol}kg`;
                         achievedStr = `Logrado: ${numSets} series, ${totalVolume}kg`;
                         percentage = goalVol > 0 ? (totalVolume / goalVol) * 100 : 0;
                    }
                }
                doc.text(`- Objetivo: ${goalStr}`, 26, y);
                y += 5;
                doc.text(`- Realizado: ${achievedStr} (${Math.min(100, percentage).toFixed(0)}%)`, 26, y);
                y += 7;
            }
        });

        // Session Summary
        if (sessionLogs.length > 0) {
            const startTime = new Date(sessionLogs[0].timestamp);
            const endTime = new Date(sessionLogs[sessionLogs.length - 1].timestamp);
            const duration = endTime.getTime() - startTime.getTime();
            const totalSessionVolume = exercisesInSession.reduce((sum, ex) => sum + ex.clusters.reduce((s, c) => s + (c.weight * c.reps), 0), 0);
            const totalSessionReps = exercisesInSession.reduce((sum, ex) => sum + ex.clusters.reduce((s, c) => s + c.reps, 0), 0);

            y += 5;
            checkY();
            doc.setDrawColor(220, 220, 220);
            doc.line(22, y, 188, y);
            y += 8;

            doc.setFont('helvetica', 'bold');
            doc.text('Resumen de la Sesión', 105, y, { align: 'center' });
            y += 7;
            doc.setFont('helvetica', 'normal');
            doc.text(`Duración Total:  ${formatDuration(duration)}`, 105, y, { align: 'center' });
            y += 5;
            doc.text(`Volumen Total:  ${totalSessionVolume} kg`, 105, y, { align: 'center' });
            y += 5;
            doc.text(`Repeticiones Totales:  ${totalSessionReps}`, 105, y, { align: 'center' });
            y += 5;
            doc.text(`Horarios:  ${formatTime(sessionLogs[0].timestamp)} - ${formatTime(sessionLogs[sessionLogs.length - 1].timestamp)}`, 105, y, { align: 'center' });
            y += 10;
        }
    });

    const getSanitizedDateString = (dateKey: string): string => {
        const logForDate = logs.find(log => formatDate(log.timestamp) === dateKey);
        if (logForDate) {
            return new Date(logForDate.timestamp).toISOString().split('T')[0];
        }
        return new Date().toISOString().split('T')[0];
    };

    let fileName = '';
    const namePart = userProfile?.name.replace(/ /g, '_') || 'usuario';

    if (sessionKeys.length === 1) {
        const dateStr = getSanitizedDateString(sessionKeys[0]);
        fileName = `sesion_${namePart}_${dateStr}.pdf`;
    } else {
        const dateStr = new Date().toISOString().split('T')[0];
        fileName = `historial_entrenamiento_${namePart}_${dateStr}.pdf`;
    }

    doc.save(fileName);
};
```

---

## Archivo: `components/Header.tsx`

```typescript
import React from 'react';

interface HeaderProps {
    title: string;
    userName: string;
    showHistory: boolean;
    onNavigateHome: () => void;
    onViewHistory: () => void;
    onGoToSettings: () => void;
    onEditRoutine: () => void;
    onLogout: () => void;
    onGoToRoutineSelection: () => void;
    onOpenSaveRoutineModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, userName, showHistory, onNavigateHome, onViewHistory, onGoToSettings, onEditRoutine, onLogout, onGoToRoutineSelection, onOpenSaveRoutineModal }) => {
    
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className='text-center md:text-left'>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 pb-2">
                    {title}
                </h1>
                {userName && (
                    <p className="text-slate-400 text-sm">
                        Sesión de <span className="font-bold text-amber-400">{userName}</span>
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                {showHistory ? (
                    <>
                        <button 
                            onClick={onNavigateHome} 
                            className="flex-shrink-0 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors duration-300 text-sm"
                            aria-label="Volver al panel de rutina"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Volver al Panel</span>
                        </button>
                         <button 
                            onClick={onLogout} 
                            className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors duration-300"
                            aria-label="Cambiar de perfil"
                            title="Cambiar de perfil"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                            onClick={onViewHistory} 
                            className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors duration-300 text-sm"
                        >
                            Ver Historial
                        </button>
                         <button 
                            onClick={onOpenSaveRoutineModal}
                            className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors duration-300"
                            aria-label="Guardar rutina"
                            title="Guardar rutina"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                           </svg>
                        </button>
                         <button 
                            onClick={onGoToSettings} 
                            className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors duration-300"
                            aria-label="Configurar perfil"
                            title="Configurar perfil"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0l-.1.41a2 2 0 01-1.42 1.42l-.41.1c-1.56.38-1.56 2.6 0 2.98l.41.1a2 2 0 011.42 1.42l.1.41c.38 1.56 2.6 1.56 2.98 0l.1-.41a2 2 0 011.42-1.42l.41-.1c1.56-.38 1.56-2.6 0-2.98l-.41-.1a2 2 0 01-1.42-1.42l-.1-.41zM10 5a5 5 0 100 10 5 5 0 000-10zM10 8a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button 
                            onClick={onLogout} 
                            className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors duration-300"
                            aria-label="Cambiar de perfil"
                            title="Cambiar de perfil"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
```

---

## Archivo: `components/Dashboard.tsx`

```typescript
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { ExerciseLog, ExerciseName, Goals, UserProfile, UserRoutine, RestSettings, TrainingType } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { getExerciseColor } from '../colors';
import { GoalSetter } from './GoalSetter';
import { UserProfile as UserProfileComponent } from './UserProfile';
import { RestSettings as RestSettingsComponent } from './RestSettings';
import { FloatingRestTimer } from './FloatingRestTimer';


interface DashboardProps {
  logs: ExerciseLog[];
  goals: Goals;
  userProfile: UserProfile | null;
  userRoutine: UserRoutine | null;
  restSettings: RestSettings;
  trainingType: TrainingType;
  onLog: (logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
  onSetGoals: (goals: Goals) => void;
  onSaveProfile: (profile: UserProfile) => void;
  onSaveRestSettings: (settings: RestSettings) => void;
  onSetTrainingType: (type: TrainingType) => void;
  onViewHistory: () => void;
  onGoToSettings: () => void;
  onEditRoutine: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  logs, 
  goals, 
  userProfile, 
  userRoutine,
  restSettings,
  trainingType,
  onLog, 
  onSetGoals, 
  onSaveProfile,
  onSaveRestSettings,
  onSetTrainingType,
  onViewHistory,
  onGoToSettings,
  onEditRoutine,
}) => {
  const [interExerciseRestActive, setInterExerciseRestActive] = useState(false);
  const [interExerciseRestTimeLeft, setInterExerciseRestTimeLeft] = useState(0);
  const interExerciseRestEndTimeRef = useRef<number | null>(null);
  const prevLogsLengthRef = useRef(logs.length);

  const playRestCompleteChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Note 1 (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.22, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch {}

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }
  }, []);

  const completedExercisesToday = useMemo(() => {
    return new Set(logs.map(log => log.exerciseName));
  }, [logs]);

  const routineExercises = useMemo(() => {
    return Array.isArray(userRoutine?.exercises) ? userRoutine.exercises : [];
  }, [userRoutine]);

  const isRoutineFinished = useMemo(() => {
    if (routineExercises.length === 0) {
        return false;
    }
    // Check if the number of unique completed exercises matches the number of exercises in the routine
    if (completedExercisesToday.size < routineExercises.length) {
        return false;
    }
    // Verify that every exercise in the routine is in the completed set
    return routineExercises.every(ex => completedExercisesToday.has(ex));
  }, [routineExercises, completedExercisesToday]);

  useEffect(() => {
    // Only reset if logs were explicitly cleared from a non-empty state
    if (prevLogsLengthRef.current > 0 && logs.length === 0) {
        interExerciseRestEndTimeRef.current = null;
        setInterExerciseRestActive(false);
        setInterExerciseRestTimeLeft(0);
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs.length]);

  // Wall-clock timestamp driven countdown: continues accurately even when phone screen turns off or locks
  useEffect(() => {
    if (!interExerciseRestActive) {
      return;
    }

    const durationSec = Number(restSettings?.restBetweenExercises) || 30;
    if (!interExerciseRestEndTimeRef.current) {
      interExerciseRestEndTimeRef.current = Date.now() + durationSec * 1000;
    }

    const updateTimer = () => {
      if (!interExerciseRestEndTimeRef.current) return;
      const remainingMs = interExerciseRestEndTimeRef.current - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      setInterExerciseRestTimeLeft(remainingSecs);

      if (remainingSecs <= 0) {
        interExerciseRestEndTimeRef.current = null;
        setInterExerciseRestActive(false);
        playRestCompleteChime();
      }
    };

    // Immediate check
    updateTimer();

    // High frequency interval (250ms) to ensure responsive display without drift
    const interval = window.setInterval(updateTimer, 250);

    // Instant synchronization when unlocking phone or switching back to the app
    const handleVisibilityOrFocus = () => {
      updateTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);

    // Request Screen Wake Lock if supported to prevent premature screen turn-off during rest
    let wakeLockSentinel: any = null;
    if ('wakeLock' in navigator && typeof (navigator as any).wakeLock?.request === 'function') {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLockSentinel = lock;
      }).catch(() => {});
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [interExerciseRestActive, playRestCompleteChime, restSettings?.restBetweenExercises]);


  const progressData = useMemo(() => {
    const data: Record<string, { weight: number; reps: number; clusters: number; totalTime: number; heartRate?: number; lastLogWithHrTimestamp?: string; }> = {};
    
    logs.forEach(log => {
        if (!data[log.exerciseName]) {
          data[log.exerciseName] = { weight: 0, reps: 0, clusters: 0, totalTime: 0 };
        }
        data[log.exerciseName].clusters += log.clusters.length;
        log.clusters.forEach(cluster => {
            data[log.exerciseName].weight += cluster.weight * cluster.reps;
            data[log.exerciseName].reps += cluster.reps;
            data[log.exerciseName].totalTime += cluster.time || 0;
        });

        if (log.heartRate) {
          if (!data[log.exerciseName].lastLogWithHrTimestamp || log.timestamp > data[log.exerciseName].lastLogWithHrTimestamp!) {
              data[log.exerciseName].heartRate = log.heartRate;
              data[log.exerciseName].lastLogWithHrTimestamp = log.timestamp;
          }
        }
      });

    Object.values(data).forEach(d => delete d.lastLogWithHrTimestamp);
    return data;
  }, [logs]);

  const exercisesForDisplay = useMemo(() => {
      return userRoutine?.exercises || [];
  }, [userRoutine]);
  
  const handleCompleteExercise = useCallback((logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => {
    onLog(logData);

    // We need to check for completion here to decide whether to start the rest timer.
    // The state `isRoutineFinished` won't be updated yet in this render cycle.
    const currentCompleted = new Set(logs.map(l => l.exerciseName));
    currentCompleted.add(logData.exerciseName);
    const routineExs = Array.isArray(userRoutine?.exercises) ? userRoutine.exercises : [];
    const allExercisesCompleted = routineExs.length > 0 && routineExs.every(ex => currentCompleted.has(ex));

    const durationSec = Number(restSettings?.restBetweenExercises) || 0;
    const isAutoMode = restSettings?.mode !== 'manual';

    if (!allExercisesCompleted && isAutoMode && durationSec > 0) {
        interExerciseRestEndTimeRef.current = Date.now() + durationSec * 1000;
        setInterExerciseRestTimeLeft(durationSec);
        setInterExerciseRestActive(true);
    }
  }, [onLog, restSettings, userRoutine, logs]);

  const handleProfileSaveFromComponent = useCallback((profileData: Omit<UserProfile, 'id'>) => {
    if (userProfile) {
      onSaveProfile({
        id: userProfile.id,
        ...profileData,
      });
    }
  }, [userProfile, onSaveProfile]);
  
  const handleSkipInterExerciseRest = useCallback(() => {
    interExerciseRestEndTimeRef.current = null;
    setInterExerciseRestActive(false);
    setInterExerciseRestTimeLeft(0);
  }, []);

  const exerciseElements = useMemo(() => {
    return exercisesForDisplay.map((exercise) => (
        <ExerciseCard
          key={exercise}
          exerciseName={exercise}
          onCompleteExercise={handleCompleteExercise}
          goal={goals[exercise]}
          progress={progressData[exercise]}
          isCompletedToday={completedExercisesToday.has(exercise)}
          color={getExerciseColor(exercise)}
          userProfile={userProfile}
          restBetweenSets={restSettings.restBetweenSets}
          trainingType={trainingType}
          isDisabled={interExerciseRestActive}
        />
    ));
  }, [
      exercisesForDisplay, 
      handleCompleteExercise, 
      goals, 
      progressData, 
      userProfile, 
      restSettings, 
      trainingType, 
      completedExercisesToday, 
      interExerciseRestActive
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
        <UserProfileComponent profile={userProfile} onSave={handleProfileSaveFromComponent} />
        
        <RestSettingsComponent settings={restSettings} onSave={onSaveRestSettings} />

        <GoalSetter 
            exercises={exercisesForDisplay} 
            currentGoals={goals} 
            onSetGoals={onSetGoals} 
            trainingType={trainingType}
            onSetTrainingType={onSetTrainingType}
        />

        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold text-slate-200">
                    Ejercicios de Hoy: <span className="text-cyan-400">{userRoutine?.type} - {userRoutine?.focus}</span>
                </h2>
                <button 
                    onClick={onEditRoutine} 
                    className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    aria-label="Añadir o editar ejercicios"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                    Añadir / Editar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {exerciseElements.length > 0 ? (
                exerciseElements
            ) : (
                <div className="md:col-span-2 xl:col-span-3 text-center bg-slate-800/50 p-8 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-300">No hay ejercicios en esta rutina.</h3>
                    <p className="text-slate-400 mt-2">Vuelve a la configuración para añadir ejercicios a tu rutina personalizada.</p>
                </div>
            )}
            </div>

            {isRoutineFinished && (
                <div className="mt-12 text-center animate-fade-in-up bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl shadow-lg p-8">
                    <div className="flex justify-center mb-4">
                    <div className="bg-emerald-500/10 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-400">¡Rutina Completada!</h3>
                    <p className="text-slate-400 mt-2 mb-6">Excelente trabajo. Revisa tus resultados para ver tu progreso.</p>
                    <button
                        onClick={onViewHistory}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/40 text-lg"
                    >
                        Finalizar Rutina y Ver Resultados
                    </button>
                </div>
            )}

            {!isRoutineFinished && completedExercisesToday.size > 0 && (
                 <div className="mt-12 text-center animate-fade-in-up bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-8">
                    <h3 className="text-xl font-bold text-amber-400">¿Deseas finalizar la sesión?</h3>
                    <p className="text-slate-400 mt-2 mb-6">Tu progreso se guardará, pero la rutina quedará marcada como incompleta.</p>
                    <button
                        onClick={onViewHistory}
                        className="bg-rose-700 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 text-lg"
                        aria-label="Finalizar sesión de entrenamiento ahora"
                    >
                        Finalizar Sesión Ahora
                    </button>
                </div>
            )}
        </div>
        <FloatingRestTimer
            isActive={interExerciseRestActive}
            timeLeft={interExerciseRestTimeLeft}
            totalDuration={restSettings.restBetweenExercises}
            onSkip={handleSkipInterExerciseRest}
        />
    </div>
  );
};
```

---

## Archivo: `components/WelcomeScreen.tsx`

```typescript
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { UserProfile, SavedRoutine } from '../types';

interface WelcomeScreenProps {
    profiles: UserProfile[];
    savedRoutines: SavedRoutine[];
    onSelectProfile: (profileId: string) => void;
    onStartNewRoutine: (profileId: string) => void;
    onStartSavedRoutine: (profileId: string, routine: SavedRoutine) => void;
    onCreateProfile: () => void;
    onDeleteProfile: (profileId: string) => void;
    onDeleteRoutine: (routineId: string) => void;
    onViewHistory: (profileId: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ profiles, savedRoutines, onSelectProfile, onStartNewRoutine, onStartSavedRoutine, onCreateProfile, onDeleteProfile, onDeleteRoutine, onViewHistory }) => {
    const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

    const handleProfileClick = (profileId: string) => {
        setExpandedProfileId(current => (current === profileId ? null : profileId));
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-lg w-full border border-slate-700 animate-fade-in-up text-center flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 pb-2 mb-4">
                        Monitor de Ejercicio
                    </h1>
                    <p className="text-slate-400 mb-8">Selecciona tu perfil para empezar a entrenar.</p>
                </div>

                <div className="flex-grow space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                    {profiles.length > 0 ? (
                        profiles.map(profile => {
                            const isExpanded = expandedProfileId === profile.id;
                            const profileRoutines = savedRoutines.filter(r => r.profileId === profile.id);

                            return (
                                <div key={profile.id} className={`bg-slate-700/30 border border-slate-600 rounded-lg p-4 transition-all duration-300 ${isExpanded ? 'ring-2 ring-cyan-500' : ''}`}>
                                    <div className="group flex items-center gap-2">
                                        <button
                                            onClick={() => handleProfileClick(profile.id)}
                                            className="flex-grow bg-slate-700/50 hover:bg-slate-700 rounded-lg py-3 px-4 text-white text-lg font-semibold transition-all duration-300 w-full text-left flex items-center justify-between"
                                        >
                                            <span>{profile.name}</span>
                                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-400' : ''}`} />
                                        </button>
                                        <button 
                                            onClick={() => onDeleteProfile(profile.id)}
                                            className="p-2 text-slate-500 hover:text-rose-400 transition-opacity opacity-0 group-hover:opacity-100"
                                            aria-label={`Eliminar perfil ${profile.name}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-slate-600 animate-fade-in space-y-3">
                                            <h3 className="text-sm font-semibold text-slate-300 mb-2">¿Qué quieres hacer hoy?</h3>
                                            <button
                                                onClick={() => onSelectProfile(profile.id)}
                                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-cyan-500/20"
                                            >
                                                Entrar al Panel de Rutina
                                            </button>
                                            <button
                                                onClick={() => onStartNewRoutine(profile.id)}
                                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300"
                                            >
                                                Configurar Nueva Rutina
                                            </button>
                                            <button
                                                onClick={() => onViewHistory(profile.id)}
                                                className="w-full bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-all duration-300"
                                            >
                                                Ver Historial
                                            </button>
                                            
                                            {profileRoutines.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs text-slate-400 pt-2">O selecciona una rutina guardada:</h4>
                                                    {profileRoutines.map(routine => (
                                                         <div key={routine.id} className="group flex items-center gap-1">
                                                            <button
                                                                onClick={() => onStartSavedRoutine(profile.id, routine)}
                                                                className="flex-grow bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 text-left"
                                                            >
                                                                {routine.name}
                                                            </button>
                                                            <button 
                                                                onClick={() => onDeleteRoutine(routine.id)}
                                                                className="p-2 text-slate-500 hover:text-rose-400 transition-opacity opacity-0 group-hover:opacity-100"
                                                                aria-label={`Eliminar rutina ${routine.name}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                                            </button>
                                                         </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-slate-500 py-8">No hay perfiles guardados.</p>
                    )}
                </div>

                <div className="flex-shrink-0 mt-8">
                    <button
                        onClick={onCreateProfile}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-cyan-500/30 text-lg"
                    >
                        + Crear Perfil Nuevo
                    </button>
                </div>
            </div>
        </div>
    );
};
```

---

## Archivo: `components/SetupWizard.tsx`

```typescript

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from './UserProfile';
import type { UserProfile as UserProfileType, RoutineType, RoutineFocus, ExerciseName, UserRoutine, ExerciseLog, TrainingType, RestSettings, Goals } from '../types';
import { PREDEFINED_EXERCISES } from '../constants/exercises';
import { ManualLogModal } from './ManualLogModal';
import { AIConversationAssistant } from './AIConversationAssistant';
import { EquipmentSelector } from './EquipmentSelector';
import { getEquipmentForExercise, canPerformExerciseWithEquipment, DEFAULT_EQUIPMENT_LIST } from '../constants/equipment';


interface SetupWizardProps {
  onComplete: (
    profile: Omit<UserProfileType, 'id'>, 
    routine: RoutineType, 
    focus: RoutineFocus, 
    exercises: ExerciseName[], 
    favoriteExercises: ExerciseName[], 
    aiConfig?: { trainingType: TrainingType, restSettings: RestSettings, goals: Goals },
    equipment?: string[]
  ) => void;
  initialProfile?: UserProfileType | null;
  initialRoutine?: UserRoutine | null;
  onCancel?: () => void;
  startStep?: number;
  onSaveManualLog: (profile: Omit<UserProfileType, 'id'> | null, logs: ExerciseLog[]) => void;
}

const routineOptions: { name: RoutineType; description: string }[] = [
    { name: 'Calistenia', description: 'Entrenamiento con tu propio peso corporal.' },
    { name: 'Gym', description: 'Ejercicios clásicos de gimnasio con pesas.' },
    { name: 'Personalizado', description: 'Crea y personaliza tu propia rutina.' },
];

const routineColors: Record<RoutineType, { selected: string; base: string; text: string }> = {
    Calistenia: {
      selected: 'bg-emerald-900/50 border-emerald-500',
      base: 'bg-slate-700/50 border-slate-600 hover:border-emerald-600 hover:bg-slate-700',
      text: 'text-emerald-400',
    },
    Gym: {
      selected: 'bg-amber-900/50 border-amber-500',
      base: 'bg-slate-700/50 border-slate-600 hover:border-amber-600 hover:bg-slate-700',
      text: 'text-amber-400',
    },
    Personalizado: {
      selected: 'bg-blue-900/50 border-blue-500',
      base: 'bg-slate-700/50 border-slate-600 hover:border-blue-600 hover:bg-slate-700',
      text: 'text-blue-400',
    }
};

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, initialProfile, initialRoutine, onCancel, startStep = 1, onSaveManualLog }) => {
  const [step, setStep] = useState(startStep);
  const [profile, setProfile] = useState<Omit<UserProfileType, 'id'> | null>(initialProfile || null);
  const [routine, setRoutine] = useState<RoutineType | null>(initialRoutine?.type || null);
  const [focus, setFocus] = useState<RoutineFocus | null>(initialRoutine?.focus || null);
  const [selectedExercises, setSelectedExercises] = useState<ExerciseName[]>(initialRoutine?.exercises || []);
  const [favoriteExercises, setFavoriteExercises] = useState<ExerciseName[]>(initialProfile?.favoriteExercises || []);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(
    initialProfile?.availableEquipment || [
      'Peso corporal (Sin equipo)',
      'Mancuernas',
      'Barra olímpica / Discos',
      'Barra de dominadas',
      'Paralelas / Anillas',
      'Banco de pesas',
      'Bandas elásticas',
    ]
  );
  const [filterOnlyCompatible, setFilterOnlyCompatible] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [suggestions, setSuggestions] = useState<ExerciseName[]>([]);
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [isRoutineBuilderOpen, setIsRoutineBuilderOpen] = useState(false);
  
  const [aiAssistMode, setAiAssistMode] = useState<'idle' | 'active' | 'manual'>('idle');

  const allPredefinedExercises = useMemo(() => {
    const allExercises = new Set<ExerciseName>();
    if (PREDEFINED_EXERCISES) {
      Object.values(PREDEFINED_EXERCISES).forEach(routineType => {
          if (routineType && routineType !== PREDEFINED_EXERCISES.Personalizado) {
              Object.values(routineType).forEach(focusExercises => {
                  if (Array.isArray(focusExercises)) {
                      focusExercises.forEach(ex => allExercises.add(ex));
                  }
              });
          }
      });
    }
    return Array.from(allExercises).sort();
  }, []);

  useEffect(() => {
    setStep(startStep);
    if(initialRoutine) {
      setAiAssistMode('manual');
    } else {
      setAiAssistMode('idle');
    }
  }, [startStep, initialRoutine]);
  
  useEffect(() => {
    if(initialProfile) {
        setProfile(initialProfile);
        setFavoriteExercises(initialProfile.favoriteExercises || []);
    }
    if(initialRoutine) {
      setRoutine(initialRoutine.type);
      setFocus(initialRoutine.focus);
      setSelectedExercises(initialRoutine.exercises || []);
    } else {
      setRoutine(null);
      setFocus(null);
      setSelectedExercises([]);
    }
  }, [initialProfile, initialRoutine]);

  const handleProfileSave = (savedProfile: Omit<UserProfileType, 'id'>) => {
    setProfile(savedProfile);
    setStep(2);
  };

  const handleRoutineSelect = (selectedRoutine: RoutineType) => {
    setRoutine(selectedRoutine);
    setFocus(null);
    setSelectedExercises([]);
  };

  const handleFocusSelect = (selectedFocus: RoutineFocus) => {
    setFocus(selectedFocus);
    setSelectedExercises([]);
  };
  
  const handleExerciseToggle = (exerciseName: ExerciseName) => {
    setSelectedExercises(prev => 
        prev.includes(exerciseName) 
            ? prev.filter(ex => ex !== exerciseName)
            : [...prev, exerciseName]
    );
  };

  const handleToggleFavorite = (exerciseName: ExerciseName) => {
    setFavoriteExercises(prev => {
        const isFavorite = prev.includes(exerciseName);
        if (isFavorite) {
            return prev.filter(ex => ex !== exerciseName);
        } else {
            return [...prev, exerciseName];
        }
    });
  };

  const handleNewExerciseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewExerciseName(value);

    if (value.trim().length > 1) {
        const filtered = allPredefinedExercises.filter(ex =>
            ex.toLowerCase().includes(value.toLowerCase()) && !selectedExercises.includes(ex)
        );
        setSuggestions(filtered.slice(0, 5));
    } else {
        setSuggestions([]);
    }
  };

  const handleSuggestionClick = (exerciseName: ExerciseName) => {
    handleExerciseToggle(exerciseName);
    setNewExerciseName('');
    setSuggestions([]);
  };

  const handleAddNewExercise = () => {
    const trimmedName = newExerciseName.trim();
    if (trimmedName && !selectedExercises.includes(trimmedName as ExerciseName)) {
      handleExerciseToggle(trimmedName as ExerciseName);
      setNewExerciseName('');
      setSuggestions([]);
    }
  };

  const handleContinueToStep3 = () => {
    if (routine && focus) {
        setStep(3);
    }
  }
  
  const handleRoutineBuilderComplete = (config: { trainingType: TrainingType, restSettings: RestSettings, goals: Goals }) => {
    if (profile && routine && focus) {
        onComplete(profile, routine, focus, selectedExercises, favoriteExercises, config, availableEquipment);
    }
    setIsRoutineBuilderOpen(false);
  };


  const handleFinish = () => {
    if (profile && routine && focus) {
      onComplete(profile, routine, focus, selectedExercises, favoriteExercises, undefined, availableEquipment);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setFocus(null);
  };
  
  const handleBackToStep2 = () => {
      setStep(2);
  }

  const focusOptions: RoutineFocus[] = ['Tren Superior', 'Tren Inferior', 'Core', 'Mixto'];

  const renderManualStep2 = () => (
    <>
      <div className="space-y-4">
        {routineOptions.map(option => {
          const isSelected = routine === option.name;
          const color = routineColors[option.name];
          return (
            <div key={option.name} className="transition-all duration-300">
              <button
                onClick={() => handleRoutineSelect(option.name)}
                className={`w-full p-6 rounded-lg border-2 transition-all duration-300 text-left ${isSelected ? color.selected : color.base}`}
              >
                <h3 className="font-bold text-lg text-white">{option.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{option.description}</p>
              </button>
              
              {isSelected && (
                <div key={`${option.name}-focus`} className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 animate-fade-in-up">
                  <h3 className="text-lg font-semibold text-slate-300 mb-4 text-center">Selecciona tu enfoque</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {focusOptions.map(f => (
                      <button
                        key={f}
                        onClick={() => handleFocusSelect(f)}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 text-center ${
                          focus === f
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsManualLogOpen(true)}
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          ¿Solo quieres registrar una sesión pasada?
        </button>
      </div>

      <div className="flex justify-center pt-6 gap-4">
        <button
          onClick={handleBackToStep1}
          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-8 rounded-lg transition-all"
        >
          &larr; Volver
        </button>
        <button
          onClick={handleContinueToStep3}
          disabled={!routine || !focus}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          Continuar &rarr;
        </button>
      </div>
    </>
  );

  return (
    <>
        <div className="fixed inset-0 bg-slate-900 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-slate-700 animate-fade-in-up flex flex-col">
            <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 pb-2 mb-4">
                {initialProfile ? 'Actualizar Configuración' : 'Crear Nuevo Perfil'}
            </h1>
            {initialProfile ? (
                <p className="text-slate-400 text-center">
                    Modifica tu perfil o cambia tu tipo de rutina.
                </p>
            ) : (
                <p className="text-slate-400 text-center">
                    Sigue los pasos para configurar tu cuenta.
                </p>
            )}
            </div>

            <div className="flex-grow overflow-y-auto -mr-4 pr-4 mt-8 scrollbar-hide">
            {step === 1 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 text-center">Paso 1: Tu Perfil</h2>
                    <UserProfile profile={profile} onSave={handleProfileSave} isWizardStep={true} onCancel={onCancel} />
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 text-center">Paso 2: Elige tu Rutina</h2>
                    {renderManualStep2()}
                </div>
            )}

            {step === 3 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-slate-200 mb-2 text-center">Paso 3: Equipamiento y Selección de Ejercicios</h2>
                    <p className="text-xs sm:text-sm text-slate-400 text-center mb-5">
                      Configura los elementos que tienes a mano para adaptar y elegir tu rutina.
                    </p>

                    {/* Selector y configuración de equipamiento disponible */}
                    <EquipmentSelector
                      selectedEquipment={availableEquipment}
                      onChange={setAvailableEquipment}
                      title="¿Con qué elementos cuentas para entrenar?"
                      subtitle="Elige mancuernas, barras, cuerda de saltar, máquinas en casa o peso corporal."
                    />

                    {/* Contenedor de selección de ejercicios */}
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
                          <div>
                            <h3 className="text-lg font-bold text-cyan-400">{routine} - {focus}</h3>
                            <p className="text-xs text-slate-400">
                              {selectedExercises.length} ejercicio{selectedExercises.length === 1 ? '' : 's'} seleccionado{selectedExercises.length === 1 ? '' : 's'}
                            </p>
                          </div>

                          {/* Filtro por compatibilidad con el equipamiento */}
                          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                            <button
                              type="button"
                              onClick={() => setFilterOnlyCompatible(false)}
                              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                                !filterOnlyCompatible
                                  ? 'bg-cyan-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterOnlyCompatible(true)}
                              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                                filterOnlyCompatible
                                  ? 'bg-cyan-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span>⚡ Solo con mi equipo</span>
                            </button>
                          </div>
                        </div>

                        {routine && focus ? (
                            (() => {
                                const predefined = PREDEFINED_EXERCISES[routine]?.[focus] || [];
                                const custom = selectedExercises.filter(ex => !predefined.includes(ex));
                                let allDisplayExercises = [...new Set([...predefined, ...custom])];
                                
                                const totalCount = allDisplayExercises.length;
                                const compatibleCount = allDisplayExercises.filter(ex => 
                                  canPerformExerciseWithEquipment(ex, availableEquipment)
                                ).length;

                                if (filterOnlyCompatible) {
                                  allDisplayExercises = allDisplayExercises.filter(ex => 
                                    canPerformExerciseWithEquipment(ex, availableEquipment)
                                  );
                                }

                                allDisplayExercises.sort((a, b) => {
                                    const aIsFavorite = favoriteExercises.includes(a);
                                    const bIsFavorite = favoriteExercises.includes(b);
                                    if (aIsFavorite && !bIsFavorite) return -1;
                                    if (!aIsFavorite && bIsFavorite) return 1;
                                    return a.localeCompare(b);
                                });

                                if (allDisplayExercises.length > 0) {
                                    return (
                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {allDisplayExercises.map(ex => {
                                                const isFavorite = favoriteExercises.includes(ex);
                                                const isCompatible = canPerformExerciseWithEquipment(ex, availableEquipment);
                                                const equipmentNeeded = getEquipmentForExercise(ex);

                                                return (
                                                    <div 
                                                      key={ex} 
                                                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md transition-colors gap-2 ${
                                                        selectedExercises.includes(ex)
                                                          ? 'bg-slate-800/90 border border-cyan-500/30'
                                                          : 'bg-slate-800/60 hover:bg-slate-800'
                                                      }`}
                                                    >
                                                        <div className="flex items-center flex-grow min-w-0">
                                                          <label className="flex items-center cursor-pointer min-w-0 flex-grow">
                                                              <input
                                                                  type="checkbox"
                                                                  checked={selectedExercises.includes(ex)}
                                                                  onChange={() => handleExerciseToggle(ex)}
                                                                  className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-emerald-500 focus:ring-emerald-500 flex-shrink-0"
                                                              />
                                                              <div className="ml-3 min-w-0">
                                                                <span className="text-sm font-medium text-slate-200 block truncate">{ex}</span>
                                                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                                  {equipmentNeeded.slice(0, 2).map((eqName) => (
                                                                    <span
                                                                      key={eqName}
                                                                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                                        availableEquipment.includes(eqName)
                                                                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                                                                          : 'bg-slate-700/60 text-slate-400 border border-slate-600/40'
                                                                      }`}
                                                                    >
                                                                      {eqName}
                                                                    </span>
                                                                  ))}
                                                                  {!isCompatible && (
                                                                    <span className="text-[10px] text-amber-400/90 italic">
                                                                      (Falta equipamiento)
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              </div>
                                                          </label>
                                                        </div>

                                                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                                          <button
                                                              type="button"
                                                              onClick={() => handleToggleFavorite(ex)}
                                                              className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-amber-400 hover:bg-slate-700' : 'text-slate-500 hover:text-amber-300 hover:bg-slate-700'}`}
                                                              aria-label={isFavorite ? `Quitar ${ex} de favoritos` : `Añadir ${ex} a favoritos`}
                                                          >
                                                              {isFavorite ? (
                                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                  </svg>
                                                              ) : (
                                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                  </svg>
                                                              )}
                                                          </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                } else {
                                    return (
                                      <div className="text-center py-6">
                                        <p className="text-slate-400 mb-2">
                                          {filterOnlyCompatible
                                            ? 'No se encontraron ejercicios compatibles con los elementos seleccionados.'
                                            : 'Añade tus propios ejercicios para esta rutina personalizada.'}
                                        </p>
                                        {filterOnlyCompatible && (
                                          <button
                                            type="button"
                                            onClick={() => setFilterOnlyCompatible(false)}
                                            className="text-xs text-cyan-400 hover:underline font-semibold"
                                          >
                                            Ver todos los ejercicios sin filtrar por equipamiento
                                          </button>
                                        )}
                                      </div>
                                    );
                                }
                            })()
                        ) : null}
                    </div>
                    
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-slate-300 mb-2">Añadir Ejercicio Personalizado</h3>
                        <div className="relative">
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newExerciseName}
                                    onChange={handleNewExerciseNameChange}
                                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                                    placeholder="Ej: Empieza a escribir 'Sentadilla'..."
                                    className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
                                    autoComplete="off"
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddNewExercise}
                                    className="flex-shrink-0 whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                    aria-label="Añadir ejercicio personalizado"
                                >
                                    Añadir
                                </button>
                            </div>
                            {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-slate-600 border border-slate-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg animate-fade-in">
                                    {suggestions.map(suggestion => (
                                        <li
                                            key={suggestion}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="px-4 py-2 cursor-pointer hover:bg-slate-500 text-sm text-slate-200"
                                        >
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {newExerciseName && (
                            <p className="text-xs text-amber-400 mt-2 animate-fade-in">
                                Verifica que el ejercicio que incluyes corresponda a la rutina y enfoque seleccionado.
                            </p>
                        )}
                    </div>

                    <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-center">
                        <h3 className="text-lg font-bold text-indigo-400 mb-2">¿Necesitas ayuda para configurar?</h3>
                        <p className="text-sm text-slate-400 mb-4">Usa el asistente de IA para establecer tus metas, descansos y tipo de entrenamiento de forma rápida.</p>
                        <button
                            onClick={() => setIsRoutineBuilderOpen(true)}
                            disabled={selectedExercises.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-all disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            <span>Configurar con Asistente IA</span>
                        </button>
                    </div>


                    <div className="flex justify-center pt-8 gap-4">
                        <button
                        onClick={handleBackToStep2}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-8 rounded-lg transition-all"
                        >
                        &larr; Volver
                        </button>
                        <button
                        onClick={handleFinish}
                        disabled={selectedExercises.length === 0}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                        {initialProfile ? 'Actualizar' : 'Finalizar Configuración'}
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
        </div>
        {isRoutineBuilderOpen && (
            <AIConversationAssistant
                selectedExercises={selectedExercises}
                onComplete={handleRoutineBuilderComplete}
                onCancel={() => setIsRoutineBuilderOpen(false)}
            />
        )}
        <ManualLogModal
            isOpen={isManualLogOpen}
            onClose={() => setIsManualLogOpen(false)}
            onSave={(newLogs) => {
                onSaveManualLog(profile, newLogs);
            }}
            userRoutine={initialRoutine} 
        />
    </>
  );
};

```

---

## Archivo: `components/UserProfile.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { UserProfile as UserProfileType } from '../types';

interface UserProfileProps {
  profile: UserProfileType | Omit<UserProfileType, 'id'> | null;
  onSave: (profileData: Omit<UserProfileType, 'id'>) => void;
  isWizardStep?: boolean;
  onCancel?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ profile, onSave, isWizardStep = false, onCancel }) => {
  const [isEditing, setIsEditing] = useState(!profile);
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<UserProfileType, 'id'>>({ name: '', age: 0, weight: 0, height: 0, restingHeartRate: 0 });

  useEffect(() => {
    if (profile) {
      const { id, ...data } = profile as any;
      setFormData(data);
      if(!isWizardStep) setIsEditing(false);
    } else {
      setFormData({ name: '', age: 0, weight: 0, height: 0, restingHeartRate: 0 });
      setIsEditing(true);
    }
  }, [profile, isWizardStep]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
        setFormData(prev => ({...prev, name: value}));
    } else {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    if(!isWizardStep) setIsEditing(false);
  };

  const hasProfile = profile && profile.age > 0 && profile.weight > 0;

  if (!isEditing && !hasProfile && !isWizardStep) {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 text-center">
            <h2 className="text-xl font-bold text-slate-300">Completa tu perfil</h2>
            <p className="text-slate-400 mt-2">Añade tus datos para obtener un seguimiento más personalizado.</p>
            <button
                onClick={() => setIsEditing(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-indigo-500/30"
            >
                Añadir Perfil
            </button>
        </div>
    )
  }

  return (
    <div className={`${isWizardStep ? '' : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-300">Perfil de Usuario</h2>
        {!isEditing && !isWizardStep ? (
          <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">Editar</button>
        ) : null}
      </div>

      {isEditing || isWizardStep ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-slate-300 mb-1">Edad</label>
              <input type="number" name="age" id="age" value={formData.age || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-1">Peso (Kg)</label>
              <input type="number" name="weight" id="weight" step="0.1" value={formData.weight || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-1">Altura (cm)</label>
              <input type="number" name="height" id="height" value={formData.height || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required />
            </div>
            <div>
              <label htmlFor="restingHeartRate" className="block text-sm font-medium text-slate-300 mb-1">FC Reposo</label>
              <input type="number" name="restingHeartRate" id="restingHeartRate" value={formData.restingHeartRate || ''} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" />
            </div>
          </div>
          {isWizardStep && (
            <div className="flex justify-center pt-4 gap-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-8 rounded-lg transition-all"
                    >
                        {isWizardStep ? 'Cancelar' : 'Volver'}
                    </button>
                )}
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all">Guardar y Continuar</button>
            </div>
          )}
          {!isWizardStep && (
            <div className="flex justify-end gap-4 pt-2">
                {profile && <button type="button" onClick={() => { if (profile) { const { id, ...data } = profile as any; setFormData(data); } setIsEditing(false); }} className="text-sm font-semibold text-slate-400 hover:text-slate-300">Cancelar</button>}
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all">Guardar Perfil</button>
            </div>
          )}
        </form>
      ) : (
        <div className="flex flex-row flex-wrap justify-between items-center gap-x-6 gap-y-2 animate-fade-in">
          <div className="text-center">
            <p className="text-xs text-slate-400">Edad</p>
            <p className="font-semibold text-lg">{profile?.age}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Peso</p>
            <p className="font-semibold text-lg">{profile?.weight} <span className="text-sm text-slate-400">Kg</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Altura</p>
            <p className="font-semibold text-lg">{profile?.height} <span className="text-sm text-slate-400">cm</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">FC Reposo</p>
            <p className="font-semibold text-lg">{profile?.restingHeartRate ? <>{profile.restingHeartRate} <span className="text-sm text-slate-400">PPM</span></> : 'N/A'}</p>
          </div>
          {profile?.availableEquipment && profile.availableEquipment.length > 0 && (
            <div className="w-full mt-3 pt-3 border-t border-slate-700/60">
              <button
                type="button"
                id="toggle-available-equipment-btn"
                onClick={() => setIsEquipmentOpen(!isEquipmentOpen)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-0.5 group focus:outline-none"
                aria-expanded={isEquipmentOpen}
              >
                <span className="font-medium text-slate-400 group-hover:text-slate-300">
                  Equipamiento disponible ({profile.availableEquipment.length})
                </span>
                <span className="flex items-center gap-1 text-[11px] text-cyan-400 group-hover:text-cyan-300 font-medium">
                  <span>{isEquipmentOpen ? 'Ocultar' : 'Ver'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isEquipmentOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {isEquipmentOpen && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 animate-fade-in">
                  {profile.availableEquipment.map(item => (
                    <span key={item} className="text-xs px-2 py-0.5 rounded bg-slate-700/80 text-cyan-300 border border-slate-600/70">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## Archivo: `components/SessionManager.tsx`

```typescript

```

---

## Archivo: `components/ExerciseCard.tsx`

```typescript
import React, { useState, FormEvent, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ExerciseLog, ExerciseGoal, ExerciseName, Cluster, ColorTheme, UserProfile, TrainingType } from '../types';
import { GoalProgress } from './GoalProgress';
import { HeartRateModal } from './HeartRateModal';
import { TimeScroller } from './TimeScroller';
import { isTimeBased as isTimeBasedUtil, isEffectivelyRepBased as isRepBasedUtil } from '../utils/exerciseUtils';
import { generateUUID } from '../utils/uuid';


interface ExerciseCardProps {
  exerciseName: ExerciseName;
  onCompleteExercise: (logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
  goal?: ExerciseGoal;
  progress?: { weight: number; reps: number; clusters: number; totalTime: number; heartRate?: number; };
  color: ColorTheme;
  userProfile: UserProfile | null;
  isCompletedToday: boolean;
  restBetweenSets: number;
  trainingType: TrainingType;
  isDisabled: boolean;
}

type LocalCluster = { id: string; weight: string; reps: string; time: number };

const formatSecondsToMMSS = (totalSeconds: number): string => {
    if (totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
        return '0:00';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
    exerciseName, 
    onCompleteExercise, 
    goal, 
    progress, 
    color, 
    userProfile, 
    isCompletedToday, 
    restBetweenSets,
    trainingType,
    isDisabled
}) => {
  const [clusters, setClusters] = useState<LocalCluster[]>([{ id: generateUUID(), weight: '', reps: '', time: 0 }]);
  const [timeSeries, setTimeSeries] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingLog, setPendingLog] = useState<Omit<ExerciseLog, 'id' | 'timestamp' | 'heartRate' | 'perceivedExertion'> | null>(null);
  
  const [viewMode, setViewMode] = useState<'form' | 'completed'>(isCompletedToday ? 'completed' : 'form');
  
  // Intra-set rest timer state
  const [isIntraSetResting, setIsIntraSetResting] = useState(false);
  const [intraSetRestTimeLeft, setIntraSetRestTimeLeft] = useState(0);
  const intraSetRestEndTimeRef = useRef<number | null>(null);

  const playRestCompleteChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {}
    }
  }, []);

  const isClusterMode = trainingType === 'Clúster';
  
  const isTimeBased = useMemo(() => isTimeBasedUtil(exerciseName), [exerciseName]);
  const isEffectivelyRepBased = useMemo(() => isRepBasedUtil(exerciseName, goal, trainingType), [exerciseName, goal, trainingType]);

  const lastCluster = useMemo(() => clusters.length > 0 ? clusters[clusters.length - 1] : null, [clusters]);

  const isAddSetDisabled = useMemo(() => {
    if (isClusterMode && clusters.length >= 5) {
        return true;
    }
    // Disable if the last cluster's reps are empty.
    if (lastCluster && lastCluster.reps.trim() === '') {
        return true;
    }
    return false;
  }, [isClusterMode, clusters.length, lastCluster]);

  const addSetDisabledTitle = useMemo(() => {
    if (isClusterMode && clusters.length >= 5) {
        return 'Máximo 5 clústeres por set';
    }
    if (lastCluster && lastCluster.reps.trim() === '') {
        return 'Completa las repeticiones para añadir otra serie';
    }
    return '';
  }, [isClusterMode, clusters.length, lastCluster]);


  useEffect(() => {
    setViewMode(isCompletedToday ? 'completed' : 'form');
  }, [isCompletedToday]);

  
  // Wall-clock timestamp driven intra-set countdown timer (survives phone screen lock and sleep)
  useEffect(() => {
    if (!isIntraSetResting || !intraSetRestEndTimeRef.current) {
      return;
    }

    const updateTimer = () => {
      if (!intraSetRestEndTimeRef.current) return;
      const remainingMs = intraSetRestEndTimeRef.current - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      setIntraSetRestTimeLeft(remainingSecs);

      if (remainingSecs <= 0) {
        intraSetRestEndTimeRef.current = null;
        setIsIntraSetResting(false);
        playRestCompleteChime();
      }
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 250);

    const handleVisibilityOrFocus = () => {
      updateTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);

    let wakeLockSentinel: any = null;
    if ('wakeLock' in navigator && typeof (navigator as any).wakeLock?.request === 'function') {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLockSentinel = lock;
      }).catch(() => {});
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isIntraSetResting, playRestCompleteChime]);

  const currentVolume = useMemo(() => {
    if (isTimeBased || isEffectivelyRepBased) return 0;
    return clusters.reduce((total, cluster) => {
      const weight = parseFloat(cluster.weight);
      const reps = parseInt(cluster.reps, 10);
      if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
        return total + (weight * reps);
      }
      return total;
    }, 0);
  }, [clusters, isTimeBased, isEffectivelyRepBased]);
  
  const currentTotalReps = useMemo(() => {
    if (!isEffectivelyRepBased) return 0;
     return clusters.reduce((total, cluster) => {
        const reps = parseInt(cluster.reps, 10);
        return total + (isNaN(reps) ? 0 : reps);
    }, 0);
  }, [clusters, isEffectivelyRepBased]);

  const currentTotalTime = useMemo(() => {
    if (!isTimeBased) return 0;
     return timeSeries.reduce((total, time) => total + time, 0);
  }, [timeSeries, isTimeBased]);

  const nextClusterGoal = useMemo(() => {
    if (!isClusterMode || !goal?.clusterGoals || goal.clusterGoals.length === 0) {
        return null;
    }
    // The index of the goal corresponds to the cluster row being filled.
    // If there's 1 row (index 0), we're aiming for the goal at index 0.
    const currentClusterIndex = clusters.length - 1;
    
    if (currentClusterIndex < goal.clusterGoals.length) {
        const clusterGoal = goal.clusterGoals[currentClusterIndex];
        // Only show if the goal has values
        if (clusterGoal && (clusterGoal.reps > 0 || clusterGoal.weight > 0)) {
            return clusterGoal;
        }
    }

    return null;
  }, [isClusterMode, goal, clusters]);

  const handleTextChange = (id: string, field: 'weight' | 'reps', value: string) => {
    setClusters(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };
  
  const addWeightRepCluster = () => {
    if (isAddSetDisabled) {
      return;
    }
    setClusters(prev => [...prev, { id: generateUUID(), weight: '', reps: '', time: 0 }]);
    if (restBetweenSets > 0) {
        intraSetRestEndTimeRef.current = Date.now() + restBetweenSets * 1000;
        setIntraSetRestTimeLeft(restBetweenSets);
        setIsIntraSetResting(true);
    }
  };

  const removeWeightRepCluster = (id: string) => {
    if (clusters.length > 1) {
      setClusters(prev => prev.filter(c => c.id !== id));
    }
  };

  const addTimeSeries = () => {
    if (currentTime > 0) {
        setTimeSeries(prev => [...prev, currentTime]);
        setCurrentTime(0);
        if (restBetweenSets > 0) {
            intraSetRestEndTimeRef.current = Date.now() + restBetweenSets * 1000;
            setIntraSetRestTimeLeft(restBetweenSets);
            setIsIntraSetResting(true);
        }
    }
  };

  const removeTimeSeries = (indexToRemove: number) => {
      setTimeSeries(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedClusters: Cluster[] = [];

    if (isTimeBased) {
        parsedClusters = timeSeries.map(time => ({ weight: 0, reps: 0, time }));
        if (parsedClusters.length === 0) {
            setError(`Debes registrar al menos una serie de ${isClusterMode ? 'clúster' : 'plancha'}.`);
            return;
        }
    } else if (isEffectivelyRepBased) {
        for (const cluster of clusters) {
            const parsedReps = parseInt(cluster.reps, 10);
            if (isNaN(parsedReps) || parsedReps <= 0) {
                setError('Por favor, ingresa un número de repeticiones válido y positivo.');
                return;
            }
            parsedClusters.push({ weight: 0, reps: parsedReps });
        }
    } else {
        for (const cluster of clusters) {
            const parsedWeight = parseFloat(cluster.weight);
            const parsedReps = parseInt(cluster.reps, 10);

            if (isNaN(parsedWeight) || isNaN(parsedReps) || parsedWeight < 0 || parsedReps <= 0) {
                setError('Por favor, ingresa valores válidos y positivos en todas las series.');
                return;
            }
            parsedClusters.push({ weight: parsedWeight, reps: parsedReps });
        }
    }

    if (parsedClusters.length === 0) {
      setError(`Debes registrar al menos un${isClusterMode ? ' clúster' : 'a serie'}.`);
      return;
    }

    setPendingLog({
      exerciseName,
      clusters: parsedClusters,
    });
    setIsModalOpen(true);
  };

  const handleFinalizeLog = (heartRate?: number, perceivedExertion?: number) => {
    if (pendingLog) {
      const finalLog = { 
        ...pendingLog, 
        ...(heartRate && { heartRate }),
        ...(perceivedExertion && { perceivedExertion })
      };
      onCompleteExercise(finalLog);
    }
    // Reset forms
    setClusters([{ id: generateUUID(), weight: '', reps: '', time: 0 }]);
    setTimeSeries([]);
    setCurrentTime(0);

    setIsModalOpen(false);
    setPendingLog(null);
    setViewMode('completed');
  };
  
  const handleSkipIntraSetRest = useCallback(() => {
    intraSetRestEndTimeRef.current = null;
    setIsIntraSetResting(false);
    setIntraSetRestTimeLeft(0);
  }, []);

  const renderIntraSetRestTimer = () => {
    if (!isIntraSetResting) return null;
    return (
        <div className="my-2 text-center p-3 bg-slate-900 rounded-lg border border-cyan-500/50 animate-fade-in">
            <p className="text-sm font-bold text-cyan-400">¡Descanso {isClusterMode ? 'entre clústeres' : ''}!</p>
            <p className="text-4xl font-mono font-bold text-white my-1">
                {formatSecondsToMMSS(intraSetRestTimeLeft)}
            </p>
            <button type="button" onClick={handleSkipIntraSetRest} className="text-xs text-slate-400 hover:text-white">Omitir</button>
        </div>
    );
  };


  const renderFeedback = () => {
      if (isTimeBased) {
        if (!goal?.totalTime || goal.totalTime <= 0 || currentTotalTime === 0) {
            return null;
        }
        const difference = currentTotalTime - goal.totalTime;

        if (difference > 0) {
            return <p className="text-amber-400 text-xs font-semibold animate-pulse">Tiempo excedido: +{difference}s</p>;
        }
        if (difference < 0) {
            return <p className="text-slate-400 text-xs">Tiempo no alcanzado: {difference}s</p>;
        }
        return <p className="text-green-400 text-xs font-semibold">¡Meta de tiempo alcanzada!</p>;
      }
      
      if (isEffectivelyRepBased) {
        const goalTotalReps = (goal?.reps || 0) * (goal?.series || 0);
        if (!goalTotalReps || goalTotalReps <= 0 || currentTotalReps === 0) {
            return null;
        }
        const difference = currentTotalReps - goalTotalReps;

        if (difference > 0) {
            return <p className="text-amber-400 text-xs font-semibold animate-pulse">Reps excedidas: +{difference}</p>;
        }
        if (difference < 0) {
            return <p className="text-slate-400 text-xs">Reps no alcanzadas: {difference}</p>;
        }
        return <p className="text-green-400 text-xs font-semibold">¡Meta de repeticiones alcanzada!</p>;
      }

      // Volume-based feedback
      const goalTotalVolume = trainingType === 'Clúster' && goal?.clusterGoals 
        ? goal.clusterGoals.reduce((sum, cg) => sum + (cg.weight * (cg.reps || 0)), 0)
        : (goal?.weight || 0) * (goal?.reps || 0) * (goal?.series || 0);

      if (!goalTotalVolume || goalTotalVolume <= 0 || currentVolume === 0) {
        return null;
      }
      const difference = currentVolume - goalTotalVolume;
      if (difference > 0) {
        return <p className="text-amber-400 text-xs font-semibold animate-pulse">Volumen excedido: +{difference.toLocaleString()}kg</p>;
      }
      if (difference < 0) {
        return <p className="text-slate-400 text-xs">Volumen no alcanzado: {difference.toLocaleString()}kg</p>;
      }
      return <p className="text-green-400 text-xs font-semibold">¡Meta de volumen alcanzada!</p>;
  };

  const renderTimeBasedForm = () => (
    <>
        <div className="space-y-1 mb-2 flex-grow">
            {timeSeries.map((time, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-md animate-fade-in">
                    <span className="text-slate-300 text-sm">Serie {index + 1}: <span className="font-mono font-bold text-white">{formatSecondsToMMSS(time)}</span></span>
                    <button type="button" onClick={() => removeTimeSeries(index)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            ))}
            {timeSeries.length === 0 && <p className="text-slate-500 text-center text-xs py-4">Añade tu primera serie de plancha.</p>}
        </div>
        {renderIntraSetRestTimer()}
        <div className="mb-2">
            <label className="block text-xs font-medium text-slate-300 mb-1 text-center">Añadir Tiempo de Serie</label>
            <TimeScroller value={currentTime} onChange={setCurrentTime} color={color} />
        </div>
        <button type="button" onClick={addTimeSeries} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium text-sm py-2 px-4 rounded-lg transition-colors duration-300">
            Añadir Serie
        </button>
    </>
  );

  const renderWeightRepForm = () => (
     <>
        <div className="space-y-1 flex-grow">
            {clusters.map((cluster, index) => (
            <div key={cluster.id} className="flex items-center gap-2 p-1.5 bg-slate-900/50 rounded-md">
                <span className="text-slate-400 font-bold text-sm pr-1">{isClusterMode ? 'Clúster ' : ''}{index + 1}</span>
                <div className="flex-1">
                    {isEffectivelyRepBased ? (
                        <div>
                        <label htmlFor={`reps-${cluster.id}`} className="sr-only">Reps</label>
                        <input
                            type="number"
                            id={`reps-${cluster.id}`}
                            value={cluster.reps}
                            onChange={(e) => handleTextChange(cluster.id, 'reps', e.target.value)}
                            placeholder="Reps"
                            min="1"
                            className={`w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
                            required
                        />
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                            <label htmlFor={`weight-${cluster.id}`} className="sr-only">Peso (Kg)</label>
                            <input
                                type="number"
                                id={`weight-${cluster.id}`}
                                value={cluster.weight}
                                onChange={(e) => handleTextChange(cluster.id, 'weight', e.target.value)}
                                placeholder="Kg"
                                min="0"
                                step="0.1"
                                className={`w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
                                required
                            />
                            </div>
                            <div className="flex-1">
                            <label htmlFor={`reps-${cluster.id}`} className="sr-only">Reps</label>
                            <input
                                type="number"
                                id={`reps-${cluster.id}`}
                                value={cluster.reps}
                                onChange={(e) => handleTextChange(cluster.id, 'reps', e.target.value)}
                                placeholder="Reps"
                                min="1"
                                className={`w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-sm text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
                                required
                            />
                            </div>
                        </div>
                    )}
                </div>
                <button type="button" onClick={() => removeWeightRepCluster(cluster.id)} disabled={clusters.length <= 1} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50 disabled:hover:text-slate-400 transition-colors self-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                </button>
            </div>
            ))}
        </div>
        {renderIntraSetRestTimer()}
        {nextClusterGoal && (
            <div className="text-center text-sm text-slate-300 my-3 p-3 bg-slate-900 rounded-lg border border-slate-700 animate-fade-in">
                <span>Objetivo del Clúster: </span>
                <span className="font-bold text-amber-400">{nextClusterGoal.reps} reps</span>
                <span className="text-slate-400"> con </span>
                <span className="font-bold text-amber-400">{nextClusterGoal.weight} kg</span>
            </div>
        )}
        <button 
            type="button" 
            onClick={addWeightRepCluster} 
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium text-xs py-1.5 px-4 rounded-lg transition-colors duration-300 mt-1 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
            disabled={isAddSetDisabled}
            title={addSetDisabledTitle}
        >
            {isClusterMode ? 'Añadir Clúster' : 'Añadir Serie'}
        </button>
     </>
  );

  return (
    <>
      <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-4 flex flex-col h-full transform transition-all duration-300 ${isDisabled ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02]'}`}>
        <fieldset disabled={isDisabled} className="contents">
            <h2 className={`text-xl font-bold ${color.text} mb-3`}>{exerciseName}</h2>
            
            {goal && progress && <GoalProgress goal={goal} progress={progress} isTimeBased={isTimeBased} isRepBased={isEffectivelyRepBased} trainingType={trainingType} />}
            
            {viewMode === 'form' ? (
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col animate-fade-in">
                    <div className="flex-grow flex flex-col">
                        {isTimeBased ? renderTimeBasedForm() : renderWeightRepForm()}
                    </div>
                    <div className="mt-4 space-y-3">
                        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                        <div className="min-h-[1.25rem] text-center">{renderFeedback()}</div>
                        <button type="submit" className={`w-full ${color.bg} ${color.hoverBg} text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-md ${color.shadow}`}>
                            {isClusterMode ? 'Registrar Clúster Set' : 'Registrar Entrenamiento'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col items-center justify-center flex-grow py-8 animate-fade-in text-center">
                    <div className="bg-emerald-500/10 p-3 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-200">Entrenamiento Registrado</h3>
                    <p className="text-slate-400 text-sm mb-6">¡Buen trabajo!</p>
                    <button 
                        onClick={() => setViewMode('form')}
                        className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        Editar Entrenamiento
                    </button>
                </div>
            )}
        </fieldset>
      </div>
      <HeartRateModal
        isOpen={isModalOpen}
        onClose={() => handleFinalizeLog()}
        onSave={handleFinalizeLog}
        exerciseName={exerciseName}
        color={color}
        userProfile={userProfile}
      />
    </>
  );
};
```

---

## Archivo: `components/ExerciseProgressChart.tsx`

```typescript

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
}

interface ExerciseProgressChartProps {
  data: ChartDataPoint[];
}

export const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({ data }) => {

  if (data.length < 2) {
    return <p className="text-center text-slate-500 text-sm py-4">Se necesitan al menos dos sesiones para mostrar el progreso.</p>;
  }

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg">
        <h3 className="text-md font-semibold text-slate-300 mb-4">Evolución del Ejercicio</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                    yAxisId="left" 
                    stroke="#38bdf8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: 'Volumen (kg)', angle: -90, position: 'insideLeft', fill: '#9ca3af', dy: 40 }}
                />
                <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#fbbf24" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: 'Peso Máx (kg)', angle: 90, position: 'insideRight', fill: '#9ca3af', dy: -40 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#d1d5db' }}
                />
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Line
                    yAxisId="left"
                    name="Volumen Total"
                    key="totalVolume"
                    type="monotone"
                    dataKey="totalVolume"
                    stroke="#38bdf8" // cyan
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#38bdf8' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                />
                <Line
                    yAxisId="right"
                    name="Peso Máximo"
                    key="maxWeight"
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#fbbf24" // amber
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#fbbf24' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

```

---

## Archivo: `components/ExerciseHistoryDetail.tsx`

```typescript

import React, { useMemo } from 'react';
import type { ExerciseLog, ExerciseName } from '../types';
import { ExerciseProgressChart } from './ExerciseProgressChart';

interface ExerciseHistoryDetailProps {
    exerciseName: ExerciseName;
    allLogs: ExerciseLog[];
    onBack: () => void;
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const ExerciseHistoryDetail: React.FC<ExerciseHistoryDetailProps> = ({ exerciseName, allLogs, onBack }) => {

    const { exerciseLogs, chartData, stats, sessions } = useMemo(() => {
        const filteredLogs = allLogs.filter(log => log.exerciseName === exerciseName)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let maxWeight = 0;
        let maxVolume = 0;

        const sessionsMap: Record<string, { totalVolume: number, maxWeight: number, clusters: {weight: number, reps: number, time?: number}[], RPEs: number[] }> = {};

        filteredLogs.forEach(log => {
            const dateKey = formatDate(log.timestamp);
            if (!sessionsMap[dateKey]) {
                sessionsMap[dateKey] = { totalVolume: 0, maxWeight: 0, clusters: [], RPEs: [] };
            }
            
            if (log.perceivedExertion) {
                sessionsMap[dateKey].RPEs.push(log.perceivedExertion);
            }

            log.clusters.forEach(cluster => {
                const volume = cluster.weight * cluster.reps;
                sessionsMap[dateKey].totalVolume += volume;
                sessionsMap[dateKey].maxWeight = Math.max(sessionsMap[dateKey].maxWeight, cluster.weight);
                sessionsMap[dateKey].clusters.push(cluster);

                maxWeight = Math.max(maxWeight, cluster.weight);
            });
        });

        const chartDataPoints = Object.entries(sessionsMap).map(([date, data]) => {
            maxVolume = Math.max(maxVolume, data.totalVolume);
            return {
                date: new Date(filteredLogs.find(l => formatDate(l.timestamp) === date)!.timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                timestamp: new Date(filteredLogs.find(l => formatDate(l.timestamp) === date)!.timestamp).getTime(),
                maxWeight: data.maxWeight,
                totalVolume: data.totalVolume
            };
        }).sort((a,b) => a.timestamp - b.timestamp);

        const sessionEntries = Object.entries(sessionsMap)
            .map(([date, data]) => ({
                date,
                timestamp: new Date(filteredLogs.find(l => formatDate(l.timestamp) === date)!.timestamp).getTime(),
                ...data
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // Sort sessions descending for display

        return {
            exerciseLogs: filteredLogs,
            chartData: chartDataPoints,
            stats: { maxWeight, maxVolume, totalSessions: Object.keys(sessionsMap).length },
            sessions: sessionEntries
        };
    }, [allLogs, exerciseName]);

    if (exerciseLogs.length === 0) {
        return (
            <div className="text-center bg-slate-800/50 p-8 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-300">No hay datos para {exerciseName}.</h3>
                <button onClick={onBack} className="mt-4 text-cyan-400 hover:text-cyan-300">Volver al historial</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-200">Progreso de:</h2>
                    <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">{exerciseName}</p>
                </div>
                 <button 
                    onClick={onBack} 
                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
                    aria-label="Volver al historial"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Volver</span>
                </button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-300 mb-4 text-center">Récords Personales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-400">Peso Máximo (PR)</p>
                        <p className="text-2xl font-bold text-cyan-400">{stats.maxWeight.toLocaleString('es-ES')} <span className="text-lg text-slate-400">kg</span></p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Máximo Volumen / Sesión</p>
                        <p className="text-2xl font-bold text-cyan-400">{stats.maxVolume.toLocaleString('es-ES')} <span className="text-lg text-slate-400">kg</span></p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Total Sesiones</p>
                        <p className="text-2xl font-bold text-cyan-400">{stats.totalSessions}</p>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <ExerciseProgressChart data={chartData} />
            </div>

             <div>
                <h2 className="text-2xl font-bold text-slate-200 mb-4">Historial de Sesiones</h2>
                <div className="space-y-4">
                    {sessions.map(session => {
                        const avgRPE = session.RPEs.length > 0
                            ? (session.RPEs.reduce((a, b) => a + b, 0) / session.RPEs.length).toFixed(1)
                            : null;

                        return (
                            <div key={session.date} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <h3 className="font-bold text-cyan-400">{session.date}</h3>
                                <div className="mt-2 text-sm text-slate-300 space-y-1">
                                    {session.clusters.map((cluster, index) => (
                                         <p key={index} className="pl-2">
                                            <span className="text-slate-500">{index + 1}. </span>
                                            {cluster.time ? (
                                                `Tiempo: ${cluster.time}s`
                                            ) : (
                                                ` ${cluster.weight} kg x ${cluster.reps} reps`
                                            )}
                                        </p>
                                    ))}
                                </div>
                                <div className="mt-3 pt-2 border-t border-slate-700 text-xs text-center text-slate-400 flex flex-wrap justify-center items-center gap-x-2">
                                    <span>Volumen: <span className="font-semibold text-white">{session.totalVolume.toLocaleString()} kg</span></span>
                                    <span className="mx-2 hidden sm:inline">|</span>
                                    <span>Peso Máx: <span className="font-semibold text-white">{session.maxWeight.toLocaleString()} kg</span></span>
                                    {avgRPE && (
                                        <>
                                            <span className="mx-2 hidden sm:inline">|</span>
                                            <span>RPE Medio: <span className="font-semibold text-white">{avgRPE}/10</span></span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
```

---

## Archivo: `components/HistoryScreen.tsx`

```typescript

import React, { useState } from 'react';
import { HistoryLog } from './HistoryLog';
import { ManualLogModal } from './ManualLogModal';
import type { ExerciseLog, Goals, UserProfile, UserRoutine, ExerciseName } from '../types';
import { ExerciseHistoryDetail } from './ExerciseHistoryDetail';

interface HistoryScreenProps {
  logs: ExerciseLog[];
  goals: Goals;
  userProfile: UserProfile | null;
  userRoutine: UserRoutine | null;
  onDelete: (logIdsToDelete: string[]) => void;
  onAddLogs: (logs: ExerciseLog[]) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ logs, goals, userProfile, userRoutine, onDelete, onAddLogs }) => {
  const [isManualLogModalOpen, setManualLogModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseName | null>(null);

  if (selectedExercise) {
    return (
      <ExerciseHistoryDetail
        exerciseName={selectedExercise}
        allLogs={logs}
        onBack={() => setSelectedExercise(null)}
      />
    );
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      <HistoryLog 
        logs={logs} 
        goals={goals} 
        userProfile={userProfile} 
        onDelete={onDelete} 
        onOpenManualLog={() => setManualLogModalOpen(true)}
        onSelectExercise={(ex) => setSelectedExercise(ex)}
      />
      <ManualLogModal 
        isOpen={isManualLogModalOpen}
        onClose={() => setManualLogModalOpen(false)}
        onSave={(newLogs) => {
            onAddLogs(newLogs);
            setManualLogModalOpen(false);
        }}
        userRoutine={userRoutine}
      />
    </div>
  );
};
```

---

## Archivo: `components/HistoryLog.tsx`

```typescript
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { ExerciseLog, Goals, UserProfile, ExerciseName, Cluster } from '../types';
import { ProgressChart } from './ProgressChart';
import { DeleteModal } from './DeleteModal';
import { generateHistoryPdf } from '../services/pdfGenerator';
import { AIAnalysisCard } from './AIAnalysisCard';

interface HistoryLogProps {
  logs: ExerciseLog[];
  goals: Goals;
  userProfile: UserProfile | null;
  onDelete: (logIdsToDelete: string[]) => void;
  onOpenManualLog: () => void;
  onSelectExercise: (exercise: ExerciseName) => void;
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatTotalHoursMinutes = (milliseconds: number): string => {
    if (isNaN(milliseconds) || milliseconds < 0) return '0 horas, 0 min';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    return `${hours} horas, ${minutes} min`;
};

const formatSessionDuration = (milliseconds: number): string => {
    if (isNaN(milliseconds) || milliseconds < 0) return 'N/A';
    if (milliseconds < 60000) return '< 1 min';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);
    
    return parts.join(' ');
};


export const HistoryLog: React.FC<HistoryLogProps> = ({ logs, goals, userProfile, onDelete, onOpenManualLog, onSelectExercise }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
    const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
    
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const { logsBySession, sortedSessionKeys, uniqueExercises } = useMemo(() => {
        const grouped: Record<string, ExerciseLog[]> = {};
        const exercises = new Set<ExerciseName>();
        logs.forEach(log => {
            const dateKey = formatDate(log.timestamp);
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(log);
            exercises.add(log.exerciseName);
        });
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
             // We need to find the original timestamp to sort correctly
            const dateA = new Date(logs.find(log => formatDate(log.timestamp) === a)?.timestamp || 0).getTime();
            const dateB = new Date(logs.find(log => formatDate(log.timestamp) === b)?.timestamp || 0).getTime();
            return dateB - dateA;
        });
        return { logsBySession: grouped, sortedSessionKeys: sortedKeys, uniqueExercises: Array.from(exercises).sort() };
    }, [logs]);

    const generateSummary = useCallback(async () => {
        if (!userProfile || sortedSessionKeys.length === 0) {
            return;
        }

        setIsGeneratingSummary(true);
        setSummaryError(null);

        try {
            const latestSessionKey = sortedSessionKeys[0];
            const sessionLogs = logsBySession[latestSessionKey];
            if (!sessionLogs || sessionLogs.length === 0) {
                setIsGeneratingSummary(false);
                return;
            }

            const res = await fetch('/api/gemini/analyze-workout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userProfile, sessionLogs }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data.summary) {
                setAiSummary(data.summary);
            } else {
                throw new Error("Respuesta vacía del servidor.");
            }
        } catch (err) {
            console.error("Error al obtener análisis de IA:", err);
            // Si hay algún problema de conexión, generar resumen de cortesía con el volumen alcanzado
            const latestSessionKey = sortedSessionKeys[0];
            const sessionLogs = logsBySession[latestSessionKey] || [];
            let totalVolume = 0;
            sessionLogs.forEach(l => {
                (l.clusters || []).forEach(c => {
                    totalVolume += (c.weight || 0) * (c.reps || 0);
                });
            });
            const volumeStr = totalVolume > 0 ? ` con un volumen total de **${totalVolume.toLocaleString('es-ES')} kg**` : '';
            setAiSummary(`¡Excelente entrenamiento completado, **${userProfile.name}**! Registraste con éxito ${sessionLogs.length} ejercicios${volumeStr}. Mantén la constancia e hidrátate adecuadamente para una recuperación óptima.`);
        } finally {
            setIsGeneratingSummary(false);
        }
    }, [userProfile, sortedSessionKeys, logsBySession]);

    useEffect(() => {
        if (logs.length > 0) {
            generateSummary();
        }
    }, [logs, generateSummary]);

    const generalStats = useMemo(() => {
        const totalSessions = sortedSessionKeys.length;
        
        const totalDurationMs = sortedSessionKeys.reduce((total, key) => {
            const sessionLogs = logsBySession[key];
            if (sessionLogs.length > 1) {
                const timestamps = sessionLogs.map(log => new Date(log.timestamp).getTime());
                const sessionStart = Math.min(...timestamps);
                const sessionEnd = Math.max(...timestamps);
                return total + (sessionEnd - sessionStart);
            }
            return total;
        }, 0);

        const totalVolume = logs.reduce((total, log) => {
            return total + log.clusters.reduce((clusterTotal, c) => clusterTotal + (c.weight * c.reps), 0);
        }, 0);

        return {
            totalSessions,
            totalDuration: formatTotalHoursMinutes(totalDurationMs),
            totalVolume: totalVolume.toLocaleString('es-ES'),
        };
    }, [logs, logsBySession, sortedSessionKeys]);
    
    const handleToggleExpand = (sessionKey: string) => {
        setExpandedSessions(prev =>
            prev.includes(sessionKey)
                ? prev.filter(key => key !== sessionKey)
                : [...prev, sessionKey]
        );
    };

    const handleToggleSelection = (sessionKey: string) => {
        setSelectedSessions(prev =>
            prev.includes(sessionKey)
                ? prev.filter(key => key !== sessionKey)
                : [...prev, sessionKey]
        );
    };

    const handleSelectAll = () => {
        setSelectedSessions(sortedSessionKeys);
    };

    const handleDeselectAll = () => {
        setSelectedSessions([]);
    };
    
    const handleDownloadPdf = () => {
        if (selectedSessions.length === 0) return;

        const logsToExport = logs.filter(log =>
            selectedSessions.includes(formatDate(log.timestamp))
        );

        generateHistoryPdf(logsToExport, goals, userProfile, selectedSessions);
    };

    if (logs.length === 0) {
        return (
            <div className="text-center bg-slate-800/50 p-8 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-300">No hay historial de entrenamiento.</h3>
                <p className="text-slate-400 mt-2">Completa una sesión para ver tus registros aquí.</p>
                 <button 
                    onClick={onOpenManualLog}
                    className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg transition-colors mx-auto"
                    aria-label="Registrar una sesión pasada"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Registrar Primera Sesión
                </button>
            </div>
        );
    }
    
    return (
        <>
            <AIAnalysisCard
                summary={aiSummary}
                isLoading={isGeneratingSummary}
                error={summaryError}
                onRetry={generateSummary}
            />

            <div className="mb-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-300 mb-4 text-center">Estadísticas Generales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-400">Horas Totales de Entrenamiento</p>
                        <p className="text-2xl font-bold text-cyan-400">{generalStats.totalDuration}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Sesiones Registradas</p>
                        <p className="text-2xl font-bold text-cyan-400">{generalStats.totalSessions}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Volumen Total Levantado</p>
                        <p className="text-2xl font-bold text-cyan-400">{generalStats.totalVolume} <span className="text-lg text-slate-400">kg</span></p>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <ProgressChart logs={logs} selectedSessionKeys={selectedSessions} />
            </div>
            
            <div className="mb-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 space-y-4">
                 <div>
                    <h3 className="text-xl font-bold text-slate-300">Análisis y Exportación</h3>
                    <p className="text-sm text-slate-400 mt-1">Selecciona un ejercicio para ver su progreso o exporta tus sesiones a PDF.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="exercise-progress-select" className="block text-sm font-medium text-slate-300 mb-1">Ver progreso por ejercicio</label>
                        <select
                          id="exercise-progress-select"
                          onChange={(e) => onSelectExercise(e.target.value as ExerciseName)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="">-- Elige un ejercicio --</option>
                          {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-300 mb-1">Exportar sesiones a PDF</label>
                        <button
                            onClick={handleDownloadPdf}
                            disabled={selectedSessions.length === 0}
                            className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                            title="Descargar PDF de sesiones seleccionadas"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Descargar PDF ({selectedSessions.length})</span>
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-slate-300">{selectedSessions.length} de {sortedSessionKeys.length} sesión(es) para PDF</span>
                    <div className="space-x-4">
                        <button onClick={handleSelectAll} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Seleccionar todo</button>
                        <button onClick={handleDeselectAll} className="text-xs font-semibold text-slate-400 hover:text-slate-300">Deseccionar todo</button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-slate-200">Registros de Sesiones</h2>
                <div className="flex items-center gap-2 sm:gap-4">
                     <button 
                        onClick={onOpenManualLog}
                        className="flex items-center gap-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg transition-colors"
                        aria-label="Registrar una sesión pasada"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <span>Registrar Sesión Pasada</span>
                    </button>
                    <button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="p-2.5 bg-slate-700 hover:bg-slate-600 text-rose-400 rounded-lg transition-colors duration-300"
                        aria-label="Borrar registros del historial"
                        title="Borrar registros"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {sortedSessionKeys.map(sessionKey => {
                    const isExpanded = expandedSessions.includes(sessionKey);

                    const sessionLogs = logsBySession[sessionKey];
                    const totalExercises = new Set(sessionLogs.map(log => log.exerciseName)).size;
                    const totalSessionVolume = sessionLogs.reduce((total, log) => total + log.clusters.reduce((clusterTotal, c) => clusterTotal + (c.weight * c.reps), 0), 0);
                    const totalSessionReps = sessionLogs.reduce((total, log) => total + log.clusters.reduce((clusterTotal, c) => clusterTotal + c.reps, 0), 0);
                    
                    let sessionDuration = 'N/A';
                    if (sessionLogs.length > 1) {
                        const timestamps = sessionLogs.map(log => new Date(log.timestamp).getTime());
                        const sessionStart = Math.min(...timestamps);
                        const sessionEnd = Math.max(...timestamps);
                        sessionDuration = formatSessionDuration(sessionEnd - sessionStart);
                    }

                    return (
                        <div key={sessionKey} className={`bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-xl shadow-lg transition-all duration-300 ${selectedSessions.includes(sessionKey) ? 'border-cyan-500 bg-slate-800' : ''}`}>
                            <div className="flex justify-between items-center p-6">
                                <div>
                                    <h3 className="text-lg font-bold text-cyan-400">{sessionKey}</h3>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <button
                                        onClick={() => handleToggleExpand(sessionKey)}
                                        className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                                        aria-expanded={isExpanded}
                                        aria-controls={`session-details-${sessionKey.replace(/\s/g, '-')}`}
                                    >
                                        {isExpanded ? 'Ocultar' : 'Ver Detalle'}
                                    </button>
                                    <input
                                        type="checkbox"
                                        checked={selectedSessions.includes(sessionKey)}
                                        onChange={() => handleToggleSelection(sessionKey)}
                                        className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-800 cursor-pointer"
                                        aria-label={`Seleccionar sesión del ${sessionKey}`}
                                    />
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div id={`session-details-${sessionKey.replace(/\s/g, '-')}`} className="px-6 pb-6 animate-fade-in">
                                    
                                    <div>
                                        <h4 className="font-semibold text-slate-300 mb-2 text-center">Resumen de la Sesión</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-slate-400">Volumen Total</p>
                                                <p className="font-bold text-white text-lg">{totalSessionVolume.toLocaleString()} <span className="text-sm text-slate-400">kg</span></p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Reps Totales</p>
                                                <p className="font-bold text-white text-lg">{totalSessionReps}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Ejercicios</p>
                                                <p className="font-bold text-white text-lg">{totalExercises}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Tiempo Estimado</p>
                                                <p className="font-bold text-white text-lg">{sessionDuration}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-700 space-y-4">
                                        <h4 className="font-semibold text-slate-300 mb-2 text-center">Ejercicios Realizados</h4>
                                        {logsBySession[sessionKey]
                                            .reduce((acc, log) => {
                                                let exercise = acc.find(e => e.exerciseName === log.exerciseName);
                                                if (!exercise) {
                                                    exercise = { exerciseName: log.exerciseName, clusters: [], perceivedExertions: [] };
                                                    acc.push(exercise);
                                                }
                                                exercise.clusters.push(...log.clusters);
                                                if (log.perceivedExertion) {
                                                    exercise.perceivedExertions.push(log.perceivedExertion);
                                                }
                                                return acc;
                                            }, [] as { exerciseName: ExerciseName, clusters: Cluster[], perceivedExertions: number[] }[])
                                            .map(({ exerciseName, clusters, perceivedExertions }) => {
                                                const totalVolume = clusters.reduce((sum, c) => sum + (c.weight * c.reps), 0);
                                                const totalReps = clusters.reduce((sum, c) => sum + c.reps, 0);
                                                const totalTime = clusters.reduce((sum, c) => sum + (c.time || 0), 0);
                                                const numSets = clusters.length;
                                                const avgRPE = perceivedExertions.length > 0 
                                                    ? (perceivedExertions.reduce((a, b) => a + b, 0) / perceivedExertions.length).toFixed(1)
                                                    : 0;

                                                return (
                                                    <div key={exerciseName} className="p-3 bg-slate-900/50 rounded-md">
                                                        <p className="font-semibold text-slate-200">{exerciseName}</p>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                                                            <span><span className="font-bold text-white">{numSets}</span> series</span>
                                                            {totalVolume > 0 && <span>Vol: <span className="font-bold text-white">{totalVolume.toLocaleString()}</span> kg</span>}
                                                            {totalReps > 0 && totalVolume === 0 && <span>Reps: <span className="font-bold text-white">{totalReps}</span></span>}
                                                            {totalTime > 0 && <span>Tiempo: <span className="font-bold text-white">{totalTime}</span>s</span>}
                                                            {Number(avgRPE) > 0 && <span>RPE: <span className="font-bold text-white">{avgRPE}</span>/10</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>

                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={onDelete}
                logsBySession={logsBySession}
                sortedSessionKeys={sortedSessionKeys}
            />
        </>
    );
};
```

---

## Archivo: `components/GoalProgress.tsx`

```typescript
import React from 'react';
import { ExerciseGoal, TrainingType } from '../types';

interface GoalProgressProps {
  goal: ExerciseGoal;
  progress: {
    weight: number;
    reps: number;
    clusters: number;
    totalTime: number;
    heartRate?: number;
  };
  isTimeBased: boolean;
  isRepBased: boolean;
  trainingType: TrainingType;
}

const formatSecondsToMMSS = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const ProgressBar: React.FC<{
  label: string;
  current: number;
  goal: number;
  unit: string;
  isTimeFormat?: boolean;
}> = ({ label, current, goal, unit, isTimeFormat = false }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isComplete = current >= goal;

  const displayCurrent = isTimeFormat ? formatSecondsToMMSS(current) : current.toLocaleString();
  const displayGoal = isTimeFormat ? formatSecondsToMMSS(goal) : goal.toLocaleString();


  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className={`text-xs font-mono ${isComplete ? 'text-green-400' : 'text-slate-400'}`}>
          {displayCurrent}{unit} / {displayGoal}{unit}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div 
          className={`${isComplete ? 'bg-green-500' : 'bg-cyan-500'} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ goal, progress, isTimeBased, isRepBased, trainingType }) => {
  if (!goal) {
    return null;
  }
  
  const isClusterMode = trainingType === 'Clúster';

  let goalSeriesCount = 0;
  let goalWeight = 0;
  let goalTotalReps = 0;

  if (isClusterMode && goal.clusterGoals) {
      goalSeriesCount = goal.clusterGoals.length;
      goalWeight = goal.clusterGoals.reduce((sum, cg) => sum + (cg.weight * (cg.reps || 0)), 0);
      goalTotalReps = goal.clusterGoals.reduce((sum, cg) => sum + (cg.reps || 0), 0);
  } else {
      goalSeriesCount = goal.series || 0;
      goalWeight = (goal.weight || 0) * (goal.reps || 0) * goalSeriesCount;
      goalTotalReps = (goal.reps || 0) * goalSeriesCount;
  }


  const hasWeightGoal = !isTimeBased && !isRepBased && goalWeight > 0;
  const hasRepsGoal = isRepBased && goalTotalReps > 0;
  const hasTimeGoal = isTimeBased && goal.totalTime && goal.totalTime > 0;
  const hasSeriesGoal = goalSeriesCount > 0 && !isTimeBased;
  const recordedHeartRate = progress?.heartRate;

  if (!hasWeightGoal && !hasRepsGoal && !hasTimeGoal && !hasSeriesGoal && !recordedHeartRate) {
      return null;
  }

  return (
    <div className="mb-4 space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progreso de Meta</h3>
      {hasTimeGoal && <ProgressBar label="Tiempo Total" current={progress.totalTime} goal={goal.totalTime!} unit="" isTimeFormat={true} />}
      {hasWeightGoal && <ProgressBar label="Volumen Total" current={progress.weight} goal={goalWeight} unit="Kg" />}
      {hasRepsGoal && <ProgressBar label="Reps Totales" current={progress.reps} goal={goalTotalReps} unit="" />}
      {hasSeriesGoal && <ProgressBar label="Series Totales" current={progress.clusters} goal={goalSeriesCount} unit="" />}
      {recordedHeartRate && recordedHeartRate > 0 && (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-slate-300">Frecuencia Cardíaca:</span>
            <span className="text-sm font-bold font-mono text-white">{recordedHeartRate} PPM</span>
        </div>
      )}
    </div>
  );
}
```

---

## Archivo: `components/GoalSetter.tsx`

```typescript

import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import type { ExerciseName, Goals, ExerciseGoal, TrainingType, Cluster } from '../types';
import { isTimeBased as isTimeBasedUtil, isBodyweight as isBodyweightUtil } from '../utils/exerciseUtils';

interface GoalSetterProps {
  exercises: ExerciseName[];
  currentGoals: Goals;
  onSetGoals: (goals: Goals) => void;
  trainingType: TrainingType;
  onSetTrainingType: (type: TrainingType) => void;
}

// Initial state for a new goal
const initialGoalState: ExerciseGoal = {
  weight: 0,
  reps: 0,
  series: 3,
  totalTime: 60,
  tempo: '2-0-2-0',
  isWeighted: false,
  useTempo: false,
  clusterGoals: [{ weight: 0, reps: 0 }],
};

export const GoalSetter: React.FC<GoalSetterProps> = ({ exercises, currentGoals, onSetGoals, trainingType, onSetTrainingType }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseName | ''>('');
  const [goalData, setGoalData] = useState<Partial<ExerciseGoal>>(initialGoalState);
  const [isSaved, setIsSaved] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isTimeBased = useMemo(() => selectedExercise ? isTimeBasedUtil(selectedExercise) : false, [selectedExercise]);
  const isBodyweight = useMemo(() => selectedExercise ? isBodyweightUtil(selectedExercise) : false, [selectedExercise]);
  
  const isEffectivelyRepBased = useMemo(() => isBodyweight && !isTimeBased && !goalData.isWeighted, [isBodyweight, isTimeBased, goalData.isWeighted]);


  useEffect(() => {
    if (selectedExercise) {
      const existingGoal = currentGoals[selectedExercise];
      const newGoal = existingGoal ? { ...initialGoalState, ...existingGoal } : { ...initialGoalState };
      setGoalData(newGoal);

    } else {
      setGoalData(initialGoalState);
    }
    setIsSaved(true);
  }, [selectedExercise, currentGoals]);
  
  const handleTrainingTypeChange = (type: TrainingType) => {
    onSetTrainingType(type);
    setIsSaved(false);
    // When switching to a non-cluster type, reset series to the default.
    // The series field is irrelevant for cluster type under the new logic.
    if(type !== 'Clúster') {
        setGoalData(prev => ({...prev, series: 3}));
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setIsSaved(false);
    setGoalData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'tempo' ? value : Number(value)),
    }));
  };
  
  const handleClusterChange = (index: number, field: 'weight' | 'reps', value: string) => {
    setIsSaved(false);
    const updatedClusters = [...(goalData.clusterGoals || [])];
    updatedClusters[index] = { ...updatedClusters[index], [field]: Number(value) || 0 };
    setGoalData(prev => ({ ...prev, clusterGoals: updatedClusters }));
  };

  const addCluster = () => {
    setIsSaved(false);
    const updatedClusters = [...(goalData.clusterGoals || []), { weight: 0, reps: 0 }];
    setGoalData(prev => ({ ...prev, clusterGoals: updatedClusters }));
  };
  
  const removeCluster = (index: number) => {
    if ((goalData.clusterGoals || []).length <= 1) return; // Prevent removing the last one
    setIsSaved(false);
    const updatedClusters = [...(goalData.clusterGoals || [])];
    updatedClusters.splice(index, 1);
    setGoalData(prev => ({ ...prev, clusterGoals: updatedClusters }));
  };


  const handleSaveGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;
    
    // Clean up irrelevant data before saving
    const finalGoalData: Partial<ExerciseGoal> = { ...goalData };
    if (trainingType !== 'Clúster') delete finalGoalData.clusterGoals;
    if (isTimeBased) {
        delete finalGoalData.weight;
        delete finalGoalData.reps;
        delete finalGoalData.series;
    } else if (isEffectivelyRepBased) {
        delete finalGoalData.weight;
        delete finalGoalData.totalTime;
    } else if (trainingType === 'Clúster') {
        delete finalGoalData.weight;
        delete finalGoalData.reps;
        delete finalGoalData.series;
    } else {
        delete finalGoalData.totalTime;
    }

    onSetGoals({ ...currentGoals, [selectedExercise]: finalGoalData });
    setIsSaved(true);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2500);
  };
  
  const handleRemoveGoal = () => {
      if (!selectedExercise) return;
      const { [selectedExercise]: _, ...remainingGoals } = currentGoals;
      onSetGoals(remainingGoals);
      setSelectedExercise(''); // Reset selection
  };
  
  const hasUnsavedChanges = !isSaved && selectedExercise;

  const trainingTypes: TrainingType[] = ['Normal', 'Clúster', 'Drop'];

  if (isCollapsed) {
    return (
      <div 
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsCollapsed(false)}
        aria-label="Metas de entrenamiento. Haz clic para editar."
      >
        <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`${Object.keys(currentGoals).length > 0 ? 'bg-emerald-500/10' : 'bg-slate-700/50'} p-2 rounded-full`}>
                   {Object.keys(currentGoals).length > 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                   )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-300">Metas de Entrenamiento</h2>
                    <p className="text-slate-400 text-sm">
                        {Object.keys(currentGoals).length > 0 
                            ? `${Object.keys(currentGoals).length} meta(s) establecida(s). Haz clic para editar.` 
                            : 'Establece tus metas para la sesión.'}
                    </p>
                </div>
            </div>
            <div className='text-right mt-4 sm:mt-0'>
                <span className="text-sm font-semibold bg-cyan-900/50 text-cyan-300 py-1 px-3 rounded-full">{trainingType}</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveGoal} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div>
                <h2 className="text-xl font-bold text-slate-300">Metas de Entrenamiento</h2>
                <p className="text-slate-400 mt-1 text-sm">Selecciona un ejercicio y establece tus metas.</p>
            </div>
            {hasUnsavedChanges && (
                <div className="text-amber-400 text-sm font-semibold flex items-center gap-2 animate-pulse mt-2 sm:mt-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Cambios sin guardar
                </div>
            )}
        </div>
      
      {/* Training Type Selector */}
      <fieldset className="mb-6">
          <legend className="text-sm font-medium text-slate-300 mb-2">Tipo de Entrenamiento</legend>
          <div className="flex flex-wrap gap-3">
              {trainingTypes.map(type => (
                  <button
                      key={type}
                      type="button"
                      onClick={() => handleTrainingTypeChange(type)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${trainingType === type ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                  >
                      {type}
                  </button>
              ))}
          </div>
      </fieldset>
      
      {/* Exercise Selector */}
      <div className="mb-4">
        <label htmlFor="exercise-select" className="block text-sm font-medium text-slate-300 mb-1">Ejercicio</label>
        <select
          id="exercise-select"
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value as ExerciseName)}
          className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">-- Selecciona un ejercicio --</option>
          {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
        </select>
      </div>

      {selectedExercise && (
        <div className="animate-fade-in space-y-4">
            {/* Form fields */}
            {isTimeBased ? (
                <div>
                    <label htmlFor="totalTime" className="block text-sm font-medium text-slate-300 mb-1">Tiempo Total (segundos)</label>
                    <input type="number" name="totalTime" id="totalTime" value={goalData.totalTime || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" min="1" />
                </div>
            ) : trainingType === 'Clúster' ? (
                <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Configuración de Clústeres</h3>
                    <div className="space-y-2">
                        {(goalData.clusterGoals || [{ weight: 0, reps: 0 }]).map((cluster, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold text-sm pr-1">Clúster {index + 1}</span>
                                <input type="number" placeholder="Kg" value={cluster.weight || ''} onChange={(e) => handleClusterChange(index, 'weight', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" />
                                <input type="number" placeholder="Reps" value={cluster.reps || ''} onChange={(e) => handleClusterChange(index, 'reps', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" />
                                <button type="button" onClick={() => removeCluster(index)} disabled={(goalData.clusterGoals || []).length <= 1} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-50 disabled:hover:text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                            </div>
                        ))}
                        <button type="button" onClick={addCluster} className="text-sm text-cyan-400 hover:text-cyan-300">+ Añadir Clúster</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {!isEffectivelyRepBased && (
                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-1">Peso (Kg)</label>
                            <input type="number" name="weight" id="weight" step="0.1" value={goalData.weight || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" min="0"/>
                        </div>
                    )}
                    <div>
                        <label htmlFor="reps" className="block text-sm font-medium text-slate-300 mb-1">Reps</label>
                        <input type="number" name="reps" id="reps" value={goalData.reps || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" min="1"/>
                    </div>
                    <div>
                        <label htmlFor="series" className="block text-sm font-medium text-slate-300 mb-1">Series</label>
                        <input type="number" name="series" id="series" value={goalData.series || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" min="1"/>
                    </div>
                    {isBodyweight && !isTimeBased && (
                        <div className="col-span-2 md:col-span-1 flex items-end">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" name="isWeighted" checked={goalData.isWeighted || false} onChange={handleInputChange} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500" />
                                <span className="text-sm text-slate-300">Con Lastre</span>
                            </label>
                        </div>
                    )}
                </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center mt-8 gap-4">
                <button 
                    type="button" 
                    onClick={() => setIsCollapsed(true)} 
                    className="w-full sm:flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 px-6 rounded-lg transition-all text-center"
                >
                    Cerrar
                </button>
                <button 
                    type="submit" 
                    className="w-full sm:flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed text-center" 
                    disabled={isSaved || !selectedExercise}
                >
                    {isSaved ? 'Meta Guardada' : 'Guardar Meta'}
                </button>
                {currentGoals[selectedExercise] && (
                    <button 
                        type="button" 
                        onClick={handleRemoveGoal} 
                        className="w-full sm:flex-1 bg-rose-800 hover:bg-rose-700 text-rose-300 font-bold py-3 px-6 rounded-lg transition-all text-center"
                    >
                        Borrar
                    </button>
                )}
            </div>
             <div className="text-center mt-2 h-5">
                {showConfirmation && (
                    <p className="text-emerald-400 text-sm animate-fade-in">¡Meta para {selectedExercise} guardada!</p>
                )}
            </div>
        </div>
      )}
    </form>
  );
};

```

---

## Archivo: `components/HeartRateModal.tsx`

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import type { ColorTheme, UserProfile, ExerciseName } from '../types';

interface HeartRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (heartRate?: number, perceivedExertion?: number) => void;
  exerciseName: ExerciseName;
  color: ColorTheme;
  userProfile: UserProfile | null;
}

type HeartRateZones = {
    light: number;
    moderate: number;
    vigorous: number;
    high: number;
    max: number;
};

const getHeartRateFeedback = (hrValue: number, zones: HeartRateZones): { message: string; color: string } => {
    if (hrValue > zones.max) {
        return { message: `¡Atención! Frecuencia cardíaca por encima de tu máximo estimado (${zones.max} PPM).`, color: 'text-red-400' };
    }
    if (hrValue >= zones.high) {
        return { message: 'Intensidad muy alta. ¡Estás dándolo todo!', color: 'text-amber-400' };
    }
    if (hrValue >= zones.vigorous) {
        return { message: 'Zona de intensidad vigorosa. ¡Excelente para mejorar el rendimiento!', color: 'text-green-400' };
    }
    if (hrValue >= zones.moderate) {
        return { message: 'Zona de intensidad moderada. Ideal para la salud cardiovascular.', color: 'text-cyan-400' };
    }
    return { message: 'Intensidad ligera. Buen calentamiento o vuelta a la calma.', color: 'text-slate-400' };
};

export const HeartRateModal: React.FC<HeartRateModalProps> = ({ isOpen, onClose, onSave, exerciseName, color, userProfile }) => {
  const [heartRate, setHeartRate] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState('');
  const [feedback, setFeedback] = useState<{ message: string, color: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setHeartRate('');
        setPerceivedExertion('');
        setFeedback(null);
      }, 300); // Wait for animation to finish
    }
  }, [isOpen]);

  const zones = useMemo<HeartRateZones | null>(() => {
    if (!userProfile?.age) return null;
    
    const maxHR = 220 - userProfile.age;

    // Use Karvonen formula if resting HR is available and valid
    if (userProfile.restingHeartRate && userProfile.restingHeartRate > 0 && userProfile.restingHeartRate < maxHR) {
        const hrr = maxHR - userProfile.restingHeartRate;
        return {
            light: Math.round(hrr * 0.5 + userProfile.restingHeartRate),
            moderate: Math.round(hrr * 0.6 + userProfile.restingHeartRate),
            vigorous: Math.round(hrr * 0.7 + userProfile.restingHeartRate),
            high: Math.round(hrr * 0.85 + userProfile.restingHeartRate),
            max: maxHR
        };
    }

    // Fallback to simple percentage of Max HR
    return {
        light: Math.round(maxHR * 0.5),
        moderate: Math.round(maxHR * 0.6),
        vigorous: Math.round(maxHR * 0.7),
        high: Math.round(maxHR * 0.85),
        max: maxHR
    };
  }, [userProfile]);

  const handleHeartRateChange = (value: string) => {
    setHeartRate(value);
    const hrValue = parseInt(value, 10);

    if (!value || isNaN(hrValue) || !zones) {
      setFeedback(null);
      return;
    }
    
    setFeedback(getHeartRateFeedback(hrValue, zones));
  };

  const handlePerceivedExertionChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 10)) {
        setPerceivedExertion(value);
    }
  };


  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(
        heartRate ? parseInt(heartRate, 10) : undefined,
        perceivedExertion ? parseInt(perceivedExertion, 10) : undefined
    );
  };
  
  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-sm w-full relative transition-all duration-300 text-center ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="flex justify-center mb-2">
            <div className="bg-emerald-500/10 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-1">¡Entrenamiento Registrado!</h2>
        <p className={`text-md font-semibold ${color.text} mb-4`}>{exerciseName}</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="heart-rate" className="block text-sm font-medium text-slate-300 mb-1">
              Opcional: Frecuencia Cardíaca (PPM)
            </label>
            <input
              type="number"
              id="heart-rate"
              value={heartRate}
              onChange={(e) => handleHeartRateChange(e.target.value)}
              placeholder="145"
              min="40"
              max="250"
              className={`w-28 mx-auto text-center bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
            />
            <div className="min-h-[1.25rem] text-xs text-center transition-opacity duration-300" style={{opacity: feedback ? 1 : 0}}>
              {feedback && <p className={feedback.color}>{feedback.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="perceived-exertion" className="block text-sm font-medium text-slate-300 mb-1">
              Intensidad Percibida (1-10)
            </label>
            <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  id="perceived-exertion"
                  value={perceivedExertion}
                  onChange={(e) => handlePerceivedExertionChange(e.target.value)}
                  placeholder="8"
                  min="1"
                  max="10"
                  className={`w-20 text-center bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 ${color.ring}`}
                />
                <span className="text-slate-400 text-lg">/ 10</span>
            </div>
          </div>
        </div>


        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
          >
            Ignorar
          </button>
          <button
            onClick={handleSave}
            className={`w-full ${color.bg} ${color.hoverBg} text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md ${color.shadow}`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Archivo: `components/ManualLogModal.tsx`

```typescript


import React, { useState, useMemo, useEffect } from 'react';
import type { ExerciseLog, UserRoutine, ExerciseName, Cluster, TrainingType } from '../types';
import { PREDEFINED_EXERCISES } from '../constants/exercises';
import { isTimeBased as isTimeBasedUtil, isBodyweight as isBodyweightUtil } from '../utils/exerciseUtils';
import { generateUUID } from '../utils/uuid';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (logs: ExerciseLog[]) => void;
  userRoutine: UserRoutine | null;
}

type ManualCluster = { id: string; weight: string; reps: string; time: string };
type ManualExercise = { id: string; name: ExerciseName; clusters: ManualCluster[] };

const todayISO = () => new Date().toISOString().split('T')[0];

const shouldShowWeight = (exerciseName: ExerciseName, trainingType: TrainingType): boolean => {
    if (isTimeBasedUtil(exerciseName)) {
        return false;
    }
    if (!isBodyweightUtil(exerciseName)) {
        return true;
    }
    // It's a bodyweight exercise. Show weight for these types which imply using weights.
    return trainingType === 'Clúster' || trainingType === 'Drop';
};


export const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose, onSave, userRoutine }) => {
    const [sessionDate, setSessionDate] = useState(todayISO);
    const [exercises, setExercises] = useState<ManualExercise[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<ExerciseName[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sessionTrainingType, setSessionTrainingType] = useState<TrainingType>('Normal');


    const allPossibleExercises = useMemo(() => {
        const all = new Set<ExerciseName>();
        Object.values(PREDEFINED_EXERCISES).forEach(routine => {
            Object.values(routine).forEach(focus => {
                focus.forEach(ex => all.add(ex));
            });
        });
        return Array.from(all).sort();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            // Reset state after closing animation
            const timer = setTimeout(() => {
                setSessionDate(todayISO());
                setExercises([]);
                setSearchTerm('');
                setSuggestions([]);
                setError(null);
                setSessionTrainingType('Normal');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        const existingNames = exercises.map(ex => ex.name);
        if (value.trim().length > 1) {
            const filtered = allPossibleExercises.filter(ex =>
                ex.toLowerCase().includes(value.toLowerCase()) && !existingNames.includes(ex)
            );
            setSuggestions(filtered.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const addExercise = (name: ExerciseName) => {
        setExercises(prev => [...prev, {
            id: generateUUID(),
            name,
            clusters: [{ id: generateUUID(), weight: '', reps: '', time: '0' }]
        }]);
        setSearchTerm('');
        setSuggestions([]);
    };

    const removeExercise = (exerciseId: string) => {
        setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    };

    const handleClusterChange = (exerciseId: string, clusterId: string, field: keyof Omit<ManualCluster, 'id'>, value: string) => {
        setExercises(prev => prev.map(ex => 
            ex.id === exerciseId
                ? { ...ex, clusters: ex.clusters.map(c => c.id === clusterId ? { ...c, [field]: value } : c) }
                : ex
        ));
    };

    const addCluster = (exerciseId: string) => {
        setExercises(prev => prev.map(ex =>
            ex.id === exerciseId
                ? { ...ex, clusters: [...ex.clusters, { id: generateUUID(), weight: '', reps: '', time: '0' }] }
                : ex
        ));
    };

    const removeCluster = (exerciseId: string, clusterId: string) => {
        setExercises(prev => prev.map(ex =>
            ex.id === exerciseId
                ? { ...ex, clusters: ex.clusters.filter(c => c.id !== clusterId) }
                : ex
        ));
    };

    const handleSubmit = () => {
        setError(null);
        if (exercises.length === 0) {
            setError("Añade al menos un ejercicio para registrar la sesión.");
            return;
        }

        const [year, month, day] = sessionDate.split('-').map(Number);

        // Process exercises into valid log data, filtering out empty ones
        const validLogData = exercises
            .map(exercise => {
                const parsedClusters: Cluster[] = exercise.clusters
                    .map((cluster): Cluster | null => {
                        const isTime = isTimeBasedUtil(exercise.name);
                        const showWeight = shouldShowWeight(exercise.name, sessionTrainingType);
                        
                        const weight = showWeight ? parseFloat(cluster.weight) : 0;
                        const reps = parseInt(cluster.reps, 10);
                        const time = parseInt(cluster.time, 10);

                        if (isTime) {
                            if (!isNaN(time) && time > 0) {
                                return { weight: 0, reps: 0, time };
                            }
                        } else {
                            if (!isNaN(reps) && reps > 0) {
                                return { weight: isNaN(weight) ? 0 : weight, reps };
                            }
                        }
                        return null; // Invalid cluster
                    })
                    .filter((c): c is Cluster => c !== null);

                if (parsedClusters.length > 0) {
                    return {
                        exerciseName: exercise.name,
                        clusters: parsedClusters,
                    };
                }
                return null;
            })
            .filter((log): log is { exerciseName: ExerciseName; clusters: Cluster[] } => log !== null);
        
        if (validLogData.length === 0) {
             setError("Asegúrate de rellenar los datos de al menos una serie para cada ejercicio.");
             return;
        }

        // Create final logs with timestamps.
        const logsToAdd: ExerciseLog[] = validLogData.map((logData, index) => {
            // Stagger timestamp by one minute per exercise to maintain order.
            // This creates the date at noon in the user's local timezone to avoid DST/timezone shifts changing the day.
            const logTimestamp = new Date(year, month - 1, day, 12, index, 0).toISOString();
            return {
                id: generateUUID(),
                timestamp: logTimestamp,
                exerciseName: logData.exerciseName,
                clusters: logData.clusters,
            };
        });

        onSave(logsToAdd);
    };

    if (!isOpen) return null;

    const trainingTypes: TrainingType[] = ['Normal', 'Clúster', 'Drop'];

    return (
        <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 z-50 transition-opacity duration-300 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-2xl w-full relative transition-all duration-300 flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="flex-shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h2 className="text-xl font-bold text-white mb-2">Registrar Sesión Pasada</h2>
                    <p className="text-sm text-slate-400 mb-4">Añade los detalles del entrenamiento que ya realizaste.</p>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-4 scrollbar-hide space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="session-date" className="block text-sm font-medium text-slate-300 mb-1">Fecha de la Sesión</label>
                            <input
                                type="date"
                                id="session-date"
                                value={sessionDate}
                                onChange={(e) => setSessionDate(e.target.value)}
                                max={todayISO()}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        <fieldset>
                            <legend className="block text-sm font-medium text-slate-300 mb-1">Tipo de Entrenamiento</legend>
                            <div className="flex flex-wrap gap-2">
                                {trainingTypes.map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSessionTrainingType(type)}
                                        className={`px-3 py-2 rounded-md text-xs font-semibold transition-all duration-300 flex-grow ${sessionTrainingType === type ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="text-md font-semibold text-slate-300 mb-2">Añadir Ejercicios</h3>
                        {userRoutine && Array.isArray(userRoutine.exercises) && userRoutine.exercises.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs text-slate-400 mb-2">Sugerencias de tu rutina actual:</p>
                                <div className="flex flex-wrap gap-2">
                                    {userRoutine.exercises.filter(ex => !exercises.some(e => e.name === ex)).map(ex => (
                                        <button key={ex} onClick={() => addExercise(ex)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 py-1 px-2.5 rounded-full transition-colors">
                                            + {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Buscar otro ejercicio..."
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
                                autoComplete="off"
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-slate-600 border border-slate-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg animate-fade-in">
                                    {suggestions.map(suggestion => (
                                        <li key={suggestion} onMouseDown={() => addExercise(suggestion)} className="px-4 py-2 cursor-pointer hover:bg-slate-500 text-sm text-slate-200">
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {exercises.map((exercise) => {
                            const showWeightInput = shouldShowWeight(exercise.name, sessionTrainingType);
                            return (
                                <div key={exercise.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 animate-fade-in">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-cyan-400">{exercise.name}</h4>
                                        <button onClick={() => removeExercise(exercise.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h--3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {exercise.clusters.map((cluster, index) => (
                                            <div key={cluster.id} className="flex items-center gap-2">
                                                <span className="text-slate-400 text-sm">{index + 1}.</span>
                                                {isTimeBasedUtil(exercise.name) ? (
                                                    <input type="number" placeholder="Segundos" value={cluster.time} onChange={e => handleClusterChange(exercise.id, cluster.id, 'time', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-2 text-sm text-white"/>
                                                ) : (
                                                    <div className="flex-grow flex items-center gap-2">
                                                        {showWeightInput && <input type="number" placeholder="Kg" value={cluster.weight} onChange={e => handleClusterChange(exercise.id, cluster.id, 'weight', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-2 text-sm text-white"/>}
                                                        <input type="number" placeholder="Reps" value={cluster.reps} onChange={e => handleClusterChange(exercise.id, cluster.id, 'reps', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 px-2 text-sm text-white"/>
                                                    </div>
                                                )}
                                                <button onClick={() => removeCluster(exercise.id, cluster.id)} disabled={exercise.clusters.length <= 1} className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => addCluster(exercise.id)} className="text-xs text-cyan-400 hover:text-cyan-300 mt-3">+ Añadir Serie</button>
                                </div>
                            );
                        })}
                    </div>

                </div>

                <div className="flex-shrink-0 pt-4 mt-2 border-t border-slate-700">
                     {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-6 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Guardar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
```

---

## Archivo: `components/SaveRoutineModal.tsx`

```typescript
import React, { useState, useEffect } from 'react';

interface SaveRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const SaveRoutineModal: React.FC<SaveRoutineModalProps> = ({ isOpen, onClose, onSave }) => {
  const [routineName, setRoutineName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRoutineName('');
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmedName = routineName.trim();
    if (trimmedName.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    onSave(trimmedName);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-sm w-full relative transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <h2 className="text-xl font-bold text-white mb-2 text-center">Guardar Rutina</h2>
        <p className="text-sm text-slate-400 mb-6 text-center">Dale un nombre a esta configuración para usarla más tarde.</p>

        <div className="space-y-2">
          <label htmlFor="routine-name" className="block text-sm font-medium text-slate-300">
            Nombre de la Rutina
          </label>
          <input
            type="text"
            id="routine-name"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="Ej: Día de Pecho y Tríceps"
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
          />
          <div className="h-4 text-xs text-center pt-1">
            {error && <p className="text-rose-400">{error}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

```

---

## Archivo: `components/DeleteModal.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import type { ExerciseLog } from '../types';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (logIdsToDelete: string[]) => void;
  logsBySession: Record<string, ExerciseLog[]>;
  sortedSessionKeys: string[];
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onDelete, logsBySession, sortedSessionKeys }) => {
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state after closing animation
      const timer = setTimeout(() => {
        setSelectedSessions([]);
        setIsConfirming(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleToggleSelection = (sessionKey: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionKey)
        ? prev.filter(key => key !== sessionKey)
        : [...prev, sessionKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedSessions(sortedSessionKeys);
  };

  const handleDeselectAll = () => {
    setSelectedSessions([]);
  };

  const handleDeleteRequest = () => {
    if (selectedSessions.length > 0) {
      setIsConfirming(true);
    }
  };

  const handleConfirmDelete = () => {
    const logIdsToDelete = selectedSessions.flatMap(sessionKey =>
      logsBySession[sessionKey].map(log => log.id)
    );
    onDelete(logIdsToDelete);
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-lg w-full relative transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {!isConfirming ? (
            <>
                <h2 className="text-xl font-bold text-white mb-2">Borrar Registros del Historial</h2>
                <p className="text-sm text-slate-400 mb-4">Selecciona las sesiones de entrenamiento que deseas eliminar permanentemente.</p>
                
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-300">{selectedSessions.length} de {sortedSessionKeys.length} seleccionadas</span>
                    <div className="space-x-4">
                        <button onClick={handleSelectAll} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Seleccionar todo</button>
                        <button onClick={handleDeselectAll} className="text-xs font-semibold text-slate-400 hover:text-slate-300">Deseccionar todo</button>
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                  {sortedSessionKeys.length > 0 ? (
                    sortedSessionKeys.map(sessionKey => (
                      <label key={sessionKey} className="flex items-center p-3 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(sessionKey)}
                          onChange={() => handleToggleSelection(sessionKey)}
                          className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="ml-3 text-sm text-slate-200">{sessionKey}</span>
                      </label>
                    ))
                  ) : (
                     <p className="text-center text-slate-400 text-sm p-4">No hay registros para mostrar.</p>
                  )}
                </div>
            </>
        ) : (
            <div>
                <h2 className="text-xl font-bold text-rose-400 mb-4 text-center">Confirmar Eliminación</h2>
                <div className="text-center p-4 bg-rose-900/30 border border-rose-500/50 rounded-lg">
                    <p className="text-slate-200">
                        Está acción es irreversible asegúrese de tomar precauciones en sus datos.
                    </p>
                    <p className="mt-2 font-semibold text-white">
                        ¿Realmente deseas eliminar {selectedSessions.length} sesión(es) seleccionada(s)?
                    </p>
                </div>
            </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {isConfirming ? (
            <>
              <button
                onClick={() => setIsConfirming(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-300 order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md shadow-rose-500/20 order-1 sm:order-2"
              >
                Sí, Eliminar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-300 order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRequest}
                disabled={selectedSessions.length === 0}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md shadow-rose-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none order-1 sm:order-2"
              >
                {selectedSessions.length > 0 ? `Eliminar (${selectedSessions.length}) registro${selectedSessions.length > 1 ? 's' : ''}` : 'Eliminar registro'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

```

---

## Archivo: `components/EquipmentSelector.tsx`

```typescript
import React, { useState } from 'react';
import { DEFAULT_EQUIPMENT_LIST, EquipmentDefinition } from '../constants/equipment';

interface EquipmentSelectorProps {
  selectedEquipment: string[];
  onChange: (equipment: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  selectedEquipment,
  onChange,
  title = '¿Con qué elementos cuentas para entrenar?',
  subtitle = 'Selecciona tu equipamiento para filtrar y adaptar los ejercicios a tu espacio o gimnasio.',
}) => {
  const [customEquipment, setCustomEquipment] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'libre' | 'calistenia' | 'maquinas' | 'accesorios'>('all');

  const toggleItem = (name: string) => {
    if (selectedEquipment.includes(name)) {
      onChange(selectedEquipment.filter(item => item !== name));
    } else {
      onChange([...selectedEquipment, name]);
    }
  };

  const handleSelectAll = () => {
    const allNames = DEFAULT_EQUIPMENT_LIST.map(e => e.name);
    const combined = Array.from(new Set([...allNames, ...selectedEquipment]));
    onChange(combined);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleQuickPreset = (preset: 'bodyweight' | 'home' | 'gym') => {
    if (preset === 'bodyweight') {
      onChange(['Peso corporal (Sin equipo)', 'Barra de dominadas']);
    } else if (preset === 'home') {
      onChange([
        'Peso corporal (Sin equipo)',
        'Mancuernas',
        'Banco de pesas',
        'Cuerda de saltar',
        'Bandas elásticas',
        'Barra de dominadas',
      ]);
    } else if (preset === 'gym') {
      onChange(DEFAULT_EQUIPMENT_LIST.map(e => e.name));
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customEquipment.trim();
    if (trimmed && !selectedEquipment.includes(trimmed)) {
      onChange([...selectedEquipment, trimmed]);
      setCustomEquipment('');
    }
  };

  const filteredDefinitions = activeCategory === 'all'
    ? DEFAULT_EQUIPMENT_LIST
    : DEFAULT_EQUIPMENT_LIST.filter(item => item.category === activeCategory);

  // Elementos personalizados que no están en la lista default
  const customItemsSelected = selectedEquipment.filter(
    item => !DEFAULT_EQUIPMENT_LIST.some(d => d.name === item)
  );

  return (
    <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 sm:p-5 mb-6 animate-fade-in shadow-inner">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-cyan-300 flex items-center gap-2">
            <span>🏋️‍♂️</span>
            <span>{title}</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-medium">
            {selectedEquipment.length} seleccionados
          </span>
        </div>
      </div>

      {/* Accesos rápidos de configuración */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-3 text-xs">
        <span className="text-slate-400 font-medium mr-1">Rápido:</span>
        <button
          type="button"
          onClick={() => handleQuickPreset('gym')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition-colors"
        >
          🏛️ Gimnasio Completo
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('home')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
        >
          🏠 Casa (Mancuernas/Bandas)
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('bodyweight')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700 transition-colors"
        >
          🤸 Solo Calistenia
        </button>
        <button
          type="button"
          onClick={handleSelectAll}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
        >
          Todos
        </button>
        {selectedEquipment.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1 bg-slate-800 hover:bg-rose-900/40 text-rose-300 rounded border border-slate-700 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Grid de opciones de equipamiento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-hide py-1">
        {filteredDefinitions.map(eq => {
          const isSelected = selectedEquipment.includes(eq.name);
          return (
            <button
              key={eq.id}
              type="button"
              onClick={() => toggleItem(eq.name)}
              className={`flex items-start text-left p-2.5 rounded-lg border text-xs transition-all duration-200 ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/40'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <span className="text-lg mr-2 flex-shrink-0 select-none">{eq.icon}</span>
              <div className="min-w-0 flex-grow">
                <div className="font-semibold flex items-center justify-between gap-1">
                  <span className="truncate">{eq.name}</span>
                  {isSelected && (
                    <span className="text-cyan-400 font-bold flex-shrink-0 text-[10px]">✓</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{eq.description}</p>
              </div>
            </button>
          );
        })}

        {/* Mostrar elementos personalizados agregados por el usuario */}
        {customItemsSelected.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => toggleItem(item)}
            className="flex items-start text-left p-2.5 rounded-lg border text-xs bg-indigo-950/60 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40"
          >
            <span className="text-lg mr-2 flex-shrink-0 select-none">✨</span>
            <div className="min-w-0 flex-grow">
              <div className="font-semibold flex items-center justify-between gap-1">
                <span className="truncate">{item}</span>
                <span className="text-indigo-400 font-bold flex-shrink-0 text-[10px]">✓</span>
              </div>
              <p className="text-[10px] text-indigo-300 truncate mt-0.5">Personalizado</p>
            </div>
          </button>
        ))}
      </div>

      {/* Formulario para añadir equipamiento adicional (ej: "Máquina casera", "TRX", etc.) */}
      <form onSubmit={handleAddCustom} className="mt-3 flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={customEquipment}
          onChange={e => setCustomEquipment(e.target.value)}
          placeholder="¿Tienes otro elemento? Ej: Máquina multifuerza en casa, TRX, Cajón..."
          className="flex-grow bg-slate-800/90 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="submit"
          disabled={!customEquipment.trim()}
          className="px-3 py-1.5 bg-slate-700 hover:bg-cyan-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-white text-xs font-semibold rounded-md transition-colors flex-shrink-0"
        >
          + Añadir
        </button>
      </form>
    </div>
  );
};

```

---

## Archivo: `components/ErrorBoundary.tsx`

```typescript
import React from 'react';
import { safeStorage } from '../utils/storage';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearStorageAndReset = () => {
    try {
      safeStorage.clear();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-cyan-400 mb-2">Ha ocurrido un problema al cargar</h1>
            <p className="text-sm text-slate-300 mb-6">
              Detectamos un error inesperado al inicializar la pantalla. Puedes recargar o restablecer los datos guardados si hubo un conflicto de caché.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-700/60 text-xs text-rose-300 text-left font-mono mb-6 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                🔄 Recargar Aplicación
              </button>
              <button
                onClick={this.handleClearStorageAndReset}
                className="w-full bg-slate-700 hover:bg-rose-900/60 text-slate-200 hover:text-rose-200 font-semibold py-2.5 px-4 rounded-lg transition-colors text-xs border border-slate-600"
              >
                🧹 Limpiar Datos de Caché y Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

```

---

## Archivo: `components/FloatingRestTimer.tsx`

```typescript
import React from 'react';
import { CircularProgress } from './CircularProgress';

interface FloatingRestTimerProps {
  isActive: boolean;
  timeLeft: number;
  totalDuration: number;
  onSkip: () => void;
}

const formatSecondsToMMSS = (totalSeconds: number): string => {
    if (totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
        return '0:00';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const FloatingRestTimer: React.FC<FloatingRestTimerProps> = ({ isActive, timeLeft, totalDuration, onSkip }) => {
  if (!isActive) {
    return null;
  }

  const effectiveTotalDuration = Math.max(Number(totalDuration) || 0, timeLeft, 1);
  const percentage = Math.min(100, Math.max(0, ((effectiveTotalDuration - timeLeft) / effectiveTotalDuration) * 100));

  return (
    <div className="fixed bottom-6 right-6 max-sm:bottom-4 max-sm:right-4 z-50 animate-fade-in-up pointer-events-auto select-none">
      <div className="bg-slate-800/90 backdrop-blur-md border-2 border-cyan-500/60 rounded-2xl shadow-2xl p-4 flex flex-col items-center justify-center text-center w-48 shadow-cyan-500/20">
        <p className="text-sm font-bold text-cyan-400 mb-2">Siguiente Ejercicio</p>
        <div className="relative">
          <CircularProgress percentage={percentage} size={80} strokeWidth={8} color="#22d3ee" trailColor="rgba(255, 255, 255, 0.1)" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-2xl font-mono font-bold text-white">
              {formatSecondsToMMSS(timeLeft)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 text-xs text-slate-400 hover:text-white transition-colors bg-slate-700/60 hover:bg-slate-700 px-3 py-1.5 rounded-full font-medium"
        >
          Omitir Descanso
        </button>
      </div>
    </div>
  );
};

```

---

## Archivo: `components/InterExerciseRestCard.tsx`

```typescript

```

---

## Archivo: `components/InterExerciseRestModal.tsx`

```typescript

```

---

## Archivo: `components/MuscleActivationMap.tsx`

```typescript

import React, { useMemo } from 'react';
import type { ExerciseLog, ExerciseName } from '../types';
import { getExerciseColor } from '../colors';
import { MUSCLE_GROUP_MAPPING, MuscleGroup } from '../constants/muscles';

interface MuscleActivationMapProps {
    sessionLogs: ExerciseLog[];
}

interface ActiveMuscle {
    muscle: MuscleGroup;
    color: string; // Tailwind class like 'fill-cyan-500'
}

export const MuscleActivationMap: React.FC<MuscleActivationMapProps> = ({ sessionLogs }) => {
    
    const { activeMuscles, exerciseLegend } = useMemo(() => {
        const uniqueExercises: ExerciseName[] = Array.from(new Set(sessionLogs.map(log => log.exerciseName)));
        const muscles = new Map<MuscleGroup, string>();
        const legend: { name: ExerciseName; color: string }[] = [];

        uniqueExercises.forEach(exerciseName => {
            const colorTheme = getExerciseColor(exerciseName);
            // e.g., 'text-cyan-400' -> 'cyan'
            const simpleColor = colorTheme.text.split('-')[1]; 
            
            legend.push({ name: exerciseName, color: simpleColor });

            const muscleGroups = MUSCLE_GROUP_MAPPING[exerciseName];
            if (muscleGroups) {
                muscleGroups.forEach(muscle => {
                    // Generate the full Tailwind class name
                    muscles.set(muscle, `fill-${simpleColor}-500`);
                });
            }
        });

        const activeMusclesList: ActiveMuscle[] = Array.from(muscles.entries()).map(([muscle, color]) => ({
            muscle,
            color
        }));

        return { activeMuscles: activeMusclesList, exerciseLegend: legend };
    }, [sessionLogs]);
    
    if (exerciseLegend.length === 0) {
        return null;
    }
    
    return (
        <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h4 className="font-semibold text-slate-300 mb-4 text-center">Músculos Activados en la Sesión</h4>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <div className="flex justify-center gap-4">
                    <BodyFront activeMuscles={activeMuscles} />
                    <BodyBack activeMuscles={activeMuscles} />
                </div>
                <div className="w-full md:w-48 flex-shrink-0">
                    <p className="text-xs text-slate-400 mb-2 font-semibold">Leyenda:</p>
                    <div className="space-y-1">
                        {exerciseLegend.map(({ name, color }) => (
                             <div key={name} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-${color}-500 flex-shrink-0`}></div>
                                <span className="text-xs text-slate-300">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


interface BodyProps {
  activeMuscles: { muscle: MuscleGroup; color: string }[];
}

const BodyFront: React.FC<BodyProps> = ({ activeMuscles }) => {
  const muscleClasses = activeMuscles.reduce((acc, { muscle, color }) => {
    (acc as any)[muscle] = color;
    return acc;
  }, {} as Record<MuscleGroup, string>);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="267" viewBox="0 0 150 400" className="overflow-visible">
      {/* Base Silhouette */}
      <path d="M75 35 C 60 35, 60 50, 65 55 C 60 58, 45 70, 45 90 C 45 110, 40 120, 38 150 C 35 180, 40 200, 45 290 C 50 380, 60 395, 75 395 C 90 395, 100 380, 105 290 C 110 200, 115 180, 112 150 C 110 120, 105 110, 105 90 C 105 70, 90 58, 85 55 C 90 50, 90 35, 75 35 Z" className="fill-slate-800"/>
      {/* Muscle Groups */}
      <g className="fill-slate-700/50 transition-colors duration-300">
        <path className={muscleClasses.neck} d="M68 64 C 65 72, 65 78, 68 82 L 72 82 C 75 78, 75 72, 72 64 Z M82 64 C 85 72, 85 78, 82 82 L 78 82 C 75 78, 75 72, 78 64 Z" />
        <path className={muscleClasses.shoulders_front} d="M48 84 C 38 90, 35 110, 48 112 L 56 108 C 54 100, 52 90, 48 84 Z" />
        <path className={muscleClasses.shoulders_front} d="M102 84 C 112 90, 115 110, 102 112 L 94 108 C 96 100, 98 90, 102 84 Z" />
        <path className={muscleClasses.chest} d="M58 88 C 58 120, 72 125, 75 125 C 78 125, 92 120, 92 88 C 85 85, 65 85, 58 88 Z" />
        <path className={muscleClasses.biceps} d="M50 114 C 46 122, 46 140, 50 145 L 56 142 C 54 135, 54 125, 50 114 Z" />
        <path className={muscleClasses.biceps} d="M100 114 C 104 122, 104 140, 100 145 L 94 142 C 96 135, 96 125, 100 114 Z" />
        <path className={muscleClasses.forearms} d="M48 150 C 44 158, 46 178, 48 182 L 54 180 C 52 172, 52 160, 48 150 Z" />
        <path className={muscleClasses.forearms} d="M102 150 C 106 158, 104 178, 102 182 L 96 180 C 98 172, 98 160, 102 150 Z" />
        <path className={muscleClasses.abs} d="M64 128 L 86 128 L 86 140 L 64 140 Z M64 142 L 86 142 L 86 154 L 64 154 Z M64 156 L 86 156 L 86 168 L 64 168 Z" />
        <path className={muscleClasses.obliques} d="M58 128 C 54 135, 54 168, 62 170 L 62 128 Z M92 128 C 96 135, 96 168, 88 170 L 88 128 Z" />
        <path className={muscleClasses.quads} d="M60 175 C 55 200, 55 280, 68 290 L 72 290 C 72 200, 68 175, 60 175 Z" />
        <path className={muscleClasses.quads} d="M90 175 C 95 200, 95 280, 82 290 L 78 290 C 78 200, 82 175, 90 175 Z" />
        <path className={muscleClasses.adductors} d="M73 175 L 77 175 L 77 280 L 73 280 Z" />
        <path className={muscleClasses.calves_front} d="M65 300 C 62 320, 65 350, 68 360 L 71 360 C 71 320, 68 300, 65 300 Z" />
        <path className={muscleClasses.calves_front} d="M85 300 C 88 320, 85 350, 82 360 L 79 360 C 79 320, 82 300, 85 300 Z" />
      </g>
    </svg>
  );
};

const BodyBack: React.FC<BodyProps> = ({ activeMuscles }) => {
  const muscleClasses = activeMuscles.reduce((acc, { muscle, color }) => {
    (acc as any)[muscle] = color;
    return acc;
  }, {} as Record<MuscleGroup, string>);
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="267" viewBox="0 0 150 400" className="overflow-visible">
      {/* Base Silhouette */}
      <path d="M75 35 C 60 35, 60 50, 65 55 C 60 58, 45 70, 45 90 C 45 110, 40 120, 38 150 C 35 180, 40 200, 45 290 C 50 380, 60 395, 75 395 C 90 395, 100 380, 105 290 C 110 200, 115 180, 112 150 C 110 120, 105 110, 105 90 C 105 70, 90 58, 85 55 C 90 50, 90 35, 75 35 Z" className="fill-slate-800"/>
      {/* Muscle Groups */}
      <g className="fill-slate-700/50 transition-colors duration-300">
        <path className={muscleClasses.neck} d="M70 60 C 68 70, 68 75, 70 80 L 80 80 C 82 75, 82 70, 80 60 Z" />
        <path className={muscleClasses.traps} d="M75 68 C 65 75, 60 90, 64 100 L 75 120 L 86 100 C 90 90, 85 75, 75 68 Z" />
        <path className={muscleClasses.shoulders_rear} d="M48 84 C 38 90, 35 110, 48 112 L 56 108 C 54 100, 52 90, 48 84 Z" />
        <path className={muscleClasses.shoulders_rear} d="M102 84 C 112 90, 115 110, 102 112 L 94 108 C 96 100, 98 90, 102 84 Z" />
        <path className={muscleClasses.triceps} d="M50 114 C 46 122, 46 140, 50 145 L 56 142 C 54 135, 54 125, 50 114 Z" />
        <path className={muscleClasses.triceps} d="M100 114 C 104 122, 104 140, 100 145 L 94 142 C 96 135, 96 125, 100 114 Z" />
        <path className={muscleClasses.forearms} d="M48 150 C 44 158, 46 178, 48 182 L 54 180 C 52 172, 52 160, 48 150 Z" />
        <path className={muscleClasses.forearms} d="M102 150 C 106 158, 104 178, 102 182 L 96 180 C 98 172, 98 160, 102 150 Z" />
        <path className={muscleClasses.lats} d="M60 105 C 50 120, 50 160, 60 170 L 75 165 L 90 170 C 100 160, 100 120, 90 105 Z" />
        <path className={muscleClasses.mid_back} d="M66 105 L 84 105 L 84 160 L 66 160 Z" />
        <path className={muscleClasses.lower_back} d="M66 162 L 84 162 L 84 175 L 66 175 Z" />
        <path className={muscleClasses.glutes} d="M60 176 C 50 185, 50 210, 60 215 L 75 205 L 90 215 C 100 210, 100 185, 90 176 Z" />
        <path className={muscleClasses.hamstrings} d="M62 218 C 60 230, 60 280, 68 290 L 72 290 L 72 218 Z" />
        <path className={muscleClasses.hamstrings} d="M88 218 C 90 230, 90 280, 82 290 L 78 290 L 78 218 Z" />
        <path className={muscleClasses.calves_rear} d="M65 300 C 62 320, 65 350, 68 360 L 71 360 C 71 320, 68 300, 65 300 Z" />
        <path className={muscleClasses.calves_rear} d="M85 300 C 88 320, 85 350, 82 360 L 79 360 C 79 320, 82 300, 85 300 Z" />
      </g>
    </svg>
  );
};

```

---

## Archivo: `components/ProgressChart.tsx`

```typescript
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ExerciseLog, ExerciseName } from '../types';

interface ProgressChartProps {
  logs: ExerciseLog[];
  selectedSessionKeys?: string[];
}

type ChartData = {
  date: string;
  [key: string]: number | string; // ExerciseName as key
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const ProgressChart: React.FC<ProgressChartProps> = ({ logs, selectedSessionKeys }) => {

  const filteredLogs = useMemo(() => {
    if (selectedSessionKeys && selectedSessionKeys.length > 0) {
      return logs.filter(log => selectedSessionKeys.includes(formatDate(log.timestamp)));
    }
    return logs;
  }, [logs, selectedSessionKeys]);

  const chartData = useMemo<ChartData[]>(() => {
    if (filteredLogs.length < 2) return [];

    const dataByDate: Record<string, Record<ExerciseName, number>> = {};
    const exercises = new Set<ExerciseName>();

    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD for sorting
      if (!dataByDate[date]) {
        dataByDate[date] = {} as Record<ExerciseName, number>;
      }
      
      const volume = log.clusters.reduce((acc, cluster) => acc + (cluster.weight * cluster.reps), 0);
      if(volume > 0) {
        if (!dataByDate[date][log.exerciseName]) {
          dataByDate[date][log.exerciseName] = 0;
        }
        dataByDate[date][log.exerciseName] += volume;
        exercises.add(log.exerciseName);
      }
    });

    return Object.entries(dataByDate)
      .map(([date, exerciseVolumes]) => ({
        date: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        ...exerciseVolumes
      }))
       // Correctly sort by date object
      .sort((a, b) => {
          const dateA = new Date(Object.keys(dataByDate).find(key => new Date(key).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) === a.date) || 0);
          const dateB = new Date(Object.keys(dataByDate).find(key => new Date(key).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) === b.date) || 0);
          return dateA.getTime() - dateB.getTime();
      });

  }, [filteredLogs]);
  
  const exerciseNames = useMemo(() => Array.from(
      new Set(filteredLogs.map(log => log.exerciseName).filter(name => 
        filteredLogs.some(l => l.exerciseName === name && l.clusters.some(c => c.weight > 0))
      ))
  ), [filteredLogs]);

  if (chartData.length < 2 || exerciseNames.length === 0) {
    return <p className="text-center text-slate-500 text-sm py-4">No hay suficientes datos de volumen para generar un gráfico en la selección actual.</p>;
  }

  const colors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg">
        <h3 className="text-md font-semibold text-slate-300 mb-4">Progreso de Volumen (Kg)</h3>
        <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend wrapperStyle={{fontSize: "12px"}}/>
            {exerciseNames.map((name, index) => (
                <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                />
            ))}
        </LineChart>
        </ResponsiveContainer>
    </div>
  );
};
```

---

## Archivo: `components/RestSettings.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import type { RestSettings as RestSettingsType } from '../types';

interface RestSettingsProps {
  settings: RestSettingsType;
  onSave: (settings: RestSettingsType) => void;
}

// Local state can have a different shape to handle the form correctly
interface FormState {
    restBetweenSets: string;
    restBetweenExercises: string;
    mode: 'auto' | 'manual';
}

export const RestSettings: React.FC<RestSettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<FormState>({
    restBetweenSets: String(settings.restBetweenSets),
    restBetweenExercises: String(settings.restBetweenExercises),
    mode: settings.mode,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setFormData({
        restBetweenSets: String(settings.restBetweenSets),
        restBetweenExercises: String(settings.restBetweenExercises),
        mode: settings.mode,
    });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setIsSaved(false);
    
    if (type === 'radio') {
        setFormData(prev => ({ ...prev, mode: value as 'auto' | 'manual' }));
    } else { // Handle number inputs
        // Allow the input to be empty, otherwise store the value.
        // The `type="number"` input will prevent non-numeric characters.
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
        restBetweenSets: Number(formData.restBetweenSets) || 0,
        restBetweenExercises: Number(formData.restBetweenExercises) || 0,
        mode: formData.mode,
    });
    setIsSaved(true);
    setIsCollapsed(true);
  };
  
   if (isCollapsed) {
    return (
      <div 
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsCollapsed(false)}
        aria-label="Metas de descanso registradas. Haz clic para editar."
      >
        <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-300">Metas de Descanso Registradas</h2>
                    <p className="text-slate-400 text-sm">Haz clic aquí para editar.</p>
                </div>
            </div>
            <div className='text-right mt-4 sm:mt-0'>
                <p className='text-sm text-slate-400'>Entre Series: <span className='font-bold text-white'>{settings.restBetweenSets}s</span></p>
                <p className='text-sm text-slate-400'>Entre Ejercicios: <span className='font-bold text-white'>{settings.restBetweenExercises}s</span></p>
            </div>
        </div>
      </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div>
                 <h2 className="text-xl font-bold text-slate-300">Metas de Descanso</h2>
                <p className="text-slate-400 mt-1 text-sm">Configura tus tiempos de recuperación.</p>
            </div>
             {!isSaved && (
                <div className="text-amber-400 text-sm font-semibold flex items-center gap-2 animate-pulse mt-2 sm:mt-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Cambios sin guardar
                </div>
            )}
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Time Inputs */}
        <div className="space-y-4">
            <div>
              <label htmlFor="restBetweenSets" className="block text-sm font-medium text-slate-300 mb-1">Descanso entre Series (seg)</label>
              <input type="number" name="restBetweenSets" id="restBetweenSets" value={formData.restBetweenSets} onChange={handleChange} onFocus={handleFocus} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required min="0" />
            </div>
            <div>
              <label htmlFor="restBetweenExercises" className="block text-sm font-medium text-slate-300 mb-1">Descanso entre Ejercicios (seg)</label>
              <input type="number" name="restBetweenExercises" id="restBetweenExercises" value={formData.restBetweenExercises} onChange={handleChange} onFocus={handleFocus} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white" required min="0" />
            </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-4">
            <fieldset>
                <legend className="text-sm font-medium text-slate-300 mb-2">Modo de Descanso</legend>
                <div className="space-y-3">
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="mode-auto" name="mode" type="radio" value="auto" checked={formData.mode === 'auto'} onChange={handleChange} className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-slate-500 bg-slate-600" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="mode-auto" className="font-medium text-slate-200">Descansos automáticos</label>
                            <p className="text-slate-400 text-xs">Se activa los tiempos de forma automática al registrar marcador cardíaco y al finalizar cada ejercicio.</p>
                        </div>
                    </div>
                     <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="mode-manual" name="mode" type="radio" value="manual" checked={formData.mode === 'manual'} onChange={handleChange} className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-slate-500 bg-slate-600" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="mode-manual" className="font-medium text-slate-200">Descansos manual</label>
                            <p className="text-slate-400 text-xs">Al ingresar tu ritmo cardiaco se anexa ingresar tiempos de descanso.</p>
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-cyan-500/30 disabled:bg-slate-600 disabled:cursor-not-allowed">
          Guardar Metas de Descanso
        </button>
      </div>
    </form>
  );
};
```

---

## Archivo: `components/TimeScroller.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import type { ColorTheme } from '../types';

interface TimeScrollerProps {
  value: number; // total seconds
  onChange: (value: number) => void;
  color: ColorTheme;
}

export const TimeScroller: React.FC<TimeScrollerProps> = ({ value, onChange, color }) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Synchronize internal state when the external value prop changes.
    const newMinutes = Math.floor(value / 60);
    const newSeconds = value % 60;
    
    setMinutes(newMinutes);
    setSeconds(newSeconds);
  }, [value]);

  const handleMinutesChange = (newMinutes: number) => {
    const updatedMinutes = Math.max(0, newMinutes);
    setMinutes(updatedMinutes); // for responsiveness
    onChange(updatedMinutes * 60 + seconds);
  };

  const handleSecondsChange = (newSeconds: number) => {
    // Seconds are capped between 0 and 59
    const updatedSeconds = Math.max(0, Math.min(59, newSeconds));
    setSeconds(updatedSeconds); // for responsiveness
    onChange(minutes * 60 + updatedSeconds);
  };

  const renderInput = (
    label: string,
    currentValue: number,
    handler: (val: number) => void,
    step: number = 1
  ) => (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => handler(currentValue + step)}
        className={`w-12 h-8 flex items-center justify-center rounded-t-md bg-slate-700 hover:bg-slate-600 transition-colors text-white font-bold text-lg`}
        aria-label={`Incrementar ${label}`}
      >
        +
      </button>
      <input
        type="number"
        value={String(currentValue).padStart(2, '0')}
        onChange={(e) => handler(parseInt(e.target.value, 10) || 0)}
        onFocus={(e) => e.target.select()}
        className={`w-16 text-center bg-slate-800 border-y border-slate-600 text-3xl font-mono text-white focus:outline-none focus:ring-2 ${color.ring}`}
        min="0"
        max={label === 'seg' ? 59 : undefined}
        aria-label={`Valor de ${label}`}
      />
      <button
        type="button"
        onClick={() => handler(currentValue - step)}
        className={`w-12 h-8 flex items-center justify-center rounded-b-md bg-slate-700 hover:bg-slate-600 transition-colors text-white font-bold text-lg`}
        aria-label={`Decrementar ${label}`}
      >
        -
      </button>
      <span className="text-xs text-slate-400 mt-1 uppercase">{label}</span>
    </div>
  );

  return (
    <div className="flex items-start justify-center gap-2">
      {renderInput('min', minutes, handleMinutesChange)}
      <span className="text-3xl font-mono text-slate-500 pt-8">:</span>
      {renderInput('seg', seconds, handleSecondsChange, 5)}
    </div>
  );
};

```

---

## Archivo: `components/CircularProgress.tsx`

```typescript
import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trailColor?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 60,
  strokeWidth = 6,
  color = '#22d3ee', // cyan-400
  trailColor = 'rgba(255, 255, 255, 0.1)',
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trailColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.35s' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

```

---

## Archivo: `components/AIAnalysisCard.tsx`

```typescript
import React from 'react';

interface AIAnalysisCardProps {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ summary, isLoading, error, onRetry }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4">
          <svg className="animate-spin h-8 w-8 text-indigo-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-300 font-semibold">Analizando tu rendimiento...</p>
          <p className="text-slate-400 text-sm">La IA está preparando tu resumen.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4">
          <p className="text-rose-400 font-semibold mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (summary) {
      // Use dangerouslySetInnerHTML to render markdown-like text (e.g., bolding with asterisks)
      // This is a simple approach. A more robust solution would use a markdown parser.
      const formattedSummary = summary
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-400">$1</strong>') // Bold
        .replace(/\n/g, '<br />'); // Newlines

      return (
        <p
          className="text-slate-300 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedSummary }}
        />
      );
    }

    return null;
  };

  return (
    <div className="mb-8 bg-slate-800/50 backdrop-blur-sm border border-indigo-500/50 rounded-xl shadow-lg p-6 animate-fade-in">
      <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>Análisis de IA de tu Última Sesión</span>
      </h3>
      {renderContent()}
    </div>
  );
};
```

---

## Archivo: `components/AIConversationAssistant.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import type { RoutineType, RoutineFocus, TrainingType, RestSettings, Goals, ExerciseName } from '../types';
import { generateUUID } from '../utils/uuid';

interface AIConversationAssistantProps {
  onComplete: (config: { trainingType: TrainingType, restSettings: RestSettings, goals: Goals }) => void;
  onCancel: () => void;
  selectedExercises: ExerciseName[];
}

type ConversationStep = 'start' | 'askTrainingType' | 'askRest' | 'askGoals' | 'confirming' | 'completed';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text?: string;
  options?: { text: string; value: any }[];
  isProcessing?: boolean;
}

const trainingOptions: { text: string; value: TrainingType }[] = [
  { text: 'Normal', value: 'Normal' },
  { text: 'Clúster', value: 'Clúster' },
  { text: 'Drop Sets', value: 'Drop' },
];

export const AIConversationAssistant: React.FC<AIConversationAssistantProps> = ({ onComplete, onCancel, selectedExercises }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ConversationStep>('start');
  const [builtConfig, setBuiltConfig] = useState<{
      trainingType: TrainingType;
      restSettings: RestSettings;
      goals: Goals;
  }>({
      trainingType: 'Normal',
      restSettings: { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' },
      goals: {}
  });
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessage = (message: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { id: generateUUID(), ...message }]);
  };
  
  const processNextStep = async (currentStep: ConversationStep, value?: any) => {
      setIsProcessing(true);
      
      let nextStep = currentStep;
      let configUpdate = {};

      if (currentStep === 'askTrainingType') {
          configUpdate = { trainingType: value };
          nextStep = 'askRest';
      } else if (currentStep === 'askRest') {
          try {
              const res = await fetch('/api/gemini/parse-rest', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: value }),
              });
              const parsedRest = await res.json();
              configUpdate = {
                  restSettings: {
                      ...builtConfig.restSettings,
                      restBetweenSets: parsedRest.restBetweenSets || 60,
                      restBetweenExercises: parsedRest.restBetweenExercises || 180
                  }
              };
              nextStep = 'askGoals';
          } catch (e) {
              console.warn("Error parsing rest settings, using defaults:", e);
              configUpdate = {
                  restSettings: { ...builtConfig.restSettings, restBetweenSets: 60, restBetweenExercises: 180 }
              };
              nextStep = 'askGoals';
          }
      } else if (currentStep === 'askGoals') {
          try {
              const res = await fetch('/api/gemini/parse-goals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: value, selectedExercises }),
              });
              const data = await res.json();
              const parsedGoalsArray = Array.isArray(data.goals) ? data.goals : [];
              const newGoals: Goals = {};

              parsedGoalsArray.forEach((item: any) => {
                  if (selectedExercises.includes(item.exerciseName)) {
                      const goalData = item.goal || {};
                      const baseGoal = {
                          weight: Number(goalData.weight) || 0,
                          reps: Number(goalData.reps) || 10,
                          series: Number(goalData.series) || 3,
                          totalTime: 60,
                          tempo: '2-0-2-0',
                          isWeighted: (Number(goalData.weight) || 0) > 0,
                          useTempo: false,
                      };
                      if (builtConfig.trainingType === 'Clúster' && baseGoal.series && baseGoal.reps) {
                          const clusterGoals = Array.from({ length: baseGoal.series }, () => ({
                              weight: baseGoal.weight,
                              reps: baseGoal.reps,
                          }));
                          newGoals[item.exerciseName] = { ...baseGoal, clusterGoals };
                      } else {
                          newGoals[item.exerciseName] = baseGoal;
                      }
                  }
              });

              // If no goals were successfully mapped, set standard starter goals
              if (Object.keys(newGoals).length === 0) {
                  selectedExercises.forEach(ex => {
                      newGoals[ex] = {
                          weight: 0,
                          reps: 10,
                          series: 3,
                          totalTime: 60,
                          tempo: '2-0-2-0',
                          isWeighted: false,
                          useTempo: false,
                      };
                  });
              }

              configUpdate = { goals: newGoals };
              nextStep = 'completed';

          } catch (e) {
              console.error("AI Goal Parsing Error:", e);
              // Fallback to standard goals so the user isn't blocked
              const fallbackGoals: Goals = {};
              selectedExercises.forEach(ex => {
                  fallbackGoals[ex] = {
                      weight: 0,
                      reps: 10,
                      series: 3,
                      totalTime: 60,
                      tempo: '2-0-2-0',
                      isWeighted: false,
                      useTempo: false,
                  };
              });
              configUpdate = { goals: fallbackGoals };
              nextStep = 'completed';
          }
      }

      const updatedConfig = { ...builtConfig, ...configUpdate };
      setBuiltConfig(updatedConfig);
      setStep(nextStep);

      // Trigger AI's next message
      setTimeout(() => {
          setIsProcessing(false);
          if (nextStep === 'askRest') {
              addMessage({ sender: 'ai', text: 'Genial. Ahora, dime los tiempos de descanso. Por ejemplo: "60s entre series y 2 minutos entre ejercicios".' });
          } else if (nextStep === 'askGoals') {
              addMessage({ sender: 'ai', text: 'Por último, ¿cuáles son tus metas de peso, series y repeticiones para estos ejercicios?' });
          } else if (nextStep === 'completed') {
              addMessage({ sender: 'ai', text: '¡Perfecto! He configurado tu rutina. Finalizando en un momento...' });
              setTimeout(() => onComplete(updatedConfig), 2000);
          }
      }, 1500);
  };

  useEffect(() => {
    setIsVisible(true);
    addMessage({ sender: 'ai', text: `¡Hola! Veo que has elegido estos ejercicios: ${selectedExercises.join(', ')}. Vamos a configurarlos.`});
    setTimeout(() => {
        addMessage({ sender: 'ai', text: 'Primero, ¿qué método de entrenamiento prefieres?', options: trainingOptions });
        setStep('askTrainingType');
    }, 1500);
  }, []);

  const handleOptionSelect = (option: { text: string; value: any }) => {
    if (isProcessing) return;
    addMessage({ sender: 'user', text: option.text });
    setMessages(prev => {
        const lastMessage = prev[prev.length - 2];
        if (lastMessage?.sender === 'ai') {
            return [...prev.slice(0, -2), { ...lastMessage, options: undefined }, prev[prev.length - 1]];
        }
        return prev;
    });
    processNextStep(step, option.value);
  };

  const handleUserInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing) return;
    addMessage({ sender: 'user', text: userInput });
    processNextStep(step, userInput);
    setUserInput('');
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showTextInput = step === 'askRest' || step === 'askGoals';

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-lg flex flex-col">
            <div className="bg-slate-800 border border-slate-700 rounded-t-xl shadow-2xl p-4 max-h-[70vh] flex flex-col">
                <h2 className="text-lg font-bold text-indigo-400 text-center mb-4 flex-shrink-0">Asistente de Rutina IA</h2>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 animate-fade-in-up ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                            )}
                            <div className={`max-w-xs rounded-lg p-3 ${msg.sender === 'ai' ? 'bg-slate-700 text-slate-200 rounded-bl-none' : 'bg-cyan-600 text-white rounded-br-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                     {isProcessing && (
                        <div className="flex items-end gap-2 justify-start">
                             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </div>
                            <div className="max-w-xs rounded-lg p-3 bg-slate-700 text-slate-200 rounded-bl-none">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                     )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-sm border-x border-b border-slate-700 rounded-b-xl shadow-2xl p-4">
                {messages[messages.length - 1]?.options && !isProcessing && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 animate-fade-in-up">
                        {messages[messages.length - 1].options?.map(option => (
                             <button
                                key={option.value}
                                onClick={() => handleOptionSelect(option)}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 px-2 rounded-lg transition-all duration-300 text-sm"
                             >
                                 {option.text}
                             </button>
                        ))}
                    </div>
                )}
                 {showTextInput && !isProcessing && (
                    <form onSubmit={handleUserInput} className="flex gap-2 animate-fade-in-up">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
                            autoFocus
                        />
                        <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all">
                            Enviar
                        </button>
                    </form>
                 )}
                 <div className="text-center mt-3">
                    <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                        Puedes omitir estos pasos y comenzar con los ejercicios elegidos.
                    </button>
                 </div>
            </div>
        </div>
    </div>
  );
};

```

---

