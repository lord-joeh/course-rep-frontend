import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '@/lib/auth-validation';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid credentials with student ID', () => {
      const result = loginSchema.safeParse({
        identifier: '10928374',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid credentials with email', () => {
      const result = loginSchema.safeParse({
        identifier: 'student@univ.edu',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects short passwords', () => {
      const result = loginSchema.safeParse({
        identifier: 'student@univ.edu',
        password: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('at least 6 characters');
      }
    });
  });

  describe('registerSchema', () => {
    it('validates correct student registration payload', () => {
      const result = registerSchema.safeParse({
        id: '10928374',
        name: 'Jane Doe',
        email: 'jane.doe@univ.edu',
        phone: '+1234567890',
        password: 'SecurePassword1',
        confirmPassword: 'SecurePassword1',
      });
      expect(result.success).toBe(true);
    });

    it('fails when passwords do not match', () => {
      const result = registerSchema.safeParse({
        id: '10928374',
        name: 'Jane Doe',
        email: 'jane.doe@univ.edu',
        password: 'SecurePassword1',
        confirmPassword: 'DifferentPassword2',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Passwords do not match');
      }
    });

    it('enforces password complexity (must contain uppercase and number)', () => {
      const result = registerSchema.safeParse({
        id: '10928374',
        name: 'Jane Doe',
        email: 'jane.doe@univ.edu',
        password: 'lowercaseonly',
        confirmPassword: 'lowercaseonly',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('accepts valid identifier', () => {
      const result = forgotPasswordSchema.safeParse({ identifier: 'user@univ.edu' });
      expect(result.success).toBe(true);
    });

    it('rejects empty identifier', () => {
      const result = forgotPasswordSchema.safeParse({ identifier: '  ' });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('validates matching new passwords with token', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'valid-reset-token-123',
        newPassword: 'BrandNewPassword1',
        confirmPassword: 'BrandNewPassword1',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched new passwords', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'valid-reset-token-123',
        newPassword: 'BrandNewPassword1',
        confirmPassword: 'MismatchPassword2',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('rejects when new password is same as current password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'ExistingPassword1',
        newPassword: 'ExistingPassword1',
        confirmPassword: 'ExistingPassword1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('cannot be identical');
      }
    });

    it('accepts valid password change', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword2',
        confirmPassword: 'NewPassword2',
      });
      expect(result.success).toBe(true);
    });
  });
});

