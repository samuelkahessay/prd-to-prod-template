"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityItem } from "./ActivityItem";
import type { PipelineEvent } from "@/lib/pipeline/types";

interface ActivityFeedProps {
  events: PipelineEvent[];
  isLoading?: boolean;
  error?: Error | null;
  owner?: string;
  repo?: string;
}

export function ActivityFeed({
  events,
  isLoading,
  error,
  owner,
  repo,
}: ActivityFeedProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div data-testid="activity-feed" className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            data-testid="activity-skeleton"
            className="flex items-start gap-3 px-4 py-3"
          >
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="activity-feed"
        className="flex items-center justify-center py-12 px-4 text-center"
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">
            Failed to load activity feed
          </p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        data-testid="activity-feed"
        className="flex items-center justify-center py-12 px-4 text-center"
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            No recent activity
          </p>
          <p className="text-xs text-muted-foreground">
            Activity will appear here as your pipeline runs
          </p>
        </div>
      </div>
    );
  }

  const displayEvents = events.slice(0, 5);
  const hasMore = events.length > 5;

  return (
    <div data-testid="activity-feed" className="space-y-1">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="space-y-1">
          {displayEvents.map((event, index) => (
            <ActivityItem
              key={`${event.type}-${event.timestamp}-${index}`}
              event={event}
              index={index}
              owner={owner}
              repo={repo}
            />
          ))}
        </div>

        {hasMore && (
          <>
            <CollapsibleContent>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {events.slice(5).map((event, index) => (
                    <ActivityItem
                      key={`${event.type}-${event.timestamp}-${index + 5}`}
                      event={event}
                      index={index + 5}
                      owner={owner}
                      repo={repo}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>

            <div className="px-4 pt-2 pb-1">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span>{isOpen ? "Show less" : `Show more (${events.length - 5} hidden)`}</span>
                  {isOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </>
        )}
      </Collapsible>
    </div>
  );
}
