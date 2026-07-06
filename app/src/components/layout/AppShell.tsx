"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AuthGate } from "@/components/auth/AuthGate";
import { SubscriptionAccessGuard } from "@/components/auth/SubscriptionAccessGuard";
import { AutoSyncRunner } from "@/components/profile/AutoSyncRunner";
import { SessionActivityTracker } from "@/components/auth/SessionActivityTracker";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SyncQueueProvider } from "@/components/providers/SyncQueueProvider";
import { isLegalDocumentPath } from "@/lib/routing/public-paths";

interface AppShellProps {
  children: React.ReactNode;
}

function isDevPanelRoute(pathname: string): boolean {
  return pathname === "/dev" || pathname.startsWith("/dev/");
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isDevPanel = isDevPanelRoute(pathname);
  const isLegalPage = isLegalDocumentPath(pathname);
  const showStudentChrome = !isLogin && !isDevPanel && !isLegalPage;

  return (
    <QueryProvider>
      <SyncQueueProvider>
        <AuthGate>
          <SubscriptionAccessGuard>
            {showStudentChrome && <SessionActivityTracker />}
            {showStudentChrome && <AutoSyncRunner />}
            {showStudentChrome && <Navbar />}
            <main
              className={`main-content ${
                isLogin ? "main-content-login" : ""
              } ${isDevPanel ? "main-content-dev" : ""} ${
                isLegalPage ? "main-content-legal" : ""
              }`}
            >
              {children}
            </main>
          </SubscriptionAccessGuard>
        </AuthGate>
      </SyncQueueProvider>
    </QueryProvider>
  );
}
