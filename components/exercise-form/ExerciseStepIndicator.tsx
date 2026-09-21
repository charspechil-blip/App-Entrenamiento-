import React from 'react';
import { Check, Layers, Dumbbell, Activity, SlidersHorizontal } from 'lucide-react';
import { ExerciseFormStep } from './types';

interface StepIndicatorProps {
  currentStep: ExerciseFormStep;
  onStepClick: (step: ExerciseFormStep) => void;
  isStepComplete: (step: ExerciseFormStep) => boolean;
}

const STEPS: { step: ExerciseFormStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { step: 1, label: 'Básico', icon: Layers },
  { step: 2, label: 'Equipamiento', icon: Dumbbell },
  { step: 3, label: 'Músculos', icon: Activity },
  { step: 4, label: 'Detalles', icon: SlidersHorizontal },
];

export const ExerciseStepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  isStepComplete,
}) => {
  return (
    <nav aria-label="Progreso de configuración de ejercicio" className="w-full bg-slate-900/90 border-b border-slate-800 px-3 sm:px-5 py-3">
      {/* Visual step buttons */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {STEPS.map(({ step, label, icon: Icon }) => {
          const isActive = currentStep === step;
          const isComplete = isStepComplete(step);

          return (
            <button
              key={step}
              type="button"
              onClick={() => onStepClick(step)}
              className={`group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 select-none text-left ${
                isActive
                  ? 'bg-cyan-950/60 border border-cyan-500/60 shadow-sm shadow-cyan-950/50'
                  : isComplete
                  ? 'bg-slate-800/60 border border-emerald-500/40 hover:border-slate-600'
                  : 'bg-slate-850/40 border border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50'
                      : isComplete
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isComplete && !isActive ? <Check className="w-3 h-3 stroke-[2.5]" /> : step}
                </span>
                <Icon
                  className={`w-3.5 h-3.5 hidden xs:inline-block transition-colors ${
                    isActive ? 'text-cyan-400' : isComplete ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                />
              </div>
              <span
                className={`text-[11px] sm:text-xs font-semibold tracking-tight truncate max-w-full ${
                  isActive
                    ? 'text-cyan-200 font-bold'
                    : isComplete
                    ? 'text-slate-300'
                    : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Thin colored progress track */}
      <div className="mt-2.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
    </nav>
  );
};
