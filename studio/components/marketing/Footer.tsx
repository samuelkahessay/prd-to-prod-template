import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          Built by the pipeline&nbsp;&mdash; this site is its own first
          customer.
        </p>
        <a
          href="https://github.com/skahessay/prd-to-prod-template"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Github className="size-4" />
          <span className="sr-only">GitHub repository</span>
        </a>
      </div>
    </footer>
  );
}
