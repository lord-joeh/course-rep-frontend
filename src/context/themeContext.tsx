import React, {
  useState,
  useMemo,
  useCallback,
  PropsWithChildren,
} from "react";
import { ThemeContext } from "./themeContextIInstance";

export interface Theme {
  name: "light" | "dark";
  colors: {
    primary: string; // Used for key UI elements like buttons and headings
    secondary: string; // Used for accents and hover states
    background: string;
    surface: string; // Used for cards, panels, etc.
    text: string;
    subText: string;
    border: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const lightTheme: Theme = {
  name: "light",
  colors: {
    primary: "#1d3557", // Dark Blue (from your secondary)
    secondary: "#e63946", // Bright Red (from your subText) for accents/buttons
    background: "#f1faee", // Your original light background
    surface: "#ffffff", // Pure white for cards, better for readability
    text: "#000000", // Black for high contrast on light backgrounds
    subText: "#6a7380", // A soft gray for secondary text, not alarming
    border: "#d1d5db", // A light gray border
  },
};

const darkTheme: Theme = {
  name: "dark",
  colors: {
    primary: "#415a77", // Lighter Blue
    secondary: "#e63946", // Retain vibrant red accent
    background: "#1b263b", // Dark Blue-Gray
    surface: "#283655", // Slightly lighter dark surface
    text: "#e0e1dd", // Off-white for high contrast
    subText: "#b8c3d0", // Light gray for secondary text
    border: "#4a5568", // Medium-dark gray
  },
};

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(lightTheme);

  const toggleTheme = useCallback(() => {
    setCurrentTheme((prevTheme) =>
      prevTheme.name === "light" ? darkTheme : lightTheme,
    );
  }, []);

  const contextValue = useMemo(
    () => ({
      theme: currentTheme,
      toggleTheme,
    }),
    [currentTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export type { ThemeContextType };
