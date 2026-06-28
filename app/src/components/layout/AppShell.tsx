"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AuthGate } from "@/components/auth/AuthGate";
import { AutoSyncRunner } from "@/components/profile/AutoSyncRunner";
import { SessionActivityTracker } from "@/components/auth/SessionActivityTracker";
import { QueryProvider } from "@/components/providers/QueryProvider";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <QueryProvider>
      <AuthGate>
        {!isLogin && <SessionActivityTracker />}
        {!isLogin && <AutoSyncRunner />}
        {!isLogin && <Navbar />}
        <main className={`main-content ${isLogin ? "main-content-login" : ""}`}>
          {children}
        </main>
      </AuthGate>
    </QueryProvider>
  );
}
