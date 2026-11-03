import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { CourseSlidesPage } from '@/pages/slides/course-slides-page';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';

describe('CourseSlidesPage', () => {
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
          <CourseSlidesPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  const mockCourse = {
    id: 'CSC401',
    name: 'Advanced Operating Systems',
    semester: 'FIRST',
    slidesFolderId: 'folder-csc401-id',
  };

  const mockSlides = [
    {
      id: 'slide-1',
      driveFileId: 'drive-file-1',
      fileName: 'CSC401-Architecture-Deck.pptx',
      courseId: 'CSC401',
      hash: 'sha256pptxhash',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'slide-2',
      driveFileId: 'drive-file-2',
      fileName: 'CSC401-Kernel-Walkthrough.mp4',
      courseId: 'CSC401',
      hash: 'sha256mp4hash',
      createdAt: '2026-11-02T15:00:00.000Z',
      updatedAt: '2026-11-02T15:00:00.000Z',
    },
  ];

  it('renders Course Rep view with upload button and material count pills', async () => {
    // Authenticate as Rep
    authStore.setSession(
      {
        id: 'rep-uuid-1',
        email: 'rep@university.edu',
        name: 'Rep Commander',
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
      if (url === '/slides') {
        return {
          data: {
            success: true,
            data: {
              items: mockSlides,
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
      screen.getByRole('heading', { name: /Course Slides & Video Recordings/i }),
    ).toBeInTheDocument();

    // Reps see the Upload Materials action button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Materials/i })).toBeInTheDocument();
    });

    // Verify slide and video items rendered in Grid and course metadata
    await waitFor(() => {
      expect(screen.getByText('Advanced Operating Systems')).toBeInTheDocument();
      expect(screen.getByText('CSC401-Architecture-Deck.pptx')).toBeInTheDocument();
      expect(screen.getByText('CSC401-Kernel-Walkthrough.mp4')).toBeInTheDocument();
      expect(screen.getByText('Video Lecture')).toBeInTheDocument();
    });

    // Verify filter pills
    expect(screen.getByText('All (2)')).toBeInTheDocument();
    expect(screen.getByText('Slides (1)')).toBeInTheDocument();
    expect(screen.getByText('Videos (1)')).toBeInTheDocument();
  });

  it('filters by Videos and Slides when filter pills are clicked', async () => {
    authStore.setSession(
      {
        id: 'rep-uuid-1',
        email: 'rep@university.edu',
        name: 'Rep Commander',
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
      if (url === '/slides') {
        return {
          data: {
            success: true,
            data: {
              items: mockSlides,
              meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
            },
          },
        } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('CSC401-Architecture-Deck.pptx')).toBeInTheDocument();
      expect(screen.getByText('CSC401-Kernel-Walkthrough.mp4')).toBeInTheDocument();
    });

    // Click "Videos (1)"
    fireEvent.click(screen.getByText('Videos (1)'));
    expect(screen.queryByText('CSC401-Architecture-Deck.pptx')).not.toBeInTheDocument();
    expect(screen.getByText('CSC401-Kernel-Walkthrough.mp4')).toBeInTheDocument();

    // Click "Slides (1)"
    fireEvent.click(screen.getByText('Slides (1)'));
    expect(screen.getByText('CSC401-Architecture-Deck.pptx')).toBeInTheDocument();
    expect(screen.queryByText('CSC401-Kernel-Walkthrough.mp4')).not.toBeInTheDocument();
  });

  it('renders student view without upload button or rep delete buttons', async () => {
    // Authenticate as Student
    authStore.setSession(
      {
        id: 'student-uuid-9',
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
      if (url === '/slides') {
        return {
          data: {
            success: true,
            data: {
              items: mockSlides,
              meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
            },
          },
        } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    // Student should NOT see the Upload button
    expect(screen.queryByRole('button', { name: /Upload Materials/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('CSC401-Architecture-Deck.pptx')).toBeInTheDocument();
    });

    // Student should NOT see any Delete buttons
    expect(screen.queryByTitle('Delete Slide')).not.toBeInTheDocument();
  });

  it('switches between Grid and Table views smoothly', async () => {
    authStore.setSession(
      {
        id: 'rep-uuid-1',
        email: 'rep@university.edu',
        name: 'Rep Commander',
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
      if (url === '/slides') {
        return {
          data: {
            success: true,
            data: {
              items: mockSlides,
              meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
            },
          },
        } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('CSC401-Architecture-Deck.pptx')).toBeInTheDocument();
    });

    // Switch to Table View
    const tableViewBtn = screen.getByTitle('Table View');
    fireEvent.click(tableViewBtn);

    // Verify table headers appear
    expect(screen.getByText('Integrity Hash')).toBeInTheDocument();
    expect(screen.getByText('Date Added')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});

