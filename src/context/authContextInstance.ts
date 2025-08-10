import { createContext } from "react";
import type { AuthContextType } from "./authContext.ts";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
