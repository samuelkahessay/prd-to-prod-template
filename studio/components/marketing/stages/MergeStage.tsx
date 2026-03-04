import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, GitMerge, Trash2 } from "lucide-react";

const events = [
  {
    icon: Check,
    text: "All checks passed",
    detail: "CI, review verdict, policy compliance",
    color: "text-green-600 dark:text-green-400",
  },
  {
    icon: GitMerge,
    text: "PR #31 auto-merged into main",
    detail: "Squash merge · 4 commits → 1",
    color: "text-stage-merge",
  },
  {
    icon: Trash2,
    text: "Branch feat/notification-prefs deleted",
    detail: "Cleanup complete",
    color: "text-muted-foreground",
  },
];

export function MergeStage() {
  return (
    <Card className="overflow-hidden text-sm">
      <div className="border-b bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: "var(--stage-merge-muted)", color: "var(--stage-merge)" }}
          >
            auto-merge
          </Badge>
          <span className="text-xs text-muted-foreground">
            completed in 12s
          </span>
        </div>
      </div>
      <CardContent className="py-3">
        <div className="relative space-y-0">
          {events.map((e, i) => (
            <div key={e.text} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={`flex size-6 shrink-0 items-center justify-center rounded-full border bg-background ${e.color}`}>
                  <e.icon className="size-3" />
                </div>
                {i < events.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="pt-0.5">
                <p className="text-xs font-medium">{e.text}</p>
                <p className="text-[11px] text-muted-foreground">{e.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
