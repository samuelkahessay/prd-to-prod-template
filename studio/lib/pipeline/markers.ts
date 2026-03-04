export type MarkerValue = string | number;

export interface CiRepairState {
  status?: string;
  pr_number?: number;
  linked_issue?: number;
  head_sha?: string;
  head_branch?: string;
  failure_run_id?: number;
  failure_run_url?: string;
  failure_type?: string;
  failure_signature?: string;
  attempt_count?: number;
  updated_at?: string;
  [key: string]: MarkerValue | undefined;
}

export interface CiRepairCommand {
  pr_number?: number;
  linked_issue?: number;
  head_sha?: string;
  head_branch?: string;
  failure_run_id?: number;
  failure_run_url?: string;
  failure_type?: string;
  failure_signature?: string;
  attempt_count?: number;
  [key: string]: MarkerValue | undefined;
}

export interface DispatchRecord {
  dispatch_workflow?: string;
  dispatch_origin_workflow?: string;
  dispatch_reason?: string;
  dispatch_workflow_run_id?: number;
  dispatch_workflow_run_url?: string;
  repo_assist_run_id?: number;
  repo_assist_run_url?: string;
  dispatched_at?: string;
  [key: string]: MarkerValue | undefined;
}

export interface DeferredRecord {
  dispatch_workflow?: string;
  dispatch_workflow_run_id?: number;
  dispatch_workflow_run_url?: string;
  blocking_repo_assist_run_id?: number;
  blocking_repo_assist_run_url?: string;
  deferred_at?: string;
  [key: string]: MarkerValue | undefined;
}

export interface DrillMetadata {
  drill_id?: string;
  observed_commit?: string;
  observed_failure_run_id?: number;
  observed_failure_run_url?: string;
  [key: string]: MarkerValue | undefined;
}

export type VerdictValue = 'APPROVE' | 'REQUEST_CHANGES';

export interface Verdict {
  verdict: VerdictValue;
  reason: string | null;
  reasons: string[];
}

export interface PipelineMarkers {
  ciRepairState: CiRepairState | null;
  ciRepairCommand: CiRepairCommand | null;
  selfHealingDispatch: DispatchRecord | null;
  selfHealingDeferred: DeferredRecord | null;
  drillMetadata: DrillMetadata | null;
  pipelineVerdict: Verdict | null;
}

const NUMBER_LIKE_KEYS = new Set([
  'attempt_count',
  'pr_number',
  'linked_issue',
  'failure_run_id',
  'dispatch_workflow_run_id',
  'repo_assist_run_id',
  'blocking_repo_assist_run_id',
  'observed_failure_run_id',
]);

function extractMarkerPayload(body: string, markerName: string): string | null {
  const pattern = new RegExp(`<!--\\s*${markerName}:v1\\s*([\\s\\S]*?)\\s*-->`, 'm');
  const match = body.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function parseMarkerValue(key: string, value: string): MarkerValue {
  const trimmed = value.trim();
  if (NUMBER_LIKE_KEYS.has(key) && /^-?\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }
  return trimmed;
}

function parseKeyValuePayload(payload: string): Record<string, MarkerValue> {
  const record: Record<string, MarkerValue> = {};
  for (const line of payload.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);
    if (!key) {
      continue;
    }
    record[key] = parseMarkerValue(key, value);
  }
  return record;
}

function parseJsonPayload(payload: string): Record<string, MarkerValue> | null {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const record: Record<string, MarkerValue> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        record[key] = parseMarkerValue(key, value);
      } else if (typeof value === 'number') {
        record[key] = value;
      }
    }
    return record;
  } catch {
    return null;
  }
}

function parseMarker<T extends Record<string, MarkerValue | undefined>>(
  body: string,
  markerName: string,
): T | null {
  const payload = extractMarkerPayload(body, markerName);
  if (!payload) {
    return null;
  }

  const asJson = payload.trim().startsWith('{') ? parseJsonPayload(payload) : null;
  if (payload.trim().startsWith('{') && !asJson) {
    return null;
  }

  const parsed = asJson ?? parseKeyValuePayload(payload);
  if (Object.keys(parsed).length === 0) {
    return null;
  }

  return parsed as T;
}

function parseReasonLines(comment: string): string[] {
  const issuesSection = comment.match(/###\s+Issues\s*\n([\s\S]*?)(\n###\s+|\n---|$)/i)?.[1];
  if (!issuesSection) {
    const inlineReason = comment.match(/^Reason:\s*(.+)$/im)?.[1]?.trim();
    return inlineReason ? [inlineReason] : [];
  }

  const lines = issuesSection
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 1 && /^none$/i.test(lines[0])) {
    return [];
  }

  const reasons = lines
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 0);

  if (reasons.length > 0) {
    return reasons;
  }

  const inlineReason = comment.match(/^Reason:\s*(.+)$/im)?.[1]?.trim();
  return inlineReason ? [inlineReason] : [];
}

export function parseCiRepairState(body: string): CiRepairState | null {
  return parseMarker<CiRepairState>(body, 'ci-repair-state');
}

export function parseCiRepairCommand(body: string): CiRepairCommand | null {
  return parseMarker<CiRepairCommand>(body, 'ci-repair-command');
}

export function parseSelfHealingDispatch(body: string): DispatchRecord | null {
  return parseMarker<DispatchRecord>(body, 'self-healing-dispatch');
}

export function parseSelfHealingDeferred(body: string): DeferredRecord | null {
  return parseMarker<DeferredRecord>(body, 'self-healing-dispatch-deferred');
}

export function parseDrillMetadata(body: string): DrillMetadata | null {
  return parseMarker<DrillMetadata>(body, 'self-healing-drill');
}

export function parsePipelineVerdict(comment: string): Verdict | null {
  if (!/^\[PIPELINE-VERDICT\]/m.test(comment)) {
    return null;
  }

  const explicitVerdict = comment.match(/\*\*VERDICT:\s*(APPROVE|REQUEST_CHANGES)\*\*/i)?.[1];
  const standaloneVerdict = comment.match(/^\s*(APPROVE|REQUEST_CHANGES)\s*$/m)?.[1];
  const verdict = (explicitVerdict ?? standaloneVerdict) as VerdictValue | undefined;

  if (!verdict) {
    return null;
  }

  const reasons = parseReasonLines(comment);
  return {
    verdict,
    reason: reasons[0] ?? null,
    reasons,
  };
}

export function parseAllMarkers(body: string): PipelineMarkers {
  return {
    ciRepairState: parseCiRepairState(body),
    ciRepairCommand: parseCiRepairCommand(body),
    selfHealingDispatch: parseSelfHealingDispatch(body),
    selfHealingDeferred: parseSelfHealingDeferred(body),
    drillMetadata: parseDrillMetadata(body),
    pipelineVerdict: parsePipelineVerdict(body),
  };
}
