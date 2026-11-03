import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
          <Card className="max-w-lg w-full border border-border bg-card">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-destructive mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Application Encountered an Error</CardTitle>
              <CardDescription>
                Something unexpected happened while rendering this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {this.state.error && (
                <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-40 border border-border">
                  {this.state.error.message}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center gap-3">
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
