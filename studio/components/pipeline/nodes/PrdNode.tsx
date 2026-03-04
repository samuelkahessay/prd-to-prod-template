import { Handle, Position, type NodeProps } from "@xyflow/react";

import { PIPELINE_STATUS_COLORS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getStatusClasses, type PipelineFlowNode } from "@/components/pipeline/types";

export function PrdNode({ id, data }: NodeProps<PipelineFlowNode>) {
  const statusClasses = getStatusClasses(data.stage);
  const rootPalette = PIPELINE_STATUS_COLORS.in_progress;

  return (
    <div
      className={cn(
        "min-w-[280px] rounded-xl border-2 bg-card px-4 py-3 shadow-sm",
        rootPalette.border,
        statusClasses.border
      )}
      style={{ borderColor: data.statusColor }}
      data-testid="pipeline-node-prd"
      role="button"
      tabIndex={0}
      onClick={() => data.onClick?.({ id, type: "prd-node", data })}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          data.onClick?.({ id, type: "prd-node", data });
        }
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="mb-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
        PRD Root
      </div>
      <div className="line-clamp-2 text-sm font-semibold">{data.title}</div>
      <div className={cn("mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", statusClasses.badge)}>
        {data.stage}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
