import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        readable = `${parsed.error}${parsed.path ? ` (${parsed.operationType} ${parsed.path})` : ''}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] dark:bg-[#0e0d0c] text-[#29231e] dark:text-[#f5f4f0] px-6">
          <div className="max-w-md w-full rounded-3xl bg-[#f3f2ed] dark:bg-[#171614] border border-black/10 dark:border-white/10 p-7 text-center">
            <h1 className="text-[22px] font-semibold mb-2">Something went wrong</h1>
            <p className="text-[14px] text-[#6b645c] dark:text-[#a39c93] mb-6 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[14px] font-semibold cursor-pointer"
            >
              Reload Luancer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
