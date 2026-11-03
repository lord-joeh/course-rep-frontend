import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { StudentDirectoryPage } from '@/pages/reps/student-directory-page';
import { apiClient } from '@/lib/api-client';

describe('StudentDirectoryPage', () => {
  let queryClient: QueryClient;

  const mockStudents = [
    {
      id: '10928374',
      name: 'Grace Hopper',
      email: 'grace@navy.mil',
      phone: '+1234567890',
      isRep: true,
      status: 'active' as const,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    {
      id: '10928375',
      name: 'Claude Shannon',
      email: 'claude@bell.labs',
      phone: '+1987654321',
      isRep: false,
      status: 'suspended' as const,
      createdAt: '2026-01-16T10:00:00Z',
      updatedAt: '2026-01-16T10:00:00Z',
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
          <StudentDirectoryPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders directory page header and table columns', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: { items: mockStudents, total: 2, page: 1, limit: 10, totalPages: 1 },
      },
    });

    renderComponent();

    expect(screen.getByRole('heading', { name: /Student Directory/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by ID, name, or email/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
      expect(screen.getByText('Claude Shannon')).toBeInTheDocument();
    });

    expect(screen.getByText('10928374')).toBeInTheDocument();
    expect(screen.getByText('Representative')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('filters students when typing in search input', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: { items: [mockStudents[0]], total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    });

    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search by ID, name, or email/i);
    fireEvent.change(searchInput, { target: { value: 'Grace' } });

    await waitFor(
      () => {
        expect(getSpy).toHaveBeenCalledWith(
          '/students',
          expect.objectContaining({
            params: expect.objectContaining({ search: 'Grace' }),
          }),
        );
      },
      { timeout: 1000 },
    );
  });

  it('displays empty state when no students match query', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No students found/i)).toBeInTheDocument();
    });
  });
});

