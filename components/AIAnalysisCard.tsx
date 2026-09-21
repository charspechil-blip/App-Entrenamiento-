import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Clock, Timer, Dumbbell, RefreshCw, BarChart2 } from 'lucide-react';
import type { SessionAnalysisMetrics } from '../types';

interface AIAnalysisCardProps {
  metrics?: SessionAnalysisMetrics | null;
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  metrics,
  summary,
  isLoading,
  error,
  onRetry,
}) => {
  const formattedSummary = summary
    ? summary
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-400 font-semibold">$1</strong>')
        .replace(/\n/g, '<br />')
    : null;

  return (
    <div
      id="ai-session-analysis-card"
      className="mb-8 bg-slate-800/60 backdrop-blur-sm border border-cyan-500/40 rounded-2xl shadow-xl p-5 sm:p-7 text-white animate-fade-in relative overflow-hidden"
    >
      {/* Background subtle decorative gradient */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 mb-5 border-b border-slate-700/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Análisis de IA de tu Última Sesión
            </h3>
            {metrics?.sessionDate ? (
              <p className="text-xs text-slate-400 font-medium capitalize">
                {metrics.sessionDate}
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-medium">
                Métricas de rendimiento y densidad de carga
              </p>
            )}
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="text-slate-400 hover:text-cyan-300 p-2 rounded-lg hover:bg-slate-700/50 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
            title="Actualizar análisis"
            aria-label="Actualizar análisis de IA"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        )}
      </div>

      {/* Main Direct Metrics Section */}
      {metrics && (
        <div className="space-y-4 relative z-10">
          {/* 1. Volumen total completado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/70 border border-slate-700/80 rounded-xl gap-2">
            <div className="flex items-center gap-2.5">
              <Dumbbell className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-slate-200">
                Volumen total completado:
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">
                {metrics.totalVolume.toLocaleString('es-ES')}
              </span>
              <span className="text-sm font-bold text-slate-400 ml-1.5">kg</span>
            </div>
          </div>

          {/* 2. Volumen por ejercicio */}
          <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-xl">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400">
                Volumen por ejercicio
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {metrics.volumeByExercise.length} {metrics.volumeByExercise.length === 1 ? 'ejercicio' : 'ejercicios'}
              </span>
            </div>

            {metrics.volumeByExercise.length > 0 ? (
              <div className="space-y-2 pl-3 border-l-2 border-cyan-500/50">
                {metrics.volumeByExercise.map((ex) => (
                  <div
                    key={ex.exerciseName}
                    className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm py-1 border-b border-slate-800/60 last:border-b-0 gap-1"
                  >
                    <span className="text-slate-200 font-medium truncate pr-2">
                      • {ex.exerciseName}:
                    </span>
                    <div className="flex items-center gap-2 text-left sm:text-right flex-shrink-0">
                      <span className="text-cyan-300 font-bold font-mono">
                        {ex.volume.toLocaleString('es-ES')} kg
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({ex.sets} {ex.sets === 1 ? 'serie' : 'series'}, {ex.reps} reps)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No se registraron cargas con peso en los ejercicios.</p>
            )}
          </div>

          {/* 3 & 4. Tiempo estimado y Total tiempo en descanso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tiempo estimado de sesión */}
            <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                  Tiempo estimado de sesión:
                </span>
              </div>
              <span className="text-base sm:text-lg font-bold text-white font-mono flex-shrink-0">
                {metrics.estimatedSessionDurationFormatted}
              </span>
            </div>

            {/* Total tiempo en descanso */}
            <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Timer className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                  Total tiempo en descanso:
                </span>
              </div>
              <span className="text-base sm:text-lg font-bold text-teal-400 font-mono flex-shrink-0">
                {metrics.totalRestFormatted}
              </span>
            </div>
          </div>

          {/* 5. Densidad de carga */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900/90 to-cyan-950/40 border-2 border-cyan-500/50 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <BarChart2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-white">
                      Densidad de carga:
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    Total de carga trabajada ÷ tiempo de sesión
                  </p>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 self-start sm:self-auto bg-slate-950/60 px-3.5 py-1.5 rounded-lg border border-cyan-500/30">
                <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight">
                  {metrics.loadDensity.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs font-bold text-slate-400">kg/min</span>
              </div>
            </div>

            {/* Comparison with previous session */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 font-medium">
                Comparación vs. sesión anterior:
              </span>

              {metrics.hasPreviousSession && metrics.loadDensityDiffPercent !== null ? (
                metrics.loadDensityDiffPercent > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 self-start sm:self-auto">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{metrics.loadDensityDiffPercent}% de incremento
                  </span>
                ) : metrics.loadDensityDiffPercent < 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-rose-500/15 border border-rose-500/40 text-rose-400 self-start sm:self-auto">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {metrics.loadDensityDiffPercent}% de disminución
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-slate-700/60 border border-slate-600 text-slate-300 self-start sm:self-auto">
                    <Minus className="w-3.5 h-3.5" />
                    0% (igual a la sesión anterior)
                  </span>
                )
              ) : (
                <span className="text-slate-400 italic text-[11px] self-start sm:self-auto">
                  Primera sesión registrada (referencia base)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Qualitative Feedback / Insight */}
      <div className="mt-4 pt-4 border-t border-slate-700/70 relative z-10">
        {isLoading && (
          <div className="flex items-center gap-3 py-2 text-slate-400 text-xs">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Consultando análisis técnico de la IA...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            <span>{error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="text-cyan-400 underline font-semibold hover:text-cyan-300"
            >
              Reintentar
            </button>
          </div>
        )}

        {formattedSummary && !isLoading && (
          <div className="p-3.5 bg-slate-900/50 border border-cyan-500/25 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conclusión técnica de la IA</span>
            </div>
            <p
              className="text-slate-300 text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formattedSummary }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
