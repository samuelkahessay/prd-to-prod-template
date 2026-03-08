#!/usr/bin/env bash
set -euo pipefail

ISSUE_JSON=$(cat)

TITLE=$(printf '%s' "$ISSUE_JSON" | jq -r '.title // ""')
BODY=$(printf '%s' "$ISSUE_JSON" | jq -r '.body // ""')
LABELS_JSON=$(printf '%s' "$ISSUE_JSON" | jq -c '[.labels[]?.name // empty | ascii_downcase]')

has_label() {
  local label="$1"
  printf '%s' "$LABELS_JSON" | jq -e --arg label "$label" 'index($label) != null' >/dev/null
}

REASON="actionable"
ACTIONABLE=true

if ! has_label "pipeline"; then
  ACTIONABLE=false
  REASON="missing_pipeline_label"
elif [ "$TITLE" = "[Pipeline] Status" ]; then
  ACTIONABLE=false
  REASON="status_issue"
elif ! printf '%s' "$BODY" | grep -q '[^[:space:]]'; then
  ACTIONABLE=false
  REASON="missing_issue_body"
elif printf '%s\n' "$BODY" | grep -Eq '^# PRD:'; then
  ACTIONABLE=false
  REASON="prd_parent_issue"
elif has_label "report"; then
  ACTIONABLE=false
  REASON="report_issue"
elif ! printf '%s' "$LABELS_JSON" | jq -e 'any(.[]; . == "bug" or . == "docs" or . == "feature" or . == "infra" or . == "test")' >/dev/null; then
  ACTIONABLE=false
  REASON="missing_actionable_label"
fi

jq -n \
  --arg title "$TITLE" \
  --arg reason "$REASON" \
  --argjson actionable "$ACTIONABLE" \
  --argjson labels "$LABELS_JSON" \
  '{
    actionable: $actionable,
    reason: $reason,
    title: $title,
    labels: $labels
  }'
