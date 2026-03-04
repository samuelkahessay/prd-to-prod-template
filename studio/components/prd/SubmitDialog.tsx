'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  commitPrdFile,
  createPrdIssue,
  triggerDecompose,
} from '@/lib/prd/submit';

interface SubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  owner: string;
  repo: string;
}

type StepStatus = 'pending' | 'loading' | 'success' | 'error';

interface StepState {
  commitFile: StepStatus;
  createIssue: StepStatus;
  triggerDecompose: StepStatus;
}

const INITIAL_STEP_STATE: StepState = {
  commitFile: 'pending',
  createIssue: 'pending',
  triggerDecompose: 'pending',
};

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'loading') {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  }

  if (status === 'success') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  }

  if (status === 'error') {
    return <XCircle className="h-4 w-4 text-red-600" />;
  }

  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

export function SubmitDialog({
  open,
  onOpenChange,
  title,
  content,
  owner,
  repo,
}: SubmitDialogProps) {
  const [steps, setSteps] = useState<StepState>(INITIAL_STEP_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      setIssueUrl(null);

      try {
        setSteps((prev) => ({ ...prev, commitFile: 'loading' }));
        await commitPrdFile(owner, repo, title, content);
        setSteps((prev) => ({
          ...prev,
          commitFile: 'success',
          createIssue: 'loading',
        }));
      } catch (error) {
        setSteps((prev) => ({ ...prev, commitFile: 'error' }));
        throw error;
      }

      try {
        const issue = await createPrdIssue(owner, repo, title, content);
        setSteps((prev) => ({
          ...prev,
          createIssue: 'success',
          triggerDecompose: 'loading',
        }));

        await triggerDecompose(owner, repo, issue.number);
        setSteps((prev) => ({ ...prev, triggerDecompose: 'success' }));
        setIssueUrl(issue.url);

        return issue;
      } catch (error) {
        setSteps((prev) => ({
          ...prev,
          createIssue: prev.createIssue === 'loading' ? 'error' : prev.createIssue,
          triggerDecompose:
            prev.triggerDecompose === 'loading' ? 'error' : prev.triggerDecompose,
        }));

        throw error;
      }
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit PRD');
    },
  });

  const hasStarted = useMemo(
    () =>
      steps.commitFile !== 'pending' ||
      steps.createIssue !== 'pending' ||
      steps.triggerDecompose !== 'pending',
    [steps]
  );

  const resetAndSubmit = () => {
    setSteps(INITIAL_STEP_STATE);
    setErrorMessage(null);
    setIssueUrl(null);
    mutation.reset();
    mutation.mutate();
  };

  useEffect(() => {
    if (open && !hasStarted && mutation.status === 'idle') {
      resetAndSubmit();
      return;
    }

    if (!open) {
      setSteps(INITIAL_STEP_STATE);
      setErrorMessage(null);
      setIssueUrl(null);
      mutation.reset();
    }
  }, [hasStarted, mutation, open]);

  const isSuccess = steps.triggerDecompose === 'success';
  const isError = Boolean(errorMessage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submitting PRD</DialogTitle>
          <DialogDescription>
            Creating PRD file, issue, and triggering decomposition.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3" data-testid="submit-steps">
          <div
            className="flex items-center gap-2"
            data-testid="step-commitFile"
            data-status={steps.commitFile}
          >
            <StepIcon status={steps.commitFile} />
            <span>Committing PRD file...</span>
          </div>

          <div
            className="flex items-center gap-2"
            data-testid="step-createIssue"
            data-status={steps.createIssue}
          >
            <StepIcon status={steps.createIssue} />
            <span>Creating GitHub issue...</span>
          </div>

          <div
            className="flex items-center gap-2"
            data-testid="step-triggerDecompose"
            data-status={steps.triggerDecompose}
          >
            <StepIcon status={steps.triggerDecompose} />
            <span>Triggering /decompose...</span>
          </div>
        </div>

        {isSuccess && issueUrl ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <p className="font-medium">Submission complete.</p>
            <a
              href={issueUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              Open created issue
            </a>
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <DialogFooter>
          {isError ? (
            <Button onClick={resetAndSubmit}>Retry</Button>
          ) : null}
          {isSuccess ? (
            <Button onClick={() => onOpenChange(false)}>Go to Dashboard</Button>
          ) : (
            <Button variant="outline" disabled>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Processing
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
