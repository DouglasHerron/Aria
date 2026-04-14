import type { ReactNode } from "react";

import { ActiveSectionProvider } from "@/components/ActiveSectionProvider";
import { CommandPaletteHost } from "@/components/CommandPaletteHost";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

interface DashboardShellProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  userImage?: string | null;
  demoMode?: boolean;
}

export function DashboardShell({
  children,
  userName,
  userEmail,
  userImage,
  demoMode,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-x-hidden overflow-hidden bg-background text-foreground">
      <CommandPaletteHost />
      <ActiveSectionProvider>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
          />
          {demoMode ? (
            <div className="border-b border-yellow-500/30 bg-yellow-500/20 px-4 py-1 text-center text-xs text-yellow-700 dark:text-yellow-300">
              Demo Mode — showing sample data (writes disabled)
            </div>
          ) : null}
          <main className="min-h-0 flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </ActiveSectionProvider>
    </div>
  );
}
