import { describe, it, expect } from 'vitest';
import type { PipelineIssue } from '@/lib/pipeline/types';
import {
  classifyIssueStage,
  LABEL_TYPES,
  LABEL_STATE,
  LABEL_ARCHITECTURE,
  LABEL_REPAIR,
  isTypeLabel,
  isStateLabel,
  isArchitectureLabel,
  isRepairLabel,
  getStateLabels,
  getTypeLabels,
  getRepairLabels,
  isInRepair,
  isCompleted,
} from '@/lib/pipeline/labels';

function createIssue(overrides: Partial<PipelineIssue> = {}): PipelineIssue {
  return {
    id: 'issue-1',
    number: 1,
    title: 'Test Issue',
    state: 'open',
    labels: [],
    dependencies: [],
    assignee: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('classifyIssueStage', () => {
  describe('completed stage', () => {
    it('should return "complete" when completed label is present', () => {
      const issue = createIssue({ labels: [LABEL_STATE.completed] });
      expect(classifyIssueStage(issue)).toBe('complete');
    });

    it('should return "complete" even with other labels', () => {
      const issue = createIssue({
        labels: [LABEL_STATE.inProgress, LABEL_STATE.completed, LABEL_TYPES.feature],
      });
      expect(classifyIssueStage(issue)).toBe('complete');
    });

    it('should handle case-insensitive labels', () => {
      const issue = createIssue({ labels: ['COMPLETED'] });
      expect(classifyIssueStage(issue)).toBe('complete');
    });
  });

  describe('failed stage', () => {
    it('should return "failed" when ci-failure label is present', () => {
      const issue = createIssue({ labels: [LABEL_REPAIR.ciFailure] });
      expect(classifyIssueStage(issue)).toBe('failed');
    });

    it('should return "failed" when repair-in-progress label is present', () => {
      const issue = createIssue({ labels: [LABEL_REPAIR.repairInProgress] });
      expect(classifyIssueStage(issue)).toBe('failed');
    });

    it('should return "failed" when repair-escalated label is present', () => {
      const issue = createIssue({ labels: [LABEL_REPAIR.repairEscalated] });
      expect(classifyIssueStage(issue)).toBe('failed');
    });

    it('should prioritize failed over other states except completed', () => {
      const issue = createIssue({
        labels: [LABEL_REPAIR.ciFailure, LABEL_STATE.ready, LABEL_STATE.inProgress],
      });
      expect(classifyIssueStage(issue)).toBe('failed');
    });
  });

  describe('planning stage', () => {
    it('should return "planning" when architecture-draft is present without architecture-approved', () => {
      const issue = createIssue({ labels: [LABEL_ARCHITECTURE.draft] });
      expect(classifyIssueStage(issue)).toBe('planning');
    });

    it('should NOT return "planning" when both draft and approved are present', () => {
      const issue = createIssue({
        labels: [LABEL_ARCHITECTURE.draft, LABEL_ARCHITECTURE.approved],
      });
      expect(classifyIssueStage(issue)).not.toBe('planning');
    });

    it('should return "planning" with type labels', () => {
      const issue = createIssue({
        labels: [LABEL_ARCHITECTURE.draft, LABEL_TYPES.feature],
      });
      expect(classifyIssueStage(issue)).toBe('planning');
    });
  });

  describe('implementing stage', () => {
    it('should return "implementing" when in-progress label is present', () => {
      const issue = createIssue({ labels: [LABEL_STATE.inProgress] });
      expect(classifyIssueStage(issue)).toBe('implementing');
    });

    it('should return "implementing" with type and architecture labels', () => {
      const issue = createIssue({
        labels: [
          LABEL_STATE.inProgress,
          LABEL_TYPES.feature,
          LABEL_ARCHITECTURE.approved,
        ],
      });
      expect(classifyIssueStage(issue)).toBe('implementing');
    });
  });

  describe('reviewing stage', () => {
    it('should return "reviewing" when ready label is present', () => {
      const issue = createIssue({ labels: [LABEL_STATE.ready] });
      expect(classifyIssueStage(issue)).toBe('reviewing');
    });

    it('should return "reviewing" with type labels', () => {
      const issue = createIssue({
        labels: [LABEL_STATE.ready, LABEL_TYPES.test],
      });
      expect(classifyIssueStage(issue)).toBe('reviewing');
    });
  });

  describe('deploying stage', () => {
    it('should return "deploying" when blocked label is present', () => {
      const issue = createIssue({ labels: [LABEL_STATE.blocked] });
      expect(classifyIssueStage(issue)).toBe('deploying');
    });

    it('should return "reviewing" when both ready and blocked are present (ready wins)', () => {
      const issue = createIssue({
        labels: [LABEL_STATE.blocked, LABEL_STATE.ready],
      });
      expect(classifyIssueStage(issue)).toBe('reviewing');
    });
  });

  describe('idle stage (default)', () => {
    it('should return "idle" when no labels are present', () => {
      const issue = createIssue({ labels: [] });
      expect(classifyIssueStage(issue)).toBe('idle');
    });

    it('should return "idle" when only type labels are present', () => {
      const issue = createIssue({
        labels: [LABEL_TYPES.feature, LABEL_TYPES.test],
      });
      expect(classifyIssueStage(issue)).toBe('idle');
    });

    it('should return "idle" when pipeline label is present alone', () => {
      const issue = createIssue({ labels: [LABEL_STATE.pipeline] });
      expect(classifyIssueStage(issue)).toBe('idle');
    });
  });

  describe('priority order (edge cases)', () => {
    it('should prioritize completed > failed > planning > implementing > reviewing > deploying > idle', () => {
      // Completed wins
      let issue = createIssue({
        labels: [LABEL_STATE.completed, LABEL_REPAIR.ciFailure],
      });
      expect(classifyIssueStage(issue)).toBe('complete');

      // Failed wins over planning
      issue = createIssue({
        labels: [LABEL_REPAIR.ciFailure, LABEL_ARCHITECTURE.draft],
      });
      expect(classifyIssueStage(issue)).toBe('failed');

      // Planning wins over implementing
      issue = createIssue({
        labels: [LABEL_ARCHITECTURE.draft, LABEL_STATE.inProgress],
      });
      expect(classifyIssueStage(issue)).toBe('planning');

      // Implementing wins over reviewing
      issue = createIssue({
        labels: [LABEL_STATE.inProgress, LABEL_STATE.ready],
      });
      expect(classifyIssueStage(issue)).toBe('implementing');

      // Reviewing wins over deploying
      issue = createIssue({
        labels: [LABEL_STATE.ready, LABEL_STATE.blocked],
      });
      expect(classifyIssueStage(issue)).toBe('reviewing');

      // Deploying wins over idle
      issue = createIssue({
        labels: [LABEL_STATE.blocked, LABEL_TYPES.feature],
      });
      expect(classifyIssueStage(issue)).toBe('deploying');
    });

    it('should handle mixed case labels', () => {
      const issue = createIssue({
        labels: ['In-Progress', 'FEATURE', 'architecture-APPROVED'],
      });
      expect(classifyIssueStage(issue)).toBe('implementing');
    });
  });
});

describe('Label type guards', () => {
  describe('isTypeLabel', () => {
    it('should return true for valid type labels', () => {
      expect(isTypeLabel(LABEL_TYPES.feature)).toBe(true);
      expect(isTypeLabel(LABEL_TYPES.test)).toBe(true);
      expect(isTypeLabel(LABEL_TYPES.infra)).toBe(true);
      expect(isTypeLabel(LABEL_TYPES.docs)).toBe(true);
      expect(isTypeLabel(LABEL_TYPES.bug)).toBe(true);
    });

    it('should return false for invalid labels', () => {
      expect(isTypeLabel(LABEL_STATE.inProgress)).toBe(false);
      expect(isTypeLabel('unknown')).toBe(false);
    });
  });

  describe('isStateLabel', () => {
    it('should return true for valid state labels', () => {
      expect(isStateLabel(LABEL_STATE.pipeline)).toBe(true);
      expect(isStateLabel(LABEL_STATE.inProgress)).toBe(true);
      expect(isStateLabel(LABEL_STATE.blocked)).toBe(true);
      expect(isStateLabel(LABEL_STATE.ready)).toBe(true);
      expect(isStateLabel(LABEL_STATE.completed)).toBe(true);
    });

    it('should return false for invalid labels', () => {
      expect(isStateLabel(LABEL_TYPES.feature)).toBe(false);
      expect(isStateLabel('unknown')).toBe(false);
    });
  });

  describe('isArchitectureLabel', () => {
    it('should return true for valid architecture labels', () => {
      expect(isArchitectureLabel(LABEL_ARCHITECTURE.draft)).toBe(true);
      expect(isArchitectureLabel(LABEL_ARCHITECTURE.approved)).toBe(true);
    });

    it('should return false for invalid labels', () => {
      expect(isArchitectureLabel(LABEL_TYPES.feature)).toBe(false);
      expect(isArchitectureLabel('unknown')).toBe(false);
    });
  });

  describe('isRepairLabel', () => {
    it('should return true for valid repair labels', () => {
      expect(isRepairLabel(LABEL_REPAIR.ciFailure)).toBe(true);
      expect(isRepairLabel(LABEL_REPAIR.repairInProgress)).toBe(true);
      expect(isRepairLabel(LABEL_REPAIR.repairEscalated)).toBe(true);
    });

    it('should return false for invalid labels', () => {
      expect(isRepairLabel(LABEL_TYPES.feature)).toBe(false);
      expect(isRepairLabel('unknown')).toBe(false);
    });
  });
});

describe('Label filtering functions', () => {
  describe('getStateLabels', () => {
    it('should return only state labels', () => {
      const issue = createIssue({
        labels: [
          LABEL_STATE.inProgress,
          LABEL_TYPES.feature,
          LABEL_STATE.ready,
          LABEL_ARCHITECTURE.draft,
        ],
      });
      const stateLabels = getStateLabels(issue);
      expect(stateLabels).toContain(LABEL_STATE.inProgress);
      expect(stateLabels).toContain(LABEL_STATE.ready);
      expect(stateLabels).not.toContain(LABEL_TYPES.feature);
      expect(stateLabels.length).toBe(2);
    });

    it('should return empty array when no state labels exist', () => {
      const issue = createIssue({
        labels: [LABEL_TYPES.feature, LABEL_TYPES.test],
      });
      expect(getStateLabels(issue)).toEqual([]);
    });
  });

  describe('getTypeLabels', () => {
    it('should return only type labels', () => {
      const issue = createIssue({
        labels: [
          LABEL_STATE.inProgress,
          LABEL_TYPES.feature,
          LABEL_TYPES.test,
          LABEL_TYPES.bug,
        ],
      });
      const typeLabels = getTypeLabels(issue);
      expect(typeLabels).toContain(LABEL_TYPES.feature);
      expect(typeLabels).toContain(LABEL_TYPES.test);
      expect(typeLabels).toContain(LABEL_TYPES.bug);
      expect(typeLabels).not.toContain(LABEL_STATE.inProgress);
      expect(typeLabels.length).toBe(3);
    });
  });

  describe('getRepairLabels', () => {
    it('should return only repair labels', () => {
      const issue = createIssue({
        labels: [
          LABEL_REPAIR.ciFailure,
          LABEL_STATE.inProgress,
          LABEL_REPAIR.repairInProgress,
        ],
      });
      const repairLabels = getRepairLabels(issue);
      expect(repairLabels).toContain(LABEL_REPAIR.ciFailure);
      expect(repairLabels).toContain(LABEL_REPAIR.repairInProgress);
      expect(repairLabels.length).toBe(2);
    });
  });
});

describe('State check functions', () => {
  describe('isInRepair', () => {
    it('should return true when any repair label is present', () => {
      let issue = createIssue({ labels: [LABEL_REPAIR.ciFailure] });
      expect(isInRepair(issue)).toBe(true);

      issue = createIssue({ labels: [LABEL_REPAIR.repairInProgress] });
      expect(isInRepair(issue)).toBe(true);

      issue = createIssue({ labels: [LABEL_REPAIR.repairEscalated] });
      expect(isInRepair(issue)).toBe(true);
    });

    it('should return false when no repair labels are present', () => {
      const issue = createIssue({
        labels: [LABEL_STATE.inProgress, LABEL_TYPES.feature],
      });
      expect(isInRepair(issue)).toBe(false);
    });

    it('should handle case-insensitive labels', () => {
      const issue = createIssue({ labels: ['CI-FAILURE'] });
      expect(isInRepair(issue)).toBe(true);
    });
  });

  describe('isCompleted', () => {
    it('should return true when completed label is present', () => {
      const issue = createIssue({ labels: [LABEL_STATE.completed] });
      expect(isCompleted(issue)).toBe(true);
    });

    it('should return false when completed label is not present', () => {
      const issue = createIssue({ labels: [LABEL_STATE.inProgress] });
      expect(isCompleted(issue)).toBe(false);
    });

    it('should handle case-insensitive labels', () => {
      const issue = createIssue({ labels: ['COMPLETED'] });
      expect(isCompleted(issue)).toBe(true);
    });

    it('should return false when other labels exist', () => {
      const issue = createIssue({
        labels: [LABEL_STATE.ready, LABEL_TYPES.feature],
      });
      expect(isCompleted(issue)).toBe(false);
    });
  });
});

describe('Label constants', () => {
  it('should have all type labels defined', () => {
    expect(LABEL_TYPES.feature).toBe('feature');
    expect(LABEL_TYPES.test).toBe('test');
    expect(LABEL_TYPES.infra).toBe('infra');
    expect(LABEL_TYPES.docs).toBe('docs');
    expect(LABEL_TYPES.bug).toBe('bug');
  });

  it('should have all state labels defined', () => {
    expect(LABEL_STATE.pipeline).toBe('pipeline');
    expect(LABEL_STATE.inProgress).toBe('in-progress');
    expect(LABEL_STATE.blocked).toBe('blocked');
    expect(LABEL_STATE.ready).toBe('ready');
    expect(LABEL_STATE.completed).toBe('completed');
  });

  it('should have all architecture labels defined', () => {
    expect(LABEL_ARCHITECTURE.draft).toBe('architecture-draft');
    expect(LABEL_ARCHITECTURE.approved).toBe('architecture-approved');
  });

  it('should have all repair labels defined', () => {
    expect(LABEL_REPAIR.ciFailure).toBe('ci-failure');
    expect(LABEL_REPAIR.repairInProgress).toBe('repair-in-progress');
    expect(LABEL_REPAIR.repairEscalated).toBe('repair-escalated');
  });
});
