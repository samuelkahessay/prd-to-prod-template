"use client";

import type { ComponentType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PrdTemplate } from "@/lib/prd/templates";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  template: PrdTemplate;
  onSelect: (template: PrdTemplate) => void;
  isSelected?: boolean;
}

export function CategoryCard({ template, onSelect, isSelected = false }: CategoryCardProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, ComponentType<{ className?: string }>>)[template.icon] || LucideIcons.Box;

  return (
    <Card
      data-testid={`category-card-${template.category}`}
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-primary border-2 shadow-lg"
      )}
      onClick={() => onSelect(template)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(template);
        }
      }}
      tabIndex={0}
      role="button"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <IconComponent className="size-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
          </div>
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
