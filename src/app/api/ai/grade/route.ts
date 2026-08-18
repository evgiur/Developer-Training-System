import { NextRequest, NextResponse } from 'next/server';
import { aiGateway } from '@/modules/ai-gateway';
import { z } from 'zod';

const RequestSchema = z.object({
  userAnswer: z.string().min(1, 'User answer is required'),
  referenceAnswer: z.string().min(1, 'Reference answer is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAnswer, referenceAnswer } = RequestSchema.parse(body);

    const gradingResult = await aiGateway.gradeAnswer(userAnswer, {
      correctnessWeight: 0.4,
      completenessWeight: 0.3,
      depthWeight: 0.3,
      referenceAnswer,
    });

    return NextResponse.json({
      success: true,
      grading: gradingResult,
    });
  } catch (error: any) {
    console.error('[API /api/ai/grade Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 400 }
    );
  }
}
