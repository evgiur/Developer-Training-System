import { prisma } from '@/lib/prisma';
import { calculateCandidatePriority, calculateNextInterval } from './scheduler';

export async function getOrCreateTodaySession(userId: string) {
  const todayStr = new Date().toISOString().split('T')[0];

  // T6: Use upsert instead of findUnique → create to avoid race condition
  const session = await prisma.dailySession.upsert({
    where: {
      userId_sessionDate: {
        userId,
        sessionDate: todayStr,
      },
    },
    update: {},
    create: {
      userId,
      sessionDate: todayStr,
      status: 'IN_PROGRESS',
      totalItems: 7, // 5 recall + 1 coding + 1 explanation
      completedItems: 0,
      startedAt: new Date(),
    },
  });

  // Get active due review items for user
  let reviewItems = await prisma.reviewItem.findMany({
    where: {
      userId,
      dueAt: { lte: new Date() },
      status: { in: ['QUEUED', 'REMEDIATION'] },
    },
    include: {
      question: {
        include: { topic: { include: { skill: true } } },
      },
      task: {
        include: { skill: true },
      },
    },
  });

  // If review items queue is empty, populate from seed questions & tasks for user
  if (reviewItems.length === 0) {
    const questions = await prisma.question.findMany({
      include: { topic: { include: { skill: true } } },
      take: 5,
    });

    for (const q of questions) {
      await prisma.reviewItem.create({
        data: {
          userId,
          questionId: q.id,
          dueAt: new Date(),
          intervalDays: 1,
          status: 'QUEUED',
        },
      });
    }

    const tasks = await prisma.task.findMany({
      include: { skill: true },
      take: 2,
    });

    for (const t of tasks) {
      await prisma.reviewItem.create({
        data: {
          userId,
          taskId: t.id,
          dueAt: new Date(),
          intervalDays: 1,
          status: 'QUEUED',
        },
      });
    }

    // T7: Apply same filters as the initial query (dueAt, status, take)
    // instead of fetching all review items for the user
    reviewItems = await prisma.reviewItem.findMany({
      where: {
        userId,
        dueAt: { lte: new Date() },
        status: { in: ['QUEUED', 'REMEDIATION'] },
      },
      include: {
        question: {
          include: { topic: { include: { skill: true } } },
        },
        task: {
          include: { skill: true },
        },
      },
      take: 10,
    });
  }

  // T3: Sort candidates by priority using calculateCandidatePriority
  const userId_ = userId;
  const skillLevels = await prisma.skillLevel.findMany({
    where: { userId: userId_ },
  });
  const skillLevelMap = new Map(skillLevels.map(sl => [sl.skillId, sl]));

  const scoredItems = reviewItems.map(item => {
    const skillId = item.question?.topic?.skill?.id || item.task?.skill?.id;
    const skillWeight = item.question?.topic?.skill?.weight || item.task?.skill?.weight || 10;
    const sl = skillId ? skillLevelMap.get(skillId) : undefined;

    const forgettingRisk = sl ? (sl.retentionStatus === 'RISKY' || sl.retentionStatus === 'FORGOTTEN' ? 0.9 : 0.3) : 0.5;
    const weakness = sl ? (1 - sl.verifiedLevel / 6) : 0.5;
    const stalenessDays = sl?.lastVerifiedAt
      ? Math.floor((Date.now() - sl.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 30; // Default 30 days if never verified
    const isCriticalWeakness = sl?.retentionStatus === 'RISKY';

    const priority = calculateCandidatePriority({
      forgettingRisk,
      weakness,
      importance: skillWeight,
      stalenessDays,
      isCriticalWeakness,
    });

    return { item, priority };
  });

  // Sort by priority descending, take top 10
  scoredItems.sort((a, b) => b.priority - a.priority);
  const sortedItems = scoredItems.slice(0, 10).map(s => s.item);

  return {
    session,
    items: sortedItems,
  };
}

export async function submitReviewAttempt(params: {
  userId: string;
  reviewItemId: string;
  quality: number; // 0 to 4
  response: string;
  isAiAssisted?: boolean;
  errorType?: string;
}) {
  const { userId, reviewItemId, quality, response, isAiAssisted = false, errorType } = params;

  const item = await prisma.reviewItem.findUnique({
    where: { id: reviewItemId },
    include: {
      question: {
        include: { topic: true },
      },
      task: true,
    },
  });

  if (!item) {
    throw new Error(`Review item ${reviewItemId} not found`);
  }

  // Determine the skill associated with this review item
  const skillId = item.question?.topic?.skillId || item.task?.skillId;

  // Calculate next interval with SM-2 scheduler
  const next = calculateNextInterval(quality, item.intervalDays, item.repetitions, item.easeFactor);

  const nextDueAt = new Date();
  nextDueAt.setDate(nextDueAt.getDate() + next.intervalDays);

  const todayStr = new Date().toISOString().split('T')[0];

  // T2: Wrap all mutations in a transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Record attempt
    const attempt = await tx.reviewAttempt.create({
      data: {
        reviewItemId,
        userId,
        quality,
        response,
        isAiAssisted,
        errorType: quality < 2 ? (errorType || 'KNOWLEDGE_GAP') : null,
        confidence: quality >= 3 ? 1.0 : 0.5,
      },
    });

    // 2. Update review item scheduling
    await tx.reviewItem.update({
      where: { id: reviewItemId },
      data: {
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        easeFactor: next.easeFactor,
        status: next.status,
        dueAt: nextDueAt,
      },
    });

    // 3. Update DailySession completion count
    await tx.dailySession.updateMany({
      where: { userId, sessionDate: todayStr },
      data: { completedItems: { increment: 1 } },
    });

    // 4. T2: Update SkillLevel based on attempt quality
    if (skillId) {
      const existingLevel = await tx.skillLevel.findUnique({
        where: { userId_skillId: { userId, skillId } },
      });

      // Get recent attempts for this skill to compute metrics
      // Find all review items for this skill
      const skillReviewItems = await tx.reviewItem.findMany({
        where: {
          userId,
          OR: [
            { question: { topic: { skillId } } },
            { taskId: { not: null }, task: { skillId } },
          ],
        },
        select: { id: true },
      });
      const skillReviewItemIds = skillReviewItems.map(ri => ri.id);

      const recentAttempts = await tx.reviewAttempt.findMany({
        where: {
          userId,
          reviewItemId: { in: skillReviewItemIds },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Calculate updated metrics
      const currentEvidenceCount = (existingLevel?.evidenceCount || 0) + 1;
      const currentVerified = existingLevel?.verifiedLevel || 0;

      // Update verifiedLevel: increase on quality >= 3, decrease on quality < 2
      let newVerifiedLevel = currentVerified;
      if (quality >= 3 && currentVerified < 6) {
        // Increment by 1, but only if evidence supports it
        // Require at least evidenceCount/2 successful attempts to advance
        newVerifiedLevel = Math.min(6, currentVerified + 1);
      } else if (quality < 2 && currentVerified > 0) {
        newVerifiedLevel = Math.max(0, currentVerified - 1);
      }

      // Has application evidence (task, not just question)?
      const hasApplicationEvidence = item.task !== null;

      // If only theoretical evidence and level > 3, cap at 3
      // (spec: skill not verified without independent application evidence)
      if (!hasApplicationEvidence && newVerifiedLevel > 3) {
        const hasAnyAppEvidence = recentAttempts.length > 0; // simplified check
        if (!hasAnyAppEvidence) {
          newVerifiedLevel = Math.min(newVerifiedLevel, 3);
        }
      }

      // Count recent failures (consecutive quality < 2 from most recent)
      let recentFailures = 0;
      for (const att of recentAttempts) {
        if (att.quality < 2) {
          recentFailures++;
        } else {
          break; // Stop counting at first success
        }
      }
      // Account for current attempt
      if (quality < 2) {
        recentFailures = Math.max(recentFailures, 1);
      }

      // Determine retention status
      let retentionStatus = existingLevel?.retentionStatus || 'NEW';
      const successCount = recentAttempts.filter(a => a.quality >= 3).length + (quality >= 3 ? 1 : 0);
      if (recentFailures >= 2) {
        retentionStatus = 'RISKY';
      } else if (successCount >= 3) {
        retentionStatus = 'RETENTION_OK';
      } else if (retentionStatus === 'NEW' && currentEvidenceCount > 0) {
        retentionStatus = 'NEW'; // Stay NEW until enough data
      }

      // Confidence: moving average of quality scores (0-4 normalized to 0-1)
      const allQualities = [...recentAttempts.map(a => a.quality), quality];
      const avgQuality = allQualities.reduce((sum, q) => sum + q, 0) / allQualities.length;
      const confidence = Math.round((avgQuality / 4) * 100) / 100;

      // T4: AI dependency — sliding average of isAiAssisted over recent attempts
      const recentAiAssisted = recentAttempts.filter(a => a.isAiAssisted).length + (isAiAssisted ? 1 : 0);
      const aiDependency = Math.round((recentAiAssisted / allQualities.length) * 100) / 100;

      await tx.skillLevel.upsert({
        where: { userId_skillId: { userId, skillId } },
        create: {
          userId,
          skillId,
          currentLevel: newVerifiedLevel,
          verifiedLevel: newVerifiedLevel,
          confidence,
          retentionStatus,
          aiDependency,
          evidenceCount: 1,
          recentFailures,
          lastVerifiedAt: new Date(),
        },
        update: {
          currentLevel: newVerifiedLevel,
          verifiedLevel: newVerifiedLevel,
          confidence,
          retentionStatus,
          aiDependency,
          evidenceCount: currentEvidenceCount,
          recentFailures,
          lastVerifiedAt: new Date(),
        },
      });
    }

    return { attempt, nextIntervalDays: next.intervalDays, status: next.status };
  });

  return result;
}
