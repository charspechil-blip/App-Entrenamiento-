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
      
      const clusters = Array.isArray(log?.clusters) ? log.clusters : [];
      const volume = clusters.reduce((acc, cluster) => acc + ((Number(cluster?.weight) || 0) * (Number(cluster?.reps) || 0)), 0);
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