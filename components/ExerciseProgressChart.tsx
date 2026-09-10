
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
}

interface ExerciseProgressChartProps {
  data: ChartDataPoint[];
}

export const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({ data }) => {

  if (data.length < 2) {
    return <p className="text-center text-slate-500 text-sm py-4">Se necesitan al menos dos sesiones para mostrar el progreso.</p>;
  }

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg">
        <h3 className="text-md font-semibold text-slate-300 mb-4">Evolución del Ejercicio</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                    yAxisId="left" 
                    stroke="#38bdf8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: 'Volumen (kg)', angle: -90, position: 'insideLeft', fill: '#9ca3af', dy: 40 }}
                />
                <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#fbbf24" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: 'Peso Máx (kg)', angle: 90, position: 'insideRight', fill: '#9ca3af', dy: -40 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#d1d5db' }}
                />
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Line
                    yAxisId="left"
                    name="Volumen Total"
                    key="totalVolume"
                    type="monotone"
                    dataKey="totalVolume"
                    stroke="#38bdf8" // cyan
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#38bdf8' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                />
                <Line
                    yAxisId="right"
                    name="Peso Máximo"
                    key="maxWeight"
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#fbbf24" // amber
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#fbbf24' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};
