"use client";

import { useMemo, type CSSProperties, type ComponentType } from "react";
import dynamic from "next/dynamic";
import {
  Background,
  Controls,
  MiniMap,
  type NodeProps,
  type NodeTypes,
  type ReactFlowProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  buildPipelineDAG,
  type PipelineDAGEdge,
  type PipelineDAGNodeData,
} from "@/lib/pipeline/dag";
import type { PipelineIssue, PipelinePR, PipelineWorkflowRun } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";
import { PrdNode } from "@/components/pipeline/nodes/PrdNode";
import { IssueNode } from "@/components/pipeline/nodes/IssueNode";
import { PrNode } from "@/components/pipeline/nodes/PrNode";
import { DeployNode } from "@/components/pipeline/nodes/DeployNode";
import {
  mapStageToStatus,
  type PipelineFlowNode,
  type PipelineFlowNodeData,
  type PipelineNodeClickPayload,
} from "@/components/pipeline/types";

interface PipelineFlowProps {
  issues: PipelineIssue[];
  prs: PipelinePR[];
  workflows: PipelineWorkflowRun[];
  className?: string;
  onNodeClick?: (payload: PipelineNodeClickPayload) => void;
}

const ReactFlow = dynamic<ReactFlowProps<PipelineFlowNode, PipelineDAGEdge>>(
  () => import("@xyflow/react").then((mod) => mod.ReactFlow),
  { ssr: false }
);

const nodeTypes: NodeTypes = {
  "prd-node": PrdNode as ComponentType<NodeProps>,
  "issue-node": IssueNode as ComponentType<NodeProps>,
  "pr-node": PrNode as ComponentType<NodeProps>,
  "deploy-node": DeployNode as ComponentType<NodeProps>,
};

export function PipelineFlow({ issues, prs, workflows, className, onNodeClick }: PipelineFlowProps) {
  const { nodes: dagNodes, edges } = useMemo(
    () => buildPipelineDAG(issues, prs, workflows),
    [issues, prs, workflows]
  );

  const nodes = useMemo<PipelineFlowNode[]>(() => {
    return dagNodes.map((node) => {
      const workflow = node.type === "deploy-node" ? workflows.find((item) => `deploy-${item.id}` === node.id) : null;
      const pr = node.type === "pr-node" && node.data.number ? prs.find((item) => item.number === node.data.number) : null;

      return {
        ...node,
        data: {
          ...(node.data as PipelineDAGNodeData),
          nodeType: node.type,
          reviewStatus: pr ? summarizeReviewStatus(pr) : undefined,
          environment: workflow ? inferEnvironment(workflow.name) : undefined,
          onClick: onNodeClick,
        },
        className: cn(
          node.className,
          mapStageToStatus(node.data.stage) === "in_progress" ? "pipeline-node-pulse" : undefined
        ),
        style: {
          ...(node.style as CSSProperties | undefined),
          "--pipeline-node-pulse-color": node.data.statusColor,
        } as CSSProperties,
      };
    });
  }, [dagNodes, onNodeClick, prs, workflows]);

  return (
    <div className={cn("h-[560px] w-full rounded-xl border bg-card", className)} data-testid="pipeline-flow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        proOptions={{ hideAttribution: true }}
        aria-label="Pipeline flow diagram"
      >
        <Background gap={24} size={1} />
        <Controls className="!bg-card/90 !shadow-md" position="bottom-right" showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeBorderRadius={8}
          nodeColor={(node) => (node.data as PipelineFlowNodeData)?.statusColor ?? "#94a3b8"}
          ariaLabel="Pipeline minimap"
        />
      </ReactFlow>
      <style>{`
        @keyframes pipeline-node-border-pulse {
          0% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--pipeline-node-pulse-color, #3b82f6) 45%, transparent);
          }
          70% {
            box-shadow: 0 0 0 12px color-mix(in srgb, var(--pipeline-node-pulse-color, #3b82f6) 0%, transparent);
          }
          100% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--pipeline-node-pulse-color, #3b82f6) 0%, transparent);
          }
        }

        .pipeline-node-pulse {
          animation: pipeline-node-border-pulse 1.8s ease-out infinite;
        }
      `}</style>
    </div>
  );
}

function summarizeReviewStatus(pr: PipelinePR): string {
  if (pr.state === "merged") {
    return "Merged";
  }

  if (pr.reviews.some((review) => review.state === "CHANGES_REQUESTED")) {
    return "Changes requested";
  }

  if (pr.reviews.some((review) => review.state === "APPROVED")) {
    return "Approved";
  }

  return "Pending review";
}

function inferEnvironment(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("prod")) {
    return "production";
  }
  if (normalized.includes("stage")) {
    return "staging";
  }
  return "preview";
}
