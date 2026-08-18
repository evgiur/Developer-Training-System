import { prisma } from '@/lib/prisma';
import { calculateCandidatePriority, calculateNextInterval } from './scheduler';

export async function getOrCreateTodaySession(userId: string) {
  const todayStr = new Date().toISOString().split('T')[0];

  let session = await prisma.dailySession.findUnique({
    where: {
      userId_sessionDate: {
        userId,
        sessionDate: todayStr,
      },
    },
  });

  if (!session) {
    session = await prisma.dailySession.create({
      data: {
        userId,
        sessionDate: todayStr,
        status: 'IN_PROGRESS',
        totalItems: 7, // 5 recall + 1 coding + 1 explanation
        completedItems: 0,
        startedAt: new Date(),
      },
    });
  }

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
    take: 10,
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

    reviewItems = await prisma.reviewItem.findMany({
      where: { userId },
      include: {
        question: {
          include: { topic: { include: { skill: true } } },
        },
        task: {
          include: { skill: true },
        },
      },
    });
  }

  return {
    session,
    items: reviewItems,
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
    include: { question: true, task: true },
  });

  if (!item) {
    throw new Error(`Review item ${reviewItemId} not found`);
  }

  // Record attempt
  const attempt = await prisma.reviewAttempt.create({
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

  // Calculate next interval with SM-2 scheduler
  const next = calculateNextInterval(quality, item.intervalDays, item.repetitions, item.easeFactor);

  const nextDueAt = new Date();
  nextDueAt.setDate(nextDueAt.getDate() + next.intervalDays);

  await prisma.reviewItem.update({
    where: { id: reviewItemId },
    data: {
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      easeFactor: next.easeFactor,
      status: next.status,
      dueAt: nextDueAt,
    },
  });

  // Update DailySession completion count
  const todayStr = new Date().toISOString().split('T')[0];
  await prisma.dailySession.updateMany({
    where: { userId, sessionDate: todayStr },
    data: { completedItems: { increment: 1 } },
  });

  return {
    attempt,
    nextIntervalDays: next.intervalDays,
    status: next.status,
  };
}
