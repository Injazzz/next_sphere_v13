"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Analytics Dashboard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className='border-destructive'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-destructive'>
                <AlertTriangle className='h-5 w-5' />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                An error occurred while loading the analytics dashboard. Please
                try refreshing the page.
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant='outline'
                size='sm'
                className='gap-2'
              >
                <RefreshCw className='h-4 w-4' />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}
