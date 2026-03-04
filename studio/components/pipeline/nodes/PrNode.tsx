import { Handle, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { getStatusClasses, type PipelineFlowNode } from "@/components/pipeline/types";

export function PrNode({ id, data }: NodeProps<PipelineFlowNode>) {
  const statusClasses = getStatusClasses(data.stage);

  return (
    <div
      className={cn("min-w-[300px] rounded-xl border-2 bg-card px-4 py-3 shadow-sm", statusClasses.border)}
      style={{ borderColor: data.statusColor }}
      data-testid="pipeline-node-pr"
      role="button"
      tabIndex={0}
      onClick={() => data.onClick?.({ id, type: "pr-node", data })}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          data.onClick?.({ id, type: "pr-node", data });
        }
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pull Request</span>
        {typeof data.number === "number" ? (
          <span className="rounded-full border px-2 py-0.5 text-xs font-medium">#{data.number}</span>
        ) : null}
      </div>
      <div className="line-clamp-2 text-sm font-semibold">{data.title}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", statusClasses.badge)}>
          {data.stage}
        </span>
        {data.reviewStatus ? (
          <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {data.reviewStatus}
          </span>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
