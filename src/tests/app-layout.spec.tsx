import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/app-layout';
import { ThemeProvider } from '@/components/theme-provider';

describe('AppLayout & Sidebar', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const dummyRep = {
    id: 'REP-101',
    name: 'Alexander Rep',
    email: 'rep@univ.edu',
    isRep: true,
  };

  const dummyStudent = {
    id: 'STU-202',
    name: 'Samantha Student',
    email: 'student@univ.edu',
    isRep: false,
  };

  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>{ui}</BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>,
    );

  it('renders Rep navigation items when user is a course representative', () => {
    renderWithProviders(<AppLayout user={dummyRep} />);

    expect(screen.getAllByText('CourseRep')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Students')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Security Audit')[0]).toBeInTheDocument();
  });

  it('hides rep-only navigation items when user is a student', () => {
    renderWithProviders(<AppLayout user={dummyStudent} />);

    expect(screen.queryByText('Security Audit')).not.toBeInTheDocument();
    expect(screen.queryByText('Queue Admin')).not.toBeInTheDocument();
    expect(screen.getAllByText('My Courses')[0]).toBeInTheDocument();
  });

  it('toggles desktop sidebar collapse state', () => {
    renderWithProviders(<AppLayout user={dummyRep} />);

    const collapseBtn = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(collapseBtn);

    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });
});
