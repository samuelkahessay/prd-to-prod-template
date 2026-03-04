"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { addRecentRepo } from "./storage";

export interface RepoInfo {
  owner: string;
  repo: string;
}

interface RepoContextValue {
  currentRepo: RepoInfo | null;
  setRepo: (owner: string, repo: string) => void;
  clearRepo: () => void;
}

const RepoContext = createContext<RepoContextValue | undefined>(undefined);

const STORAGE_KEY = "prd-to-prod-studio:current-repo";

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const [currentRepo, setCurrentRepo] = useState<RepoInfo | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RepoInfo;
        setCurrentRepo(parsed);
      }
    } catch (error) {
      console.error("Failed to restore current repo from localStorage:", error);
    }
    
    setIsHydrated(true);
  }, []);

  const setRepo = (owner: string, repo: string) => {
    const repoInfo: RepoInfo = { owner, repo };
    setCurrentRepo(repoInfo);
    
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(repoInfo));
      addRecentRepo(owner, repo);
    }
  };

  const clearRepo = () => {
    setCurrentRepo(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value: RepoContextValue = {
    currentRepo: isHydrated ? currentRepo : null,
    setRepo,
    clearRepo,
  };

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepo() {
  const context = useContext(RepoContext);
  if (context === undefined) {
    throw new Error("useRepo must be used within a RepoProvider");
  }
  return context;
}
