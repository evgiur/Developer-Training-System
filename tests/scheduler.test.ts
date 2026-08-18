import { describe, test, expect } from 'vitest';
import { calculateCandidatePriority, calculateNextInterval } from '../src/modules/learning/scheduler';

describe('Learning Engine Scheduler', () => {
  test('calculateCandidatePriority correctly scores candidates', () => {
    const score = calculateCandidatePriority({
      forgettingRisk: 0.8,
      weakness: 0.7,
      importance: 10,
      stalenessDays: 5,
    });
    expect(score).toBeGreaterThan(1.5);
  });

  test('calculateNextInterval increases interval on quality 3 or 4', () => {
    const res = calculateNextInterval(3, 1, 1, 2.5);
    expect(res.intervalDays).toBeGreaterThan(1);
    expect(res.status).toBe('GRADED');
  });

  test('calculateNextInterval triggers remediation on quality 0 or 1', () => {
    const res = calculateNextInterval(0, 14, 3, 2.5);
    expect(res.intervalDays).toBe(1);
    expect(res.repetitions).toBe(0);
    expect(res.status).toBe('REMEDIATION');
  });
});
