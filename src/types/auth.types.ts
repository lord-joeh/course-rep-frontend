export type UserRole = 'REP' | 'STUDENT';

export type StudentStatus = 'active' | 'suspended' | 'pending';

export interface AuthenticatedUser {
  id: string;
  email: string;
  isRep: boolean;
  name?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isRep: boolean;
  status: StudentStatus;
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
  student: StudentProfile;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}
