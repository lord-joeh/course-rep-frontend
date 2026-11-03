import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditStudentDialog } from '@/components/students/edit-student-dialog';
import { apiClient } from '@/lib/api-client';
import type { Student } from '@/types';

describe('EditStudentDialog', () => {
  let queryClient: QueryClient;

  const mockStudent: Student = {
    id: 'STU-999',
    name: 'Linus Torvalds',
    email: 'linus@linux.org',
    phone: '+1555123456',
    isRep: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderDialog = (open = true, onOpenChange = vi.fn()) =>
    render(
      <QueryClientProvider client={queryClient}>
        <EditStudentDialog
          student={mockStudent}
          open={open}
          onOpenChange={onOpenChange}
        />
      </QueryClientProvider>,
    );

  it('renders pre-filled student details in form inputs', () => {
    renderDialog();

    expect(screen.getByRole('heading', { name: /Edit Student Profile/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Linus Torvalds')).toBeInTheDocument();
    expect(screen.getByDisplayValue('linus@linux.org')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1555123456')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Course Representative Privileges/i })).not.toBeChecked();
  });

  it('shows caution warning when elevating student to Course Rep', () => {
    renderDialog();

    const repToggle = screen.getByRole('checkbox', { name: /Course Representative Privileges/i });
    fireEvent.click(repToggle);

    expect(repToggle).toBeChecked();
    expect(screen.getByText(/Caution: This user will have full Course Representative administrative permissions/i)).toBeInTheDocument();
  });

  it('submits updated student payload to PATCH /students/:id', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...mockStudent, name: 'Linus B. Torvalds', status: 'suspended' },
      },
    });

    const onOpenChange = vi.fn();
    renderDialog(true, onOpenChange);

    const nameInput = screen.getByDisplayValue('Linus Torvalds');
    fireEvent.change(nameInput, { target: { value: 'Linus B. Torvalds' } });

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('/students/STU-999', expect.objectContaining({
        name: 'Linus B. Torvalds',
      }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

