# CLAUDE.md

## How this repo works

This is an autonomous software pipeline powered by gh-aw (GitHub Agentic Workflows). Issues labeled `pipeline` are picked up by the `repo-assist` agent, which implements them, opens PRs, and the review/merge chain handles the rest.

## Our role

We write **design briefs as GitHub issues**, not code. The pipeline agents do the implementation.

- Describe *what* should change and *why*, not *how* (no file paths, no diffs, no implementation details)
- Use clear issue structure: Problem → Solution → Scope → Acceptance Criteria
- Label issues with `feature, pipeline` or `bug, pipeline` so auto-dispatch picks them up
- Acceptance criteria are the contract — the PR review agent verifies against them

**Exception:** `.github/workflows/` changes (pipeline infrastructure) are done directly, not through issues.

## Working style

- When exploring the codebase or investigating an issue, start with the specific files/folders mentioned before doing broad exploration
- Never fabricate or assume details about PRs, issue statuses, or external resources
- Do not claim a process succeeded until you have verified the actual output

## CI failure triage procedure

Run `gh run list --status=failure --limit=5 --json databaseId,name,conclusion,headBranch` to find recent CI failures. For each failure:

1. Fetch the full logs with `gh run view <id> --log-failed`
2. Identify the root cause by tracing error messages to specific source files
3. Implement the fix on a new branch named `fix/ci-<short-description>`
4. Run the same build/test command that failed to verify the fix locally
5. If verification passes, commit and open a PR with the failure log excerpt and root cause analysis

## Issue writing guidelines

- Be descriptive about the desired experience, not prescriptive about implementation
- Include a "Scope" section that describes boundaries (what should/shouldn't change)
- The agent reads the codebase itself — trust it to find the right files
- Acceptance criteria should be verifiable (build passes, tests pass, behavior observable)
