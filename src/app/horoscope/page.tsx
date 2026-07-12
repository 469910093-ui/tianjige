'use client';

import { useState, useCallback, useEffect } from 'react';
import Navbar from '@/components/navbar';
import FortuneReport from '@/components/fortune-report';
import { useReport } from '@/components/use-report';
import CopyableSummary from '@/components/copyable-summary';
import { calculateHoroscope, type HoroscopeResult } from '@/lib/bazi-engine';

const ZODIAC_LIST = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座',
];

type Step = 'input' | 'result' | 'report';

export default function HoroscopePage() {
  const [step, setStep] = useState<Step>('input');
  const [selectedZodiac, setSelectedZodiac] = useState('');
  const [horoscopeResult, setHoroscopeResult] = useState<HoroscopeResult | null>(null);
  const [summary, setSummary] = useState('');
  const { report, isGenerating, reportError, handleGenerateReport, clearReportError } = useReport();

  useEffect(() => {
    setStep('input');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedZodiac) return;
    const result = calculateHoroscope(selectedZodiac);
    setHoroscopeResult(result);
    setSummary(`【每日运势】\n星座：${selectedZodiac}\n日期：${new Date().toLocaleDateString('zh-CN')}\n\n来源：今天吃什么 AI 算命`);
    setStep('result');
  }, [selectedZodiac]);

  const onGenerateAll = useCallback(async () => {
    if (!horoscopeResult) return;
    await handleGenerateReport(horoscopeResult, 'horoscope');
    setStep('report');
  }, [horoscopeResult, handleGenerateReport]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">每日运势</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">选择你的星座，查看今日运势</p>
        </div>

        {step === 'input' && (
          <div className="max-w-md mx-auto">
            <h2 className="text-sm font-semibold text-foreground mb-4">选择星座</h2>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {ZODIAC_LIST.map(z => (
                <button
                  key={z}
                  onClick={() => setSelectedZodiac(z)}
                  className={`min-h-[48px] rounded-xl text-sm font-medium transition-all active:scale-[0.97] ${
                    selectedZodiac === z
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card text-foreground border border-outline-variant/15 hover:border-primary/30'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selectedZodiac}
              className="w-full mt-6 min-h-[48px] bg-primary text-primary-foreground rounded-xl font-medium text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              查看运势
            </button>
          </div>
        )}

        {(step === 'result' || step === 'report') && horoscopeResult && (
          <div className="space-y-6">
            {summary && <CopyableSummary summary={summary} />}
            <h2 className="text-lg font-semibold text-foreground">
              {horoscopeResult.zodiac} · 每日运势
            </h2>

            <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-lg font-bold">{horoscopeResult.zodiac.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{horoscopeResult.zodiac}</div>
                  <div className="text-xs text-muted-foreground">今日干支：{horoscopeResult.todayGanZhi}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-1">五行属性</div>
              <div className="text-sm font-medium text-foreground mb-3">{horoscopeResult.element}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: '宜', items: horoscopeResult.yi, color: 'text-soft-green' },
                { label: '忌', items: horoscopeResult.ji, color: 'text-destructive' },
              ].map(section => (
                <div key={section.label} className="bg-card rounded-xl p-4 shadow-[0_2px_8px_rgba(49,37,27,0.08)] col-span-1 md:col-span-1">
                  <div className={`text-sm font-semibold ${section.color} mb-2`}>{section.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {section.items.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 bg-surface-container rounded text-xs text-foreground">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-card rounded-xl p-4 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
                <div className="text-sm font-semibold text-primary mb-2">方位</div>
                <div className="text-xs text-muted-foreground">
                  <div>财神：<span className="text-foreground">{horoscopeResult.fangwei.caiShen}</span></div>
                  <div>福神：<span className="text-foreground">{horoscopeResult.fangwei.fuShen}</span></div>
                  <div>喜神：<span className="text-foreground">{horoscopeResult.fangwei.xiShen}</span></div>
                </div>
              </div>
            </div>

            <FortuneReport
              report={report}
              isGenerating={isGenerating}
              reportError={reportError}
              onRetry={() => horoscopeResult && handleGenerateReport(horoscopeResult, 'horoscope')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
