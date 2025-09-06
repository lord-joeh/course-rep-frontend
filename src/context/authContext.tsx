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
  data?: object;
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
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
    }
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
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!user) return;

    const checkTokenValidity = () => {
      if (!isTokenValid(user.token)) {
        logout();
      }
    };

    const interval = setInterval(checkTokenValidity, 60000);
    return () => clearInterval(interval);
  }, [user, logout]);

  const login = useCallback(
    (loginResponse: UserType) => {
      try {
        if (!isTokenValid(loginResponse.token)) {
          throw new Error("Login failed: Token is invalid or expired.");
        }

        setUser(loginResponse);
        localStorage.setItem("user", JSON.stringify(loginResponse));
        navigate(loginResponse.isRep? '/reps/dashboard': '/students/dashboard');
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
