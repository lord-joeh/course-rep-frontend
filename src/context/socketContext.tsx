import { useEffect, ReactNode, useCallback, useRef } from "react";
import { SocketContext, SocketContextType } from "./socketContextInstance";
import { io } from "socket.io-client";

let socketSingleton: SocketContextType = null;

const getLocalStorageToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.token || null;
  } catch {
    return null;
  }
};

const createSocket = (token: string | null) => {
  const url =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.VITE_ENV === "production" ? "/" : "http://localhost:5000");

  return io(url, {
    path: "/api/socket.io",
    withCredentials: true,
    auth: { token },
    autoConnect: true,
    transports: ["websocket", "polling"], // Try WebSocket first, fall back to polling
  });
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  // Initialize once, synchronously
  if (!socketSingleton) {
    socketSingleton = createSocket(getLocalStorageToken());
  }

  const currentTokenRef = useRef<string | null>(getLocalStorageToken());

  // Attach core event listeners
  useEffect(() => {
    if (!socketSingleton) return;

    const onConnect = () =>
      console.log("Socket connected:", socketSingleton?.id);
    const onDisconnect = () => console.log("Socket disconnected");
    const onError = (err: Error) => console.error("Socket Error:", err);

    socketSingleton.on("connect", onConnect);
    socketSingleton.on("disconnect", onDisconnect);
    socketSingleton.on("connect_error", onError);

    return () => {
      socketSingleton?.off("connect", onConnect);
      socketSingleton?.off("disconnect", onDisconnect);
      socketSingleton?.off("connect_error", onError);
    };
  }, []);

  // Re-auth when token changes — cross-tab via storage event,
  // same-tab via a custom event you dispatch on login/logout
  const syncToken = useCallback(() => {
    const newToken = getLocalStorageToken();
    if (newToken !== currentTokenRef.current && socketSingleton) {
      console.log("Re-authenticating socket...");
      currentTokenRef.current = newToken;
      socketSingleton.auth = { token: newToken };
      socketSingleton.disconnect().connect();
    }
  }, []);

  useEffect(() => {
    // Cross-tab sync
    window.addEventListener("storage", syncToken);
    // Same-tab sync: dispatch this custom event after login/logout
    window.addEventListener("auth-changed", syncToken);

    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("auth-changed", syncToken);
    };
  }, [syncToken]);

  return (
    <SocketContext.Provider value={socketSingleton}>{children}</SocketContext.Provider>
  );
};

// Call this after login or logout on the same tab
export const notifySocketAuthChanged = () => {
  window.dispatchEvent(new Event("auth-changed"));
};

export const getSocketId = () => socketSingleton?.id ?? null;
