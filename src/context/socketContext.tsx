import { useState, useEffect, ReactNode } from "react";
import { SocketContext, SocketContextType } from "./socketContextInstance";
import { io } from "socket.io-client";

// module-scoped singleton socket to avoid multiple connections (React StrictMode/HMR)
let socketSingleton: SocketContextType = null;
let socketId: string | null = null;
let currentToken: string | null = null;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<SocketContextType>(socketSingleton);

  useEffect(() => {
    const { token } = JSON.parse(localStorage.getItem("user") || "{}");
    currentToken = token;

    if (!socketSingleton) {
      const url =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.VITE_ENV === "production"
          ? "/"
          : "http://localhost:5000");

      const secure = typeof url === "string" && url.startsWith("https");
      socketSingleton = io(url, {
        path: "/api/socket.io",
        withCredentials: true,
        secure,
        auth: { token },
      });

      // Store socket ID when connected
      socketSingleton.on("connect", () => {
        socketId = socketSingleton?.id || null;
      });

      // Clear socket ID when disconnected
      socketSingleton.on("disconnect", () => {
        socketId = null;
        console.log("🔌 Socket disconnected");
      });

      // Add error handling
      socketSingleton.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
      });
    }

    setSocket(socketSingleton);

    return () => {
      // only disconnect when the page is unloading and no other consumers exist.
      // For dev/HMR/StrictMode the singleton avoids double connections.
      // Do not set socketSingleton = null here to keep a stable instance across remounts.
      if (typeof window !== "undefined") {
        // leave socket connected; it will be cleaned up on full page unload
      }
    };
  }, []);

  // Listen for token changes and re-authenticate socket
  useEffect(() => {
    const checkTokenChange = () => {
      const { token } = JSON.parse(localStorage.getItem("user") || "{}");
      if (token !== currentToken && socketSingleton) {
        currentToken = token;
        // Update socket authentication with new token
        socketSingleton.auth = { token };
        // Reconnect with new token
        socketSingleton.disconnect();
        socketSingleton.connect();
        console.log("🔄 Socket re-authenticated with new token");
      }
    };

    // Check for token changes every 5 seconds
    const interval = setInterval(checkTokenChange, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

// Export function to get current socket ID
export const getSocketId = (): string | null => {
  return socketId;
};
