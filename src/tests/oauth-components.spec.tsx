import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { AppleSignInButton } from '@/components/auth/apple-sign-in-button';
import { CompleteOAuthDialog } from '@/components/auth/complete-oauth-dialog';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { apiClient } from '@/lib/api-client';

describe('OAuth Components & Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>,
    );

  describe('GoogleSignInButton', () => {
    it('renders with default label', () => {
      render(<GoogleSignInButton onSuccess={vi.fn()} />);
      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    it('renders with custom text and triggers onSuccess when clicked', () => {
      const onSuccessMock = vi.fn();
      render(<GoogleSignInButton onSuccess={onSuccessMock} text="Google Sign In" />);

      expect(screen.getByText('Google Sign In')).toBeInTheDocument();
      const button = screen.getByRole('button', { name: /Sign in with Google/i });
      fireEvent.click(button);

      expect(onSuccessMock).toHaveBeenCalledTimes(1);
      expect(onSuccessMock).toHaveBeenCalledWith(expect.stringContaining('mock-google-token-'));
    });

    it('honors disabled prop', () => {
      render(<GoogleSignInButton onSuccess={vi.fn()} disabled />);
      const button = screen.getByRole('button', { name: /Sign in with Google/i });
      expect(button).toBeDisabled();
    });
  });

  describe('AppleSignInButton', () => {
    it('renders with default label', () => {
      render(<AppleSignInButton onSuccess={vi.fn()} />);
      expect(screen.getByRole('button', { name: /Sign in with Apple/i })).toBeInTheDocument();
      expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
    });

    it('renders with custom text and triggers onSuccess when clicked', () => {
      const onSuccessMock = vi.fn();
      render(<AppleSignInButton onSuccess={onSuccessMock} text="Apple Sign In" />);

      expect(screen.getByText('Apple Sign In')).toBeInTheDocument();
      const button = screen.getByRole('button', { name: /Sign in with Apple/i });
      fireEvent.click(button);

      expect(onSuccessMock).toHaveBeenCalledTimes(1);
      expect(onSuccessMock).toHaveBeenCalledWith(
        expect.stringContaining('mock-apple-token-'),
        expect.objectContaining({ name: { firstName: 'Apple', lastName: 'User' } }),
      );
    });

    it('honors disabled prop', () => {
      render(<AppleSignInButton onSuccess={vi.fn()} disabled />);
      const button = screen.getByRole('button', { name: /Sign in with Apple/i });
      expect(button).toBeDisabled();
    });
  });

  describe('CompleteOAuthDialog', () => {
    const mockData = {
      requiresCompletion: true as const,
      tempToken: 'valid-temp-token-xyz',
      email: 'ama.mensah@univ.edu',
      name: 'Ama Mensah',
      provider: 'google' as const,
    };

    it('does not render when isOpen is false', () => {
      renderWithProviders(
        <CompleteOAuthDialog isOpen={false} onClose={vi.fn()} data={mockData} />,
      );
      expect(screen.queryByText(/Complete Your Profile/i)).not.toBeInTheDocument();
    });

    it('renders dialog with user details when open', () => {
      renderWithProviders(
        <CompleteOAuthDialog isOpen={true} onClose={vi.fn()} data={mockData} />,
      );

      expect(screen.getByText(/Complete Your Profile/i)).toBeInTheDocument();
      expect(screen.getByText('ama.mensah@univ.edu')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Ama Mensah')).toBeInTheDocument();
    });

    it('validates student ID requirement and format', async () => {
      renderWithProviders(
        <CompleteOAuthDialog isOpen={true} onClose={vi.fn()} data={mockData} />,
      );

      const submitBtn = screen.getByRole('button', { name: /Finish & Launch Portal/i });
      fireEvent.click(submitBtn);

      expect(
        await screen.findByText(/Student ID \/ Index Number is required/i),
      ).toBeInTheDocument();

      const studentIdInput = screen.getByLabelText(/Student ID \/ Index Number/i);
      fireEvent.change(studentIdInput, { target: { value: 'ab' } });
      fireEvent.click(submitBtn);

      expect(
        await screen.findByText(/Student ID must be 4-50 characters with letters, numbers, hyphens, or underscores/i),
      ).toBeInTheDocument();
    });

    it('submits registration when valid details are provided', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            student: {
              id: '10928374',
              name: 'Ama Mensah',
              email: 'ama.mensah@univ.edu',
              isRep: false,
              status: 'active',
            },
            accessToken: 'new-access-jwt',
            refreshToken: 'new-refresh-jwt',
          },
        },
      });

      const onCloseMock = vi.fn();
      renderWithProviders(
        <CompleteOAuthDialog isOpen={true} onClose={onCloseMock} data={mockData} />,
      );

      const studentIdInput = screen.getByLabelText(/Student ID \/ Index Number/i);
      fireEvent.change(studentIdInput, { target: { value: '10928374' } });

      const submitBtn = screen.getByRole('button', { name: /Finish & Launch Portal/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/auth/oauth/complete-registration', {
          tempToken: 'valid-temp-token-xyz',
          studentId: '10928374',
          name: 'Ama Mensah',
          phone: undefined,
        });
        expect(onCloseMock).toHaveBeenCalled();
      });
    });
  });

  describe('LoginPage & RegisterPage Integration', () => {
    it('renders Google and Apple sign-in options on LoginPage', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in with Apple/i })).toBeInTheDocument();
      expect(screen.getByText(/Or continue with/i)).toBeInTheDocument();
    });

    it('renders Google and Apple sign-up options on RegisterPage', () => {
      renderWithProviders(<RegisterPage />);

      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in with Apple/i })).toBeInTheDocument();
      expect(screen.getByText(/Or register with/i)).toBeInTheDocument();
    });
  });
});
