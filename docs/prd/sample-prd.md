# CLI Task Tracker

> **Note to template users**: This is a sample PRD demonstrating the format that
> the prd-decomposer workflow expects. Replace this file with your own PRD,
> or use it as a starting point. Each section below includes a brief annotation
> explaining its purpose.

## Overview

A command-line task management tool that lets developers track work items
without leaving the terminal. Users can create, list, complete, and delete
tasks through simple CLI commands. All data is persisted locally so tasks
survive across sessions.

## User Stories

- As a developer, I want to add a task with a description so that I can
  capture work items quickly from my terminal
- As a user, I want to list all tasks with their status so that I can see
  what needs to be done
- As a user, I want to mark a task as complete so that I can track my
  progress
- As a user, I want to delete a task so that I can remove items that are
  no longer relevant
- As a user, I want to see a help message so that I can learn the
  available commands

## Technical Requirements

- Single executable with a task command entry point
- Subcommands: add, list, done, delete, help
- Local file-based persistence (data survives across invocations)
- Human-readable output with aligned columns for the list command
- Exit code 0 on success, non-zero on error
- Graceful handling of invalid input (missing arguments, bad IDs)
- No external service dependencies -- fully offline operation

## Acceptance Criteria

- [ ] task add "Buy groceries" creates a new task and prints its ID
- [ ] task list shows all tasks with ID, status, description, and creation date
- [ ] task done 1 marks task 1 as complete; task list reflects the change
- [ ] task delete 1 removes task 1; task list no longer shows it
- [ ] task help prints usage information for all subcommands
- [ ] Running task add without a description prints an error and exits non-zero
- [ ] Running task done 999 (nonexistent ID) prints an error and exits non-zero
- [ ] Tasks persist after the process exits -- rerunning task list shows previously added tasks

## Out of Scope

- Web interface or REST API
- User authentication or multi-user support
- Cloud synchronization or remote storage
- Task priorities, due dates, or tags
- Multiple task lists or projects
- Configuration file or environment variables

## Dependencies

None -- this is a standalone application with no external dependencies.
