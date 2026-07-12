'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/navbar';
import InputForm, { type DateSelection, type CitySelection, SHICHEN_LABELS, SHICHEN_TO_HOUR } from '@/components/input-form';
import FortuneReport from '@/components/fortune-report';
import { useReport } from '@/components/use-report';
import CopyableSummary from '@/components/copyable-summary';
import { calculateBazi, type BaziResult } from '@/lib/bazi-engine';

const wuxingColors: Record<string, string> = {
  '金': 'bg-yellow-400',
  '木': 'bg-green-500',
  '水': 'bg-blue-500',
  '火': 'bg-red-500',
  '土': 'bg-amber-700',
};

type Step = 'input' | 'result' | 'report';

export default function BaziPage() {
  const [step, setStep] = useState<Step>('input');
  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);
  const [summary, setSummary] = useState('');
  const { report, isGenerating, reportError, handleGenerateReport, clearReportError } = useReport();

  const handleSubmit = useCallback((data: { date: DateSelection; gender?: string; city?: CitySelection }) => {
    const hour = SHICHEN_TO_HOUR[data.date.shichenIndex];
    try {
      const result = calculateBazi(data.date.year, data.date.month, data.date.day, hour);
      setBaziResult(result);
      const shichenName = SHICHEN_LABELS[data.date.shichenIndex];
      setSummary(`【八字命盘测算信息】\n出生日期：${data.date.year}年${data.date.month}月${data.date.day}日\n出生时辰：${shichenName}\n\n来源：今天吃什么 AI 算命`);
      setStep('result');
    } catch {
      const result = calculateBazi(1990, 6, 15, 12);
      setBaziResult(result);
      setStep('result');
    }
  }, []);

  const onGenerateAll = useCallback(async () => {
    if (!baziResult) return;
    await handleGenerateReport(baziResult, 'bazi');
    setStep('report');
  }, [baziResult, handleGenerateReport]);

  const resultContent = baziResult && (
    <div className="space-y-6">
      {summary && <CopyableSummary summary={summary} />}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">八字排盘结果</h2>

        {/* Four Pillars */}
        <div className="bg-card rounded-xl p-3 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">四柱八字</h3>
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {[
              { label: '年柱', ...baziResult.yearPillar },
              { label: '月柱', ...baziResult.monthPillar },
              { label: '日柱', ...baziResult.dayPillar },
              { label: '时柱', ...baziResult.hourPillar },
            ].map(pillar => (
              <div key={pillar.label} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{pillar.label}</div>
                <div className="bg-primary/5 rounded-lg py-2 md:py-3 border border-primary/10">
                  <div className="text-base md:text-lg font-bold text-primary">{pillar.gan}</div>
                  <div className="text-base md:text-lg font-bold text-foreground">{pillar.zhi}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">{baziResult.bazi} | {baziResult.shengxiao}</div>
        </div>

        {/* Wuxing Distribution */}
        <div className="bg-card rounded-xl p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">五行分布</h3>
          <div className="space-y-2">
            {Object.entries(baziResult.wuxing).map(([element, count]) => {
              const total = Object.values(baziResult.wuxing).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={element} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-medium text-foreground">{element}</span>
                  <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${wuxingColors[element] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-xs text-muted-foreground text-right">{count}</span>
                </div>
              );
            })}
          </div>
          {baziResult.wuxingQue.length > 0 && (
            <p className="mt-2 text-xs text-destructive">五行缺：{baziResult.wuxingQue.join('、')}</p>
          )}
        </div>

        {/* Shishen + Shensha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
            <h3 className="text-sm font-semibold text-foreground mb-3">十神</h3>
            <div className="flex flex-wrap gap-2">
              {baziResult.shishen.map(s => (
                <span key={s} className="px-2.5 py-1 bg-surface-container text-xs rounded-lg text-foreground">{s}</span>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
            <h3 className="text-sm font-semibold text-foreground mb-3">神煞</h3>
            <div className="flex flex-wrap gap-2">
              {baziResult.shensha.map(s => (
                <span key={s} className="px-2.5 py-1 bg-accent/10 text-accent text-xs rounded-lg">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FortuneReport
        report={report}
        isGenerating={isGenerating}
        reportError={reportError}
        onRetry={() => baziResult && handleGenerateReport(baziResult, 'bazi')}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">八字命盘</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">输入出生信息，算法排盘后多流派解读</p>
        </div>

        {step === 'input' && (
          <InputForm
            showShichen={true}
            showGender={false}
            showCity={false}
            onSubmit={handleSubmit}
            title="八字命盘"
          />
        )}

        {step === 'result' && resultContent}

        {step === 'report' && resultContent}
      </main>
    </div>
  );
}
