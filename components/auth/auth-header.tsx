"use client";

import Image from "next/image";
import { useTheme } from "@/contexts/theme-context";
import { ThemeSwitcher } from "@/components/auth/theme-switcher";

export function AuthHeader() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex justify-between items-center p-4 md:p-6 shrink-0">
      <a href="/" className="group flex items-center gap-2 hover:opacity-80 transition-all">
        <Image
          src={resolvedTheme === "dark" ? "/light-long-logo.png" : "/dark-long-logo.png"}
          alt="ESN Compass Logo"
          width={150}
          height={40}
          priority
          className="object-contain h-10 w-auto"
        />
      </a>
      <ThemeSwitcher />
    </div>
  );
}
