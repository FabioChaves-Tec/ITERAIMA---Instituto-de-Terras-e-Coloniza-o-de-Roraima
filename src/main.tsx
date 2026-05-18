import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, errorInfo: string}> {
  public state = { hasError: false, errorInfo: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#e3fffb] p-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-[#00640f]/5 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m14.5 9-5 5"/><path d="m9.5 9 5 5"/></svg>
            </div>
            <h2 className="text-2xl font-black text-[#04201e] font-headline mb-2">Ops! Algo deu errado</h2>
            <p className="text-sm text-[#4f5e80] mb-8">{this.state.errorInfo}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#00640f] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#00640f]/20 active:scale-95 transition-all"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
