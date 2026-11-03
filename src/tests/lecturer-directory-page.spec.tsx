import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LecturerDirectoryPage } from '@/pages/lecturers/lecturer-directory-page';
import { apiClient } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';

describe('LecturerDirectoryPage', () => {
  let queryClient: QueryClient;

  const mockLecturers = [
    {
      id: 'lec-1',
      name: 'Dr. John von Neumann',
      email: 'vonneumann@ias.edu',
      phone: '+1 609-555-0101',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'lec-2',
      name: 'Dr. Emmy Noether',
      email: 'noether@gottingen.de',
      phone: '+49 551-555-0102',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
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
          <LecturerDirectoryPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders faculty directory header and lecturers in grid view for Course Rep', async () => {
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

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: mockLecturers,
          meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
        },
      },
    });

    renderComponent();

    expect(screen.getByRole('heading', { name: /Faculty Directory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Faculty/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dr. John von Neumann')).toBeInTheDocument();
      expect(screen.getByText('Dr. Emmy Noether')).toBeInTheDocument();
      expect(screen.getByText('vonneumann@ias.edu')).toBeInTheDocument();
    });
  });

  it('hides Add Faculty button when viewed by a regular student', async () => {
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

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: mockLecturers,
          meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
        },
      },
    });

    renderComponent();

    expect(screen.queryByRole('button', { name: /Add Faculty/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dr. John von Neumann')).toBeInTheDocument();
    });
  });

  it('toggles to table view and displays tabulated records', async () => {
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

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: mockLecturers,
          meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
        },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dr. John von Neumann')).toBeInTheDocument();
    });

    // Click table view button
    const tableViewButton = screen.getByTitle('Table View');
    fireEvent.click(tableViewButton);

    // Should now find table headers
    expect(screen.getByText('Faculty Member')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Registered')).toBeInTheDocument();
  });

  it('handles debounced search input', async () => {
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

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [mockLecturers[0]],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    });

    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search by name, email, or phone/i);
    fireEvent.change(searchInput, { target: { value: 'Neumann' } });

    await waitFor(
      () => {
        expect(getSpy).toHaveBeenCalledWith('/lecturers', {
          params: { page: 1, limit: 20, search: 'Neumann' },
        });
      },
      { timeout: 1000 },
    );
  });

  it('renders zero state when directory is empty', async () => {
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

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Faculty directory is empty/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add First Faculty Member/i })).toBeInTheDocument();
    });
  });
});

