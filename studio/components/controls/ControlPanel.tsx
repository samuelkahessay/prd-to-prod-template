"use client";

import { Command } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PipelineFlowNode } from "@/components/pipeline/types";
import { IssueActions } from "@/components/controls/IssueActions";
import { PrActions } from "@/components/controls/PrActions";
import { WorkflowActions } from "@/components/controls/WorkflowActions";
import { SlashCommandMenu } from "@/components/controls/SlashCommandMenu";

interface ControlPanelProps {
  selectedNode: PipelineFlowNode | null;
  owner: string;
  repo: string;
  onActionComplete?: () => void;
}

export function ControlPanel({
  selectedNode,
  owner,
  repo,
  onActionComplete,
}: ControlPanelProps) {
  if (!selectedNode) {
    return null;
  }

  const getNodeTitle = () => {
    if (selectedNode.type === "prd-node") {
      return "PRD Actions";
    }
    if (selectedNode.type === "issue-node" && selectedNode.data.number) {
      return `Issue #${selectedNode.data.number}`;
    }
    if (selectedNode.type === "pr-node" && selectedNode.data.number) {
      return `PR #${selectedNode.data.number}`;
    }
    if (selectedNode.type === "deploy-node") {
      return "Deployment Actions";
    }
    return "Actions";
  };

  const getNodeDescription = () => {
    if (selectedNode.type === "prd-node") {
      return "Trigger decomposition workflow";
    }
    if (selectedNode.type === "issue-node") {
      return "Manage issue state and labels";
    }
    if (selectedNode.type === "pr-node") {
      return "Review, merge, or close pull request";
    }
    if (selectedNode.type === "deploy-node") {
      return "Control workflow execution";
    }
    return "Available actions for this node";
  };

  const renderActions = () => {
    if (selectedNode.type === "prd-node") {
      return (
        <div className="flex gap-2">
          <Button variant="default" size="sm" disabled>
            <Command className="h-4 w-4 mr-2" />
            Trigger /decompose
          </Button>
          <p className="text-sm text-muted-foreground self-center">
            Post /decompose command to PRD issue
          </p>
        </div>
      );
    }

    if (selectedNode.type === "issue-node" && selectedNode.data.number) {
      return (
        <IssueActions
          owner={owner}
          repo={repo}
          issueNumber={selectedNode.data.number}
          onActionComplete={onActionComplete}
        />
      );
    }

    if (selectedNode.type === "pr-node" && selectedNode.data.number) {
      return (
        <PrActions
          owner={owner}
          repo={repo}
          prNumber={selectedNode.data.number}
          onActionComplete={onActionComplete}
        />
      );
    }

    if (selectedNode.type === "deploy-node") {
      const runId = extractRunId(selectedNode.id);
      if (runId) {
        return (
          <WorkflowActions
            owner={owner}
            repo={repo}
            runId={runId}
            onActionComplete={onActionComplete}
          />
        );
      }
      return (
        <p className="text-sm text-muted-foreground">
          No workflow run ID available
        </p>
      );
    }

    return null;
  };

  return (
    <Card data-testid="control-panel" className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{getNodeTitle()}</CardTitle>
        <CardDescription>{getNodeDescription()}</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {renderActions()}
      </CardContent>
    </Card>
  );
}

function extractRunId(deployNodeId: string): number | null {
  const match = deployNodeId.match(/^deploy-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}
