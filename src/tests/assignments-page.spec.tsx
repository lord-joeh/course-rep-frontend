import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { AssignmentsPage } from '@/pages/assignments/assignments-page';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';

describe('AssignmentsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AssignmentsPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  const mockCourse = {
    id: 'CPEN402',
    name: 'Distributed Systems & Cloud',
    semester: 'FIRST',
    slidesFolderId: 'cpen402-folder',
  };

  const futureDeadline = new Date(Date.now() + 86400000 * 5).toISOString();
  const pastDeadline = new Date(Date.now() - 86400000 * 3).toISOString();

  const mockAssignments = [
    {
      id: 'assign-1',
      title: 'Lab 1: RPC Client-Server',
      description: 'Build a gRPC client-server in Go',
      courseId: 'CPEN402',
      deadline: futureDeadline,
      submissionFolderId: 'folder-1',
      fileId: 'file-1',
      fileName: 'lab1_spec.pdf',
      submissionCount: 8,
      hasSubmitted: false,
      studentSubmission: null,
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'assign-2',
      title: 'Lab 2: Paxos Consensus',
      description: 'Implement distributed Paxos consensus',
      courseId: 'CPEN402',
      deadline: pastDeadline,
      submissionFolderId: 'folder-2',
      fileId: null,
      fileName: null,
      submissionCount: 20,
      hasSubmitted: true,
      studentSubmission: {
        id: 'sub-22',
        fileName: 'my_paxos.zip',
        submittedAt: '2026-11-02T10:00:00.000Z',
      },
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    },
  ];

  it('renders Course Rep view with Create Assignment button and filter counts', async () => {
    // Authenticate as Rep
    authStore.setSession(
      {
        id: 'rep-uuid-1',
        email: 'rep@university.edu',
        name: 'Lead Representative',
        role: 'REP',
        isRep: true,
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
        status: 'active',
      },
      { accessToken: 'mock-token' },
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: {
              items: [mockCourse],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        } as any;
      }
      if (url === '/assignments') {
        return {
          data: {
            success: true,
            data: {
              items: mockAssignments,
              meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
            },
          },
        } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    // Verify Page Header
    expect(
      screen.getByRole('heading', { name: /Course Assignments/i }),
    ).toBeInTheDocument();

    // Reps see the Create Assignment action button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Assignment/i })).toBeInTheDocument();
    });

    // Wait for course and assignment items to render
    await waitFor(() => {
      expect(screen.getByText('Distributed Systems & Cloud')).toBeInTheDocument();
      expect(screen.getByText('Lab 1: RPC Client-Server')).toBeInTheDocument();
      expect(screen.getByText('Lab 2: Paxos Consensus')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Submissions \(8\)/i })).toBeInTheDocument();
    });

    // Verify filter pills
    expect(screen.getByText('All (2)')).toBeInTheDocument();
    expect(screen.getByText('Active (1)')).toBeInTheDocument();
    expect(screen.getByText('With Submissions (2)')).toBeInTheDocument();
    expect(screen.getByText('Closed (1)')).toBeInTheDocument();
  });

  it('filters assignments when status pills are clicked', async () => {
    authStore.setSession(
      {
        id: 'rep-uuid-1',
        email: 'rep@university.edu',
        name: 'Lead Representative',
        role: 'REP',
        isRep: true,
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
        status: 'active',
      },
      { accessToken: 'mock-token' },
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: {
              items: [mockCourse],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        } as any;
      }
      if (url === '/assignments') {
        return {
          data: {
            success: true,
            data: {
              items: mockAssignments,
              meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
            },
          },
        } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Lab 1: RPC Client-Server')).toBeInTheDocument();
      expect(screen.getByText('Lab 2: Paxos Consensus')).toBeInTheDocument();
    });

    // Click "Active (1)"
    fireEvent.click(screen.getByText('Active (1)'));
    expect(screen.getByText('Lab 1: RPC Client-Server')).toBeInTheDocument();
    expect(screen.queryByText('Lab 2: Paxos Consensus')).not.toBeInTheDocument();

    // Click "Closed (1)"
    fireEvent.click(screen.getByText('Closed (1)'));
    expect(screen.queryByText('Lab 1: RPC Client-Server')).not.toBeInTheDocument();
    expect(screen.getByText('Lab 2: Paxos Consensus')).toBeInTheDocument();
  });

  it('renders student view without Create Assignment button or rep actions', async () => {
    authStore.setSession(
      {
        id: 'student-uuid-2',
        email: 'student@university.edu',
        name: 'Student Learner',
        role: 'STUDENT',
        isRep: false,
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
        status: 'active',
      },
      { accessToken: 'mock-student-token' },
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/courses/my-courses') {
        return {
          data: {
            success: true,
            data: [mockCourse],
          },
        } as any;
      }
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: {
              items: [mockCourse],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        } as any;
      }
      if (url === '/assignments') {
        return {
          data: {
            success: true,
            data: {
              items: mockAssignments,
              meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
            },
          },
        } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    // Student should not see Create Assignment button
    expect(screen.queryByRole('button', { name: /Create Assignment/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Lab 1: RPC Client-Server')).toBeInTheDocument();
    });

    // Student should not see View Submissions (roster) button
    expect(screen.queryByRole('button', { name: /View Submissions/i })).not.toBeInTheDocument();

    // Student sees Submit button for active assignment
    expect(screen.getByRole('button', { name: /Submit Solution/i })).toBeInTheDocument();
  });

  it('toggles between Grid and Table views cleanly', async () => {
    authStore.setSession(
      {
        id: 'rep-uuid-1',
        email: 'rep@university.edu',
        name: 'Lead Representative',
        role: 'REP',
        isRep: true,
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
        status: 'active',
      },
      { accessToken: 'mock-token' },
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: {
              items: [mockCourse],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        } as any;
      }
      if (url === '/assignments') {
        return {
          data: {
            success: true,
            data: {
              items: mockAssignments,
              meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
            },
          },
        } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Lab 1: RPC Client-Server')).toBeInTheDocument();
    });

    // Toggle to Table view
    const tableViewBtn = screen.getByTitle('Table View');
    fireEvent.click(tableViewBtn);

    // Verify table headers appear
    expect(screen.getByText('Assignment')).toBeInTheDocument();
    expect(screen.getByText('Deadline')).toBeInTheDocument();
    expect(screen.getByText('Brief')).toBeInTheDocument();
    expect(screen.getByText('Submissions')).toBeInTheDocument();
  });
});
