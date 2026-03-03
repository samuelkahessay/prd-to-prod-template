# Test Scripts

This directory contains test scripts for pipeline infrastructure and deployment validation.

## Purpose

Test scripts verify:
- Workflow orchestration logic
- Deployment target correctness
- Secret and configuration state
- Self-healing loop integrity
- Decision ledger accuracy

## Test Categories

### Workflow Tests
Tests for agentic workflow behavior, issue decomposition, PR review logic, and auto-merge conditions.

### Deployment Tests
Tests for deploy profile configuration, target environment health checks, and rollback scenarios.

### Integration Tests
End-to-end tests exercising the full pipeline from PRD input through deployment.

## Running Tests

Tests are ported from the source `prd-to-prod` repository as needed. Check the source repo for the complete test suite and implementation details.

## Contributing Tests

When porting tests from the source repo:

1. Copy the test script to this directory
2. Update any hardcoded paths to be relative
3. Add a comment at the top indicating the source and porting date
4. Run the test to verify it works in the template context
5. Update this README with the test name and purpose

## Framework

Tests are primarily shell scripts for simplicity and portability. Some tests may use:
- `bats` — Bash Automated Testing System for assertion helpers
- `jq` for JSON validation
- GitHub CLI (`gh`) for API validation
