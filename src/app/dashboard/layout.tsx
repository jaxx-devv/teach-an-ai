import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AchievementToastWatcher } from "@/components/dashboard/achievement-toast";
import { IdentityProvider } from "@/components/dashboard/identity-provider";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IdentityProvider>
      <div className="min-h-screen flex gap-2 lg:gap-4 p-2 lg:p-4 bg-canvas-light dark:bg-canvas-dark">
        <div className="w-44 lg:w-52 rounded-[1.75rem] bg-white dark:bg-sidebar-dark border border-lavender/25 shadow-card shrink-0 h-[calc(100vh-1rem)] lg:h-[calc(100vh-2rem)] sticky top-2 lg:top-4 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="flex-1 min-w-0 px-1 lg:px-2 py-2 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
        <AchievementToastWatcher />
      </div>
    </IdentityProvider>
  );
}
