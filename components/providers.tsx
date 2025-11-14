"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/contexts/theme-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ThemeProvider>
  );
}
