import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    system: 'Developer Training System API',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.AI_PROVIDER || 'ollama',
  });
}
