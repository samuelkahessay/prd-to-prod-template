"use client";

import { useState } from "react";
import { X, Tag, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SlashCommandMenu } from "@/components/controls/SlashCommandMenu";

interface IssueActionsProps {
  owner: string;
  repo: string;
  issueNumber: number;
  onActionComplete?: () => void;
}

export function IssueActions({
  owner,
  repo,
  issueNumber,
  onActionComplete,
}: IssueActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [labelInput, setLabelInput] = useState("");

  const handleCloseIssue = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          issueNumber,
          action: "close",
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to close issue");
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

  const handleAddLabel = async () => {
    if (!labelInput.trim()) {
      setError("Label name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/actions/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          issueNumber,
          action: "label",
          label: labelInput.trim(),
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Failed to add label");
        return;
      }

      setShowLabelDialog(false);
      setLabelInput("");
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="issue-actions" className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowCloseDialog(true)}
          data-testid="action-close-issue"
        >
          <X className="h-4 w-4 mr-2" />
          Close Issue
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLabelDialog(true)}
          data-testid="action-add-label"
        >
          <Tag className="h-4 w-4 mr-2" />
          Add Label
        </Button>

        <SlashCommandMenu
          owner={owner}
          repo={repo}
          issueNumber={issueNumber}
          onActionComplete={onActionComplete}
        />
      </div>

      {isLoading && (
        <div data-testid="action-loading" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Issue</DialogTitle>
            <DialogDescription>
              Are you sure you want to close issue #{issueNumber}? This action can be undone.
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
              onClick={handleCloseIssue}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Label</DialogTitle>
            <DialogDescription>
              Enter the label name to add to issue #{issueNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Label name"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLabelDialog(false);
                setLabelInput("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddLabel} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
