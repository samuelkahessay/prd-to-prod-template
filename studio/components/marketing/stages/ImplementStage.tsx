import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const files = [
  { name: "components/settings/NotificationSettings.tsx", added: 87, removed: 0 },
  { name: "app/api/notifications/preferences/route.ts", added: 42, removed: 0 },
  { name: "lib/notifications/dispatch.ts", added: 12, removed: 3 },
  { name: "tests/notification-prefs.test.ts", added: 56, removed: 0 },
];

const commits = [
  "feat: add NotificationSettings component with per-event toggles",
  "feat: create notification preferences API with localStorage persistence",
  "fix: wire preferences check into event dispatch pipeline",
  "test: add unit tests for notification preference CRUD",
];

export function ImplementStage() {
  return (
    <Card className="overflow-hidden text-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            PR #31
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: "var(--stage-implement-muted)", color: "var(--stage-implement)" }}
          >
            repo-assist
          </Badge>
        </div>
        <CardTitle className="text-base mt-1">
          Add notification preferences to settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-foreground mb-1.5">
            Files changed
          </p>
          <div className="space-y-1">
            {files.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between gap-2 font-mono text-xs"
              >
                <span className="truncate text-muted-foreground">{f.name}</span>
                <span className="shrink-0">
                  <span className="text-green-600 dark:text-green-400">+{f.added}</span>
                  {f.removed > 0 && (
                    <span className="ml-1 text-red-500 dark:text-red-400">-{f.removed}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground mb-1.5">Commits</p>
          <div className="space-y-1">
            {commits.map((c) => (
              <p key={c} className="text-xs text-muted-foreground truncate">
                {c}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
