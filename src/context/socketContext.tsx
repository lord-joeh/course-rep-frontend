import { useState, useEffect, ReactNode, useCallback } from "react";
import { SocketContext, SocketContextType } from "./socketContextInstance";
import { io } from "socket.io-client";

let socketSingleton: SocketContextType = null;
let socketId: string | null = null;
let currentToken: string | null = null;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<SocketContextType>(socketSingleton);

  const getLocalStorageToken = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.token || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const token = getLocalStorageToken();
    currentToken = token;

    if (!socketSingleton) {
      const url =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.VITE_ENV === "production"
          ? "/"
          : "http://localhost:5000");

      socketSingleton = io(url, {
        path: "/api/socket.io",
        withCredentials: true,
        auth: { token },
        autoConnect: true, 
      });
    }

    const onConnect = () => {
      socketId = socketSingleton?.id || null;
    };
    const onDisconnect = () => {
      socketId = null;
    };
    const onError = (err: Error) => console.error(" Socket Error:", err);

    socketSingleton.on("connect", onConnect);
    socketSingleton.on("disconnect", onDisconnect);
    socketSingleton.on("connect_error", onError);

    setSocket(socketSingleton);

    return () => {
      socketSingleton?.off("connect", onConnect);
      socketSingleton?.off("disconnect", onDisconnect);
      socketSingleton?.off("connect_error", onError);
    };
  }, [getLocalStorageToken]);

  useEffect(() => {
    const syncToken = () => {
      const newToken = getLocalStorageToken();
      if (newToken !== currentToken && socketSingleton) {
        console.log("🔄 Re-authenticating socket...");
        currentToken = newToken;
        socketSingleton.auth = { token: newToken };
        socketSingleton.disconnect().connect();
      }
    };

    // Instant sync across tabs
    globalThis.window.addEventListener("storage", syncToken);

    const interval = setInterval(syncToken, 30000);

    return () => {
      globalThis.window.removeEventListener("storage", syncToken);
      clearInterval(interval);
    };
  }, [getLocalStorageToken]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const getSocketId = () => socketId;
