import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, RoleRoute, PublicOnlyRoute } from '@/components/auth/route-guards';
import { authStore } from '@/lib/auth-store';
import type { StudentProfile } from '@/types';

describe('Route Guards', () => {
  const studentUser: StudentProfile = {
    id: 'STU-1',
    name: 'Standard Student',
    email: 'student@univ.edu',
    isRep: false,
    status: 'active',
  };

  const repUser: StudentProfile = {
    id: 'REP-1',
    name: 'Course Representative',
    email: 'rep@univ.edu',
    isRep: true,
    status: 'active',
  };

  beforeEach(() => {
    authStore.clearSession();
  });

  describe('ProtectedRoute', () => {
    it('redirects unauthenticated users to /login', () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<div>Secret Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
      expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    });

    it('renders protected child routes when user is authenticated', () => {
      authStore.setSession(studentUser, { accessToken: 'valid-token' });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<div>Secret Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Secret Content')).toBeInTheDocument();
    });
  });

  describe('RoleRoute', () => {
    it('redirects students away from REP-only routes to /students/dashboard', () => {
      authStore.setSession(studentUser, { accessToken: 'valid-token' });

      render(
        <MemoryRouter initialEntries={['/reps/admin']}>
          <Routes>
            <Route path="/students/dashboard" element={<div>Student Home</div>} />
            <Route element={<RoleRoute requiredRole="REP" />}>
              <Route path="/reps/admin" element={<div>Course Rep Exclusive Area</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Student Home')).toBeInTheDocument();
      expect(screen.queryByText('Course Rep Exclusive Area')).not.toBeInTheDocument();
    });

    it('allows Course Reps to enter REP-only routes', () => {
      authStore.setSession(repUser, { accessToken: 'valid-token' });

      render(
        <MemoryRouter initialEntries={['/reps/admin']}>
          <Routes>
            <Route path="/students/dashboard" element={<div>Student Home</div>} />
            <Route element={<RoleRoute requiredRole="REP" />}>
              <Route path="/reps/admin" element={<div>Course Rep Exclusive Area</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Course Rep Exclusive Area')).toBeInTheDocument();
    });
  });

  describe('PublicOnlyRoute', () => {
    it('redirects authenticated rep to /reps/dashboard', () => {
      authStore.setSession(repUser, { accessToken: 'valid-token' });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/reps/dashboard" element={<div>Rep Dashboard Landing</div>} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<div>Login Form</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Rep Dashboard Landing')).toBeInTheDocument();
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    });
  });
});

