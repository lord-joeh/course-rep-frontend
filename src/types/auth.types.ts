export type UserRole = 'REP' | 'STUDENT';

export type StudentStatus = 'active' | 'suspended' | 'pending';

export interface AuthenticatedUser {
  id: string;
  email: string;
  isRep: boolean;
  name?: string;
  avatarUrl?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isRep: boolean;
  status: StudentStatus;
  avatarUrl?: string;
  googleId?: string;
  appleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface LoginResponse {
  requiresCompletion?: false;
  student: StudentProfile;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface OAuthCompletionRequiredResponse {
  requiresCompletion: true;
  tempToken: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  provider: 'google' | 'apple';
}

export type OAuthLoginResponse = LoginResponse | OAuthCompletionRequiredResponse;

export interface GoogleAuthDto {
  idToken: string;
}

export interface AppleAuthDto {
  idToken: string;
  code?: string;
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
  };
}

export interface CompleteOAuthRegistrationDto {
  tempToken: string;
  studentId: string;
  phone?: string;
  name?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}
