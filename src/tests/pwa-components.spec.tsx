import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { PwaInstallBanner } from '@/components/pwa/pwa-install-banner';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';

describe('PWA UI Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('PwaInstallBanner', () => {
    it('does not render when application is not installable', () => {
      render(<PwaInstallBanner />);
      expect(screen.queryByText('Install CourseRep App')).not.toBeInTheDocument();
    });

    it('renders install prompt when beforeinstallprompt event is captured and handles install click', async () => {
      render(<PwaInstallBanner />);

      const mockPrompt = vi.fn().mockResolvedValue(undefined);
      const promptEvent = new Event('beforeinstallprompt');
      Object.assign(promptEvent, {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      });

      act(() => {
        window.dispatchEvent(promptEvent);
      });

      expect(screen.getByText('Install CourseRep App')).toBeInTheDocument();
      expect(
        screen.getByText(/Add CourseRep to your home screen or desktop/i),
      ).toBeInTheDocument();

      const installBtn = screen.getByText('Install App');
      await act(async () => {
        fireEvent.click(installBtn);
      });

      expect(mockPrompt).toHaveBeenCalled();
      expect(screen.queryByText('Install CourseRep App')).not.toBeInTheDocument();
    });

    it('dismisses banner when "Not now" or X button is clicked', () => {
      render(<PwaInstallBanner />);

      const promptEvent = new Event('beforeinstallprompt');
      Object.assign(promptEvent, {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      });

      act(() => {
        window.dispatchEvent(promptEvent);
      });

      expect(screen.getByText('Install CourseRep App')).toBeInTheDocument();

      const notNowBtn = screen.getByText('Not now');
      fireEvent.click(notNowBtn);

      expect(screen.queryByText('Install CourseRep App')).not.toBeInTheDocument();
    });
  });

  describe('OfflineIndicator', () => {
    it('does not render when online', () => {
      render(<OfflineIndicator />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('renders offline alert when window dispatches offline event and removes it on online', () => {
      render(<OfflineIndicator />);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
