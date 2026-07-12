import { NextRequest, NextResponse } from 'next/server';
import { streamChat } from '@/lib/llm-client';

export async function POST(request: NextRequest) {
  const { messages, systemPrompt } = await request.json();

  const allMessages = [
    { role: 'system' as const, content: systemPrompt || '你是今天吃什么的AI算命先生，擅长八字命理、星座占卜、塔罗解读、紫微斗数、奇门遁甲、六爻占卜。' },
    ...messages,
  ];

  try {
    const llmStream = await streamChat(allMessages, {
      temperature: 0.8,
    });

    return new NextResponse(llmStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('LLM stream error:', error);
    const message = error instanceof Error ? error.message : 'AI 服务暂时不可用';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
