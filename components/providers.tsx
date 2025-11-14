"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/contexts/theme-context";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
      <Toaster />
    </ThemeProvider>
  );
}
