import { useContext } from "react";
import { SocketContext } from "../context/socketContextInstance";

export const useSocket = () => {
  const socket = useContext(SocketContext);
  // SocketContext is initialized with undefined when no provider exists
  if (socket === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
};
