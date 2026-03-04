import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PrdStage() {
  return (
    <Card className="overflow-hidden text-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            #42
          </Badge>
          <Badge variant="secondary" className="text-xs">
            feature
          </Badge>
          <Badge variant="secondary" className="text-xs">
            pipeline
          </Badge>
        </div>
        <CardTitle className="text-base mt-1">
          Add user notification preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-muted-foreground">
        <div>
          <p className="font-medium text-foreground text-xs mb-1.5">
            Problem
          </p>
          <p className="text-xs leading-relaxed">
            Users have no way to control which pipeline events trigger
            notifications. All events go to all watchers.
          </p>
        </div>
        <div>
          <p className="font-medium text-foreground text-xs mb-1.5">
            Acceptance Criteria
          </p>
          <ul className="space-y-1">
            {[
              "Settings page has notification toggle per event type",
              "Preferences persist across sessions",
              "Default: all notifications enabled",
              "Build passes, no console errors",
            ].map((c) => (
              <li key={c} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 block size-3.5 shrink-0 rounded border border-border" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
