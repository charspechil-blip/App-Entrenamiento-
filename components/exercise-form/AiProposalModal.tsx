import React from 'react';
import { Sparkles, Check, X, Dumbbell, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { ExerciseFormData } from './types';

interface AiProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmApply: () => void;
  proposalData: Partial<ExerciseFormData>;
  exerciseName: string;
}

export const AiProposalModal: React.FC<AiProposalModalProps> = ({
  isOpen,
  onClose,
  onConfirmApply,
  proposalData,
  exerciseName,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-proposal-title"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/60 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="ai-proposal-title" className="text-sm sm:text-base font-bold text-white leading-tight">
                Propuesta de Gemini para la Ficha
              </h3>
              <p className="text-[11px] text-cyan-300">
                La IA propone • Tú decides si aplicarla
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cerrar propuesta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300">
              Gemini ha investigado <strong className="text-white">"{exerciseName}"</strong>. Puedes aplicar estos datos a los 4 pasos del formulario y después editar o afinar cualquier casilla libremente.
            </p>
          </div>

          <div className="space-y-3 bg-slate-850 p-4 rounded-xl border border-slate-800">
            {/* Category & Difficulty */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Categoría & Dificultad:</span>
              <span className="font-bold text-cyan-300">
                {proposalData.category || 'Fuerza'} • {proposalData.difficulty || 'Intermedio'}
              </span>
            </div>

            {/* Equipment */}
            <div className="space-y-1 pb-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-cyan-400" />
                Equipamiento propuesto:
              </span>
              <div className="flex flex-wrap gap-1">
                {(proposalData.equipment || ['Peso corporal']).map(eq => (
                  <span key={eq} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px]">
                    {eq}
                  </span>
                ))}
              </div>
            </div>

            {/* Muscles */}
            <div className="space-y-1 pb-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                Músculos principales y secundarios:
              </span>
              {proposalData.primaryMuscles && proposalData.primaryMuscles.length > 0 && (
                <div className="text-[11px] text-cyan-300">
                  <strong className="text-cyan-400">Principales: </strong>
                  {proposalData.primaryMuscles.join(', ')}
                </div>
              )}
              {proposalData.secondaryMuscles && proposalData.secondaryMuscles.length > 0 && (
                <div className="text-[11px] text-slate-400">
                  <strong className="text-slate-300">Secundarios: </strong>
                  {proposalData.secondaryMuscles.join(', ')}
                </div>
              )}
            </div>

            {/* Biomechanics */}
            <div className="space-y-1">
              <span className="text-slate-400">Tipo & Patrón:</span>
              <div className="text-slate-200">
                {proposalData.movementType} ({proposalData.laterality}) • {proposalData.position}
              </div>
            </div>

            {/* Description Preview */}
            {proposalData.description && (
              <div className="pt-2 border-t border-slate-800 text-slate-300 italic">
                "{proposalData.description}"
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-850 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Mantener mis datos actuales
          </button>
          <button
            type="button"
            onClick={onConfirmApply}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/40 transition-all"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Aplicar propuesta a la ficha</span>
          </button>
        </div>
      </div>
    </div>
  );
};
