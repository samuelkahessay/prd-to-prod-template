# Activity Feed Components

Activity timeline for prd-to-prod Studio showing pipeline events in real-time.

## Usage

```tsx
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { buildEventTimeline } from "@/lib/pipeline/events";
import { usePipelineOverview } from "@/lib/queries/pipeline";

function Dashboard() {
  const { data, isLoading, error } = usePipelineOverview(owner, repo);
  
  const events = data
    ? buildEventTimeline(
        data.issues,
        data.pull_requests,
        data.workflows,
        data.deployments
      )
    : [];

  return (
    <ActivityFeed
      events={events}
      isLoading={isLoading}
      error={error}
      owner={owner}
      repo={repo}
    />
  );
}
```

## Components

### `ActivityFeed`
Main container with collapse/expand functionality.

**Props:**
- `events: PipelineEvent[]` - Pre-sorted events (newest first)
- `isLoading?: boolean` - Show loading skeletons
- `error?: Error | null` - Show error state
- `owner?: string` - GitHub repo owner (for links)
- `repo?: string` - GitHub repo name (for links)

### `ActivityItem`
Single event row with icon, timestamp, and GitHub link.

**Props:**
- `event: PipelineEvent` - Event to display
- `owner?: string` - GitHub repo owner
- `repo?: string` - GitHub repo name

### `ActivityFilter`
Event type filter popover (Issues, PRs, Workflows, Deployments).

**Props:**
- `selectedTypes: Set<string>` - Currently selected type IDs
- `onToggleType: (type: string) => void` - Toggle callback

## Helper Functions

### `buildEventTimeline()`
Merges and sorts all pipeline entities into a unified event stream.

```typescript
import { buildEventTimeline } from "@/lib/pipeline/events";

const events = buildEventTimeline(
  issues,      // PipelineIssue[]
  prs,         // PipelinePR[]
  workflows,   // PipelineWorkflowRun[]
  deployments  // PipelineDeployment[]
);
// Returns: PipelineEvent[] sorted newest first
```

### `formatRelativeTime()`
Formats ISO timestamps as relative strings.

```typescript
import { formatRelativeTime } from "@/lib/utils/time";

formatRelativeTime("2026-03-03T10:00:00Z");
// Returns: "2m ago" | "1h ago" | "3d ago" | etc.
```

## Event Types

All events follow discriminated union pattern:

```typescript
type PipelineEvent =
  | { type: 'issue_created'; issue: PipelineIssue; timestamp: string }
  | { type: 'issue_updated'; issue: PipelineIssue; changes: Partial<PipelineIssue>; timestamp: string }
  | { type: 'pr_created'; pr: PipelinePR; timestamp: string }
  | { type: 'pr_updated'; pr: PipelinePR; changes: Partial<PipelinePR>; timestamp: string }
  | { type: 'workflow_started'; workflow: PipelineWorkflowRun; timestamp: string }
  | { type: 'workflow_completed'; workflow: PipelineWorkflowRun; timestamp: string }
  | { type: 'deployment_started'; deployment: PipelineDeployment; timestamp: string }
  | { type: 'deployment_completed'; deployment: PipelineDeployment; timestamp: string };
```

## Styling

Uses Tailwind CSS v4 with dark mode support. All components respond to system theme via next-themes.

## Testing

Run tests:
```bash
npm test -- tests/components/activity/
npm test -- tests/lib/pipeline/events.test.ts
```

E2E tests:
```bash
npx playwright test e2e/activity-feed.spec.ts
```
