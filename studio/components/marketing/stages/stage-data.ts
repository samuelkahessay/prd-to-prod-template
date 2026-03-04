export interface StageInfo {
  id: string;
  name: string;
  agent: string;
  description: string;
  colorVar: string;
  mutedColorVar: string;
}

export const STAGES: StageInfo[] = [
  {
    id: "prd",
    name: "PRD",
    agent: "prd-planner",
    description:
      "A product brief is written as a GitHub issue. Acceptance criteria define the contract — the pipeline verifies against them.",
    colorVar: "var(--stage-prd)",
    mutedColorVar: "var(--stage-prd-muted)",
  },
  {
    id: "decompose",
    name: "Decompose",
    agent: "prd-decomposer",
    description:
      "The PRD is broken into atomic, dependency-ordered sub-issues. Each one is small enough for a single PR.",
    colorVar: "var(--stage-decompose)",
    mutedColorVar: "var(--stage-decompose-muted)",
  },
  {
    id: "implement",
    name: "Implement",
    agent: "repo-assist",
    description:
      "An agent reads the issue, explores the codebase, writes code, and opens a pull request with tests.",
    colorVar: "var(--stage-implement)",
    mutedColorVar: "var(--stage-implement-muted)",
  },
  {
    id: "review",
    name: "Review",
    agent: "pr-review-agent",
    description:
      "A separate agent reviews the PR against the original acceptance criteria. It can approve or request changes.",
    colorVar: "var(--stage-review)",
    mutedColorVar: "var(--stage-review-muted)",
  },
  {
    id: "merge",
    name: "Merge",
    agent: "pr-review-submit",
    description:
      "Approved PRs are auto-merged. The branch is cleaned up and the issue is closed.",
    colorVar: "var(--stage-merge)",
    mutedColorVar: "var(--stage-merge-muted)",
  },
  {
    id: "deploy",
    name: "Deploy",
    agent: "deploy-vercel",
    description:
      "Code is deployed to production automatically. The deployment URL is posted back to the PR.",
    colorVar: "var(--stage-deploy)",
    mutedColorVar: "var(--stage-deploy-muted)",
  },
  {
    id: "heal",
    name: "Self-Heal",
    agent: "ci-failure-resolve",
    description:
      "If a deployment fails or CI breaks, the pipeline detects the failure, diagnoses the root cause, and opens a fix PR.",
    colorVar: "var(--stage-heal)",
    mutedColorVar: "var(--stage-heal-muted)",
  },
];
