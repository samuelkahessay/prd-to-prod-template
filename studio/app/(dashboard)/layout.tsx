import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RepoProvider } from "@/lib/repo/context";
import { QueryClientProvider } from "@/lib/queries/provider";

export const metadata: Metadata = {
  title: "Dashboard | prd-to-prod Studio",
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryClientProvider>
      <RepoProvider>
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </RepoProvider>
    </QueryClientProvider>
  );
}
