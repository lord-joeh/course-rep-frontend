import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSocketId } from "../context/socketContext";
import dispatchHttpError from "./dispatchHttpError";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Routes that do not require an access token
const publicRoutes = [
  "/api/auth/login",
  "/api/students/register",
  "/api/auth/refresh",
  "/api/auth/forgot",
  "/api/auth/reset",
];

api.interceptors.request.use(
  async function (config): Promise<InternalAxiosRequestConfig<any>> {
  if (publicRoutes.some((route) => config.url?.includes(route))) {
    return config;
  }

  if (config.method === "get") {
    config.headers.set("Cache-Control", "no-cache");
    config.headers.set("Pragma", "no-cache");
  }

  const socketId = getSocketId();
  if (socketId) {
    config.headers.set("X-Socket-ID", socketId);
  }

  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user?.token) {
        config.headers.set("Authorization", `Bearer ${user.token}`);
      }
    }
  } catch (error) {
    console.error("Auth Error: Failed to parse user data", error);
  }

  return config;
},
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async function (error: AxiosError) {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    if (!originalRequest) return Promise.reject(error);

    // 1. Handle Token Expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isPublicRoute = publicRoutes.some((route) => originalRequest.url?.includes(route)
      );

      if (isPublicRoute) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { token } = refreshResponse.data;

        // Update Local Storage
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          localStorage.setItem("user", JSON.stringify({ ...user, token }));
        }

        // Retry original request with new token
        originalRequest.headers.set("Authorization", `Bearer ${token}`);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return api(originalRequest);
      } catch (refreshError) {
        dispatchHttpError("Session Expired");
        localStorage.removeItem("user");
        globalThis.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 429) {
      const retryCount = originalRequest._retryCount || 0;
      const MAX_RETRIES = 2;

      if (retryCount < MAX_RETRIES) {
        originalRequest._retryCount = retryCount + 1;
        const delay = 1000 * Math.pow(2, retryCount);

        console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return api(originalRequest);
      } else {
        dispatchHttpError("Rate Limit Exceeded. Please try again later");
      }
    }

    if (error.response && error.response.status >= 500) {
      console.error("Server Error:", error.response.data);
      dispatchHttpError("Something went wrong on the server.");
    }

    return Promise.reject(error);
  },
);

// Debug logging in development
if (import.meta.env.VITE_ENV === "development") {
  api.interceptors.request.use((request) => {
    console.log("Request:", request.method?.toUpperCase(), request.url);
    return request;
  });
}

export default api;
