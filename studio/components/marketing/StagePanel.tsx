import { Badge } from "@/components/ui/badge";
import type { StageInfo } from "./stages/stage-data";

interface StagePanelProps {
  stage: StageInfo;
  children: React.ReactNode;
}

export function StagePanel({ stage, children }: StagePanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className="block size-2.5 rounded-full"
            style={{ backgroundColor: stage.colorVar }}
          />
          <Badge
            variant="outline"
            className="font-mono text-xs"
            style={{ borderColor: stage.colorVar, color: stage.colorVar }}
          >
            {stage.name}
          </Badge>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {stage.agent}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {stage.description}
        </p>
      </div>
      {children}
    </div>
  );
}
