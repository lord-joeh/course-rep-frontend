import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { GroupsPage } from '@/pages/groups/groups-page';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import type { Group } from '@/types';

describe('GroupsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  const mockGroup: Group = {
    id: 'grp-1',
    name: 'Hardware Design Group 1',
    courseId: 'CPEN402',
    isGeneral: false,
    description: 'Embedded system laboratory projects',
    createdAt: '2026-11-04T08:00:00Z',
    updatedAt: '2026-11-04T08:00:00Z',
    course: { id: 'CPEN402', name: 'Embedded Systems' },
    memberCount: 3,
    members: [
      {
        studentId: 'std-rep',
        isLeader: true,
        student: { id: 'std-rep', name: 'Rep Leader', indexNumber: '10928374' },
      },
    ],
  };

  it('renders Course Rep view with metrics, auto-divide button, and create group button', async () => {
    authStore.setSession(
      {
        id: 'std-rep',
        name: 'Rep Leader',
        email: 'rep@university.edu',
        isRep: true,
        role: 'REP',
        status: 'active',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
      { accessToken: 'mock-token' },
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/groups') {
        return {
          data: {
            success: true,
            data: {
              items: [mockGroup],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        };
      }
      if (url === '/groups/my-groups') {
        return {
          data: {
            success: true,
            data: [mockGroup],
          },
        };
      }
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: {
              items: [{ id: 'CPEN402', name: 'Embedded Systems' }],
              meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
            },
          },
        };
      }
      return { data: { success: true, data: [] } };
    });

    render(<GroupsPage />, { wrapper });

    expect(screen.getByRole('heading', { name: /Study Groups Administration/i })).toBeInTheDocument();
    expect(screen.getByTestId('open-auto-divide-btn')).toBeInTheDocument();
    expect(screen.getByTestId('open-create-group-btn')).toBeInTheDocument();
    expect(screen.getByText('Total Groups')).toBeInTheDocument();

    expect(await screen.findByText('Hardware Design Group 1')).toBeInTheDocument();
  });

  it('toggles between Grid and Table views cleanly', async () => {
    authStore.setSession(
      {
        id: 'std-rep',
        name: 'Rep Leader',
        email: 'rep@university.edu',
        isRep: true,
        role: 'REP',
        status: 'active',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
      { accessToken: 'mock-token' },
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/groups') {
        return {
          data: {
            success: true,
            data: {
              items: [mockGroup],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        };
      }
      return { data: { success: true, data: [] } };
    });

    render(<GroupsPage />, { wrapper });

    // Starts in Grid mode
    expect(await screen.findByTestId('group-card-grp-1')).toBeInTheDocument();

    // Switch to Table view
    const tableBtn = screen.getByTestId('view-table-btn');
    fireEvent.click(tableBtn);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Group Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Cohort / Course' })).toBeInTheDocument();
  });

  it('allows Course Rep to switch to My Groups tab', async () => {
    authStore.setSession(
      {
        id: 'std-rep',
        name: 'Rep Leader',
        email: 'rep@university.edu',
        isRep: true,
        role: 'REP',
        status: 'active',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
      { accessToken: 'mock-token' },
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/groups/my-groups') {
        return {
          data: {
            success: true,
            data: [mockGroup],
          },
        };
      }
      return { data: { success: true, data: { items: [], meta: { page: 1, limit: 20, total: 0 } } } };
    });

    render(<GroupsPage />, { wrapper });

    const myGroupsTab = screen.getByTestId('tab-my-groups');
    fireEvent.click(myGroupsTab);

    expect(screen.getByRole('heading', { name: /My Study Groups Portal/i })).toBeInTheDocument();
  });

  it('renders student mode with My Assigned Groups as default tab', async () => {
    authStore.setSession(
      {
        id: 'std-regular',
        name: 'Regular Student',
        email: 'student@university.edu',
        isRep: false,
        role: 'STUDENT',
        status: 'active',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
      { accessToken: 'mock-token' },
    );

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/groups/my-groups') {
        return {
          data: {
            success: true,
            data: [mockGroup],
          },
        };
      }
      return { data: { success: true, data: { items: [], meta: { page: 1, limit: 20, total: 0 } } } };
    });

    render(<GroupsPage />, { wrapper });

    expect(screen.getByRole('heading', { name: /My Study Groups Portal/i })).toBeInTheDocument();
    // Rep actions must NOT be present
    expect(screen.queryByTestId('open-auto-divide-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('open-create-group-btn')).not.toBeInTheDocument();
  });
});
