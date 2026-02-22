import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSocketId } from "../context/socketContext";
import dispatchHttpError from "./dispatchHttpError";

// Types for the queuing system
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else if (token) promise.resolve(token);
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const publicRoutes = [
  "/api/auth/login",
  "/api/students/register",
  "/api/auth/refresh",
  "/api/auth/forgot",
  "/api/auth/reset",
];

api.interceptors.request.use(
  async (config): Promise<InternalAxiosRequestConfig> => {
    const isPublic = publicRoutes.some((route) => config.url?.includes(route));

    if (!isPublic && config.method === "get") {
      config.headers.set("Cache-Control", "no-cache");
      config.headers.set("Pragma", "no-cache");
    }

    // Attach Socket ID for real-time tracking
    const socketId = getSocketId();
    if (socketId) {
      config.headers.set("X-Socket-ID", socketId);
    }

    // Attach Bearer Token
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user?.token) {
          config.headers.set("Authorization", `Bearer ${user.token}`);
        }
      }
    } catch (e) {
      console.error("Auth Header Error:", e);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    if (!originalRequest || !error.response) return Promise.reject(error);

    // 1. Handle 401 Unauthorized (Token Expiry)
    if (error.response.status === 401) {
      // If we are already retrying or it's a public/refresh route, fail immediately
      if (
        originalRequest._retry ||
        originalRequest.url?.includes("/api/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.set("Authorization", `Bearer ${token}`);
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { token } = refreshResponse.data;

        // Update Local Storage
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          localStorage.setItem("user", JSON.stringify({ ...user, token }));
        }

        // Update instance and retry original
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        originalRequest.headers.set("Authorization", `Bearer ${token}`);

        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        dispatchHttpError("Session Expired. Please log in again.");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 2. Handle 429 Too Many Requests (Rate Limiting)
    if (error.response.status === 429) {
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 2) {
        originalRequest._retryCount = retryCount + 1;
        const backoffDelay = 1000 * Math.pow(2, retryCount); // 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return api(originalRequest);
      }
      dispatchHttpError("Rate limit exceeded. Try again in a moment.");
    }
    return Promise.reject(error);
  },
);

export default api;
