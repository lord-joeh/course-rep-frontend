import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { Skeleton } from '@/components/ui/skeleton';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

interface RoleRouteProps {
  requiredRole: 'REP' | 'STUDENT';
}

export function RoleRoute({ requiredRole }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'REP' && !user.isRep) {
    // Non-rep student attempting to access Course Rep administrative area
    return <Navigate to="/students/dashboard" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.isRep ? '/reps/dashboard' : '/students/dashboard'} replace />;
  }

  return <Outlet />;
}

