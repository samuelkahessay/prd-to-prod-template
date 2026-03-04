import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe, Clock } from "lucide-react";

export function DeployStage() {
  return (
    <Card className="overflow-hidden text-sm">
      <div className="border-b bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: "var(--stage-deploy-muted)", color: "var(--stage-deploy)" }}
          >
            deploy-vercel
          </Badge>
          <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
            Production
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2 rounded-md border px-3 py-2.5 bg-muted/30">
          <Globe className="size-4 shrink-0 text-muted-foreground" />
          <code className="flex-1 truncate text-xs">
            my-project-abc123.vercel.app
          </code>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="mt-0.5 font-medium flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-green-500" />
              Ready
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="mt-0.5 font-medium flex items-center gap-1.5">
              <Clock className="size-3 text-muted-foreground" />
              34s
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Branch</p>
            <p className="mt-0.5 font-mono font-medium">main</p>
          </div>
          <div>
            <p className="text-muted-foreground">Commit</p>
            <p className="mt-0.5 font-mono font-medium">a1b2c3d</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
