import { createContext } from "react";
import { Socket } from "socket.io-client";


export type SocketContextType = Socket | null | undefined;

export const SocketContext = createContext<SocketContextType>(undefined);
