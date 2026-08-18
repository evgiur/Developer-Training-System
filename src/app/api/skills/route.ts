import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-user-1';

    const skills = await prisma.skill.findMany({
      include: {
        skillLevels: {
          where: { userId },
        },
      },
    });

    const skillMatrix = skills.map((s) => {
      const level = s.skillLevels[0];
      const score = level ? Math.round((level.verifiedLevel / 6) * 100) : 70; // baseline 70%
      const threshold = s.domain === 'JS/TS' || s.domain === 'React' ? 80 : 75;

      return {
        id: s.id,
        name: s.name,
        domain: s.domain,
        weight: s.weight,
        score,
        threshold,
        isBlocker: score < threshold,
      };
    });

    const overallReadiness = Math.round(
      skillMatrix.reduce((acc, item) => acc + item.score, 0) / (skillMatrix.length || 1)
    );

    const blockers = skillMatrix.filter((item) => item.isBlocker);

    return NextResponse.json({
      success: true,
      skills: skillMatrix,
      overallReadiness,
      isMiddleReady: overallReadiness >= 80 && blockers.length === 0,
      blockers,
    });
  } catch (error: any) {
    console.error('[API /api/skills GET Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
