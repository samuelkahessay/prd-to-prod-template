export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface PrdTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  fields: TemplateField[];
}

const commonFields: TemplateField[] = [
  {
    id: "projectName",
    label: "Project Name",
    type: "text",
    placeholder: "My Awesome Project",
    required: true,
  },
  {
    id: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Describe what your project does and its purpose",
    required: true,
  },
  {
    id: "targetUsers",
    label: "Target Users",
    type: "text",
    placeholder: "Who will use this?",
    required: false,
  },
  {
    id: "keyFeatures",
    label: "Key Features",
    type: "textarea",
    placeholder: "List the main features (one per line)",
    required: false,
  },
  {
    id: "technicalConstraints",
    label: "Technical Constraints",
    type: "textarea",
    placeholder: "Any technical requirements or limitations",
    required: false,
  },
];

export const PRD_TEMPLATES: PrdTemplate[] = [
  {
    id: "web-app",
    name: "Web App",
    category: "web-app",
    description: "Build modern web applications with rich user interfaces",
    icon: "Globe",
    fields: [
      ...commonFields,
      {
        id: "uiFramework",
        label: "UI Framework Preference",
        type: "text",
        placeholder: "e.g., Next.js, React, Vue",
        required: false,
      },
      {
        id: "authRequirements",
        label: "Authentication Requirements",
        type: "text",
        placeholder: "e.g., OAuth, JWT, email/password",
        required: false,
      },
      {
        id: "deploymentTarget",
        label: "Deployment Target",
        type: "text",
        placeholder: "e.g., Vercel, AWS, Azure",
        required: false,
      },
    ],
  },
  {
    id: "api-backend",
    name: "API Backend",
    category: "api-backend",
    description: "Create RESTful or GraphQL APIs and backend services",
    icon: "Server",
    fields: [
      ...commonFields,
      {
        id: "endpoints",
        label: "Endpoints List",
        type: "textarea",
        placeholder: "List API endpoints (one per line)\nGET /api/users\nPOST /api/users",
        required: false,
      },
      {
        id: "database",
        label: "Database Preference",
        type: "text",
        placeholder: "e.g., PostgreSQL, MongoDB, MySQL",
        required: false,
      },
      {
        id: "authMethod",
        label: "Authentication Method",
        type: "text",
        placeholder: "e.g., JWT, OAuth, API Keys",
        required: false,
      },
    ],
  },
  {
    id: "cli-tool",
    name: "CLI Tool",
    category: "cli-tool",
    description: "Build command-line tools and utilities",
    icon: "Terminal",
    fields: [
      ...commonFields,
      {
        id: "commands",
        label: "Commands List",
        type: "textarea",
        placeholder: "List commands (one per line)\ntool init\ntool build",
        required: false,
      },
      {
        id: "inputOutput",
        label: "Input/Output Format",
        type: "text",
        placeholder: "e.g., JSON input, text output",
        required: false,
      },
      {
        id: "installation",
        label: "Installation Method",
        type: "text",
        placeholder: "e.g., npm, pip, cargo",
        required: false,
      },
    ],
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    category: "mobile-app",
    description: "Create mobile applications for iOS and Android",
    icon: "Smartphone",
    fields: [
      ...commonFields,
      {
        id: "platform",
        label: "Platform",
        type: "select",
        options: ["iOS", "Android", "Both"],
        required: false,
      },
      {
        id: "nativeOrRn",
        label: "Native or React Native",
        type: "text",
        placeholder: "e.g., Native, React Native, Flutter",
        required: false,
      },
      {
        id: "keyScreens",
        label: "Key Screens",
        type: "textarea",
        placeholder: "List main screens (one per line)\n- Login\n- Home Dashboard\n- Settings",
        required: false,
      },
    ],
  },
  {
    id: "library",
    name: "Library",
    category: "library",
    description: "Build reusable libraries and packages",
    icon: "Package",
    fields: [
      ...commonFields,
      {
        id: "language",
        label: "Language",
        type: "text",
        placeholder: "e.g., TypeScript, Python, Rust",
        required: false,
      },
      {
        id: "apiSurface",
        label: "API Surface",
        type: "textarea",
        placeholder: "Describe the main API functions and classes",
        required: false,
      },
      {
        id: "publishingTarget",
        label: "Publishing Target",
        type: "text",
        placeholder: "e.g., npm, PyPI, crates.io",
        required: false,
      },
    ],
  },
];
