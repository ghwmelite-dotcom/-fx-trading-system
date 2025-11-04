import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error('Error caught by boundary:', error, errorInfo);
    
    // You can also log to an error reporting service here
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="text-red-400 mb-4" size={64} />
              <h1 className="text-2xl font-bold text-white mb-3">Something Went Wrong</h1>
              <p className="text-red-200 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <div className="w-full space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-medium"
                >
                  Reload Application
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-medium"
                >
                  Try Again
                </button>
              </div>
              
              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 w-full text-left">
                  <summary className="cursor-pointer text-sm text-red-300 hover:text-red-200">
                    Error Details (Dev Only)
                  </summary>
                  <div className="mt-2 p-3 bg-slate-900 rounded-lg text-xs text-red-200 overflow-auto max-h-40">
                    <pre>{this.state.error.toString()}</pre>
                    <pre className="mt-2">{this.state.errorInfo?.componentStack}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;