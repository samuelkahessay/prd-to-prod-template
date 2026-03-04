"use client";

import { useRepo } from "@/lib/repo/context";
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export type RepoStatus = "valid" | "warning" | "error" | "loading" | "none";

interface RepoStatusBadgeProps {
  className?: string;
}

export function RepoStatusBadge({ className }: RepoStatusBadgeProps) {
  const { currentRepo } = useRepo();
  const [status, setStatus] = useState<RepoStatus>("none");

  useEffect(() => {
    if (!currentRepo) {
      setStatus("none");
      return;
    }

    let mounted = true;
    setStatus("loading");

    const validateRepo = async () => {
      try {
        const response = await fetch(
          `/api/repo/validate?owner=${encodeURIComponent(currentRepo.owner)}&repo=${encodeURIComponent(currentRepo.repo)}`
        );

        if (!mounted) return;

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const data = await response.json();
        
        if (data.isPrdToProdRepo && data.hasWorkflows) {
          setStatus("valid");
        } else if (data.isPrdToProdRepo && !data.hasWorkflows) {
          setStatus("warning");
        } else {
          setStatus("error");
        }
      } catch (error) {
        if (mounted) {
          console.error("Failed to validate repo:", error);
          setStatus("error");
        }
      }
    };

    validateRepo();

    return () => {
      mounted = false;
    };
  }, [currentRepo]);

  if (!currentRepo || status === "none") {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "valid":
        return <CheckCircle2 className="h-3 w-3" />;
      case "warning":
        return <AlertCircle className="h-3 w-3" />;
      case "error":
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "valid":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getStatusVariant()} className={className} data-testid="repo-status-badge">
      {getStatusIcon()}
      <span className="ml-1.5 font-mono text-xs">
        {currentRepo.owner}/{currentRepo.repo}
      </span>
    </Badge>
  );
}
