"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ActivityFilterProps {
  selectedTypes: Set<string>;
  onToggleType: (type: string) => void;
}

const EVENT_TYPES = [
  { id: "issues", label: "Issues" },
  { id: "prs", label: "Pull Requests" },
  { id: "workflows", label: "Workflows" },
  { id: "deployments", label: "Deployments" },
];

export function ActivityFilter({
  selectedTypes,
  onToggleType,
}: ActivityFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="activity-filter-trigger"
        >
          <Filter className="size-4" />
          <span>Filter</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Event Types</h4>
            <p className="text-xs text-muted-foreground">
              Filter activity by type
            </p>
          </div>
          <div className="space-y-3">
            {EVENT_TYPES.map((type) => (
              <div key={type.id} className="flex items-center gap-2">
                <Checkbox
                  id={type.id}
                  checked={selectedTypes.has(type.id)}
                  onCheckedChange={() => onToggleType(type.id)}
                />
                <label
                  htmlFor={type.id}
                  className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
