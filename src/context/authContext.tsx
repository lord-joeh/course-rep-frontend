import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  PropsWithChildren,
} from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./authContextInstance";

interface AuthContextType {
  user: UserType | null;
  login: (loginResponse: UserType) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

type UserType = {
  id: string;
  name: string;
  email: string;
  isRep: boolean;
  phone: string;
  status: string;
  token: string;
  data: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
};

const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  try {
    const decodedToken = jwtDecode(token);

    if (decodedToken.exp) {
      return decodedToken.exp * 1000 > Date.now();
    }
    return false;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuthData = useCallback(() => {
    localStorage.removeItem("user");
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || "https://d8ppps52-5000.uks1.devtunnels.ms"}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (e) {}
    setUser(null);
    clearAuthData();
    navigate("/");
  }, [navigate, clearAuthData]);

  useEffect(() => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser: UserType = JSON.parse(storedUser);
        if (isTokenValid(parsedUser.token)) {
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      logout().then(r => console.log(r));
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const login = useCallback(
    (loginResponse: UserType) => {
      try {
        if (!isTokenValid(loginResponse.token)) {
          console.log("Token is invalid or expired.");
        }

        setUser(loginResponse);
        localStorage.setItem("user", JSON.stringify(loginResponse));
        navigate(
          loginResponse.isRep ? "/reps/dashboard" : "/students/dashboard",
        );
      } catch (error) {
        console.error("Context login error:", error);

        throw error;
      }
    },
    [navigate],
  );

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: !!user && isTokenValid(user.token),
      loading,
    }),
    [user, login, logout, loading],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export type { AuthContextType, UserType };
