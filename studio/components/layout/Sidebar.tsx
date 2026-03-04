"use client";

import Link from "next/link";
import { LayoutDashboard, FileText, Settings, Activity } from "lucide-react";
import { RepoPicker } from "@/components/repo/RepoPicker";
import { RepoStatusBadge } from "@/components/repo/RepoStatusBadge";

export function Sidebar() {
  return (
    <aside 
      className="hidden w-64 flex-col border-r bg-muted/20 lg:flex"
      data-testid="sidebar"
    >
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Activity className="h-5 w-5" />
          <span>prd-to-prod Studio</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <div className="mb-4 px-4">
          <RepoPicker />
          <div className="mt-2">
            <RepoStatusBadge />
          </div>
        </div>

        <nav className="grid gap-1 px-4 text-sm font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link 
            href="/prd/new" 
            className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
            Submit PRD
          </Link>
          <Link 
            href="/settings" 
            className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </div>
    </aside>
  );
}
