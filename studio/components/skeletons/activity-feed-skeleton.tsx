import { Skeleton } from "@/components/ui/skeleton";

export function ActivityFeedSkeleton() {
  return (
    <div data-testid="skeleton-activity-feed" className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-3"
        >
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
