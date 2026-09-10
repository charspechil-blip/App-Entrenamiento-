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
