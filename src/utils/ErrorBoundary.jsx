import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Error Boundary to catch any loading issues
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6">
          <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">Application Error</h1>
          <p className="text-slate-600 mb-4 max-w-md text-center">
            Something went wrong loading the application. Please refresh the page.
          </p>
          <details className="bg-white p-4 rounded border border-red-300 max-w-md w-full">
            <summary className="font-semibold text-red-700 cursor-pointer">Error Details</summary>
            <pre className="mt-2 text-xs overflow-auto text-red-600">
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading fallback
export function AppLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
      <RefreshCw className="w-12 h-12 animate-spin text-red-700 mb-4" />
      <h2 className="text-2xl font-bold text-red-800">DRK Institute Loading...</h2>
      <p className="text-slate-600 mt-2">Please wait while we initialize the application</p>
    </div>
  );
}
