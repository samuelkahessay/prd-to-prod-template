# Showcase

This directory contains portfolio summaries for all completed PRD runs.

## What Goes Here

When you run a PRD through the pipeline from start to finish and reach completion, `scripts/archive-run.sh` creates a new directory in this showcase folder to document the run.

## Directory Structure

Each completed run is stored with a naming convention of `NN-project-name/`:

- `NN` — Sequential run number (e.g., `01`, `02`, `03`)
- `project-name` — Descriptive name of the PRD's scope (kebab-case)

Example: `01-user-auth-system/`, `02-payment-processor/`

## Contents of Each Entry

Each run directory contains:

- **README.md** — Summary of the PRD, what was implemented, and key metrics
- **SUMMARY.md** — Detailed overview of all features completed
- **git-tag** — Pointer to the git tag containing this run's code (e.g., `v1.0.0`)
- **links/** — Links to key artifacts:
  - PRD source (if documented)
  - Critical PR discussions
  - Deployment confirmation

## How Entries Are Created

The `scripts/archive-run.sh` script automatically:

1. Tags the current commit with `vN.N.N` (incremented per run)
2. Creates a summary directory here
3. Documents the PRD scope and completion status
4. Removes ephemeral files (`src/`, `package.json`, `docs/plans/`, etc.)
5. Resets the repo to a clean slate for the next PRD

## Recovering Previous Runs

To inspect or re-deploy a specific run:

```bash
git checkout v1.0.0 -- src/
```

This checks out the application code from that tagged run without affecting the current branch.
