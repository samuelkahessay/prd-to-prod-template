import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateForm } from "@/components/prd/TemplateForm";
import type { PrdTemplate } from "@/lib/prd/templates";

const mockTemplate: PrdTemplate = {
  id: "web-app",
  name: "Web App",
  category: "web-app",
  description: "Build modern web applications",
  icon: "Globe",
  fields: [
    {
      id: "projectName",
      label: "Project Name",
      type: "text",
      placeholder: "My Awesome App",
      required: true,
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "What does your app do?",
      required: true,
    },
    {
      id: "targetUsers",
      label: "Target Users",
      type: "text",
      placeholder: "Who will use this app?",
      required: false,
    },
    {
      id: "platform",
      label: "Platform",
      type: "select",
      options: ["iOS", "Android", "Both"],
      required: false,
    },
  ],
};

describe("TemplateForm", () => {
  it("renders all form fields", () => {
    render(
      <TemplateForm template={mockTemplate} onSubmit={() => {}} onBack={() => {}} />
    );

    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Users/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform/i)).toBeInTheDocument();
  });

  it("shows required field indicators", () => {
    render(
      <TemplateForm template={mockTemplate} onSubmit={() => {}} onBack={() => {}} />
    );

    const projectNameLabel = screen.getByText(/Project Name/i).closest("label");
    expect(projectNameLabel?.textContent).toContain("*");
  });

  it("renders text inputs correctly", () => {
    render(
      <TemplateForm template={mockTemplate} onSubmit={() => {}} onBack={() => {}} />
    );

    const input = screen.getByPlaceholderText("My Awesome App");
    expect(input).toHaveAttribute("type", "text");
  });

  it("renders textarea correctly", () => {
    render(
      <TemplateForm template={mockTemplate} onSubmit={() => {}} onBack={() => {}} />
    );

    const textarea = screen.getByPlaceholderText("What does your app do?");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("renders select dropdown correctly", () => {
    render(
      <TemplateForm template={mockTemplate} onSubmit={() => {}} onBack={() => {}} />
    );

    const select = screen.getByLabelText(/Platform/i);
    expect(select.tagName).toBe("SELECT");
  });

  it("validates required fields on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TemplateForm template={mockTemplate} onSubmit={onSubmit} onBack={() => {}} />
    );

    const submitButton = screen.getByRole("button", { name: /next/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TemplateForm template={mockTemplate} onSubmit={onSubmit} onBack={() => {}} />
    );

    const projectNameInput = screen.getByPlaceholderText("My Awesome App");
    const descriptionInput = screen.getByPlaceholderText("What does your app do?");

    await user.type(projectNameInput, "Test App");
    await user.type(descriptionInput, "A test application");

    const submitButton = screen.getByRole("button", { name: /next/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        projectName: "Test App",
        description: "A test application",
        targetUsers: "",
        platform: "",
      });
    });
  });

  it("calls onBack when back button is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <TemplateForm template={mockTemplate} onSubmit={() => {}} onBack={onBack} />
    );

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("populates form with initial values", () => {
    const initialValues = {
      projectName: "Existing App",
      description: "Existing description",
      targetUsers: "Developers",
      platform: "iOS",
    };

    render(
      <TemplateForm
        template={mockTemplate}
        onSubmit={() => {}}
        onBack={() => {}}
        initialValues={initialValues}
      />
    );

    expect(screen.getByDisplayValue("Existing App")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Developers")).toBeInTheDocument();
    expect(screen.getByDisplayValue("iOS")).toBeInTheDocument();
  });

  it("shows validation error with red border", async () => {
    const user = userEvent.setup();

    render(
      <TemplateForm template={mockTemplate} onSubmit={() => {}} onBack={() => {}} />
    );

    const submitButton = screen.getByRole("button", { name: /next/i });
    await user.click(submitButton);

    await waitFor(() => {
      const projectNameInput = screen.getByPlaceholderText("My Awesome App");
      expect(projectNameInput.className).toContain("border-destructive");
    });
  });

  it("clears validation errors when field is filled", async () => {
    const user = userEvent.setup();

    render(
      <TemplateForm template={mockTemplate} onSubmit={() => {}} onBack={() => {}} />
    );

    const submitButton = screen.getByRole("button", { name: /next/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
    });

    const projectNameInput = screen.getByPlaceholderText("My Awesome App");
    await user.type(projectNameInput, "Test App");

    const descriptionInput = screen.getByPlaceholderText("What does your app do?");
    await user.type(descriptionInput, "A test app");

    await waitFor(() => {
      expect(screen.queryAllByText(/required/i)).toHaveLength(0);
    });
  });
});
