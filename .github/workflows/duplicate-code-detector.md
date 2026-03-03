---
name: Duplicate Code Detector
description: Identifies duplicate code patterns across the codebase and suggests refactoring opportunities
on:
  workflow_dispatch:
  schedule: daily
permissions:
  contents: read
  issues: read
  pull-requests: read
engine:
  id: copilot
  model: claude-sonnet-4.6
safe-outputs:
  create-issue:
    expires: 2d
    title-prefix: "[duplicate-code] "
    labels: [code-quality, automated-analysis, cookie]
    assignees: copilot
    group: true
    max: 3
tools:
  github:
    toolsets: [default]
  bash: true
timeout-minutes: 15
strict: true
---

# Duplicate Code Detection

Analyze code to identify duplicated patterns using bash-based pattern analysis. Report significant findings that require refactoring.

## Task

Detect and report code duplication by:

1. **Analyzing Recent Commits**: Review changes in the latest commits
2. **Detecting Duplicated Code**: Identify similar or duplicated code patterns using grep and diff analysis
3. **Reporting Findings**: Create a detailed issue if significant duplication is detected (threshold: >10 lines or 3+ similar patterns)

## Context

- **Repository**: ${{ github.repository }}
- **Commit ID**: ${{ github.event.head_commit.id }}
- **Triggered by**: @${{ github.actor }}

## Analysis Workflow

### 1. File Discovery

Discover the project structure and recently changed files:

```bash
# List source files in your primary language (customize for your tech stack)
# Examples:
#   TypeScript/JavaScript: find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"
#   Python: find . -name "*.py"
#   Java: find . -name "*.java"
#   Go: find . -name "*.go"
#   Ruby: find . -name "*.rb"
#
# Customize exclusions for your build system:
#   Node.js: -not -path "*/node_modules/*"
#   Python: -not -path "*/__pycache__/*" -not -path "*/venv/*"
#   Java/Maven: -not -path "*/target/*"
#   Java/Gradle: -not -path "*/build/*"
#   .NET: -not -path "*/bin/*" -not -path "*/obj/*"

find ${{ github.workspace }} -name "*.[ext]" \
  -not -path "*/[build-output]/*" \
  -not -path "*/[dependencies]/*" \
  -not -path "*/[generated-code]/*" \
  -not -name "*Test*.[ext]" \
  -not -path "*/.github/*"

# Check recent commits for changed files
git log --oneline -10 --name-only
```

### 2. Changed Files Analysis

Identify and analyze modified files:
- Determine files changed in the recent commits
- **Customize file patterns** for your primary language(s) (e.g., `*.ts`, `*.py`, `*.java`, `*.go`)
- **Exclude test files** from analysis (files matching patterns: `*Test*`, `*_test.*`, or located in test directories)
- **Exclude build output** from analysis (e.g., `node_modules/`, `dist/`, `build/`, `target/`, `bin/`, `obj/`)
- **Exclude generated code** from analysis (e.g., auto-generated files, migrations, protobuf output)
- **Exclude workflow files** from analysis (files under `.github/workflows/*`)
- Use `git diff` and `git log` to understand recent changes
- Read modified file contents to examine code structure

### 3. Duplicate Detection

Apply pattern analysis to find duplicates:

**Method-Level Analysis**:
- Use `grep -rn` to search for function/method signatures across source files
- Identify functions with similar names in different files (e.g., `processRequest` across modules)
- Compare function bodies for structural similarity

**Pattern Search**:
- Use `grep -rn` to find similar code patterns across the codebase
- Search for duplication indicators:
  - Similar function/method signatures
  - Repeated logic blocks
  - Similar variable naming patterns
  - Near-identical code blocks

**Structural Analysis**:
- Use `find` and `ls` to identify files with similar names or purposes
- Use `diff` to compare suspected duplicate files or code blocks
- Use `git log` to check if duplicates were introduced by copy-paste commits

### 4. Duplication Evaluation

Assess findings to identify true code duplication:

**Duplication Types**:
- **Exact Duplication**: Identical code blocks in multiple locations
- **Structural Duplication**: Same logic with minor variations (different variable names, etc.)
- **Functional Duplication**: Different implementations of the same functionality
- **Copy-Paste Programming**: Similar code blocks that could be extracted into shared utilities

**Assessment Criteria**:
- **Severity**: Amount of duplicated code (lines of code, number of occurrences)
- **Impact**: Where duplication occurs (critical paths, frequently called code)
- **Maintainability**: How duplication affects code maintainability
- **Refactoring Opportunity**: Whether duplication can be easily refactored

### 5. Issue Reporting

Create separate issues for each distinct duplication pattern found (maximum 3 patterns per run). Each pattern should get its own issue to enable focused remediation.

**When to Create Issues**:
- Only create issues if significant duplication is found (threshold: >10 lines of duplicated code OR 3+ instances of similar patterns)
- **Create one issue per distinct pattern** - do NOT bundle multiple patterns in a single issue
- Limit to the top 3 most significant patterns if more are found
- Use the `create_issue` tool from safe-outputs MCP **once for each pattern**

**When No Issues Are Found**:

**YOU MUST CALL** the `noop` tool when analysis completes without finding significant duplication:

```json
{
  "noop": {
    "message": "✅ Duplicate code analysis complete. Analyzed [N] files changed recently. No significant duplication detected (threshold: >10 lines or 3+ similar patterns)."
  }
}
```

**DO NOT just write this message in your output text** - you MUST actually invoke the `noop` tool. The workflow will fail if you don't call either `create_issue` or `noop`.

**Issue Contents for Each Pattern**:
- **Executive Summary**: Brief description of this specific duplication pattern
- **Duplication Details**: Specific locations and code blocks for this pattern only
- **Severity Assessment**: Impact and maintainability concerns for this pattern
- **Refactoring Recommendations**: Suggested approaches to eliminate this pattern
- **Code Examples**: Concrete examples with file paths and line numbers for this pattern

## Detection Scope

### Report These Issues

- Identical or nearly identical functions/methods in different files
- Repeated code blocks that could be extracted to utilities
- Similar classes or modules with overlapping functionality
- Copy-pasted code with minor modifications
- Duplicated business logic across components

### Skip These Patterns

- Standard boilerplate code (imports, package declarations, etc.)
- Test setup/teardown code (acceptable duplication in tests)
- **All test files** (files matching common test patterns)
- **All workflow files** (files under `.github/workflows/*`)
- **Build output** (dependency directories, compiled output)
- **Generated code** (auto-generated files, database migrations, API clients)
- Configuration files with similar structure
- Language-specific patterns (constructors, property declarations, dependency injection)
- Small code snippets (<5 lines) unless highly repetitive

### Analysis Depth

- **File Type Restriction**: Customize for your primary language(s) — see File Discovery section for examples
- **Primary Focus**: All source files changed in the current push (excluding test files and workflow files)
- **Secondary Analysis**: Check for duplication with existing source codebase (excluding test files and workflow files)
- **Cross-Reference**: Look for patterns across source files in the repository
- **Historical Context**: Consider if duplication is new or existing

## Issue Template

For each distinct duplication pattern found, create a separate issue using this structure:

```markdown
# 🔍 Duplicate Code Detected: [Pattern Name]

*Analysis of commit ${{ github.event.head_commit.id }}*

**Assignee**: @copilot

## Summary

[Brief overview of this specific duplication pattern]

## Duplication Details

### Pattern: [Description]
- **Severity**: High/Medium/Low
- **Occurrences**: [Number of instances]
- **Locations**:
  - `path/to/file1.ext` (lines X-Y)
  - `path/to/file2.ext` (lines A-B)
- **Code Sample**:
  ```
  [Example of duplicated code]
  ```

## Impact Analysis

- **Maintainability**: [How this affects code maintenance]
- **Bug Risk**: [Potential for inconsistent fixes]
- **Code Bloat**: [Impact on codebase size]

## Refactoring Recommendations

1. **[Recommendation 1]**
   - Extract common functionality to: `suggested/path/utility.ext`
   - Estimated effort: [hours/complexity]
   - Benefits: [specific improvements]

2. **[Recommendation 2]**
   [... additional recommendations ...]

## Implementation Checklist

- [ ] Review duplication findings
- [ ] Prioritize refactoring tasks
- [ ] Create refactoring plan
- [ ] Implement changes
- [ ] Update tests
- [ ] Verify no functionality broken

## Analysis Metadata

- **Analyzed Files**: [count]
- **Detection Method**: Pattern analysis via grep/diff
- **Commit**: ${{ github.event.head_commit.id }}
- **Analysis Date**: [timestamp]
```

## Operational Guidelines

### Security
- Never execute untrusted code or commands
- Only use read-only analysis tools (grep, diff, find)
- Do not modify files during analysis

### Efficiency
- Focus on recently changed files first
- Use pattern analysis for meaningful duplication, not superficial matches
- Stay within timeout limits (balance thoroughness with execution time)

### Accuracy
- Verify findings before reporting
- Distinguish between acceptable patterns and true duplication
- Consider language-specific idioms and best practices
- Provide specific, actionable recommendations

### Issue Creation
- Create **one issue per distinct duplication pattern** - do NOT bundle multiple patterns in a single issue
- Limit to the top 3 most significant patterns if more are found
- Only create issues if significant duplication is found
- Include sufficient detail for SWE agents to understand and act on findings
- Provide concrete examples with file paths and line numbers
- Suggest practical refactoring approaches
- Assign issue to @copilot for automated remediation
- Use descriptive titles that clearly identify the specific pattern (e.g., "Duplicate Code: Error Handling Pattern in Parser Module")
- **If no significant duplication found, call `noop` tool** - never complete without calling either `create_issue` or `noop`

## Tool Usage Sequence

1. **File Discovery**: `find`, `ls` to locate source files and identify project structure
2. **Change Analysis**: `git log`, `git diff` to understand recent changes
3. **Pattern Matching**: `grep -rn` to search for similar code patterns across files
4. **Content Review**: Read file contents for detailed code examination
5. **Comparison**: `diff` to compare suspected duplicate code blocks
6. **Commit History**: `git log --follow` to check if duplicates arose from copy-paste
7. **Reporting**: Create issues via safe-outputs for significant findings

**Objective**: Improve code quality by identifying and reporting meaningful code duplication that impacts maintainability. Focus on actionable findings that enable automated or manual refactoring.
