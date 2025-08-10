import { Navigate, useLocation, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Spinner } from "flowbite-react";

const RepRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <Spinner size="md" className="me-4 flex items-center justify-center" />
    );
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (!user.isRep) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default RepRoute;
