import { describe, it, expect } from 'vitest';
import {
  parseAllMarkers,
  parseCiRepairCommand,
  parseCiRepairState,
  parseDrillMetadata,
  parsePipelineVerdict,
  parseSelfHealingDeferred,
  parseSelfHealingDispatch,
} from '@/lib/pipeline/markers';

describe('pipeline marker parsers', () => {
  it('parses ci-repair-state marker from workflow-style key/value payload', () => {
    const body = `
<!-- ci-repair-state:v1
status=dispatched
pr_number=77
linked_issue=120
head_sha=abc123def
head_branch=repo-assist/issue-120
failure_run_id=987654
failure_run_url=https://github.com/acme/repo/actions/runs/987654
failure_type=test-failure
failure_signature=tests::unit::failing
attempt_count=2
updated_at=2026-03-03T00:11:12Z
-->
`;

    expect(parseCiRepairState(body)).toEqual({
      status: 'dispatched',
      pr_number: 77,
      linked_issue: 120,
      head_sha: 'abc123def',
      head_branch: 'repo-assist/issue-120',
      failure_run_id: 987654,
      failure_run_url: 'https://github.com/acme/repo/actions/runs/987654',
      failure_type: 'test-failure',
      failure_signature: 'tests::unit::failing',
      attempt_count: 2,
      updated_at: '2026-03-03T00:11:12Z',
    });
  });

  it('parses ci-repair-command marker from workflow-style payload', () => {
    const body = `
/repo-assist Repair CI failure for PR #77.

<!-- ci-repair-command:v1
pr_number=77
linked_issue=120
head_sha=abc123def
head_branch=repo-assist/issue-120
failure_run_id=987654
failure_run_url=https://github.com/acme/repo/actions/runs/987654
failure_type=test-failure
failure_signature=tests::unit::failing
attempt_count=1
-->
`;

    expect(parseCiRepairCommand(body)).toEqual({
      pr_number: 77,
      linked_issue: 120,
      head_sha: 'abc123def',
      head_branch: 'repo-assist/issue-120',
      failure_run_id: 987654,
      failure_run_url: 'https://github.com/acme/repo/actions/runs/987654',
      failure_type: 'test-failure',
      failure_signature: 'tests::unit::failing',
      attempt_count: 1,
    });
  });

  it('parses self-healing dispatch and deferred markers', () => {
    const dispatchBody = `
<!-- self-healing-dispatch:v1
dispatch_workflow=Auto-Dispatch Pipeline Issues
dispatch_origin_workflow=Auto-Dispatch Requeue
dispatch_reason=requeue_after_guard_skip
dispatch_workflow_run_id=34567
dispatch_workflow_run_url=https://github.com/acme/repo/actions/runs/34567
repo_assist_run_id=999
repo_assist_run_url=https://github.com/acme/repo/actions/runs/999
dispatched_at=2026-03-03T00:11:12Z
-->
`;

    const deferredBody = `
<!-- self-healing-dispatch-deferred:v1
dispatch_workflow=Auto-Dispatch Pipeline Issues
dispatch_workflow_run_id=44444
dispatch_workflow_run_url=https://github.com/acme/repo/actions/runs/44444
blocking_repo_assist_run_id=33333
blocking_repo_assist_run_url=https://github.com/acme/repo/actions/runs/33333
deferred_at=2026-03-03T00:10:00Z
-->
`;

    expect(parseSelfHealingDispatch(dispatchBody)).toEqual({
      dispatch_workflow: 'Auto-Dispatch Pipeline Issues',
      dispatch_origin_workflow: 'Auto-Dispatch Requeue',
      dispatch_reason: 'requeue_after_guard_skip',
      dispatch_workflow_run_id: 34567,
      dispatch_workflow_run_url: 'https://github.com/acme/repo/actions/runs/34567',
      repo_assist_run_id: 999,
      repo_assist_run_url: 'https://github.com/acme/repo/actions/runs/999',
      dispatched_at: '2026-03-03T00:11:12Z',
    });

    expect(parseSelfHealingDeferred(deferredBody)).toEqual({
      dispatch_workflow: 'Auto-Dispatch Pipeline Issues',
      dispatch_workflow_run_id: 44444,
      dispatch_workflow_run_url: 'https://github.com/acme/repo/actions/runs/44444',
      blocking_repo_assist_run_id: 33333,
      blocking_repo_assist_run_url: 'https://github.com/acme/repo/actions/runs/33333',
      deferred_at: '2026-03-03T00:10:00Z',
    });
  });

  it('parses self-healing drill metadata marker', () => {
    const body = `
<!-- self-healing-drill:v1
drill_id=drill-42
observed_commit=deadbeef
observed_failure_run_id=1234
observed_failure_run_url=https://github.com/acme/repo/actions/runs/1234
-->
`;

    expect(parseDrillMetadata(body)).toEqual({
      drill_id: 'drill-42',
      observed_commit: 'deadbeef',
      observed_failure_run_id: 1234,
      observed_failure_run_url: 'https://github.com/acme/repo/actions/runs/1234',
    });
  });

  it('parses JSON-style marker payloads', () => {
    const body = `
<!-- ci-repair-state:v1 {"status":"repairing","pr_number":55,"attempt_count":"3"} -->
`;

    expect(parseCiRepairState(body)).toEqual({
      status: 'repairing',
      pr_number: 55,
      attempt_count: 3,
    });
  });

  it('returns null for malformed JSON marker payloads', () => {
    const body = '<!-- ci-repair-state:v1 {"status":"repairing", bad-json } -->';
    expect(parseCiRepairState(body)).toBeNull();
  });

  it('returns null when marker is missing or empty', () => {
    expect(parseCiRepairState('No marker here')).toBeNull();
    expect(parseSelfHealingDispatch('<!-- self-healing-dispatch:v1 -->')).toBeNull();
  });

  it('parses approve verdict comment and no issues', () => {
    const comment = `[PIPELINE-VERDICT]
## Pipeline Review

**VERDICT: APPROVE**

### Summary
Looks good.

### Issues
None
`;

    expect(parsePipelineVerdict(comment)).toEqual({
      verdict: 'APPROVE',
      reason: null,
      reasons: [],
    });
  });

  it('parses request changes verdict reasons, including code block noise', () => {
    const comment = `[PIPELINE-VERDICT]
## Pipeline Review

**VERDICT: REQUEST_CHANGES**

### Summary
Needs fixes.

### Issues
- Missing null check in parser.
- Build fails in CI for Node 20.

### Criteria Checklist
- [ ] Criterion 2 not met

\`\`\`text
extra block that should not affect issue parsing
\`\`\`
`;

    expect(parsePipelineVerdict(comment)).toEqual({
      verdict: 'REQUEST_CHANGES',
      reason: 'Missing null check in parser.',
      reasons: ['Missing null check in parser.', 'Build fails in CI for Node 20.'],
    });
  });

  it('parses standalone verdict format with Reason line', () => {
    const comment = `[PIPELINE-VERDICT]
APPROVE
Reason: Checks passed and criteria are met.
`;

    expect(parsePipelineVerdict(comment)).toEqual({
      verdict: 'APPROVE',
      reason: 'Checks passed and criteria are met.',
      reasons: ['Checks passed and criteria are met.'],
    });
  });

  it('returns null for missing marker or missing verdict value', () => {
    expect(parsePipelineVerdict('**VERDICT: APPROVE**')).toBeNull();
    expect(parsePipelineVerdict('[PIPELINE-VERDICT]\n### Summary\nNo verdict')).toBeNull();
  });

  it('parseAllMarkers combines parsed data', () => {
    const body = `
<!-- ci-repair-state:v1
status=detected
pr_number=99
attempt_count=1
-->

<!-- self-healing-drill:v1
drill_id=drill-99
observed_commit=feedbead
-->

[PIPELINE-VERDICT]
**VERDICT: REQUEST_CHANGES**
### Issues
- Missing test coverage
`;

    const result = parseAllMarkers(body);
    expect(result.ciRepairState?.status).toBe('detected');
    expect(result.ciRepairState?.pr_number).toBe(99);
    expect(result.drillMetadata?.drill_id).toBe('drill-99');
    expect(result.pipelineVerdict?.verdict).toBe('REQUEST_CHANGES');
    expect(result.pipelineVerdict?.reasons).toEqual(['Missing test coverage']);
    expect(result.ciRepairCommand).toBeNull();
    expect(result.selfHealingDispatch).toBeNull();
    expect(result.selfHealingDeferred).toBeNull();
  });
});
