"use client";

import Link from "next/link";
import { Activity, FileText, LayoutDashboard, Menu, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RepoPicker } from "@/components/repo/RepoPicker";
import { RepoStatusBadge } from "@/components/repo/RepoStatusBadge";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header 
      className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b bg-background px-4 sm:px-6"
      data-testid="topbar"
    >
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="lg:hidden"
              data-testid="mobile-nav-toggle"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Menu className="size-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[88vw] max-w-sm" side="left">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Navigate between Studio pages.</SheetDescription>
            <div className="mt-8 space-y-6">
              <div className="space-y-3">
                <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="size-4" />
                  <span>prd-to-prod Studio</span>
                </Link>
                <RepoPicker />
                <RepoStatusBadge />
              </div>
              <nav className="grid gap-1 text-sm font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
                <Link
                  href="/prd/new"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <FileText className="size-4" />
                  Submit PRD
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Settings className="size-4" />
                  Settings
                </Link>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold tracking-tight md:hidden">
          prd-to-prod
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
