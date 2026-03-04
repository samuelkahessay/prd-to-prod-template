import { Button } from "@/components/ui/button";

export function GetStarted() {
  return (
    <section className="border-t py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Start shipping autonomously
        </h2>
        <p className="mt-4 text-muted-foreground">
          Fork the template, run the setup wizard, and push your first PRD.
        </p>

        <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-foreground/20" />
            <span className="size-2.5 rounded-full bg-foreground/20" />
            <span className="size-2.5 rounded-full bg-foreground/20" />
            <code className="ml-2 text-xs text-muted-foreground">
              terminal
            </code>
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-left font-mono text-sm leading-relaxed">
            <code>
              <span className="text-muted-foreground">$</span>{" "}
              <span>npx degit skahessay/prd-to-prod-template my-project</span>
              {"\n"}
              <span className="text-muted-foreground">$</span>{" "}
              <span>cd my-project && ./setup.sh</span>
            </code>
          </pre>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <a
              href="https://github.com/skahessay/prd-to-prod-template/generate"
              target="_blank"
              rel="noopener noreferrer"
            >
              Use this template
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://github.com/skahessay/prd-to-prod-template#readme"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the docs
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
