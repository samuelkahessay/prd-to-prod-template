import { Handle, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { getStatusClasses, type PipelineFlowNode } from "@/components/pipeline/types";

export function DeployNode({ id, data }: NodeProps<PipelineFlowNode>) {
  const statusClasses = getStatusClasses(data.stage);

  return (
    <div
      className={cn("min-w-[260px] rounded-xl border-2 bg-card px-4 py-3 shadow-sm", statusClasses.border)}
      style={{ borderColor: data.statusColor }}
      data-testid="pipeline-node-deploy"
      role="button"
      tabIndex={0}
      onClick={() => data.onClick?.({ id, type: "deploy-node", data })}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          data.onClick?.({ id, type: "deploy-node", data });
        }
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Deployment</span>
        <span className="rounded-full border px-2 py-0.5 text-xs font-medium capitalize">
          {data.environment ?? "preview"}
        </span>
      </div>
      <div className="line-clamp-2 text-sm font-semibold">{data.title}</div>
      <div className={cn("mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", statusClasses.badge)}>
        {data.stage}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
