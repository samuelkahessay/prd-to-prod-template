"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Github } from "lucide-react";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-200 ${
        scrolled
          ? "border-b bg-background/80 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight"
        >
          prd-to-prod
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <a href="#walkthrough">How it works</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/skahessay/prd-to-prod-template"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-1.5 size-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>
          <ThemeToggle />
          <Button size="sm" asChild>
            <a
              href="https://github.com/skahessay/prd-to-prod-template/generate"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Started
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
