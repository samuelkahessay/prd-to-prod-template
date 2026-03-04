import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const criteria = [
  { text: "Settings page has notification toggle per event type", pass: true },
  { text: "Preferences persist across sessions", pass: true },
  { text: "Default: all notifications enabled", pass: true },
  { text: "Build passes, no console errors", pass: true },
];

export function ReviewStage() {
  return (
    <Card className="overflow-hidden text-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: "var(--stage-review-muted)", color: "var(--stage-review)" }}
          >
            pr-review-agent
          </Badge>
          <span className="text-xs text-muted-foreground">reviewed PR #31</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 px-3 py-2.5">
          <p className="font-mono text-xs font-semibold text-green-600 dark:text-green-400">
            [PIPELINE-VERDICT]: APPROVE
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            All acceptance criteria verified. Code quality is good, tests cover
            the happy path and edge cases. No security concerns.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground mb-2">
            Criteria check
          </p>
          <ul className="space-y-1.5">
            {criteria.map((c) => (
              <li key={c.text} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm bg-green-600 dark:bg-green-500">
                  <Check className="size-2.5 text-white" />
                </span>
                <span className="text-muted-foreground">{c.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
