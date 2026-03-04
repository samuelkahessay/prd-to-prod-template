import { describe, it, expect } from "vitest";
import { generatePrdMarkdown } from "@/lib/prd/generator";
import { PRD_TEMPLATES } from "@/lib/prd/templates";

describe("generatePrdMarkdown", () => {
  it("generates valid markdown for Web App template", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "web-app")!;
    const values = {
      projectName: "E-Commerce Dashboard",
      description: "A modern dashboard for managing online stores",
      targetUsers: "Store owners and managers",
      keyFeatures: "- Product management\n- Order tracking\n- Analytics",
      technicalConstraints: "Must support mobile browsers",
      uiFramework: "Next.js",
      authRequirements: "OAuth 2.0 with Google",
      deploymentTarget: "Vercel",
    };

    const markdown = generatePrdMarkdown(template, values);

    expect(markdown).toContain("# E-Commerce Dashboard");
    expect(markdown).toContain("## Overview");
    expect(markdown).toContain("A modern dashboard for managing online stores");
    expect(markdown).toContain("## Target Users");
    expect(markdown).toContain("Store owners and managers");
    expect(markdown).toContain("## Key Features");
    expect(markdown).toContain("- Product management");
    expect(markdown).toContain("## Technical Requirements");
    expect(markdown).toContain("Next.js");
    expect(markdown).toContain("## Constraints");
    expect(markdown).toContain("Must support mobile browsers");
  });

  it("generates valid markdown for API Backend template", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "api-backend")!;
    const values = {
      projectName: "User Service API",
      description: "RESTful API for user management",
      targetUsers: "Frontend developers",
      keyFeatures: "- User CRUD\n- Authentication\n- Profile management",
      technicalConstraints: "Must scale to 10k users",
      endpoints: "GET /users\nPOST /users\nPUT /users/:id",
      database: "PostgreSQL",
      authMethod: "JWT",
    };

    const markdown = generatePrdMarkdown(template, values);

    expect(markdown).toContain("# User Service API");
    expect(markdown).toContain("RESTful API for user management");
    expect(markdown).toContain("GET /users");
    expect(markdown).toContain("PostgreSQL");
    expect(markdown).toContain("JWT");
  });

  it("handles empty optional fields gracefully", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "web-app")!;
    const values = {
      projectName: "Minimal App",
      description: "A simple app",
      targetUsers: "",
      keyFeatures: "",
      technicalConstraints: "",
      uiFramework: "",
      authRequirements: "",
      deploymentTarget: "",
    };

    const markdown = generatePrdMarkdown(template, values);

    expect(markdown).toContain("# Minimal App");
    expect(markdown).toContain("A simple app");
    expect(markdown).not.toContain("undefined");
    expect(markdown).not.toContain("null");
  });

  it("converts key features to bullet list", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "cli-tool")!;
    const values = {
      projectName: "DevTool CLI",
      description: "CLI for developers",
      keyFeatures: "Code generation\nLinting\nTesting",
      commands: "devtool init\ndevtool lint",
      inputOutput: "JSON input, text output",
      installation: "npm install -g devtool",
    };

    const markdown = generatePrdMarkdown(template, values);

    expect(markdown).toContain("- Code generation");
    expect(markdown).toContain("- Linting");
    expect(markdown).toContain("- Testing");
  });

  it("includes category-specific sections", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "mobile-app")!;
    const values = {
      projectName: "Fitness Tracker",
      description: "Track workouts and nutrition",
      platform: "iOS",
      nativeOrRn: "React Native",
      keyScreens: "- Home\n- Workout log\n- Profile",
    };

    const markdown = generatePrdMarkdown(template, values);

    expect(markdown).toContain("# Fitness Tracker");
    expect(markdown).toContain("Track workouts and nutrition");
    expect(markdown).toContain("iOS");
    expect(markdown).toContain("React Native");
  });

  it("preserves multiline content", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "library")!;
    const values = {
      projectName: "DataLib",
      description: "Data manipulation library",
      apiSurface:
        "class DataProcessor {\n  parse(data: string): object\n  validate(obj: object): boolean\n}",
      language: "TypeScript",
      publishingTarget: "npm",
    };

    const markdown = generatePrdMarkdown(template, values);

    expect(markdown).toContain("class DataProcessor");
    expect(markdown).toContain("parse(data: string): object");
    expect(markdown).toContain("validate(obj: object): boolean");
  });

  it("throws error when required fields are missing", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "web-app")!;
    const values = {
      projectName: "",
      description: "Missing project name",
    };

    expect(() => {
      generatePrdMarkdown(template, values);
    }).toThrow();
  });

  it("generates clean markdown without extra blank lines", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "web-app")!;
    const values = {
      projectName: "Test App",
      description: "Test description",
      keyFeatures: "- Feature 1\n- Feature 2",
    };

    const markdown = generatePrdMarkdown(template, values);

    // Should not have triple newlines
    expect(markdown).not.toContain("\n\n\n");
  });

  it("handles special characters in markdown content", () => {
    const template = PRD_TEMPLATES.find((t) => t.id === "web-app")!;
    const values = {
      projectName: "App with *stars* and _underscores_",
      description: "Description with `code` and [links](http://example.com)",
      keyFeatures: "- Feature with **bold** text",
    };

    const markdown = generatePrdMarkdown(template, values);

    expect(markdown).toContain("*stars*");
    expect(markdown).toContain("_underscores_");
    expect(markdown).toContain("`code`");
    expect(markdown).toContain("[links]");
    expect(markdown).toContain("**bold**");
  });
});
