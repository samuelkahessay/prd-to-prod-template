import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

vi.mock("@/components/layout/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock("@/components/repo/RepoPicker", () => ({
  RepoPicker: () => <div data-testid="repo-picker">Repo picker</div>,
}));

vi.mock("@/components/repo/RepoStatusBadge", () => ({
  RepoStatusBadge: () => <div data-testid="repo-status-badge">Repo status</div>,
}));

describe("layout responsive behavior", () => {
  beforeEach(() => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));
  });

  it("renders mobile nav toggle under 1024px", () => {
    render(<TopBar />);

    expect(screen.getByTestId("mobile-nav-toggle")).toBeInTheDocument();
  });

  it("keeps sidebar hidden on mobile breakpoints", () => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar.className).toContain("hidden");
    expect(sidebar.className).toContain("lg:flex");
  });

  it("opens Sheet navigation when hamburger is clicked", () => {
    render(<TopBar />);

    fireEvent.click(screen.getByTestId("mobile-nav-toggle"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Submit PRD")).toBeInTheDocument();
  });
});
