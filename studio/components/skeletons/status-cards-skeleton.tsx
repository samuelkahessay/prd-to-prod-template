import { Skeleton } from "@/components/ui/skeleton";

export function StatusCardsSkeleton() {
  return (
    <div
      data-testid="skeleton-status-cards"
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-6 rounded-xl border bg-card py-6 shadow-sm"
        >
          <div className="flex items-start justify-between px-6">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="space-y-2 px-6">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-4 w-24" />
            <div className="space-y-1 pt-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
