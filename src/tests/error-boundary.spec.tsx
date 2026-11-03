import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/common/error-boundary';

function BuggyComponent(): React.ReactNode {
  throw new Error('Explosive component failure');
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Smooth sailing</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Smooth sailing')).toBeInTheDocument();
  });

  it('catches render error and displays recovery card with error message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Application Encountered an Error')).toBeInTheDocument();
    expect(screen.getByText('Explosive component failure')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
