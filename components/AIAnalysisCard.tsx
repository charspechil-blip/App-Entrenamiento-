import React from 'react';

interface AIAnalysisCardProps {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ summary, isLoading, error, onRetry }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4">
          <svg className="animate-spin h-8 w-8 text-indigo-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-300 font-semibold">Analizando tu rendimiento...</p>
          <p className="text-slate-400 text-sm">La IA está preparando tu resumen.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4">
          <p className="text-rose-400 font-semibold mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (summary) {
      // Use dangerouslySetInnerHTML to render markdown-like text (e.g., bolding with asterisks)
      // This is a simple approach. A more robust solution would use a markdown parser.
      const formattedSummary = summary
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-400">$1</strong>') // Bold
        .replace(/\n/g, '<br />'); // Newlines

      return (
        <p
          className="text-slate-300 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedSummary }}
        />
      );
    }

    return null;
  };

  return (
    <div className="mb-8 bg-slate-800/50 backdrop-blur-sm border border-indigo-500/50 rounded-xl shadow-lg p-6 animate-fade-in">
      <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>Análisis de IA de tu Última Sesión</span>
      </h3>
      {renderContent()}
    </div>
  );
};