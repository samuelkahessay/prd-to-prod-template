import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryCard } from "@/components/prd/CategoryCard";
import type { PrdTemplate } from "@/lib/prd/templates";

const mockTemplate: PrdTemplate = {
  id: "web-app",
  name: "Web App",
  category: "web-app",
  description: "Build modern web applications",
  icon: "Globe",
  fields: [],
};

describe("CategoryCard", () => {
  it("renders template name", () => {
    render(<CategoryCard template={mockTemplate} onSelect={() => {}} />);
    expect(screen.getByText("Web App")).toBeInTheDocument();
  });

  it("renders template description", () => {
    render(<CategoryCard template={mockTemplate} onSelect={() => {}} />);
    expect(screen.getByText("Build modern web applications")).toBeInTheDocument();
  });

  it("has correct data-testid", () => {
    render(<CategoryCard template={mockTemplate} onSelect={() => {}} />);
    expect(screen.getByTestId("category-card-web-app")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<CategoryCard template={mockTemplate} onSelect={onSelect} />);

    const card = screen.getByTestId("category-card-web-app");
    await user.click(card);

    expect(onSelect).toHaveBeenCalledWith(mockTemplate);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders with different templates", () => {
    const apiTemplate: PrdTemplate = {
      id: "api-backend",
      name: "API Backend",
      category: "api-backend",
      description: "Create RESTful APIs",
      icon: "Server",
      fields: [],
    };

    render(<CategoryCard template={apiTemplate} onSelect={() => {}} />);

    expect(screen.getByText("API Backend")).toBeInTheDocument();
    expect(screen.getByText("Create RESTful APIs")).toBeInTheDocument();
    expect(screen.getByTestId("category-card-api-backend")).toBeInTheDocument();
  });

  it("applies selected styling when isSelected is true", () => {
    render(
      <CategoryCard template={mockTemplate} onSelect={() => {}} isSelected />
    );

    const card = screen.getByTestId("category-card-web-app");
    expect(card.className).toContain("border-primary");
  });

  it("does not apply selected styling when isSelected is false", () => {
    render(
      <CategoryCard template={mockTemplate} onSelect={() => {}} isSelected={false} />
    );

    const card = screen.getByTestId("category-card-web-app");
    expect(card.className).not.toContain("border-primary");
  });

  it("is keyboard accessible", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<CategoryCard template={mockTemplate} onSelect={onSelect} />);

    const card = screen.getByTestId("category-card-web-app");
    card.focus();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith(mockTemplate);
  });

  it("renders icon when provided", () => {
    render(<CategoryCard template={mockTemplate} onSelect={() => {}} />);
    
    const card = screen.getByTestId("category-card-web-app");
    const icon = card.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});
