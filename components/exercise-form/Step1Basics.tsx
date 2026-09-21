import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, Tag } from 'lucide-react';
import { ExerciseFormData } from './types';

interface Step1BasicsProps {
  data: ExerciseFormData;
  onChange: (updates: Partial<ExerciseFormData>) => void;
  errors?: Record<string, string>;
}

export const CATEGORY_OPTIONS = [
  'Fuerza',
  'Hipertrofia',
  'Aislamiento',
  'Funcional',
  'Cardio',
  'Movilidad',
  'Estiramiento',
  'Pliometría',
  'Potencia',
  'Otro'
];

export const Step1Basics: React.FC<Step1BasicsProps> = ({ data, onChange, errors }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onChange({ image: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleSecondaryCategory = (cat: string) => {
    if (cat === data.category) return;
    const exists = data.secondaryCategories.includes(cat);
    if (exists) {
      onChange({ secondaryCategories: data.secondaryCategories.filter(c => c !== cat) });
    } else {
      onChange({ secondaryCategories: [...data.secondaryCategories, cat] });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Exercise Name */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="exercise-name-input" className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <span>Nombre del Ejercicio</span>
            <span className="text-rose-400">*</span>
          </label>
          <span className="text-[11px] text-slate-400">Obligatorio</span>
        </div>
        <input
          id="exercise-name-input"
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ej: Sentadilla búlgara, Press militar con barra..."
          className={`w-full bg-slate-800/90 border rounded-xl py-3 px-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
            errors?.name
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'
          }`}
        />
        {errors?.name && (
          <p className="mt-1 text-xs text-rose-400 font-medium">{errors.name}</p>
        )}
      </div>

      {/* Main Category Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Categoría Principal</span>
          </label>
          <span className="text-[11px] text-slate-400">Selecciona una</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = data.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  // If changing primary category, remove it from secondary if it was there
                  const newSecondary = data.secondaryCategories.filter(c => c !== cat);
                  onChange({ category: cat, secondaryCategories: newSecondary });
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all select-none text-center ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-950/60 ring-1 ring-cyan-500/50'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600'
                }`}
              >
                {isSelected ? '✓ ' : ''}{cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Categories (Multi-select) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>Categorías Secundarias</span>
            <span className="text-[10px] font-normal text-slate-400">(Opcional)</span>
          </label>
          <span className="text-[11px] text-slate-400">Puedes marcar varias</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_OPTIONS.filter(c => c !== data.category).map((cat) => {
            const active = data.secondaryCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleToggleSecondaryCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  active
                    ? 'bg-indigo-950/50 border-indigo-400/60 text-indigo-200'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {active ? '✓ ' : '+ '}{cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Short Description (Max 200 chars) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="exercise-desc-input" className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Descripción Breve
          </label>
          <span className={`text-[11px] ${data.description.length > 200 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            {data.description.length}/200
          </span>
        </div>
        <textarea
          id="exercise-desc-input"
          rows={3}
          maxLength={200}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Breve resumen del ejercicio, objetivo y sensaciones principales..."
          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs leading-relaxed"
        />
      </div>

      {/* Exercise Image Upload & Preview */}
      <div className="pt-2 border-t border-slate-800/80">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
          Imagen o Foto del Ejercicio
        </label>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-850/70 p-3.5 rounded-xl border border-slate-800">
          {/* Preview Box */}
          <div className="w-28 h-28 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
            {data.image ? (
              <img
                src={data.image}
                alt="Vista previa del ejercicio"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-500 gap-1 p-2 text-center">
                <ImageIcon className="w-7 h-7" />
                <span className="text-[10px]">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex-1 w-full space-y-2">
            <p className="text-xs text-slate-300">
              Agrega una foto o captura de tu técnica para reconocerlo rápidamente en tu rutina.
            </p>
            
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="exercise-file-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{data.image ? 'Cambiar imagen' : 'Subir imagen o foto'}</span>
              </button>

              {data.image && (
                <button
                  type="button"
                  onClick={() => onChange({ image: '' })}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
