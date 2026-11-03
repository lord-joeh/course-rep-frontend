import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CourseCatalogPage } from '@/pages/courses/course-catalog-page';
import { apiClient } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import type { Course } from '@/types';

describe('CourseCatalogPage', () => {
  let queryClient: QueryClient;

  const mockCourses: Course[] = [
    {
      id: 'CPEN401',
      name: 'Advanced Software Engineering',
      lecturerId: 'lec-1',
      lecturer: {
        id: 'lec-1',
        name: 'Dr. John von Neumann',
        email: 'vonneumann@ias.edu',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      day: 'Monday',
      startTime: '09:00',
      endTime: '11:00',
      semester: 'First Semester',
      slidesFolderId: 'folder-1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'CPEN402',
      name: 'Distributed Systems & Cloud',
      lecturerId: null,
      lecturer: null,
      day: 'Wednesday',
      startTime: '13:00',
      endTime: '15:00',
      semester: 'First Semester',
      slidesFolderId: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

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
          <CourseCatalogPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders Course Catalog header and courses for Course Rep', async () => {
    authStore.setSession(
      {
        id: 'rep-1',
        name: 'Lead Representative',
        email: 'rep@univ.edu',
        isRep: true,
        status: 'active',
      },
      'fake-token',
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: { items: mockCourses, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } },
          },
        } as any;
      }
      if (url === '/courses/my-courses') {
        return { data: { success: true, data: [] } } as any;
      }
      return { data: { success: true, data: {} } } as any;
    });

    renderComponent();

    expect(screen.getByRole('heading', { name: /Course Management & Catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Course/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('CPEN401')).toBeInTheDocument();
      expect(screen.getByText('Advanced Software Engineering')).toBeInTheDocument();
      expect(screen.getByText('CPEN402')).toBeInTheDocument();
    });
  });

  it('renders student mode with My Enrolled Courses tab and enrollment button', async () => {
    authStore.setSession(
      {
        id: 'stu-1',
        name: 'Regular Student',
        email: 'student@univ.edu',
        isRep: false,
        status: 'active',
      },
      'fake-token',
    );

    const enrollSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: { message: 'Enrolled', courseId: 'CPEN401' } },
    });

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: { items: mockCourses, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } },
          },
        } as any;
      }
      if (url === '/courses/my-courses') {
        return { data: { success: true, data: [] } } as any;
      }
      return { data: { success: true, data: {} } } as any;
    });

    renderComponent();

    // Student should see tabs and NOT see Add Course
    expect(screen.queryByRole('button', { name: /Add Course/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My Enrolled Courses/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('CPEN401')).toBeInTheDocument();
    });

    // Find and click "Enroll in Course" button for CPEN401
    const enrollButtons = screen.getAllByRole('button', { name: /Enroll in Course/i });
    expect(enrollButtons.length).toBeGreaterThan(0);
    fireEvent.click(enrollButtons[0]);

    await waitFor(() => {
      expect(enrollSpy).toHaveBeenCalledWith('/courses/CPEN401/enroll');
    });
  });

  it('toggles to table view mode and displays course data rows', async () => {
    authStore.setSession(
      {
        id: 'rep-1',
        name: 'Lead Representative',
        email: 'rep@univ.edu',
        isRep: true,
        status: 'active',
      },
      'fake-token',
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: { items: mockCourses, meta: { page: 1, limit: 20, total: 2, totalPages: 1 } },
          },
        } as any;
      }
      if (url === '/courses/my-courses') {
        return { data: { success: true, data: [] } } as any;
      }
      return { data: { success: true, data: {} } } as any;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('CPEN401')).toBeInTheDocument();
    });

    // Toggle Table View
    const tableBtn = screen.getByTitle('Table View');
    fireEvent.click(tableBtn);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Course Title')).toBeInTheDocument();
    expect(screen.getByText('Semester')).toBeInTheDocument();
    expect(screen.getByText('Assigned Faculty')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });
});
