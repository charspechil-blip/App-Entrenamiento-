import React from 'react';
import { safeStorage } from '../utils/storage';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearStorageAndReset = () => {
    try {
      safeStorage.clear();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-cyan-400 mb-2">Ha ocurrido un problema al cargar</h1>
            <p className="text-sm text-slate-300 mb-6">
              Detectamos un error inesperado al inicializar la pantalla. Puedes recargar o restablecer los datos guardados si hubo un conflicto de caché.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-700/60 text-xs text-rose-300 text-left font-mono mb-6 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                🔄 Recargar Aplicación
              </button>
              <button
                onClick={this.handleClearStorageAndReset}
                className="w-full bg-slate-700 hover:bg-rose-900/60 text-slate-200 hover:text-rose-200 font-semibold py-2.5 px-4 rounded-lg transition-colors text-xs border border-slate-600"
              >
                🧹 Limpiar Datos de Caché y Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
