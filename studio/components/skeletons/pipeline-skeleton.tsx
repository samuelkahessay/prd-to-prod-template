import { Skeleton } from "@/components/ui/skeleton";

export function PipelineSkeleton() {
  return (
    <div
      className="h-[560px] w-full rounded-xl border bg-card p-6"
      data-testid="skeleton-pipeline-dag"
    >
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="flex flex-1 items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-20 w-32 rounded-lg" />
          <Skeleton className="h-3 w-20" />
        </div>

        <Skeleton className="h-1 w-12" />

        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-20 w-32 rounded-lg" />
          <Skeleton className="h-3 w-24" />
        </div>

        <Skeleton className="h-1 w-12" />

        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-20 w-32 rounded-lg" />
          <Skeleton className="h-3 w-16" />
        </div>

        <Skeleton className="h-1 w-12" />

        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-20 w-32 rounded-lg" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
    </div>
  );
}
