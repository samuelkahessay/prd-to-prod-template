import type { Node } from "@xyflow/react";

import { PIPELINE_STATUS_COLORS, type PipelineStatus } from "@/lib/theme";
import type { PipelineDAGNodeData, PipelineDAGNodeType } from "@/lib/pipeline/dag";
import type { PipelineStage } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

export interface PipelineFlowNodeData extends PipelineDAGNodeData {
  nodeType: PipelineDAGNodeType;
  reviewStatus?: string;
  environment?: string;
  onClick?: (payload: PipelineNodeClickPayload) => void;
}

export type PipelineFlowNode = Node<PipelineFlowNodeData, PipelineDAGNodeType>;

export interface PipelineNodeClickPayload {
  id: string;
  type: PipelineDAGNodeType;
  data: PipelineFlowNodeData;
}

export function mapStageToStatus(stage: PipelineStage): PipelineStatus {
  if (stage === "complete") {
    return "success";
  }

  if (stage === "failed") {
    return "failed";
  }

  if (stage === "reviewing" || stage === "planning") {
    return "pending";
  }

  if (stage === "idle") {
    return "idle";
  }

  return "in_progress";
}

export function isActiveStage(stage: PipelineStage): boolean {
  return stage === "implementing" || stage === "reviewing" || stage === "deploying";
}

export function getStatusClasses(stage: PipelineStage): { badge: string; border: string } {
  const tone = mapStageToStatus(stage);
  const palette = PIPELINE_STATUS_COLORS[tone];

  return {
    badge: cn(palette.bg, palette.text, "border", palette.border),
    border: cn(palette.border),
  };
}
