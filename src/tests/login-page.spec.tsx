import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '@/pages/auth/login-page';
import { apiClient } from '@/lib/api-client';

describe('LoginPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderLoginPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders login form elements and solid branding header', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /Sign In to CourseRep/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Student ID or University Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
  });

  it('toggles password visibility when eye button is clicked', () => {
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText('Show password');
    fireEvent.click(toggleBtn);

    expect(passwordInput.type).toBe('text');
  });

  it('displays client-side validation errors when submitting empty form', () => {
    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/Student ID or university email is required/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Password must be at least 6 characters long/i)).toBeInTheDocument();
  });

  it('sends credentials to backend when valid data is submitted', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          student: { id: 'STU-123', name: 'Test Student', email: 'test@univ.edu', isRep: false, status: 'active' },
          accessToken: 'test-access',
          refreshToken: 'test-refresh',
        },
      },
    });

    renderLoginPage();

    const idInput = screen.getByLabelText(/Student ID or University Email/i);
    const passInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    fireEvent.change(idInput, { target: { value: 'STU-123' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/auth/login', {
        identifier: 'STU-123',
        password: 'password123',
      });
    });
  });
});

