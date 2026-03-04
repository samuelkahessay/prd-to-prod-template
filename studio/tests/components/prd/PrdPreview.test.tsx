import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrdPreview } from "@/components/prd/PrdPreview";

describe("PrdPreview", () => {
  const sampleMarkdown = `# Test App

## Overview
A test application for demonstrating PRD preview.

## Target Users
Developers and testers

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Technical Requirements
- Next.js
- TypeScript
- Tailwind CSS

## Constraints
Must be mobile-friendly`;

  it("renders markdown content", () => {
    render(<PrdPreview markdown={sampleMarkdown} />);

    expect(screen.getByText("Test App")).toBeInTheDocument();
    expect(screen.getByText(/A test application/i)).toBeInTheDocument();
  });

  it("renders headings correctly", () => {
    render(<PrdPreview markdown={sampleMarkdown} />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Target Users")).toBeInTheDocument();
    expect(screen.getByText("Key Features")).toBeInTheDocument();
    expect(screen.getByText("Technical Requirements")).toBeInTheDocument();
    expect(screen.getByText("Constraints")).toBeInTheDocument();
  });

  it("renders bullet lists", () => {
    render(<PrdPreview markdown={sampleMarkdown} />);

    expect(screen.getByText(/Feature 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Feature 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Feature 3/i)).toBeInTheDocument();
  });

  it("handles empty markdown", () => {
    render(<PrdPreview markdown="" />);
    
    const container = screen.getByTestId("prd-preview");
    expect(container).toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  it("renders code blocks", () => {
    const markdownWithCode = `# App

\`\`\`typescript
const app = () => {
  return "Hello";
};
\`\`\``;

    render(<PrdPreview markdown={markdownWithCode} />);

    expect(screen.getByText(/const app/i)).toBeInTheDocument();
  });

  it("renders inline code", () => {
    const markdownWithInlineCode = "Install with `npm install`";

    render(<PrdPreview markdown={markdownWithInlineCode} />);

    expect(screen.getByText(/npm install/i)).toBeInTheDocument();
  });

  it("renders links", () => {
    const markdownWithLinks = "[GitHub](https://github.com)";

    render(<PrdPreview markdown={markdownWithLinks} />);

    const link = screen.getByRole("link", { name: /GitHub/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://github.com");
  });

  it("has scrollable container", () => {
    render(<PrdPreview markdown={sampleMarkdown} />);

    const preview = screen.getByTestId("prd-preview");
    expect(preview.className).toContain("overflow-auto");
  });

  it("applies markdown styling classes", () => {
    render(<PrdPreview markdown={sampleMarkdown} />);

    const preview = screen.getByTestId("prd-preview");
    expect(preview.className).toContain("prose");
  });

  it("handles long content without breaking layout", () => {
    const longMarkdown = `# Long Document

${"## Section\n\nContent paragraph.\n\n".repeat(50)}`;

    render(<PrdPreview markdown={longMarkdown} />);

    const preview = screen.getByTestId("prd-preview");
    expect(preview).toBeInTheDocument();
  });
});
