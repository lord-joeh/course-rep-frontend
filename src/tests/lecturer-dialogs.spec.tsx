import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateLecturerDialog } from '@/components/lecturers/create-lecturer-dialog';
import { EditLecturerDialog } from '@/components/lecturers/edit-lecturer-dialog';
import { DeleteLecturerDialog } from '@/components/lecturers/delete-lecturer-dialog';
import { apiClient } from '@/lib/api-client';
import type { Lecturer } from '@/types';

describe('Lecturer Dialogs', () => {
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

  const mockLecturer: Lecturer = {
    id: 'lec-100',
    name: 'Prof. Donald Knuth',
    email: 'knuth@stanford.edu',
    phone: '+1 650-555-0100',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  describe('CreateLecturerDialog', () => {
    it('renders input fields and validates required inputs', async () => {
      renderWithProviders(
        <CreateLecturerDialog open={true} onOpenChange={vi.fn()} />,
      );

      expect(screen.getByRole('heading', { name: /Add Faculty Member/i })).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: /Save Faculty Member/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Lecturer name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/A valid email address is required/i)).toBeInTheDocument();
      });
    });

    it('submits valid lecturer payload and calls onOpenChange', async () => {
      const onOpenChange = vi.fn();
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: mockLecturer },
      });

      renderWithProviders(
        <CreateLecturerDialog open={true} onOpenChange={onOpenChange} />,
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: 'Prof. Donald Knuth' },
      });
      fireEvent.change(screen.getByLabelText(/Email Address/i), {
        target: { value: 'knuth@stanford.edu' },
      });
      fireEvent.change(screen.getByLabelText(/Phone Number/i), {
        target: { value: '+1 650-555-0100' },
      });

      const saveButton = screen.getByRole('button', { name: /Save Faculty Member/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/lecturers', {
          name: 'Prof. Donald Knuth',
          email: 'knuth@stanford.edu',
          phone: '+1 650-555-0100',
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('EditLecturerDialog', () => {
    it('pre-populates fields with existing lecturer values', () => {
      renderWithProviders(
        <EditLecturerDialog lecturer={mockLecturer} open={true} onOpenChange={vi.fn()} />,
      );

      expect(screen.getByRole('heading', { name: /Edit Faculty Member/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Prof. Donald Knuth')).toBeInTheDocument();
      expect(screen.getByDisplayValue('knuth@stanford.edu')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1 650-555-0100')).toBeInTheDocument();
    });

    it('sends patch request with updated values', async () => {
      const onOpenChange = vi.fn();
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { ...mockLecturer, name: 'Donald E. Knuth' } },
      });

      renderWithProviders(
        <EditLecturerDialog lecturer={mockLecturer} open={true} onOpenChange={onOpenChange} />,
      );

      const nameInput = screen.getByDisplayValue('Prof. Donald Knuth');
      fireEvent.change(nameInput, { target: { value: 'Donald E. Knuth' } });

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/lecturers/lec-100', {
          name: 'Donald E. Knuth',
          email: 'knuth@stanford.edu',
          phone: '+1 650-555-0100',
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('DeleteLecturerDialog', () => {
    it('displays cascade warning and deletes lecturer upon confirmation', async () => {
      const onOpenChange = vi.fn();
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true, data: { message: 'Deleted' } },
      });

      renderWithProviders(
        <DeleteLecturerDialog lecturer={mockLecturer} open={true} onOpenChange={onOpenChange} />,
      );

      expect(screen.getByRole('heading', { name: /Remove Faculty Member/i })).toBeInTheDocument();
      expect(screen.getByText(/Cascade Warning/i)).toBeInTheDocument();
      expect(screen.getByText(/Courses associated with this faculty member/i)).toBeInTheDocument();

      const deleteButton = screen.getByRole('button', { name: /Delete Faculty Member/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/lecturers/lec-100');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
