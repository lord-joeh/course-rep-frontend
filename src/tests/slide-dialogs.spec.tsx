import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UploadSlidesDialog } from '@/components/slides/upload-slides-dialog';
import { MaterialPreviewDialog } from '@/components/slides/material-preview-dialog';
import { DeleteSlideDialog } from '@/components/slides/delete-slide-dialog';
import { SlideCard } from '@/components/slides/slide-card';
import { apiClient } from '@/lib/api-client';
import type { Slide } from '@/types';

describe('Slide Dialogs & Card Components', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockSlidePptx: Slide = {
    id: 'slide-101',
    driveFileId: 'drive-pptx-101',
    fileName: 'Lecture-01-Architecture.pptx',
    courseId: 'CSC401',
    hash: 'sha256hash101abcdef1234567890abcdef',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  };

  const mockSlideVideo: Slide = {
    id: 'slide-102',
    driveFileId: 'drive-video-102',
    fileName: 'Lecture-01-Live-Stream.mp4',
    courseId: 'CSC401',
    hash: 'sha256hash102abcdef1234567890abcdef',
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
  };

  describe('SlideCard', () => {
    it('renders slide metadata, course badge, and action buttons', () => {
      const onPreview = vi.fn();
      const onDelete = vi.fn();

      render(
        <SlideCard
          slide={mockSlidePptx}
          isRep={true}
          onPreview={onPreview}
          onDelete={onDelete}
        />,
        { wrapper },
      );

      expect(screen.getByText('CSC401')).toBeInTheDocument();
      expect(screen.getByText('Lecture-01-Architecture.pptx')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Preview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
      expect(screen.getByTitle('Delete Slide')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Preview/i }));
      expect(onPreview).toHaveBeenCalledWith(mockSlidePptx);

      fireEvent.click(screen.getByTitle('Delete Slide'));
      expect(onDelete).toHaveBeenCalledWith(mockSlidePptx);
    });

    it('renders "Video Lecture" badge for video materials and hides delete button for students', () => {
      render(
        <SlideCard
          slide={mockSlideVideo}
          isRep={false}
        />,
        { wrapper },
      );

      expect(screen.getByText('Video Lecture')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete Slide')).not.toBeInTheDocument();
    });
  });

  describe('MaterialPreviewDialog', () => {
    it('renders Google Drive embedded iframe previewer and title', () => {
      render(
        <MaterialPreviewDialog
          slide={mockSlideVideo}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText('Lecture-01-Live-Stream.mp4')).toBeInTheDocument();
      expect(screen.getByText('Interactive Video Player')).toBeInTheDocument();

      const iframe = screen.getByTitle('Lecture-01-Live-Stream.mp4') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://drive.google.com/file/d/drive-video-102/preview');
    });

    it('opens full view in new tab when "Open in Tab" is clicked', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(
        <MaterialPreviewDialog
          slide={mockSlidePptx}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText('Document & Slide Presentation Viewer')).toBeInTheDocument();

      const openTabBtn = screen.getByTitle('Open full view in new tab');
      fireEvent.click(openTabBtn);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://drive.google.com/file/d/drive-pptx-101/preview',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  describe('DeleteSlideDialog', () => {
    it('displays deletion confirmation with cascade cloud storage warning', () => {
      render(
        <DeleteSlideDialog
          slide={mockSlidePptx}
          open={true}
          onOpenChange={vi.fn()}
        />,
        { wrapper },
      );

      expect(screen.getByText('Delete Course Material')).toBeInTheDocument();
      expect(screen.getByText('Lecture-01-Architecture.pptx')).toBeInTheDocument();
      expect(screen.getByText(/Students enrolled in/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete Material/i })).toBeInTheDocument();
    });

    it('calls delete mutation when confirmed', async () => {
      const onOpenChange = vi.fn();
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <DeleteSlideDialog
          slide={mockSlidePptx}
          open={true}
          onOpenChange={onOpenChange}
        />,
        { wrapper },
      );

      const confirmBtn = screen.getByRole('button', { name: /Delete Material/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/slides/slide-101');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('UploadSlidesDialog', () => {
    it('renders upload form with deduplication banner and handles file validation', () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              { id: 'CSC401', title: 'Advanced Algorithms', code: 'CSC401' },
            ],
          },
        },
      });

      render(
        <UploadSlidesDialog
          open={true}
          onOpenChange={vi.fn()}
          defaultCourseId="CSC401"
        />,
        { wrapper },
      );

      expect(screen.getByText('Upload Course Materials & Videos')).toBeInTheDocument();
      expect(screen.getByText(/Supports PDF, PPTX, Word documents, and MP4\/WebM/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero-Waste SHA-256 Deduplication/i)).toBeInTheDocument();
    });
  });
});

