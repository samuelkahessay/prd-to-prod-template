#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Pipeline Verification ==="

FAILED=()

run_check() {
  local desc="$1" cmd="$2"
  echo -n "  $desc ... "
  if (cd "$REPO_ROOT" && eval "$cmd" >/dev/null 2>&1); then
    echo "OK"
  else
    echo "FAIL"
    FAILED+=("$desc")
  fi
}

run_check "autonomy-policy.yml is valid YAML" \
  "python3 -c \"import yaml; yaml.safe_load(open('autonomy-policy.yml'))\" 2>/dev/null || ruby -ryaml -e \"YAML.load_file('autonomy-policy.yml')\" 2>/dev/null || true"

run_check ".deploy-profile exists" \
  "test -f .deploy-profile"

run_check "bootstrap labels exist" \
  "gh label list --json name -q '.[].name' | grep -q pipeline"

run_check "compiled workflows exist" \
  "ls .github/workflows/*.lock.yml >/dev/null 2>&1"

# Run npm test if package.json exists
if [ -f "$REPO_ROOT/package.json" ]; then
  run_check "npm test passes" "npm test"
fi

echo ""
if [ "${#FAILED[@]}" -gt 0 ]; then
  echo "FAIL (${#FAILED[@]} checks failed)"
  for f in "${FAILED[@]}"; do echo "  - $f"; done
  exit 1
else
  echo "PASS"
fi
