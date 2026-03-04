import { describe, it, expect } from "vitest";
import { PRD_TEMPLATES, type PrdTemplate } from "@/lib/prd/templates";

describe("PRD Templates", () => {
  it("exports exactly 5 category templates", () => {
    expect(PRD_TEMPLATES).toHaveLength(5);
  });

  it("includes Web App template", () => {
    const webApp = PRD_TEMPLATES.find((t) => t.id === "web-app");
    expect(webApp).toBeDefined();
    expect(webApp?.name).toBe("Web App");
    expect(webApp?.category).toBe("web-app");
  });

  it("includes API Backend template", () => {
    const apiBackend = PRD_TEMPLATES.find((t) => t.id === "api-backend");
    expect(apiBackend).toBeDefined();
    expect(apiBackend?.name).toBe("API Backend");
    expect(apiBackend?.category).toBe("api-backend");
  });

  it("includes CLI Tool template", () => {
    const cliTool = PRD_TEMPLATES.find((t) => t.id === "cli-tool");
    expect(cliTool).toBeDefined();
    expect(cliTool?.name).toBe("CLI Tool");
    expect(cliTool?.category).toBe("cli-tool");
  });

  it("includes Mobile App template", () => {
    const mobileApp = PRD_TEMPLATES.find((t) => t.id === "mobile-app");
    expect(mobileApp).toBeDefined();
    expect(mobileApp?.name).toBe("Mobile App");
    expect(mobileApp?.category).toBe("mobile-app");
  });

  it("includes Library template", () => {
    const library = PRD_TEMPLATES.find((t) => t.id === "library");
    expect(library).toBeDefined();
    expect(library?.name).toBe("Library");
    expect(library?.category).toBe("library");
  });

  describe("Web App template", () => {
    let template: PrdTemplate;

    beforeEach(() => {
      template = PRD_TEMPLATES.find((t) => t.id === "web-app")!;
    });

    it("has common required fields", () => {
      const projectName = template.fields.find((f) => f.id === "projectName");
      expect(projectName).toBeDefined();
      expect(projectName?.required).toBe(true);
      expect(projectName?.type).toBe("text");

      const description = template.fields.find((f) => f.id === "description");
      expect(description).toBeDefined();
      expect(description?.required).toBe(true);
      expect(description?.type).toBe("textarea");
    });

    it("has Web App specific fields", () => {
      const uiFramework = template.fields.find((f) => f.id === "uiFramework");
      expect(uiFramework).toBeDefined();
      expect(uiFramework?.type).toBe("text");

      const authRequirements = template.fields.find(
        (f) => f.id === "authRequirements"
      );
      expect(authRequirements).toBeDefined();

      const deploymentTarget = template.fields.find(
        (f) => f.id === "deploymentTarget"
      );
      expect(deploymentTarget).toBeDefined();
    });
  });

  describe("API Backend template", () => {
    let template: PrdTemplate;

    beforeEach(() => {
      template = PRD_TEMPLATES.find((t) => t.id === "api-backend")!;
    });

    it("has API specific fields", () => {
      const endpoints = template.fields.find((f) => f.id === "endpoints");
      expect(endpoints).toBeDefined();
      expect(endpoints?.type).toBe("textarea");

      const database = template.fields.find((f) => f.id === "database");
      expect(database).toBeDefined();

      const authMethod = template.fields.find((f) => f.id === "authMethod");
      expect(authMethod).toBeDefined();
    });
  });

  describe("CLI Tool template", () => {
    let template: PrdTemplate;

    beforeEach(() => {
      template = PRD_TEMPLATES.find((t) => t.id === "cli-tool")!;
    });

    it("has CLI specific fields", () => {
      const commands = template.fields.find((f) => f.id === "commands");
      expect(commands).toBeDefined();
      expect(commands?.type).toBe("textarea");

      const inputOutput = template.fields.find((f) => f.id === "inputOutput");
      expect(inputOutput).toBeDefined();

      const installation = template.fields.find((f) => f.id === "installation");
      expect(installation).toBeDefined();
    });
  });

  describe("Mobile App template", () => {
    let template: PrdTemplate;

    beforeEach(() => {
      template = PRD_TEMPLATES.find((t) => t.id === "mobile-app")!;
    });

    it("has Mobile specific fields", () => {
      const platform = template.fields.find((f) => f.id === "platform");
      expect(platform).toBeDefined();
      expect(platform?.type).toBe("select");

      const nativeOrRn = template.fields.find((f) => f.id === "nativeOrRn");
      expect(nativeOrRn).toBeDefined();

      const keyScreens = template.fields.find((f) => f.id === "keyScreens");
      expect(keyScreens).toBeDefined();
      expect(keyScreens?.type).toBe("textarea");
    });
  });

  describe("Library template", () => {
    let template: PrdTemplate;

    beforeEach(() => {
      template = PRD_TEMPLATES.find((t) => t.id === "library")!;
    });

    it("has Library specific fields", () => {
      const language = template.fields.find((f) => f.id === "language");
      expect(language).toBeDefined();

      const apiSurface = template.fields.find((f) => f.id === "apiSurface");
      expect(apiSurface).toBeDefined();
      expect(apiSurface?.type).toBe("textarea");

      const publishingTarget = template.fields.find(
        (f) => f.id === "publishingTarget"
      );
      expect(publishingTarget).toBeDefined();
    });
  });

  it("all templates have unique IDs", () => {
    const ids = PRD_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(PRD_TEMPLATES.length);
  });

  it("all templates have icon specified", () => {
    PRD_TEMPLATES.forEach((template) => {
      expect(template.icon).toBeDefined();
      expect(typeof template.icon).toBe("string");
    });
  });

  it("all templates have description", () => {
    PRD_TEMPLATES.forEach((template) => {
      expect(template.description).toBeDefined();
      expect(typeof template.description).toBe("string");
      expect(template.description.length).toBeGreaterThan(0);
    });
  });
});
