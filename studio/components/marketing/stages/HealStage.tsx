import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Wrench, Check } from "lucide-react";

const timeline = [
  {
    icon: AlertTriangle,
    label: "Failure detected",
    detail: "TypeError: Cannot read property 'filter' of undefined",
    time: "14:32:01",
    status: "destructive" as const,
  },
  {
    icon: Search,
    label: "Root cause identified",
    detail: "API response changed shape — missing notifications array when empty",
    time: "14:32:08",
    status: "warning" as const,
  },
  {
    icon: Wrench,
    label: "Fix PR opened",
    detail: "PR #32: fix: handle empty notifications array with fallback",
    time: "14:32:45",
    status: "warning" as const,
  },
  {
    icon: Check,
    label: "Fix deployed",
    detail: "Auto-reviewed, merged, deployed. All checks green.",
    time: "14:35:12",
    status: "success" as const,
  },
];

const statusColors = {
  destructive: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  success: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
};

export function HealStage() {
  return (
    <Card className="overflow-hidden text-sm">
      <div className="border-b bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: "var(--stage-heal-muted)", color: "var(--stage-heal)" }}
          >
            ci-failure-resolve
          </Badge>
          <span className="text-xs text-muted-foreground">
            self-healing in 3m 11s
          </span>
        </div>
      </div>
      <CardContent className="py-3">
        <div className="relative space-y-0">
          {timeline.map((step, i) => (
            <div key={step.label} className="flex gap-3 pb-3 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${statusColors[step.status]}`}>
                  <step.icon className="size-3" />
                </div>
                {i < timeline.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex-1 pt-0.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">{step.label}</p>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {step.time}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
