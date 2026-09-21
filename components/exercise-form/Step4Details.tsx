import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  AlertTriangle, 
  Lightbulb, 
  Video, 
  Plus, 
  X, 
  CheckCircle2, 
  Eye, 
  Dumbbell, 
  Activity, 
  ShieldAlert,
  Flame
} from 'lucide-react';
import { ExerciseFormData } from './types';

interface Step4DetailsProps {
  data: ExerciseFormData;
  onChange: (updates: Partial<ExerciseFormData>) => void;
}

export const MOVEMENT_TYPES = [
  'Empuje',
  'Tirón',
  'Sentadilla',
  'Bisagra de cadera',
  'Locomoción',
  'Rotación',
  'Anti-rotación',
  'Flexión',
  'Extensión',
  'Elevación',
  'Isométrico',
  'Otro'
];

export const MOVEMENT_PATTERNS = [
  'Empuje horizontal',
  'Empuje vertical',
  'Tracción horizontal',
  'Tracción vertical',
  'Dominante de rodilla',
  'Dominante de cadera',
  'Anti-extensión',
  'Anti-rotación',
  'Aislamiento'
];

export const POSITIONS = [
  'De pie',
  'Sentado',
  'Acostado',
  'Arrodillado',
  'Colgado',
  'Apoyado',
  'Otro'
];

export const Step4Details: React.FC<Step4DetailsProps> = ({ data, onChange }) => {
  const [newErrorInput, setNewErrorInput] = useState('');
  const [newTipInput, setNewTipInput] = useState('');

  const handleTogglePattern = (pat: string) => {
    const exists = data.movementPatterns.includes(pat);
    if (exists) {
      onChange({ movementPatterns: data.movementPatterns.filter(p => p !== pat) });
    } else {
      onChange({ movementPatterns: [...data.movementPatterns, pat] });
    }
  };

  const handleAddError = () => {
    const trimmed = newErrorInput.trim();
    if (!trimmed) return;
    onChange({ commonErrors: [...data.commonErrors, trimmed] });
    setNewErrorInput('');
  };

  const handleRemoveError = (idx: number) => {
    onChange({ commonErrors: data.commonErrors.filter((_, i) => i !== idx) });
  };

  const handleAddTip = () => {
    const trimmed = newTipInput.trim();
    if (!trimmed) return;
    onChange({ executionTips: [...data.executionTips, trimmed] });
    setNewTipInput('');
  };

  const handleRemoveTip = (idx: number) => {
    onChange({ executionTips: data.executionTips.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Biomechanical Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Movement Type */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1.5">
            Tipo de Movimiento
          </label>
          <select
            value={data.movementType}
            onChange={(e) => onChange({ movementType: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-medium"
          >
            {MOVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1.5">
            Posición Principal
          </label>
          <select
            value={data.position}
            onChange={(e) => onChange({ position: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-medium"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Laterality & Difficulty Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Laterality Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Lado del Cuerpo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Bilateral', 'Unilateral', 'Alternado'] as const).map((lat) => {
              const active = data.laterality === lat;
              return (
                <button
                  key={lat}
                  type="button"
                  onClick={() => onChange({ laterality: lat })}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-500/50'
                      : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Nivel de Dificultad
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { level: 'Principiante', color: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40' },
              { level: 'Intermedio', color: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40' },
              { level: 'Avanzado', color: 'border-amber-500/50 text-amber-300 bg-amber-950/40' }
            ].map(({ level, color }) => {
              const active = data.difficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange({ difficulty: level as any })}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                    active
                      ? `${color} ring-1`
                      : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Movement Pattern (Multi-select) */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Patrones de Movimiento
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MOVEMENT_PATTERNS.map((pat) => {
            const isSelected = data.movementPatterns.includes(pat);
            return (
              <button
                key={pat}
                type="button"
                onClick={() => handleTogglePattern(pat)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400/60 text-cyan-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}{pat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Technical Execution Description */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Descripción Técnica de Ejecución
        </label>
        <textarea
          rows={3}
          value={data.technicalDescription}
          onChange={(e) => onChange({ technicalDescription: e.target.value })}
          placeholder="Describe la posición inicial, trayectoria del movimiento, alineación de articulaciones y cadencia de respiración..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs leading-relaxed"
        />
      </div>

      {/* Common Errors */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Errores Comunes a Evitar</span>
          </label>
          <span className="text-[11px] text-slate-400">{data.commonErrors.length} registrados</span>
        </div>

        {data.commonErrors.length > 0 && (
          <ul className="space-y-1.5 mb-2.5">
            {data.commonErrors.map((err, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span>{err}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveError(idx)}
                  className="hover:text-rose-400 p-1 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newErrorInput}
            onChange={(e) => setNewErrorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddError();
              }
            }}
            placeholder="Añadir error común (ej: Balancear el tronco hacia atrás)..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
          />
          <button
            type="button"
            onClick={handleAddError}
            disabled={!newErrorInput.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      {/* Execution Tips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consejos y Tips de Técnica</span>
          </label>
          <span className="text-[11px] text-slate-400">{data.executionTips.length} registrados</span>
        </div>

        {data.executionTips.length > 0 && (
          <ul className="space-y-1.5 mb-2.5">
            {data.executionTips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{tip}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTip(idx)}
                  className="hover:text-rose-400 p-1 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTipInput}
            onChange={(e) => setNewTipInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTip();
              }
            }}
            placeholder="Añadir consejo clave (ej: Piensa en empujar hacia afuera, no hacia arriba)..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
          />
          <button
            type="button"
            onClick={handleAddTip}
            disabled={!newTipInput.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      {/* Precautions / Articular Safety */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-rose-300 mb-1.5 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Precauciones y Cuidado Articular</span>
        </label>
        <textarea
          rows={2}
          value={data.precautions}
          onChange={(e) => onChange({ precautions: e.target.value })}
          placeholder="Advertencias posturales, rango de movimiento seguro para los hombros o lumbares..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
        />
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          <span>Video de Ejecución (URL de YouTube o demostración)</span>
        </label>
        <input
          type="url"
          value={data.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-mono"
        />
      </div>

      {/* LIVE PREVIEW CARD (Previsualización idéntica al catálogo) */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-3 text-cyan-300">
          <Eye className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Previsualización de la Ficha en el Catálogo
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 border border-cyan-500/30 shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {data.category || 'Fuerza'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {data.difficulty}
                </span>
                <span className="text-[11px] text-slate-400">
                  {data.laterality}
                </span>
              </div>
              <h4 className="text-base font-bold text-white leading-snug">
                {data.name || 'Nombre del ejercicio'}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2">
                {data.description || data.technicalDescription || 'Sin descripción breve ingresada.'}
              </p>
            </div>

            {/* Thumbnail if present */}
            {data.image && (
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                <img src={data.image} alt="Miniatura" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Equipment Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-1">
              <Dumbbell className="w-3 h-3 text-slate-400" />
              Equipamiento:
            </span>
            {data.equipment.map(eq => (
              <span key={eq} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-medium">
                {eq}
              </span>
            ))}
          </div>

          {/* Muscles summary in preview */}
          <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              {data.primaryMuscles.length > 0 && (
                <div className="text-[11px] text-cyan-300">
                  <span className="font-bold text-cyan-400">Principales: </span>
                  {data.primaryMuscles.join(', ')}
                </div>
              )}
              {data.secondaryMuscles.length > 0 && (
                <div className="text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300">Secundarios: </span>
                  {data.secondaryMuscles.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
