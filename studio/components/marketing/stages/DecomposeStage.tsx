import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const issues = [
  {
    number: "#43",
    title: "Add NotificationSettings component",
    dep: null,
    labels: ["component"],
  },
  {
    number: "#44",
    title: "Create notification preferences API route",
    dep: null,
    labels: ["api"],
  },
  {
    number: "#45",
    title: "Wire preferences into event dispatch",
    dep: "#44",
    labels: ["integration"],
  },
  {
    number: "#46",
    title: "Add E2E test for notification toggle",
    dep: "#43",
    labels: ["test"],
  },
];

export function DecomposeStage() {
  return (
    <Card className="overflow-hidden text-sm">
      <div className="border-b bg-muted/50 px-4 py-2.5">
        <code className="text-xs text-muted-foreground">
          4 sub-issues from #42
        </code>
      </div>
      <CardContent className="space-y-2 py-3">
        {issues.map((issue) => (
          <div
            key={issue.number}
            className="flex items-center gap-3 rounded-md border px-3 py-2"
          >
            <span className="size-3.5 shrink-0 rounded-full border-2 border-stage-implement" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-muted-foreground">
                  {issue.number}
                </span>
                <span className="truncate text-xs font-medium">
                  {issue.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {issue.labels.map((l) => (
                  <Badge
                    key={l}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {l}
                  </Badge>
                ))}
                {issue.dep && (
                  <span className="text-[10px] text-muted-foreground">
                    blocked by {issue.dep}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
