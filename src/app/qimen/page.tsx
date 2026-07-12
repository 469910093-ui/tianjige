'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/navbar';
import InputForm, { type DateSelection, type CitySelection, SHICHEN_LABELS, SHICHEN_TO_HOUR } from '@/components/input-form';
import FortuneReport from '@/components/fortune-report';
import { useReport } from '@/components/use-report';
import CopyableSummary from '@/components/copyable-summary';
import { calculateQiMen, type QiMenResult } from '@/lib/qimen-engine';

type Step = 'input' | 'result' | 'report';

export default function QiMenPage() {
  const [step, setStep] = useState<Step>('input');
  const [qimenResult, setQiMenResult] = useState<QiMenResult | null>(null);
  const [summary, setSummary] = useState('');
  const { report, isGenerating, reportError, handleGenerateReport, clearReportError } = useReport();

  const handleSubmit = useCallback((data: { date: DateSelection; gender?: string; city?: CitySelection }) => {
    const hour = SHICHEN_TO_HOUR[data.date.shichenIndex];
    try {
      const result = calculateQiMen(data.date.year, data.date.month, data.date.day, hour);
      setQiMenResult(result);
      const shichenName = SHICHEN_LABELS[data.date.shichenIndex];
      setSummary(`【奇门遁甲测算信息】\n日期：${data.date.year}年${data.date.month}月${data.date.day}日\n时辰：${shichenName}\n\n来源：今天吃什么 AI 算命`);
      setStep('result');
    } catch {
      const result = calculateQiMen(1990, 6, 15, 12);
      setQiMenResult(result);
      setStep('result');
    }
  }, []);

  const onGenerateAll = useCallback(async () => {
    if (!qimenResult) return;
    await handleGenerateReport(qimenResult, 'qimen');
    setStep('report');
  }, [qimenResult, handleGenerateReport]);

  const renderResult = () => {
    if (!qimenResult) return null;
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-xl p-3 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">奇门遁甲局象</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3">
            <div className="bg-primary/5 rounded-lg p-2.5 md:p-3 text-center border border-primary/10">
              <div className="text-[11px] md:text-xs text-muted-foreground">遁型</div>
              <div className="text-sm md:text-base font-bold text-primary">{qimenResult.dunType}</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-2.5 md:p-3 text-center border border-primary/10">
              <div className="text-[11px] md:text-xs text-muted-foreground">局数</div>
              <div className="text-sm md:text-base font-bold text-primary">第{qimenResult.juNumber}局</div>
            </div>
            {qimenResult.solarTerm && (
              <div className="bg-accent/5 rounded-lg p-2.5 md:p-3 text-center border border-accent/10">
                <div className="text-[11px] md:text-xs text-muted-foreground">节气</div>
                <div className="text-sm md:text-base font-bold text-accent">{qimenResult.solarTerm}</div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>值符：<strong className="text-foreground">{qimenResult.zhiFu.star}</strong></span>
            <span>值使：<strong className="text-foreground">{qimenResult.zhiShi.gate}</strong></span>
            {qimenResult.voidness && qimenResult.voidness.length > 0 && <span>空亡：<strong className="text-destructive">{qimenResult.voidness.join('、')}</strong></span>}
            {qimenResult.postHorse && <span>驿马：<strong className="text-accent">{qimenResult.postHorse.branch}</strong></span>}
          </div>
        </div>

        <div className="bg-card rounded-xl p-3 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">九宫排盘</h3>
          <div className="grid grid-cols-3 gap-1.5 md:gap-2">
            {qimenResult.gongDetails.map((gong, idx) => (
              <div key={idx} className={`rounded-lg p-2 md:p-2.5 text-xs border ${idx === 4 ? 'bg-primary/5 border-primary/20' : 'bg-surface-container border-outline-variant/10'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground">{gong.trigram}</span>
                  <span className="text-[10px] text-muted-foreground">{gong.gong}宫</span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div>星：<span className="text-primary font-medium">{gong.star}</span></div>
                  <div>门：<span className="text-accent font-medium">{gong.gate}</span></div>
                  <div>神：<span className="text-foreground">{gong.deity}</span></div>
                  <div className="text-muted-foreground">{gong.heavenlyStem} {gong.earthlyStem}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(qimenResult.globalAuspiciousPatterns?.length > 0 || qimenResult.globalInauspiciousPatterns?.length > 0) && (
          <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
            <h3 className="text-sm font-semibold text-foreground mb-3">格局</h3>
            <div className="space-y-2">
              {qimenResult.globalAuspiciousPatterns?.map((p, i) => (
                <div key={`a-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                  <span className="text-green-600 text-xs font-bold shrink-0">吉</span>
                  <div>
                    <span className="text-xs font-medium text-foreground">{p.name}</span>
                    {p.description && <span className="text-xs text-muted-foreground ml-1">— {p.description}</span>}
                  </div>
                </div>
              ))}
              {qimenResult.globalInauspiciousPatterns?.map((p, i) => (
                <div key={`i-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                  <span className="text-red-600 text-xs font-bold shrink-0">凶</span>
                  <div>
                    <span className="text-xs font-medium text-foreground">{p.name}</span>
                    {p.description && <span className="text-xs text-muted-foreground ml-1">— {p.description}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qimenResult.yi?.length > 0 && (
            <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
              <h3 className="text-sm font-semibold text-foreground mb-3">宜</h3>
              <div className="flex flex-wrap gap-1.5">
                {qimenResult.yi.map((y: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded">{y}</span>
                ))}
              </div>
            </div>
          )}
          {qimenResult.ji?.length > 0 && (
            <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
              <h3 className="text-sm font-semibold text-foreground mb-3">忌</h3>
              <div className="flex flex-wrap gap-1.5">
                {qimenResult.ji.map((j: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded">{j}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">奇门遁甲</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">时家奇门拆补法，九星八门九宫排盘</p>
        </div>

        {step === 'input' && (
          <div className="max-w-md mx-auto">
            <InputForm
              showShichen={true}
              showGender={false}
              showCity={false}
              onSubmit={handleSubmit}
              title="奇门遁甲"
              submitLabel="开始起局"
            />
          </div>
        )}

        {(step === 'result' || step === 'report') && qimenResult && (
          <div className="space-y-6">
            {summary && <CopyableSummary summary={summary} />}
            <h2 className="text-lg font-semibold text-foreground">奇门遁甲起局结果</h2>
            {renderResult()}
            <FortuneReport
              report={report}
              isGenerating={isGenerating}
              reportError={reportError}
              onRetry={() => qimenResult && handleGenerateReport(qimenResult, 'qimen')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
