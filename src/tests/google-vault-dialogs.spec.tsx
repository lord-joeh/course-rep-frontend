import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleStatusCard } from '@/components/google/google-status-card';
import { CreateFolderDialog } from '@/components/google/create-folder-dialog';
import { DeleteDriveFileDialog } from '@/components/google/delete-drive-file-dialog';
import { DriveFileList, formatBytes } from '@/components/google/drive-file-list';
import { apiClient } from '@/lib/api-client';
import type { DriveFileItem } from '@/types';

describe('Google Vault Dialogs and Components', () => {
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

  describe('formatBytes helper', () => {
    it('correctly converts byte values to human readable units', () => {
      expect(formatBytes(undefined)).toBe('N/A');
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(1073741824)).toBe('1.0 GB');
    });
  });

  describe('GoogleStatusCard', () => {
    it('renders connected state with green badge and revoke option', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { connected: true, expiryDate: 1780000000000 } },
      });

      renderWithProviders(<GoogleStatusCard />);

      await waitFor(() => {
        expect(screen.getByText('Google Drive Cloud Vault')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Disconnect Vault/i })).toBeInTheDocument();
      });
    });

    it('renders disconnected state with Connect button', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { connected: false, expiryDate: null } },
      });

      renderWithProviders(<GoogleStatusCard />);

      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Connect Google Drive/i })).toBeInTheDocument();
      });
    });
  });

  describe('CreateFolderDialog', () => {
    it('validates folder name input', async () => {
      renderWithProviders(
        <CreateFolderDialog open={true} onOpenChange={vi.fn()} />,
      );

      const createBtn = screen.getByRole('button', { name: /Create Folder/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText(/Folder name is required/i)).toBeInTheDocument();
      });
    });

    it('submits folder creation and displays generated folder ID', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { id: 'new-folder-xyz', name: 'CPEN401 Materials' } },
      });

      renderWithProviders(
        <CreateFolderDialog open={true} onOpenChange={vi.fn()} />,
      );

      fireEvent.change(screen.getByPlaceholderText(/e.g. CPEN401 Course Materials/i), {
        target: { value: 'CPEN401 Materials' },
      });

      const createBtn = screen.getByRole('button', { name: /Create Folder/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/google/folders', {
          folderName: 'CPEN401 Materials',
          parentFolderId: undefined,
        });
        expect(screen.getByText('new-folder-xyz')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Copy ID/i })).toBeInTheDocument();
      });
    });
  });

  describe('DeleteDriveFileDialog', () => {
    it('shows permanent removal warning and confirms deletion', async () => {
      const onOpenChange = vi.fn();
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true, data: { message: 'Deleted', fileId: 'file-123' } },
      });

      const mockFile: DriveFileItem = {
        id: 'file-123',
        name: 'Lecture1.pdf',
        mimeType: 'application/pdf',
      };

      renderWithProviders(
        <DeleteDriveFileDialog
          file={mockFile}
          folderId="folder-1"
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      expect(screen.getByRole('heading', { name: /Delete Cloud File\?/i })).toBeInTheDocument();
      expect(screen.getByText(/Permanent File Removal/i)).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /Delete File/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/google/files/file-123');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('DriveFileList', () => {
    it('renders file items with formatted sizes and download action', () => {
      const mockFiles: DriveFileItem[] = [
        {
          id: 'f-1',
          name: 'Syllabus.pdf',
          mimeType: 'application/pdf',
          size: '1048576',
          createdTime: '2026-01-01T00:00:00Z',
        },
      ];

      renderWithProviders(
        <DriveFileList files={mockFiles} isRep={true} />,
      );

      expect(screen.getByText('Syllabus.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });
  });
});
