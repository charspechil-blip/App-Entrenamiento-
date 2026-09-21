import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Loader2, 
  Dumbbell, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { 
  CatalogExercise, 
  saveCustomExerciseToCatalog, 
  findExerciseByName,
  extractMuscleGroups
} from '../services/exerciseCatalog';
import type { MuscleGroup } from '../constants/muscles';
import { ExerciseFormData, ExerciseFormStep } from './exercise-form/types';
import { ExerciseStepIndicator } from './exercise-form/ExerciseStepIndicator';
import { Step1Basics } from './exercise-form/Step1Basics';
import { Step2Equipment } from './exercise-form/Step2Equipment';
import { Step3Muscles } from './exercise-form/Step3Muscles';
import { Step4Details } from './exercise-form/Step4Details';
import { AiProposalModal } from './exercise-form/AiProposalModal';

export interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExerciseName: string;
  onExerciseAdded: (exerciseName: string) => void;
  initialExerciseData?: Partial<CatalogExercise>;
}

const DEFAULT_FORM_DATA: ExerciseFormData = {
  name: '',
  category: 'Fuerza',
  secondaryCategories: [],
  description: '',
  image: '',
  equipment: ['Peso corporal'],
  equipmentVariants: [],
  canBeDoneWithoutEquipment: true,
  bodyZones: ['Tren inferior'],
  subzones: ['Piernas'],
  primaryMuscles: ['Cuádriceps', 'Glúteos'],
  secondaryMuscles: ['Isquiotibiales', 'Core'],
  movementType: 'Sentadilla',
  movementPatterns: ['Sentadilla'],
  laterality: 'Bilateral',
  position: 'De pie',
  difficulty: 'Intermedio',
  technicalDescription: '',
  executionSteps: [
    'Adopta la postura inicial correcta manteniendo la alineación y el core activo.',
    'Inicia el movimiento con control excéntrico y respiración adecuada.',
    'Alcanza el rango completo de recorrido sin compensaciones posturales.',
    'Regresa a la posición inicial con contracción sostenida y controlada.'
  ],
  commonErrors: [],
  executionTips: [],
  precautions: 'Mantener la columna neutra y no bloquear articulaciones bruscamente.',
  videoUrl: ''
};

export const CustomExerciseModal: React.FC<CustomExerciseModalProps> = ({
  isOpen,
  onClose,
  initialExerciseName,
  onExerciseAdded,
  initialExerciseData
}) => {
  const [currentStep, setCurrentStep] = useState<ExerciseFormStep>(1);
  const [formData, setFormData] = useState<ExerciseFormData>({ ...DEFAULT_FORM_DATA });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI State
  const [isSearchingWithAI, setIsSearchingWithAI] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [aiProposalOpen, setAiProposalOpen] = useState(false);
  const [pendingAiData, setPendingAiData] = useState<Partial<ExerciseFormData> | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load existing exercise or pre-fill with defaults
  useEffect(() => {
    if (!isOpen) return;

    const trimmedName = initialExerciseName?.trim() || '';
    const existing = initialExerciseData || (trimmedName ? findExerciseByName(trimmedName) : undefined);

    if (existing) {
      setIsEditMode(true);
      const priMuscles = existing.muscles?.primary || existing.musculos_principales || [];
      const secMuscles = existing.muscles?.secondary || existing.musculos_secundarios || [];
      const eqList = existing.equipment || existing.equipamiento || ['Peso corporal'];

      setFormData({
        id: existing.id,
        name: existing.name || existing.nombre || trimmedName,
        category: existing.category || existing.categoria || 'Fuerza',
        secondaryCategories: existing.secondaryCategories || existing.categorias_secundarias || [],
        description: existing.description || existing.descripcion_breve || existing.descripcion || '',
        image: existing.image || existing.imagen || '',
        equipment: eqList,
        equipmentVariants: existing.equipmentVariants || existing.variantes_equipamiento || existing.variantes || [],
        canBeDoneWithoutEquipment: existing.canBeDoneWithoutEquipment !== undefined ? Boolean(existing.canBeDoneWithoutEquipment) : existing.sin_equipamiento_posible !== undefined ? Boolean(existing.sin_equipamiento_posible) : eqList.includes('Peso corporal'),
        bodyZones: existing.bodyZones || existing.zonas_corporales || (existing.zona ? [existing.zona] : ['Tren superior']),
        subzones: existing.subzones || existing.subzonas || (existing.subzona ? [existing.subzona] : []),
        primaryMuscles: priMuscles,
        secondaryMuscles: secMuscles,
        muscleGroups: existing.muscle_groups || extractMuscleGroups(priMuscles, secMuscles),
        movementType: existing.movementType || existing.tipo_movimiento || 'Empuje',
        movementPatterns: existing.movementPattern || existing.patrones_movimiento || (existing.patron_movimiento ? [existing.patron_movimiento] : []),
        laterality: (existing.laterality as any) || (existing.lado_cuerpo as any) || (existing.unilateral ? 'Unilateral' : 'Bilateral'),
        position: existing.position || existing.posicion_principal || 'De pie',
        difficulty: (existing.difficulty as any) || (existing.nivel_dificultad as any) || 'Intermedio',
        technicalDescription: existing.executionDescription || existing.descripcion_tecnica || existing.descripcion || '',
        executionSteps: existing.executionSteps || existing.ejecucion_pasos || DEFAULT_FORM_DATA.executionSteps,
        commonErrors: existing.commonErrors || existing.errores_comunes || [],
        executionTips: existing.executionTips || existing.consejos_ejecucion || [],
        precautions: (existing.precautions ? (Array.isArray(existing.precautions) ? existing.precautions.join('. ') : existing.precautions) : undefined) || (existing.precauciones ? (Array.isArray(existing.precauciones) ? existing.precauciones.join('. ') : existing.precauciones) : DEFAULT_FORM_DATA.precautions),
        videoUrl: existing.videoUrl || existing.video_url || ''
      });
    } else {
      setIsEditMode(false);
      // Smart infer from name for fresh exercises
      const lower = trimmedName.toLowerCase();
      let initCat = 'Fuerza';
      let initEq = ['Peso corporal'];
      let initZones = ['Tren inferior'];
      let initSubzones = ['Piernas'];
      let initPri = ['Cuádriceps', 'Glúteos'];
      let initSec = ['Isquiotibiales'];
      let initType = 'Sentadilla';
      let initPattern = ['Sentadilla'];
      let initPos = 'De pie';

      if (lower.includes('elevaci') || lower.includes('lateral') || lower.includes('vuelo')) {
        initCat = 'Aislamiento';
        initEq = ['Mancuernas'];
        initZones = ['Tren superior'];
        initSubzones = ['Hombros'];
        initPri = ['Deltoides lateral'];
        initSec = ['Deltoides anterior', 'Trapecio'];
        initType = 'Elevación';
        initPattern = ['Aislamiento'];
      } else if (lower.includes('press') || lower.includes('banca') || lower.includes('pecho') || lower.includes('flexi')) {
        initCat = 'Fuerza';
        initEq = lower.includes('flexi') ? ['Peso corporal'] : ['Mancuernas', 'Banco'];
        initZones = ['Tren superior'];
        initSubzones = ['Pecho'];
        initPri = ['Pectoral mayor', 'Tríceps braquial'];
        initSec = ['Deltoides anterior'];
        initType = 'Empuje';
        initPattern = ['Empuje horizontal'];
        initPos = lower.includes('flexi') ? 'Apoyado' : 'Acostado';
      } else if (lower.includes('remo') || lower.includes('jal') || lower.includes('espalda') || lower.includes('dominada')) {
        initCat = 'Fuerza';
        initEq = lower.includes('dominada') ? ['Barra de dominadas', 'Peso corporal'] : ['Polea', 'Mancuernas'];
        initZones = ['Tren superior'];
        initSubzones = ['Espalda'];
        initPri = ['Dorsal ancho', 'Trapecio'];
        initSec = ['Bíceps braquial', 'Romboides'];
        initType = 'Tirón';
        initPattern = lower.includes('jal') || lower.includes('dominada') ? ['Tracción vertical'] : ['Tracción horizontal'];
      } else if (lower.includes('curl') || lower.includes('bicep') || lower.includes('tricep')) {
        initCat = 'Aislamiento';
        initEq = ['Mancuernas'];
        initZones = ['Tren superior'];
        initSubzones = ['Brazos'];
        initPri = lower.includes('tricep') ? ['Tríceps braquial'] : ['Bíceps braquial'];
        initSec = ['Antebrazo'];
        initType = lower.includes('tricep') ? 'Extensión' : 'Flexión';
        initPattern = ['Aislamiento'];
      } else if (lower.includes('plancha') || lower.includes('crunch') || lower.includes('abdom') || lower.includes('core')) {
        initCat = 'Funcional';
        initEq = ['Peso corporal'];
        initZones = ['Core'];
        initSubzones = ['Abdominales'];
        initPri = ['Recto abdominal', 'Oblicuos'];
        initSec = ['Transverso del abdomen'];
        initType = 'Isométrico';
        initPattern = ['Anti-extensión'];
        initPos = 'Apoyado';
      }

      setFormData({
        ...DEFAULT_FORM_DATA,
        name: trimmedName,
        category: initCat,
        equipment: initEq,
        bodyZones: initZones,
        subzones: initSubzones,
        primaryMuscles: initPri,
        secondaryMuscles: initSec,
        movementType: initType,
        movementPatterns: initPattern,
        position: initPos,
        description: trimmedName ? `Ejercicio enfocado en el desarrollo de ${trimmedName}.` : ''
      });
    }

    setCurrentStep(1);
    setErrors({});
    setAiStatusMessage(null);
    setAiSource(null);
    setPendingAiData(null);
  }, [isOpen, initialExerciseName, initialExerciseData]);

  if (!isOpen) return null;

  const updateFormData = (updates: Partial<ExerciseFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    if (updates.name && errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  // Step completion checking for indicator
  const isStepComplete = (step: ExerciseFormStep): boolean => {
    switch (step) {
      case 1:
        return Boolean(formData.name.trim());
      case 2:
        return formData.equipment.length > 0;
      case 3:
        return formData.primaryMuscles.length > 0;
      case 4:
        return Boolean(formData.movementType && formData.difficulty);
      default:
        return false;
    }
  };

  // Validate before advancing
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setErrors({ name: 'El nombre del ejercicio es obligatorio para continuar.' });
        return;
      }
    }
    setErrors({});
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as ExerciseFormStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as ExerciseFormStep);
    }
  };

  // Trigger Gemini AI Web Search Grounding
  const handleGeminiLookup = async () => {
    const searchTarget = formData.name.trim();
    if (!searchTarget) {
      setErrors({ name: 'Escribe el nombre del ejercicio para investigarlo con Gemini.' });
      return;
    }

    setIsSearchingWithAI(true);
    setAiStatusMessage('Investigando biomecánica y equipamiento con Gemini...');

    try {
      const res = await fetch('/api/gemini/lookup-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseName: searchTarget })
      });

      if (!res.ok) {
        throw new Error('No se pudo conectar con el servidor de Gemini.');
      }

      const data = await res.json();
      if (data && data.exercise) {
        const ex = data.exercise;

        const proposed: Partial<ExerciseFormData> = {
          name: ex.name || ex.nombre || searchTarget,
          category: ex.category || ex.categoria || 'Fuerza',
          secondaryCategories: ex.secondaryCategories || ex.categorias_secundarias || [],
          description: ex.description || ex.descripcion_breve || ex.descripcion || '',
          equipment: ex.equipment || ex.equipamiento || ['Peso corporal'],
          equipmentVariants: ex.equipmentVariants || ex.variantes_equipamiento || [],
          canBeDoneWithoutEquipment: ex.canBeDoneWithoutEquipment !== undefined ? Boolean(ex.canBeDoneWithoutEquipment) : Boolean(ex.sin_equipamiento_posible),
          bodyZones: ex.bodyZones || ex.zonas_corporales || (ex.zona ? [ex.zona] : ['Tren superior']),
          subzones: ex.subzones || ex.subzona ? [ex.subzona] : [],
          primaryMuscles: ex.muscles?.primary || ex.musculos_principales || [],
          secondaryMuscles: ex.muscles?.secondary || ex.musculos_secundarios || [],
          movementType: ex.movementType || ex.tipo_movimiento || 'Empuje',
          movementPatterns: ex.movementPattern || ex.patrones_movimiento || [],
          laterality: (ex.laterality as any) || (ex.lado_cuerpo as any) || 'Bilateral',
          position: ex.position || ex.posicion_principal || 'De pie',
          difficulty: (ex.difficulty as any) || (ex.nivel_dificultad as any) || 'Intermedio',
          technicalDescription: ex.executionDescription || ex.descripcion_tecnica || ex.descripcion || '',
          executionSteps: ex.executionSteps || ex.ejecucion_pasos || DEFAULT_FORM_DATA.executionSteps,
          commonErrors: ex.commonErrors || ex.errores_comunes || [],
          executionTips: ex.executionTips || ex.consejos_ejecucion || [],
          precautions: Array.isArray(ex.precautions) ? ex.precautions.join('. ') : ex.precautions || ex.precauciones || DEFAULT_FORM_DATA.precautions,
          videoUrl: ex.videoUrl || ex.video_url || ''
        };

        setPendingAiData(proposed);
        setAiSource(data.source || 'gemini-web-search');
        // Open confirmation modal: "LA IA PROPONE. EL USUARIO CONFIRMA."
        setAiProposalOpen(true);
      }
    } catch (err: any) {
      console.warn('Error during Gemini search:', err);
      setAiStatusMessage('No se pudo completar la búsqueda asistida. Puedes ingresar los datos manualmente.');
    } finally {
      setIsSearchingWithAI(false);
    }
  };

  // User confirmed applying AI proposal
  const handleApplyAiProposal = () => {
    if (pendingAiData) {
      setFormData(prev => ({
        ...prev,
        ...pendingAiData,
        // Preserve current image if already set
        image: prev.image || pendingAiData.image || ''
      }));
      setAiStatusMessage(
        aiSource === 'gemini-web-search'
          ? '✓ Ficha completada con información verificada en la web. Revisa y ajusta cualquier campo.'
          : '✓ Ficha estructurada con análisis biomecánico asistido. Puedes ajustar cualquier campo.'
      );
    }
    setAiProposalOpen(false);
  };

  // Save Exercise
  const handleSaveAndAdd = async () => {
    const exerciseName = formData.name.trim();
    if (!exerciseName) {
      setCurrentStep(1);
      setErrors({ name: 'Por favor ingresa el nombre del ejercicio.' });
      return;
    }

    setIsSaving(true);

    const muscleGroups: MuscleGroup[] = extractMuscleGroups(
      formData.primaryMuscles,
      formData.secondaryMuscles
    );

    const exerciseEntry: Partial<CatalogExercise> & { nombre: string } = {
      id: formData.id,
      nombre: exerciseName,
      name: exerciseName,
      categoria: formData.category,
      category: formData.category,
      categorias_secundarias: formData.secondaryCategories,
      secondaryCategories: formData.secondaryCategories,
      descripcion: formData.description || formData.technicalDescription || `Ejercicio de fuerza para ${exerciseName}.`,
      descripcion_breve: formData.description,
      description: formData.description,
      imagen: formData.image,
      image: formData.image,
      equipamiento: formData.equipment,
      equipment: formData.equipment,
      variantes_equipamiento: formData.equipmentVariants,
      equipmentVariants: formData.equipmentVariants,
      sin_equipamiento_posible: formData.canBeDoneWithoutEquipment,
      canBeDoneWithoutEquipment: formData.canBeDoneWithoutEquipment,
      zonas_corporales: formData.bodyZones,
      bodyZones: formData.bodyZones,
      zona: formData.bodyZones[0] || 'superior',
      subzonas: formData.subzones,
      subzones: formData.subzones,
      musculos_principales: formData.primaryMuscles,
      musculos_secundarios: formData.secondaryMuscles,
      muscles: {
        primary: formData.primaryMuscles,
        secondary: formData.secondaryMuscles
      },
      muscle_groups: muscleGroups,
      tipo_movimiento: formData.movementType,
      movementType: formData.movementType,
      patrones_movimiento: formData.movementPatterns,
      movementPattern: formData.movementPatterns,
      lado_cuerpo: formData.laterality,
      laterality: formData.laterality,
      posicion_principal: formData.position,
      position: formData.position,
      nivel_dificultad: formData.difficulty,
      difficulty: formData.difficulty,
      descripcion_tecnica: formData.technicalDescription,
      executionDescription: formData.technicalDescription,
      ejecucion_pasos: formData.executionSteps,
      executionSteps: formData.executionSteps,
      errores_comunes: formData.commonErrors,
      commonErrors: formData.commonErrors,
      consejos_ejecucion: formData.executionTips,
      executionTips: formData.executionTips,
      precauciones: formData.precautions ? [formData.precautions] : [],
      precautions: formData.precautions ? [formData.precautions] : [],
      video_url: formData.videoUrl,
      videoUrl: formData.videoUrl,
      personalizado: true
    };

    try {
      await saveCustomExerciseToCatalog(exerciseEntry);
      onExerciseAdded(exerciseName);
      onClose();
    } catch (error) {
      console.error('Error saving exercise:', error);
      onExerciseAdded(exerciseName);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-850">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                  {isEditMode ? 'Editar Ficha de Ejercicio' : 'Configurar Ficha de Ejercicio'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Formulario estructurado en 4 pasos • Base de datos rica
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gemini AI Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-cyan-950/40 via-indigo-950/20 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
              <div className="text-xs">
                <span className="font-bold text-cyan-200">Asistente Gemini: </span>
                <span className="text-slate-300">
                  Investiga técnica, anatomía y biomecánica en la web
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGeminiLookup}
              disabled={isSearchingWithAI || !formData.name.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isSearchingWithAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Investigando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✦ Completar con Gemini</span>
                </>
              )}
            </button>
          </div>

          {/* AI Feedback message */}
          {aiStatusMessage && (
            <div className="px-4 sm:px-6 py-2 bg-slate-850 border-b border-slate-800 flex items-center gap-2 text-xs text-emerald-400">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{aiStatusMessage}</span>
            </div>
          )}

          {/* 4-Step Progress Indicator */}
          <ExerciseStepIndicator
            currentStep={currentStep}
            onStepClick={(step) => {
              if (currentStep === 1 && step > 1 && !formData.name.trim()) {
                setErrors({ name: 'El nombre del ejercicio es obligatorio para continuar.' });
                return;
              }
              setErrors({});
              setCurrentStep(step);
            }}
            isStepComplete={isStepComplete}
          />

          {/* Scrollable Step Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {currentStep === 1 && (
              <Step1Basics
                data={formData}
                onChange={updateFormData}
                errors={errors}
              />
            )}

            {currentStep === 2 && (
              <Step2Equipment
                data={formData}
                onChange={updateFormData}
              />
            )}

            {currentStep === 3 && (
              <Step3Muscles
                data={formData}
                onChange={updateFormData}
              />
            )}

            {currentStep === 4 && (
              <Step4Details
                data={formData}
                onChange={updateFormData}
              />
            )}
          </div>

          {/* Modal Footer with Step Navigation & Save */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-850 flex items-center justify-between gap-3">
            {/* Prev Button or Cancel */}
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            )}

            <div className="text-[11px] text-slate-400 hidden sm:block">
              Paso <strong className="text-cyan-300">{currentStep}</strong> de 4
            </div>

            {/* Next or Finish Button */}
            <div className="flex items-center gap-2">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAndAdd}
                  disabled={isSaving || !formData.name.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando en catálogo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{isEditMode ? 'Guardar Cambios' : '✓ Guardar y añadir al catálogo'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Proposal Confirmation Modal */}
      {aiProposalOpen && pendingAiData && (
        <AiProposalModal
          isOpen={aiProposalOpen}
          onClose={() => setAiProposalOpen(false)}
          onConfirmApply={handleApplyAiProposal}
          proposalData={pendingAiData}
          exerciseName={formData.name}
        />
      )}
    </>
  );
};
