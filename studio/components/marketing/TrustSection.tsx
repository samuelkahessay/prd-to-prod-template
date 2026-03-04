import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, FileCode, Eye } from "lucide-react";

const principles = [
  {
    icon: FileCode,
    title: "Policy is code, not prompts",
    description:
      "autonomy-policy.yml defines exactly which actions each agent can take. Version-controlled, reviewable, auditable.",
  },
  {
    icon: ShieldCheck,
    title: "Unknown actions fail closed",
    description:
      "If an agent encounters a situation not covered by policy, it stops and asks. No guessing, no improvising.",
  },
  {
    icon: Eye,
    title: "Every decision is auditable",
    description:
      "Every PR, review verdict, deploy, and self-healing action is logged as a GitHub event with full context.",
  },
];

export function TrustSection() {
  return (
    <section className="border-t bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Human-owned boundaries
          </h2>
          <p className="mt-4 text-muted-foreground">
            Autonomy without control is chaos. The pipeline operates within
            explicit, human-defined rules.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <Card className="overflow-hidden border bg-card">
            <CardContent className="p-0">
              <div className="border-b bg-muted/50 px-4 py-2.5">
                <code className="text-xs text-muted-foreground">
                  autonomy-policy.yml
                </code>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed sm:text-sm sm:leading-relaxed">
                <code>{`actions:
  create_pr:
    autonomous: true
    constraints:
      - max_files_changed: 20
      - requires_tests: true

  merge_pr:
    autonomous: true
    requires:
      - pipeline_review: APPROVE
      - ci_status: passing

  deploy:
    autonomous: true
    rollback: automatic
    alert: on_failure

  modify_infrastructure:
    autonomous: false   # always requires human approval`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title} className="flex flex-col gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <p.icon className="size-5 text-foreground" />
              </div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
