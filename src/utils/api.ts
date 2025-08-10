import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  decompress: true,
});
const authRoutes = [
  "/auth/login",
  "/student/register",
  "/auth/refresh",
  "/auth/forgot",
  "/auth/reset",
];
api.interceptors.request.use(
  async (config) => {
    if (authRoutes.some((route) => config.url?.includes(route))) {
      return config;
    }

    if (config.method === "get") {
      config.headers["Cache-Control"] = "no-cache";
      config.headers["Pragma"] = "no-cache";
    }

    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.error("Failed to parse user data:", error);
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthRoute = authRoutes.some((route) =>
        originalRequest.url?.includes(route),
      );
      if (isAuthRoute) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/refresh`,
          {},
          { withCredentials: true },
        );

        const { token } = response.data;
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          localStorage.setItem("user", JSON.stringify({ ...user, token }));
        }

        const bearerToken = `Bearer ${token}`;
        api.defaults.headers.common["Authorization"] = bearerToken;
        originalRequest.headers["Authorization"] = bearerToken;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("user");
        return Promise.reject(refreshError);
      }
    }
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 429:
          console.error("Rate limit exceeded");
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              1000 * Math.pow(2, originalRequest._retryCount || 0),
            ),
          );
          return api(originalRequest);
        case 500:
          console.error("Server Error:", error.response.data);
          break;
        default:
          if (status >= 500) {
            console.error("Server Error:", error.response.data);
          }
      }

      return Promise.reject(error);
    }
  },
);

if (import.meta.env.VITE_ENV === "development") {
  api.interceptors.request.use((request) => {
    console.log("Starting Request", request);
    return request;
  });
  api.interceptors.response.use((response) => {
    console.log("Response:", response);
    return response;
  });
}

export default api;
