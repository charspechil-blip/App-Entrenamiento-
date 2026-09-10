import React, { useState, useEffect } from 'react';
import type { ColorTheme } from '../types';

interface TimeScrollerProps {
  value: number; // total seconds
  onChange: (value: number) => void;
  color: ColorTheme;
}

export const TimeScroller: React.FC<TimeScrollerProps> = ({ value, onChange, color }) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Synchronize internal state when the external value prop changes.
    const newMinutes = Math.floor(value / 60);
    const newSeconds = value % 60;
    
    setMinutes(newMinutes);
    setSeconds(newSeconds);
  }, [value]);

  const handleMinutesChange = (newMinutes: number) => {
    const updatedMinutes = Math.max(0, newMinutes);
    setMinutes(updatedMinutes); // for responsiveness
    onChange(updatedMinutes * 60 + seconds);
  };

  const handleSecondsChange = (newSeconds: number) => {
    // Seconds are capped between 0 and 59
    const updatedSeconds = Math.max(0, Math.min(59, newSeconds));
    setSeconds(updatedSeconds); // for responsiveness
    onChange(minutes * 60 + updatedSeconds);
  };

  const renderInput = (
    label: string,
    currentValue: number,
    handler: (val: number) => void,
    step: number = 1
  ) => (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => handler(currentValue + step)}
        className={`w-12 h-8 flex items-center justify-center rounded-t-md bg-slate-700 hover:bg-slate-600 transition-colors text-white font-bold text-lg`}
        aria-label={`Incrementar ${label}`}
      >
        +
      </button>
      <input
        type="number"
        value={String(currentValue).padStart(2, '0')}
        onChange={(e) => handler(parseInt(e.target.value, 10) || 0)}
        onFocus={(e) => e.target.select()}
        className={`w-16 text-center bg-slate-800 border-y border-slate-600 text-3xl font-mono text-white focus:outline-none focus:ring-2 ${color.ring}`}
        min="0"
        max={label === 'seg' ? 59 : undefined}
        aria-label={`Valor de ${label}`}
      />
      <button
        type="button"
        onClick={() => handler(currentValue - step)}
        className={`w-12 h-8 flex items-center justify-center rounded-b-md bg-slate-700 hover:bg-slate-600 transition-colors text-white font-bold text-lg`}
        aria-label={`Decrementar ${label}`}
      >
        -
      </button>
      <span className="text-xs text-slate-400 mt-1 uppercase">{label}</span>
    </div>
  );

  return (
    <div className="flex items-start justify-center gap-2">
      {renderInput('min', minutes, handleMinutesChange)}
      <span className="text-3xl font-mono text-slate-500 pt-8">:</span>
      {renderInput('seg', seconds, handleSecondsChange, 5)}
    </div>
  );
};
