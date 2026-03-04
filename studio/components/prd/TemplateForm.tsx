"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import type { PrdTemplate } from "@/lib/prd/templates";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TemplateFormProps {
  template: PrdTemplate;
  onSubmit: (values: Record<string, string>) => void;
  onBack: (partialValues?: Record<string, string>) => void;
  initialValues?: Record<string, string>;
}

function buildSchema(template: PrdTemplate) {
  const shape: Record<string, z.ZodString | z.ZodDefault<z.ZodOptional<z.ZodString>>> = {};
  for (const field of template.fields) {
    if (field.required) {
      shape[field.id] = z.string().min(1, `${field.label} is required`);
    } else {
      shape[field.id] = z.string().optional().default("");
    }
  }
  return z.object(shape);
}

function buildDefaults(
  template: PrdTemplate,
  initial?: Record<string, string>
): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const field of template.fields) {
    defaults[field.id] = initial?.[field.id] ?? "";
  }
  return defaults;
}

export function TemplateForm({
  template,
  onSubmit,
  onBack,
  initialValues,
}: TemplateFormProps) {
  const schema = useMemo(() => buildSchema(template), [template]);
  const defaults = useMemo(
    () => buildDefaults(template, initialValues),
    [template, initialValues]
  );

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onSubmit" as const,
  });

  return (
    <form
      onSubmit={handleSubmit((data) => {
        const normalized: Record<string, string> = {};
        for (const field of template.fields) {
          normalized[field.id] = data[field.id] ?? "";
        }
        onSubmit(normalized);
      })}
      className="space-y-4"
    >
      {template.fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>

          {field.type === "text" && (
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              className={cn(errors[field.id] && "border-destructive")}
              aria-invalid={!!errors[field.id]}
              {...register(field.id)}
            />
          )}

          {field.type === "textarea" && (
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              rows={4}
              className={cn(errors[field.id] && "border-destructive")}
              aria-invalid={!!errors[field.id]}
              {...register(field.id)}
            />
          )}

          {field.type === "select" && (
            <select
              id={field.id}
              className={cn(
                "flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                errors[field.id] && "border-destructive"
              )}
              aria-invalid={!!errors[field.id]}
              {...register(field.id)}
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {errors[field.id] && (
            <p className="text-sm text-destructive">
              {(errors[field.id] as { message?: string })?.message ??
                `${field.label} is required`}
            </p>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => {
          const values = getValues();
          const cleaned: Record<string, string> = {};
          for (const [k, v] of Object.entries(values)) {
            cleaned[k] = v ?? "";
          }
          onBack(cleaned);
        }}>
          Back
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
