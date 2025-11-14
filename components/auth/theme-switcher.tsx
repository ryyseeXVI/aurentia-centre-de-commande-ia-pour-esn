"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="size-9 rounded-md"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
