import { createContext } from "react";
import type { ThemeContextType} from './themeContext'

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);