export interface IntervalResult {
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  status: 'QUEUED' | 'GRADED' | 'REMEDIATION';
}

export interface CandidatePriorityInput {
  forgettingRisk: number; // 0.0 to 1.0 (higher = more urgent to review)
  weakness: number;       // 0.0 to 1.0 (higher = user is weaker)
  importance: number;     // 1 to 10 (domain weight)
  stalenessDays: number;  // Days since last verification
  isCriticalWeakness?: boolean;
}

/**
 * Calculates priority score for daily candidate selection.
 * Priority = ForgettingRisk * Weakness * Importance * Staleness
 */
export function calculateCandidatePriority(input: CandidatePriorityInput): number {
  const { forgettingRisk, weakness, importance, stalenessDays, isCriticalWeakness } = input;
  const stalenessFactor = Math.log2(stalenessDays + 1); // Sub-linear scale for staleness
  
  let priority = forgettingRisk * (weakness + 0.1) * (importance / 10) * (stalenessFactor + 1);

  if (isCriticalWeakness) {
    priority *= 2.5; // Boost critical weaknesses so they aren't displaced
  }

  return Math.round(priority * 100) / 100;
}

/**
 * Calculates next interval based on user performance quality (0 to 4).
 */
export function calculateNextInterval(
  quality: number,
  currentIntervalDays: number,
  repetitions: number,
  easeFactor: number = 2.5
): IntervalResult {
  let nextEaseFactor = easeFactor;
  let nextRepetitions = repetitions;
  let nextInterval = currentIntervalDays;
  let nextStatus: 'QUEUED' | 'GRADED' | 'REMEDIATION' = 'GRADED';

  if (quality < 2) {
    // Quality 0 or 1: Failed or partial recall -> Reset interval & enter remediation
    nextRepetitions = 0;
    nextInterval = 1;
    nextEaseFactor = Math.max(1.3, easeFactor - 0.2);
    nextStatus = 'REMEDIATION';
  } else if (quality === 2) {
    // Quality 2: Correct with difficulty -> Short fixed interval, no ease increase
    // Per spec §3: "2 → repeat after short interval" (distinct from quality 3)
    nextRepetitions += 1;
    nextInterval = 1; // Always 1 day regardless of repetitions
    nextEaseFactor = Math.max(1.3, easeFactor - 0.05); // Slight decrease
    nextStatus = 'GRADED';
  } else {
    // Quality 3 or 4: Good/Perfect recall -> Interval increases
    nextRepetitions += 1;
    nextEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (nextRepetitions === 1) {
      nextInterval = quality === 4 ? 3 : 1;
    } else if (nextRepetitions === 2) {
      nextInterval = quality === 4 ? 7 : 3;
    } else {
      const multiplier = quality === 4 ? nextEaseFactor * 1.3 : nextEaseFactor;
      nextInterval = Math.round(currentIntervalDays * multiplier);
    }
  }

  return {
    intervalDays: Math.min(nextInterval, 180), // Cap at 180 days max
    repetitions: nextRepetitions,
    easeFactor: Math.round(nextEaseFactor * 100) / 100,
    status: nextStatus,
  };
}
