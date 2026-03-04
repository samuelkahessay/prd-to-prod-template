import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Code2, Lightbulb } from "lucide-react";

const audiences = [
  {
    icon: BarChart3,
    title: "For Engineering Leaders",
    hook: "Ship faster without growing headcount.",
    points: [
      "Autonomous pipeline handles implementation, review, and deploy",
      "Policy-as-code gives you control without micromanagement",
      "Full audit trail for compliance and visibility",
    ],
  },
  {
    icon: Code2,
    title: "For Developers",
    hook: "Write requirements, not boilerplate.",
    points: [
      "Focus on design decisions — agents handle the grind",
      "Every PR is reviewed before merge, every deploy is monitored",
      "Self-healing catches regressions while you sleep",
    ],
  },
  {
    icon: Lightbulb,
    title: "For Product Teams",
    hook: "From brief to production in hours, not sprints.",
    points: [
      "Write a PRD in plain language, pipeline decomposes it into tasks",
      "Watch progress in real-time via the Studio dashboard",
      "No waiting for sprint planning or developer availability",
    ],
  },
];

export function AudienceCards() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for your whole team
          </h2>
          <p className="mt-4 text-muted-foreground">
            Different roles, same pipeline. Everyone benefits from autonomous
            delivery.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a) => (
            <Card key={a.title} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                  <a.icon className="size-5 text-foreground" />
                </div>
                <CardTitle className="text-lg">{a.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{a.hook}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {a.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 block size-1 shrink-0 rounded-full bg-foreground/40" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
