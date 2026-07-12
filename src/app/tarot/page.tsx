'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/navbar';
import FortuneChat, { type ChatMessage } from '@/components/fortune-chat';
import FortuneReport from '@/components/fortune-report';
import { useReport } from '@/components/use-report';
import CopyableSummary from '@/components/copyable-summary';
import { drawCards, type TarotReading } from '@/lib/tarot-engine';

const SYSTEM_PROMPT = `你是今天吃什么的塔罗师，精通塔罗牌占卜。你的任务是引导用户选择占卜主题。

请按以下步骤引导：
1. 问用户想占卜哪方面（感情、事业、财运、综合）
2. 了解用户的具体问题或困惑
3. 确认后，告诉用户"信息已收集完毕，请点击下方按钮开始测算"

语气要神秘优雅，充满塔罗的灵性气息。每次回复控制在80字以内。`;

type Step = 'chat' | 'result' | 'report';

export default function TarotPage() {
  const [step, setStep] = useState<Step>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tarotReading, setTarotReading] = useState<TarotReading | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [summary, setSummary] = useState('');
  const { report, isGenerating, reportError, handleGenerateReport, clearReportError } = useReport();

  const handleMessagesChange = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  const handleInfoCollected = useCallback((chatMessages: ChatMessage[]) => {
    const userMsgs = chatMessages.filter(m => m.role === 'user').map(m => m.content);
    const allText = userMsgs.join('\n');
    const summaryText = `【塔罗占卜信息】\n测算流派：塔罗牌\n${allText.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\n来源：今天吃什么 AI 算命`;
    setSummary(summaryText);
    setMessages(chatMessages);

    const reading = drawCards(3);
    setTarotReading(reading);
    setFlippedCards(new Set());
    setStep('result');
  }, []);

  const handleFlipCard = useCallback((index: number) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const onGenerateAll = useCallback(async () => {
    if (!tarotReading) return;
    const cardsData = tarotReading.cards.map(c => ({
      name: c.card.name,
      isReversed: c.isReversed,
      position: c.position,
      keywords: c.isReversed ? c.card.reversed : c.card.upright,
      meaning: c.isReversed ? c.card.reversed.join('、') : c.card.upright.join('、'),
    }));
    await handleGenerateReport({ cards: cardsData, spread: '三牌阵' }, 'tarot');
    setStep('report');
  }, [tarotReading, handleGenerateReport]);

  const drawnCards = tarotReading?.cards || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">塔罗占卜</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">AI 塔罗师引导选牌，78 张塔罗牌正逆位深度解读</p>
        </div>

        {step === 'chat' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-xl shadow-[0_2px_8px_rgba(49,37,27,0.08)] overflow-hidden">
              <div className="p-4 border-b border-outline-variant/15">
                <h2 className="text-sm font-semibold text-foreground">对话引导</h2>
              </div>
              <FortuneChat
                systemPrompt={SYSTEM_PROMPT}
                placeholder="告诉我你想占卜的方面..."
                onMessagesChange={handleMessagesChange}
                onInfoCollected={handleInfoCollected}
                showCollectButton={true}
              />
            </div>
          </div>
        )}

        {(step === 'result' || step === 'report') && drawnCards.length > 0 && (
          <div className="space-y-6">
            {summary && <CopyableSummary summary={summary} />}
            <h2 className="text-lg font-semibold text-foreground">塔罗牌面</h2>

            <div className="flex justify-center gap-3 md:gap-6 px-2">
              {drawnCards.map((draw, idx) => {
                const isFlipped = flippedCards.has(idx);
                return (
                  <div key={idx} className="text-center flex-shrink-0">
                    <div className="text-[10px] md:text-xs text-muted-foreground mb-2">{draw.position}</div>
                    <div
                      className={`relative w-[100px] h-[160px] md:w-40 md:h-64 cursor-pointer transition-all duration-500 ${
                        !isFlipped ? 'hover:-translate-y-2' : ''
                      }`}
                      onClick={() => !isFlipped && handleFlipCard(idx)}
                    >
                      {!isFlipped && (
                        <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/40 rounded-xl border-2 border-primary/30 flex items-center justify-center">
                          <div className="text-primary-foreground/40 text-2xl md:text-4xl">✦</div>
                        </div>
                      )}
                      {isFlipped && (
                        <div className="w-full h-full rounded-xl bg-card border-2 border-primary/20 shadow-[0_2px_8px_rgba(49,37,27,0.08)] flex flex-col items-center justify-center p-2 md:p-3 animate-in fade-in duration-300">
                          <div className="text-[10px] md:text-xs text-muted-foreground mb-0.5">{draw.card.arcana === 'major' ? '大阿卡纳' : '小阿卡纳'}</div>
                          <div className="text-sm md:text-lg font-bold text-primary">{draw.card.name}</div>
                          <div className={`text-[10px] md:text-xs mt-0.5 px-1.5 py-0.5 rounded ${draw.isReversed ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
                            {draw.isReversed ? '逆位' : '正位'}
                          </div>
                          <div className="mt-1 text-[10px] md:text-xs text-muted-foreground text-center leading-relaxed line-clamp-3">
                            {(draw.isReversed ? draw.card.reversed : draw.card.upright).join(' · ')}
                          </div>
                        </div>
                      )}
                    </div>
                    {!isFlipped && (
                      <p className="text-xs text-muted-foreground mt-2">点击翻牌</p>
                    )}
                  </div>
                );
              })}
            </div>

            {flippedCards.size > 0 && (
              <div className="space-y-3">
                {drawnCards.map((draw, idx) => {
                  if (!flippedCards.has(idx)) return null;
                  return (
                    <div key={idx} className="bg-card rounded-xl p-4 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{draw.position}</span>
                        <span className="text-sm font-semibold text-foreground">{draw.card.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${draw.isReversed ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
                          {draw.isReversed ? '逆位' : '正位'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {draw.card.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <FortuneReport
              report={report}
              isGenerating={isGenerating}
              reportError={reportError}
              onRetry={() => tarotReading && handleGenerateReport(tarotReading, 'tarot')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
