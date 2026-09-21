import { MuscleGroup } from '../../constants/muscles';

export interface ExerciseFormData {
  id?: string;
  name: string;
  category: string;
  secondaryCategories: string[];
  description: string;
  image?: string;
  
  // Equipment
  equipment: string[];
  equipmentVariants: string[];
  canBeDoneWithoutEquipment: boolean;

  // Muscles & Anatomy
  bodyZones: string[];
  subzones: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  muscleGroups?: MuscleGroup[];

  // Details & Biomechanics
  movementType: string;
  movementPatterns: string[];
  laterality: 'Bilateral' | 'Unilateral' | 'Alternado';
  position: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  technicalDescription: string;
  executionSteps: string[];
  commonErrors: string[];
  executionTips: string[];
  precautions: string;
  videoUrl: string;
}

export type ExerciseFormStep = 1 | 2 | 3 | 4;
