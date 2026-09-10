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
