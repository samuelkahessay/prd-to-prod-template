import type { PrdTemplate } from "./templates";

export function generatePrdMarkdown(
  template: PrdTemplate,
  values: Record<string, string>
): string {
  const projectName = values.projectName?.trim();
  if (!projectName) {
    throw new Error("Project name is required");
  }

  const description = values.description?.trim();
  if (!description) {
    throw new Error("Description is required");
  }

  let markdown = `# ${projectName}\n\n`;

  markdown += `## Overview\n${description}\n\n`;

  if (values.targetUsers?.trim()) {
    markdown += `## Target Users\n${values.targetUsers.trim()}\n\n`;
  }

  if (values.keyFeatures?.trim()) {
    const features = values.keyFeatures
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const trimmed = line.trim();
        return trimmed.startsWith("-") ? trimmed : `- ${trimmed}`;
      })
      .join("\n");

    markdown += `## Key Features\n${features}\n\n`;
  }

  markdown += `## Technical Requirements\n`;

  const categorySpecificFields = template.fields.filter(
    (f) => !["projectName", "description", "targetUsers", "keyFeatures", "technicalConstraints"].includes(f.id)
  );

  let hasTechnicalContent = false;
  for (const field of categorySpecificFields) {
    const value = values[field.id]?.trim();
    if (value) {
      markdown += `\n**${field.label}**: ${value}\n`;
      hasTechnicalContent = true;
    }
  }

  if (!hasTechnicalContent) {
    markdown += `\nTo be determined\n`;
  }

  markdown += `\n`;

  if (values.technicalConstraints?.trim()) {
    markdown += `## Constraints\n${values.technicalConstraints.trim()}\n`;
  }

  return markdown.replace(/\n\n\n+/g, "\n\n");
}
