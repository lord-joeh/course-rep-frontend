import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import { tokenStore } from '@/lib/token-store';
import { toast } from 'sonner';
import type {
  ApiResponse,
  LoginResponse,
  OAuthLoginResponse,
  GoogleAuthDto,
  CompleteOAuthRegistrationDto,
} from '@/types';
import type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  ChangePasswordFormData,
} from '@/lib/auth-validation';
import type { AxiosError } from 'axios';

export function useLoginMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (!data?.student || !data?.accessToken) {
        toast.error('Authentication Error', { description: 'Invalid response from server' });
        return;
      }

      authStore.setSession(data.student, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      queryClient.setQueryData(['current-user'], data.student);
      toast.success('Welcome back, ' + data.student.name.split(' ')[0], {
        description: 'Successfully authenticated.',
      });

      if (data.student.isRep) {
        navigate('/reps/dashboard', { replace: true });
      } else {
        navigate('/students/dashboard', { replace: true });
      }
    },
    onError: (error: AxiosError<{ message?: string; errors?: string[] }>) => {
      const message =
        error.response?.data?.message ||
        'Unable to log in. Please check your credentials and try again.';
      toast.error('Login Failed', { description: message });
    },
  });
}

export function useRegisterMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: RegisterFormData) => {
      // Security mandate: Registrants cannot register as Course Rep.
      const payload = {
        id: formData.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        isRep: false,
      };

      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', payload);
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (data?.student && data?.accessToken) {
        authStore.setSession(data.student, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        queryClient.setQueryData(['current-user'], data.student);
        toast.success('Account Created Successfully', {
          description: 'Welcome to the Course Rep Management Portal.',
        });
        navigate('/students/dashboard', { replace: true });
      } else {
        toast.success('Registration Submitted', {
          description: 'Your account has been created. Please sign in.',
        });
        navigate('/login', { replace: true });
      }
    },
    onError: (error: AxiosError<{ message?: string; errors?: string[] }>) => {
      const message =
        error.response?.data?.message ||
        'Registration could not be completed. Please review your details.';
      toast.error('Registration Failed', { description: message });
    },
  });
}

export function useLogoutMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = tokenStore.getRefreshToken();
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // Logout gracefully even if backend session revocation fails
      }
    },
    onSettled: () => {
      authStore.clearSession();
      queryClient.clear();
      toast.info('Signed Out', { description: 'You have been securely logged out.' });
      navigate('/login', { replace: true });
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/auth/forgot-password',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Reset Instructions Dispatched', {
        description: 'If an account exists with those details, a reset email has been sent.',
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message ||
        'Unable to process reset request. Please verify your details.';
      toast.error('Request Failed', { description: message });
    },
  });
}

export function useResetPasswordMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/auth/reset-password',
        {
          token: data.token,
          newPassword: data.newPassword,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password Successfully Reset', {
        description: 'You can now log in with your new password.',
      });
      navigate('/login', { replace: true });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message ||
        'Password reset failed. The reset token may be invalid or expired.';
      toast.error('Reset Failed', { description: message });
    },
  });
}

export function useChangePasswordMutation(onSuccessCallback?: () => void) {
  return useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      const response = await apiClient.patch<ApiResponse<{ message: string }>>(
        '/auth/change-password',
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password Updated', {
        description: 'Your account password has been changed successfully.',
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message ||
        'Failed to change password. Please verify your current password.';
      toast.error('Update Failed', { description: message });
    },
  });
}

export function useGoogleLoginMutation(onNeedsCompletion?: (data: any) => void) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: GoogleAuthDto) => {
      const response = await apiClient.post<ApiResponse<OAuthLoginResponse>>('/auth/google', dto);
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (!data) return;
      if (data.requiresCompletion) {
        if (onNeedsCompletion) {
          onNeedsCompletion(data);
        }
        return;
      }

      if (data.student && data.accessToken) {
        authStore.setSession(data.student, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        queryClient.setQueryData(['current-user'], data.student);
        toast.success(`Welcome back, ${data.student.name.split(' ')[0]}`, {
          description: 'Successfully authenticated via Google.',
        });
        if (data.student.isRep) {
          navigate('/reps/dashboard', { replace: true });
        } else {
          navigate('/students/dashboard', { replace: true });
        }
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Google sign-in failed. Please try again.';
      toast.error('Google Sign-In Failed', { description: message });
    },
  });
}

export function useCompleteOAuthRegistrationMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CompleteOAuthRegistrationDto) => {
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        '/auth/oauth/complete-registration',
        dto,
      );
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (!data?.student || !data?.accessToken) {
        toast.error('Registration Error', { description: 'Invalid response from server' });
        return;
      }

      authStore.setSession(data.student, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      queryClient.setQueryData(['current-user'], data.student);
      toast.success('Registration Complete', {
        description: `Welcome to Course Rep, ${data.student.name.split(' ')[0]}!`,
      });
      navigate('/students/dashboard', { replace: true });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || 'Could not complete registration. Please check your details.';
      toast.error('Registration Failed', { description: message });
    },
  });
}

