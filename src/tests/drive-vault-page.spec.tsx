import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DriveVaultPage } from '@/pages/reps/drive-vault-page';
import { apiClient } from '@/lib/api-client';

describe('DriveVaultPage', () => {
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
          <DriveVaultPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders Google Drive Vault header, status card, and folder exploration toolbar', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/google/status') {
        return { data: { success: true, data: { connected: true, expiryDate: 1780000000000 } } } as any;
      }
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: {
              items: [
                {
                  id: 'CPEN401',
                  name: 'Advanced Software Engineering',
                  slidesFolderId: 'cpen401-folder-id',
                },
              ],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    expect(screen.getByRole('heading', { name: /Google Drive Vault/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Drive Folder/i })).toBeInTheDocument();
    expect(screen.getByText(/Quick-Select Course Vault/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste Folder ID/i)).toBeInTheDocument();
  });

  it('loads and displays files when a folder is selected', async () => {
    const mockFiles = [
      {
        id: 'file-100',
        name: 'Lecture01-Architecture.pdf',
        mimeType: 'application/pdf',
        size: '2097152',
        createdTime: '2026-01-10T12:00:00Z',
      },
    ];

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/google/status') {
        return { data: { success: true, data: { connected: true, expiryDate: 1780000000000 } } } as any;
      }
      if (url === '/courses') {
        return {
          data: {
            success: true,
            data: {
              items: [
                {
                  id: 'CPEN401',
                  name: 'Advanced Software Engineering',
                  slidesFolderId: 'cpen401-folder-id',
                },
              ],
              meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          },
        } as any;
      }
      if (url.includes('/google/folders/cpen401-folder-id/files')) {
        return { data: { success: true, data: mockFiles } } as any;
      }
      return { data: { success: true, data: [] } } as any;
    });

    renderComponent();

    // Enter manual folder ID and inspect
    const input = screen.getByPlaceholderText(/Paste Folder ID/i);
    fireEvent.change(input, { target: { value: 'cpen401-folder-id' } });

    const inspectBtn = screen.getByRole('button', { name: /Inspect Folder/i });
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByText('Lecture01-Architecture.pdf')).toBeInTheDocument();
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });
  });
});
