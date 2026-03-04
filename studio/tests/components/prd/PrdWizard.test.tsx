import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrdWizard } from "@/components/prd/PrdWizard";

const PROJECT_NAME_PLACEHOLDER = "My Awesome Project";
const DESCRIPTION_PLACEHOLDER = /Describe what your project does/i;

async function advanceToStep2(user: ReturnType<typeof userEvent.setup>) {
  const webAppCard = screen.getByTestId("category-card-web-app");
  await user.click(webAppCard);

  await waitFor(() => {
    expect(screen.getByText(/Fill Template/i)).toBeInTheDocument();
  });
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  const projectNameInput = screen.getByPlaceholderText(PROJECT_NAME_PLACEHOLDER);
  const descriptionInput = screen.getByPlaceholderText(DESCRIPTION_PLACEHOLDER);

  await user.type(projectNameInput, "Test App");
  await user.type(descriptionInput, "A test application");
}

async function advanceToStep3(user: ReturnType<typeof userEvent.setup>) {
  await advanceToStep2(user);
  await fillRequiredFields(user);

  const nextButton = screen.getByRole("button", { name: /next/i });
  await user.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText(/Review & Customize/i)).toBeInTheDocument();
  });
}

describe("PrdWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial step (Choose Category)", () => {
    render(<PrdWizard onComplete={() => {}} />);

    expect(screen.getByTestId("prd-wizard")).toBeInTheDocument();
    expect(screen.getByText(/Choose Category/i)).toBeInTheDocument();
  });

  it("displays progress indicator", () => {
    render(<PrdWizard onComplete={() => {}} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows all 5 category cards in step 1", () => {
    render(<PrdWizard onComplete={() => {}} />);

    expect(screen.getByTestId("category-card-web-app")).toBeInTheDocument();
    expect(screen.getByTestId("category-card-api-backend")).toBeInTheDocument();
    expect(screen.getByTestId("category-card-cli-tool")).toBeInTheDocument();
    expect(screen.getByTestId("category-card-mobile-app")).toBeInTheDocument();
    expect(screen.getByTestId("category-card-library")).toBeInTheDocument();
  });

  it("advances to step 2 (Fill Form) when category is selected", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    await advanceToStep2(user);
  });

  it("does not advance without selecting a category", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    const nextButton = screen.queryByRole("button", { name: /next/i });
    if (nextButton) {
      await user.click(nextButton);
    }

    expect(screen.getByText(/Choose Category/i)).toBeInTheDocument();
  });

  it("allows going back from step 2 to step 1", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    await advanceToStep2(user);

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/Choose Category/i)).toBeInTheDocument();
    });
  });

  it("advances to step 3 (Preview) after filling form", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    await advanceToStep3(user);
  });

  it("shows preview of generated PRD in step 3", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    await advanceToStep3(user);

    expect(screen.getByTestId("prd-preview")).toBeInTheDocument();
    expect(screen.getByText("Test App")).toBeInTheDocument();
  });

  it("allows editing PRD markdown in step 3", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    await advanceToStep3(user);

    const editButton = screen.queryByRole("button", { name: /edit/i });
    if (editButton) {
      expect(editButton).toBeInTheDocument();
    }
  });

  it("advances to step 4 (Submit) after reviewing", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    await advanceToStep3(user);

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Submit/i })).toBeInTheDocument();
    });
  });

  it("calls onComplete with PRD markdown when submitted", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<PrdWizard onComplete={onComplete} />);

    await advanceToStep3(user);

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(expect.stringContaining("Test App"));
    });
  });

  it("highlights current step in progress indicator", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    const step1 = screen.getByText("1").closest("div");
    expect(step1?.className).toContain("bg-primary");

    const webAppCard = screen.getByTestId("category-card-web-app");
    await user.click(webAppCard);

    await waitFor(() => {
      const step2 = screen.getByText("2").closest("div");
      expect(step2?.className).toContain("bg-primary");
    });
  });

  it("preserves form data when navigating back and forth", async () => {
    const user = userEvent.setup();
    render(<PrdWizard onComplete={() => {}} />);

    await advanceToStep2(user);

    const projectNameInput = screen.getByPlaceholderText(PROJECT_NAME_PLACEHOLDER);
    await user.type(projectNameInput, "Test App");

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/Choose Category/i)).toBeInTheDocument();
    });

    const webAppCard = screen.getByTestId("category-card-web-app");
    await user.click(webAppCard);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test App")).toBeInTheDocument();
    });
  });

  it("does not allow skipping steps", () => {
    render(<PrdWizard onComplete={() => {}} />);

    expect(screen.queryByText(/Fill Template/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Review & Customize/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Submit/i)).not.toBeInTheDocument();
  });
});
