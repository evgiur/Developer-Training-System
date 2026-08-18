import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateTodaySession, submitReviewAttempt } from '@/modules/learning/daily-session';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo-user-1';

    const sessionData = await getOrCreateTodaySession(userId);
    return NextResponse.json({ success: true, ...sessionData });
  } catch (error: any) {
    console.error('[API /api/daily-session GET Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

const SubmitSchema = z.object({
  userId: z.string().default('demo-user-1'),
  reviewItemId: z.string().min(1),
  quality: z.number().min(0).max(4),
  response: z.string(),
  isAiAssisted: z.boolean().optional(),
  errorType: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = SubmitSchema.parse(body);

    const result = await submitReviewAttempt(params);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[API /api/daily-session POST Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
