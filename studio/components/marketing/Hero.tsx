import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center px-4 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          From requirement to production.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Write a product brief. Watch AI agents decompose, implement, review,
          and deploy it&nbsp;&mdash; then fix what breaks.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            5 apps shipped
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs">
            3 tech stacks
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs">
            7 self-healing drills
          </Badge>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <a
              href="https://github.com/skahessay/prd-to-prod-template/generate"
              target="_blank"
              rel="noopener noreferrer"
            >
              Use template
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://github.com/skahessay/prd-to-prod-template"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 size-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
