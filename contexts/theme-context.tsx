"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get system theme preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Initialize from localStorage or system preference immediately
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "system";
    try {
      return (localStorage.getItem("theme") as Theme) || "system";
    } catch {
      return "system";
    }
  };

  const getInitialResolvedTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    // Check if the class was already applied by the blocking script
    if (document.documentElement.classList.contains("dark")) return "dark";
    if (document.documentElement.classList.contains("light")) return "light";
    // Fallback to computing it
    const initialTheme = getInitialTheme();
    return initialTheme === "system" ? getSystemTheme() : initialTheme;
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(getInitialResolvedTheme);

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const effectiveTheme = newTheme === "system" ? getSystemTheme() : newTheme;

    // Remove both classes first
    root.classList.remove("light", "dark");
    // Add the effective theme class
    root.classList.add(effectiveTheme);

    setResolvedTheme(effectiveTheme);
  };

  // Ensure theme is applied on mount (in case blocking script failed)
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
