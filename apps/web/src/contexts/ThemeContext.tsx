import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "classic" | "stadium";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "anket-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "classic";
  }

  const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === "stadium" || saved === "classic") {
    return saved;
  }

  return "classic";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("stadium", theme === "stadium");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    setThemeState((current) => (current === "classic" ? "stadium" : "classic"));
  };

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
