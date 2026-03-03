# Decision Ledger

The decision ledger is the durable record for consequential autonomous and human-gated actions in the pipeline.

It exists to answer four critical questions without opening GitHub logs:

1. **What action did the system try to take?**
2. **What policy result applied?**
3. **What evidence did it use?**
4. **Did it act, stop, escalate, or hand off to a human?**

## Storage

Ledger entries are stored as one JSON document per event under `drills/decisions/`.

This directory is intentionally simple:
- Easy for shell scripts to write decision records
- Easy for dashboards and audit tools to read later
- Easy to demo as auditable, timestamped artifacts

## Event Schema

Each ledger entry file uses the following JSON structure:

```json
{
  "schema_version": 1,
  "event_id": "20260302T201840Z-auto-merge-pipeline-pr-acted",
  "timestamp": "2026-03-02T20:18:40Z",
  "actor": {
    "type": "workflow",
    "name": "pr-review-submit"
  },
  "workflow": "pr-review-submit",
  "requested_action": "auto_merge_pipeline_pr",
  "policy_result": {
    "mode": "autonomous",
    "reason": null
  },
  "target": {
    "type": "pull_request",
    "id": "284",
    "path": null,
    "display": "[Pipeline] PR #284"
  },
  "evidence": [
    "Formal APPROVE review posted",
    "Required checks green",
    "PR title starts with [Pipeline]"
  ],
  "outcome": "acted",
  "summary": "Auto-merge armed after approval on PR #284.",
  "human_owner": null
}
```

## Field Reference

| Field | Type | Purpose |
|-------|------|---------|
| `schema_version` | integer | Allows future format changes without breaking readers |
| `event_id` | string | Stable identifier for the decision event (timestamp + action + outcome) |
| `timestamp` | string | UTC time in ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`) |
| `actor` | object | Who initiated the action (`workflow`, `agent`, `human`, or `service`) |
| `workflow` | string | Name of the workflow or subsystem that made the decision |
| `requested_action` | string | Normalized action name, ideally aligned to `autonomy-policy.yml` |
| `policy_result.mode` | string | Either `autonomous` or `human_required` |
| `policy_result.reason` | string | Required when `mode` is `human_required`; explains why human approval needed |
| `target` | object | The primary object affected by the action (type, ID, display name) |
| `evidence` | array | Human-readable list of decision inputs and justifications |
| `outcome` | string | One of: `acted`, `blocked`, `queued_for_human`, or `escalated` |
| `summary` | string | Short one-line explanation suitable for operator dashboards |
| `human_owner` | string | Optional: named human owner when the system hands off a decision |

## Outcome Values

- **`acted`** — The system executed the requested action autonomously
- **`blocked`** — The action was blocked by policy (human_required mode)
- **`queued_for_human`** — The action was queued for manual review and approval
- **`escalated`** — The action was escalated due to an error or policy conflict

## Creating Entries

Entries are typically created by shell functions in the pipeline's workflows:

```bash
scripts/log-decision.sh \
  --event-id "20260302T201840Z-auto-merge-pr-acted" \
  --action "auto_merge_pipeline_pr" \
  --actor "pr-review-submit" \
  --outcome "acted" \
  --evidence "Formal APPROVE review posted" "Required checks green"
```

## Accessing Entries

Retrieve all decisions from a run:

```bash
ls -la drills/decisions/
cat drills/decisions/20260302T*.json | jq '.'
```

Filter by outcome:

```bash
grep -l '"outcome": "acted"' drills/decisions/*.json
```
