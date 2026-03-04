"use client";

import { useState } from "react";
import { Play, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkflowActionsProps {
  owner: string;
  repo: string;
  runId: number;
  onActionComplete?: () => void;
}

export function WorkflowActions({
  owner,
  repo,
  runId,
  onActionComplete,
}: WorkflowActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleReRun = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          runId,
          action: "rerun",
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to re-run workflow");
        return;
      }

      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          runId,
          action: "cancel",
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to cancel workflow");
        return;
      }

      setShowCancelDialog(false);
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="workflow-actions" className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleReRun}
          disabled={isLoading}
          data-testid="action-rerun-workflow"
        >
          <Play className="h-4 w-4 mr-2" />
          Re-run
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowCancelDialog(true)}
          disabled={isLoading}
          data-testid="action-cancel-workflow"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel workflow run #{runId}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
