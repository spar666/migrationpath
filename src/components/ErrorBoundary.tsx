import React, { ReactNode, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details
    console.error('Error caught by boundary:', error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    if (import.meta.env.VITE_ENV === 'production') {
      // TODO: Implement error tracking
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <h1 className="text-lg font-semibold">Something went wrong</h1>
            </div>

            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-mono text-muted-foreground hover:text-foreground">
                  Error details (development only)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <Button onClick={this.handleReset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier usage
export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
};
