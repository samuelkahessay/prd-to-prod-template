"use client";

import { useState } from "react";
import { Check, XCircle, GitMerge, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MergeMethod = "merge" | "squash" | "rebase";

interface PrActionsProps {
  owner: string;
  repo: string;
  prNumber: number;
  onActionComplete?: () => void;
}

export function PrActions({
  owner,
  repo,
  prNumber,
  onActionComplete,
}: PrActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [mergeMethod, setMergeMethod] = useState<MergeMethod>("squash");

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          prNumber,
          action: "approve",
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to approve PR");
        return;
      }

      setShowApproveDialog(false);
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Reason is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          prNumber,
          action: "reject",
          reason: rejectReason.trim(),
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to request changes");
        return;
      }

      setShowRejectDialog(false);
      setRejectReason("");
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerge = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          prNumber,
          action: "merge",
          method: mergeMethod,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to merge PR");
        return;
      }

      setShowMergeDialog(false);
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          prNumber,
          action: "close",
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to close PR");
        return;
      }

      setShowCloseDialog(false);
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="pr-actions" className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowApproveDialog(true)}
          disabled={isLoading}
          data-testid="action-approve-pr"
        >
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRejectDialog(true)}
          disabled={isLoading}
          data-testid="action-request-changes-pr"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Request Changes
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => setShowMergeDialog(true)}
          disabled={isLoading}
          data-testid="action-merge-pr"
        >
          <GitMerge className="h-4 w-4 mr-2" />
          Merge
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowCloseDialog(true)}
          disabled={isLoading}
          data-testid="action-close-pr"
        >
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Pull Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve PR #{prNumber}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide a reason for requesting changes on PR #{prNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
              placeholder="Reason for requesting changes..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={isLoading}
              aria-label="Reason for requesting changes"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Pull Request</DialogTitle>
            <DialogDescription>
              Select merge method and confirm merging PR #{prNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">Merge Method</label>
            <select
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={mergeMethod}
              onChange={(e) => setMergeMethod(e.target.value as MergeMethod)}
              disabled={isLoading}
              aria-label="Merge method"
              role="combobox"
            >
              <option value="squash" role="option">Squash and merge</option>
              <option value="merge" role="option">Create a merge commit</option>
              <option value="rebase" role="option">Rebase and merge</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMergeDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Pull Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to close PR #{prNumber} without merging?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClose}
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
