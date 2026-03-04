"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/prd/CategoryCard";
import { TemplateForm } from "@/components/prd/TemplateForm";
import { PrdPreview } from "@/components/prd/PrdPreview";
import { PRD_TEMPLATES, type PrdTemplate } from "@/lib/prd/templates";
import { generatePrdMarkdown } from "@/lib/prd/generator";
import { cn } from "@/lib/utils";

interface PrdWizardProps {
  onComplete: (markdown: string) => void;
}

const STEPS = [
  { label: "Choose Category" },
  { label: "Fill Template" },
  { label: "Review & Customize" },
  { label: "Submit" },
] as const;

export function PrdWizard({ onComplete }: PrdWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<PrdTemplate | null>(
    null
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");

  const handleCategorySelect = useCallback((template: PrdTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(1);
  }, []);

  const handleFormSubmit = useCallback(
    (values: Record<string, string>) => {
      setFormValues(values);
      if (selectedTemplate) {
        const md = generatePrdMarkdown(selectedTemplate, values);
        setGeneratedMarkdown(md);
      }
      setCurrentStep(2);
    },
    [selectedTemplate]
  );

  const handleFormBack = useCallback((partialValues?: Record<string, string>) => {
    if (partialValues) {
      setFormValues(partialValues);
    }
    setCurrentStep(0);
  }, []);

  const handlePreviewNext = useCallback(() => {
    setCurrentStep(3);
  }, []);

  const handlePreviewBack = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const handleSubmit = useCallback(() => {
    onComplete(generatedMarkdown);
  }, [onComplete, generatedMarkdown]);

  const handleSubmitBack = useCallback(() => {
    setCurrentStep(2);
  }, []);

  return (
    <div data-testid="prd-wizard" className="page-fade-in mx-auto w-full max-w-[720px] space-y-8 px-4 sm:px-6">
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : index < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-center text-xl font-semibold">
        {STEPS[currentStep].label}
      </h2>

      {currentStep === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRD_TEMPLATES.map((template) => (
            <CategoryCard
              key={template.id}
              template={template}
              onSelect={handleCategorySelect}
              isSelected={selectedTemplate?.id === template.id}
            />
          ))}
        </div>
      )}

      {currentStep === 1 && selectedTemplate && (
        <TemplateForm
          template={selectedTemplate}
          onSubmit={handleFormSubmit}
          onBack={handleFormBack}
          initialValues={formValues}
        />
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <PrdPreview markdown={generatedMarkdown} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handlePreviewBack}>
              Back
            </Button>
            <Button onClick={handlePreviewNext}>Next</Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border p-6 text-center space-y-4">
            <p className="text-muted-foreground">
              Your PRD will be created as a GitHub issue in the selected
              repository. The pipeline will automatically decompose it into
              actionable tasks.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleSubmitBack}>
              Back
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
        </div>
      )}
    </div>
  );
}
