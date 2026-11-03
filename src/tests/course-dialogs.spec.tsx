import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateCourseDialog } from '@/components/courses/create-course-dialog';
import { EditCourseDialog } from '@/components/courses/edit-course-dialog';
import { DeleteCourseDialog } from '@/components/courses/delete-course-dialog';
import { CourseRosterSheet } from '@/components/courses/course-roster-sheet';
import { apiClient } from '@/lib/api-client';
import type { Course } from '@/types';

describe('Course Dialogs and Sheets', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  const mockCourse: Course = {
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
    slidesFolderId: 'folder-123',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  describe('CreateCourseDialog', () => {
    it('validates required fields on submit', async () => {
      // Mock lecturers list query
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } } },
      });

      renderWithProviders(
        <CreateCourseDialog open={true} onOpenChange={vi.fn()} />,
      );

      expect(screen.getByRole('heading', { name: /Register New Course/i })).toBeInTheDocument();

      const createBtn = screen.getByRole('button', { name: /Create Course/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText(/Course ID\/code must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/Course name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('submits valid course payload and triggers close', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } } },
      });

      const onOpenChange = vi.fn();
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: mockCourse },
      });

      renderWithProviders(
        <CreateCourseDialog open={true} onOpenChange={onOpenChange} />,
      );

      fireEvent.change(screen.getByPlaceholderText(/e.g. CPEN401/i), {
        target: { value: 'CPEN401' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e.g. Advanced Software Engineering/i), {
        target: { value: 'Advanced Software Engineering' },
      });

      const createBtn = screen.getByRole('button', { name: /Create Course/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/courses', {
          id: 'CPEN401',
          name: 'Advanced Software Engineering',
          semester: 'First Semester',
          day: undefined,
          startTime: undefined,
          endTime: undefined,
          lecturerId: undefined,
          slidesFolderId: undefined,
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('EditCourseDialog', () => {
    it('pre-populates inputs with existing course information', () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } } },
      });

      renderWithProviders(
        <EditCourseDialog course={mockCourse} open={true} onOpenChange={vi.fn()} />,
      );

      expect(screen.getByRole('heading', { name: /Edit Course Details/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('CPEN401')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Advanced Software Engineering')).toBeInTheDocument();
      expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('11:00')).toBeInTheDocument();
    });

    it('submits updated values to PATCH /courses/:id', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } } },
      });

      const onOpenChange = vi.fn();
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { ...mockCourse, name: 'Modern Software Engineering' } },
      });

      renderWithProviders(
        <EditCourseDialog course={mockCourse} open={true} onOpenChange={onOpenChange} />,
      );

      const titleInput = screen.getByDisplayValue('Advanced Software Engineering');
      fireEvent.change(titleInput, { target: { value: 'Modern Software Engineering' } });

      const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/courses/CPEN401', {
          name: 'Modern Software Engineering',
          semester: 'First Semester',
          day: 'Monday',
          startTime: '09:00',
          endTime: '11:00',
          lecturerId: 'lec-1',
          slidesFolderId: 'folder-123',
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('DeleteCourseDialog', () => {
    it('shows cascade warning and deletes course on confirmation', async () => {
      const onOpenChange = vi.fn();
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true, data: { message: 'Deleted' } },
      });

      renderWithProviders(
        <DeleteCourseDialog course={mockCourse} open={true} onOpenChange={onOpenChange} />,
      );

      expect(screen.getByRole('heading', { name: /Delete Academic Course/i })).toBeInTheDocument();
      expect(screen.getByText(/Critical Cascade Warning/i)).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /Delete Course/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/courses/CPEN401');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('CourseRosterSheet', () => {
    it('renders roster students and filters students by name', async () => {
      const mockStudents = [
        {
          id: '10928374',
          name: 'Grace Hopper',
          email: 'grace@navy.mil',
          isRep: true,
          status: 'active' as const,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: '10928375',
          name: 'Claude Shannon',
          email: 'claude@bell.labs',
          isRep: false,
          status: 'active' as const,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: mockStudents },
      });

      renderWithProviders(
        <CourseRosterSheet course={mockCourse} open={true} onOpenChange={vi.fn()} />,
      );

      expect(screen.getByText(/Enrolled Roster/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
        expect(screen.getByText('Claude Shannon')).toBeInTheDocument();
      });

      // Filter by Shannon
      const filterInput = screen.getByPlaceholderText(/Filter by name, ID, or email/i);
      fireEvent.change(filterInput, { target: { value: 'Shannon' } });

      expect(screen.getByText('Claude Shannon')).toBeInTheDocument();
      expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument();
    });
  });
});

