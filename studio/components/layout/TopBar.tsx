import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header 
      className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b bg-background px-4 sm:px-6"
      data-testid="topbar"
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight md:hidden">
          prd-to-prod
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
