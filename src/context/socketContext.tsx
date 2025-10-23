import { useState, useEffect, ReactNode } from "react";
import { SocketContext, SocketContextType } from "./socketContextInstance";
import { io } from "socket.io-client";

// module-scoped singleton socket to avoid multiple connections (React StrictMode/HMR)
let socketSingleton: SocketContextType = null;
let socketId: string | null = null;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<SocketContextType>(socketSingleton);

  useEffect(() => {
    if (!socketSingleton) {
      const url = import.meta.env.VITE_ENV === "production" ? "/" : "http://localhost:5000";
      // prefer websocket transport to avoid polling fallbacks and related 400 errors
      socketSingleton = io(url, { transports: ["websocket"], withCredentials: true });
      
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

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

// Export function to get current socket ID
export const getSocketId = (): string | null => {
  return socketId;
};
