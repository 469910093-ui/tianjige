'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/navbar';
import InputForm, { type DateSelection, type CitySelection, SHICHEN_TO_HOUR } from '@/components/input-form';
import FortuneReport from '@/components/fortune-report';
import { useReport } from '@/components/use-report';
import CopyableSummary from '@/components/copyable-summary';
import { calculateAstrology, type AstrologyResult } from '@/lib/astrology-engine';
import { getCityLatLon } from '@/lib/city-coords';

const elementColors: Record<string, string> = {
  '火': 'bg-red-500', '土': 'bg-amber-700', '风': 'bg-sky-400', '水': 'bg-blue-500',
};

type Step = 'input' | 'result' | 'report';

export default function AstrologyPage() {
  const [step, setStep] = useState<Step>('input');
  const [astroResult, setAstroResult] = useState<AstrologyResult | null>(null);
  const [summary, setSummary] = useState('');
  const { report, isGenerating, reportError, handleGenerateReport, clearReportError } = useReport();

  const handleSubmit = useCallback((data: { date: DateSelection; gender?: string; city?: CitySelection }) => {
    const { date, city } = data;
    const hour = SHICHEN_TO_HOUR[date.shichenIndex];
    const lonLat = city ? getCityLatLon(city.city) : { lat: 39.9, lon: 116.4 };
    try {
      const result = calculateAstrology(date.year, date.month, date.day, hour, lonLat.lat, lonLat.lon);
      setAstroResult(result);
    } catch {
      const result = calculateAstrology(date.year, date.month, date.day, hour, 39.9, 116.4);
      setAstroResult(result);
    }
    const SHICHEN_NAMES = ['子(23-1点)','丑(1-3点)','寅(3-5点)','卯(5-7点)','辰(7-9点)','巳(9-11点)','午(11-13点)','未(13-15点)','申(15-17点)','酉(17-19点)','戌(19-21点)','亥(21-23点)'];
    setSummary(`【星座星盘测算信息】\n出生日期：${date.year}年${date.month}月${date.day}日\n出生时辰：${SHICHEN_NAMES[date.shichenIndex]}\n出生城市：${city ? city.province + ' ' + city.city : '未知'}\n\n来源：今天吃什么 AI 算命`);
    setStep('result');
  }, []);

  const onGenerateAll = useCallback(async () => {
    if (!astroResult) return;
    await handleGenerateReport(astroResult, 'astrology');
    setStep('report');
  }, [astroResult, handleGenerateReport]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">星座星盘</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">基于天文算法精确计算，需出生日期、时间和城市</p>
        </div>

        {step === 'input' && (
          <InputForm
            showShichen={true}
            showCity={true}
            onSubmit={handleSubmit}
            title="输入出生信息"
          />
        )}

        {(step === 'result' || step === 'report') && astroResult && (
          <div className="space-y-6">
            {summary && <CopyableSummary summary={summary} />}
            <h2 className="text-lg font-semibold text-foreground">星盘计算结果</h2>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {[
                { label: '太阳星座', name: astroResult.sun, degree: astroResult.sunDegree, symbol: '☉' },
                { label: '月亮星座', name: astroResult.moon, degree: astroResult.moonDegree, symbol: '☽' },
                { label: '上升星座', name: astroResult.ascendant, degree: astroResult.ascendantDegree, symbol: '↑' },
              ].map(item => (
                <div key={item.label} className="bg-card rounded-xl p-3 md:p-4 text-center shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
                  <div className="text-2xl mb-1">{item.symbol}</div>
                  <div className="text-[11px] md:text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-base md:text-lg font-bold text-primary mt-1">{item.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{item.degree}°</div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
              <h3 className="text-sm font-semibold text-foreground mb-3">行星落宫</h3>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <table className="w-full text-sm min-w-[360px]">
                  <thead>
                    <tr className="border-b border-outline-variant/15">
                      <th className="text-left py-2 text-muted-foreground font-medium">行星</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">星座</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">度数</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">宫位</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {astroResult.planets.map((p, i) => (
                      <tr key={i} className="border-b border-outline-variant/10">
                        <td className="py-2 text-foreground">{p.name}</td>
                        <td className="py-2 text-primary">{p.sign}</td>
                        <td className="py-2 text-muted-foreground">{p.degree}°</td>
                        <td className="py-2 text-muted-foreground">{p.house}</td>
                        <td className="py-2">{p.retrograde ? <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600">逆行</span> : <span className="text-xs text-muted-foreground">顺行</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
                <h3 className="text-sm font-semibold text-foreground mb-3">主要相位</h3>
                <div className="space-y-1.5">
                  {astroResult.aspects.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-foreground">{a.planet1}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">{a.type}</span>
                      <span className="text-foreground">{a.planet2}</span>
                      <span className="text-[11px] text-muted-foreground">{a.orb}°</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
                <h3 className="text-sm font-semibold text-foreground mb-3">元素分布</h3>
                <div className="space-y-2">
                  {Object.entries(astroResult.elements).map(([el, count]) => {
                    const total = Object.values(astroResult.elements).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={el} className="flex items-center gap-2">
                        <span className="w-6 text-xs font-medium text-foreground">{el}</span>
                        <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${elementColors[el] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-xs text-muted-foreground text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <FortuneReport
              report={report}
              isGenerating={isGenerating}
              reportError={reportError}
              onRetry={() => astroResult && handleGenerateReport(astroResult, 'astrology')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
