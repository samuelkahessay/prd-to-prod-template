import { Skeleton } from "@/components/ui/skeleton";

export function MetricsBarSkeleton() {
  return (
    <div
      data-testid="skeleton-metrics-bar"
      className="flex items-center gap-6 overflow-x-auto rounded-lg border bg-card px-6 py-4 shadow-sm"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 whitespace-nowrap">
          <Skeleton className="h-5 w-5 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-3 w-16" />
          </div>
          {i < 4 && <div className="ml-6 h-8 w-px bg-border" />}
        </div>
      ))}
    </div>
  );
}
