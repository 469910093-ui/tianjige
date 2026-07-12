'use client';

import { useState, useCallback, useEffect } from 'react';
import Navbar from '@/components/navbar';
import InputForm, { type DateSelection, type CitySelection, SHICHEN_LABELS, SHICHEN_TO_HOUR } from '@/components/input-form';
import FortuneReport from '@/components/fortune-report';
import { useReport } from '@/components/use-report';
import CopyableSummary from '@/components/copyable-summary';
import { calculateZiwei, getHoroscopeFromParams, getAdjustedShichen, type ZiweiResult, type ZiweiHoroscopeResult } from '@/lib/ziwei-engine';
import ZiweiChartBoard from '@/components/ziwei-chart-board';
import { getCityLatLon } from '@/lib/city-coords';

import TimeNav, { type ScopeTab } from '@/components/ziwei-time-nav';

type Step = 'input' | 'result' | 'report';

export default function ZiweiPage() {
  const [step, setStep] = useState<Step>('input');
  const [result, setResult] = useState<ZiweiResult | null>(null);
  const [summary, setSummary] = useState('');
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const [currentScope, setCurrentScope] = useState<ScopeTab>('origin');
  const [horoscopeData, setHoroscopeData] = useState<ZiweiHoroscopeResult | null>(null);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetDay, setTargetDay] = useState(new Date().getDate());
  const [targetHour, setTargetHour] = useState(new Date().getHours());
  const [birthHour, setBirthHour] = useState(0);
  const [birthGender, setBirthGender] = useState('男');

  const { report, isGenerating, reportError, handleGenerateReport, clearReportError } = useReport();

  const handleSubmit = useCallback((data: { date: DateSelection; gender?: string; city?: CitySelection }) => {
    const hour = SHICHEN_TO_HOUR[data.date.shichenIndex];
    const gender = data.gender || '男';
    // 真太阳时校正：从城市获取经度
    const longitude = data.city?.city ? getCityLatLon(data.city.city)?.lon : undefined;
    const res = calculateZiwei(
      data.date.year, data.date.month, data.date.day, hour,
      gender,
      data.city?.province, data.city?.city,
      longitude,
    );
    setResult(res);
    setBirthHour(hour);
    setBirthGender(gender);

    const shichenName = SHICHEN_LABELS[data.date.shichenIndex];
    const summaryText = [
      `紫微斗数排盘`,
      `出生：${data.date.year}年${data.date.month}月${data.date.day}日 ${shichenName}`,
      `性别：${gender}`,
      `命宫：${res.mingGongGan}${res.mingGongZhi}`,
      `身宫：${res.shenGongGan}${res.shenGongZhi}`,
      `五行局：${res.wuxingJu}`,
      data.city?.city ? `出生地：${data.city.city}` : '',
    ].filter(Boolean).join('\n');
    setSummary(summaryText);
    setStep('result');
  }, []);

  const onGenerateAll = useCallback(async () => {
    if (!result) return;
    await handleGenerateReport(result, 'ziwei');
    setStep('report');
  }, [result, handleGenerateReport]);

  const handleScopeChange = useCallback((scope: ScopeTab) => {
    setCurrentScope(scope);
  }, []);

  const handleDateChange = useCallback((year: number, month: number, day: number, hour: number) => {
    setTargetYear(year);
    setTargetMonth(month);
    setTargetDay(day);
    setTargetHour(hour);
  }, []);

  // 当 scope 和日期变化时获取运限数据
  useEffect(() => {
    if (currentScope === 'origin' || !result) {
      setHoroscopeData(null);
      return;
    }
    try {
      const horo = getHoroscopeFromParams(
        result.solarDate,
        birthHour,
        birthGender,
        `${targetYear}-${targetMonth}-${targetDay}`,
        targetHour,
      );
      setHoroscopeData(horo);
    } catch (e) {
      console.error('运限计算失败:', e);
      setHoroscopeData(null);
    }
  }, [currentScope, targetYear, targetMonth, targetDay, targetHour, result, birthHour, birthGender]);

  return (
    <div className="min-h-screen bg-[#FBF3E7]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-20">
        {step === 'input' && (
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">紫微斗数</h1>
            <p className="text-sm text-muted-foreground text-center">输入出生信息，排出完整命盘</p>
            <InputForm
              showCity={true}
              showShichen={true}
              showGender={true}
              title="紫微斗数排盘"
              description="输入出生信息，排出完整命盘"
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">紫微斗数命盘</h1>

            {/* 基础信息 */}
            <div className="text-center text-xs text-muted-foreground space-y-0.5">
              <div>{result.chineseDate}</div>
              <div>
                命宫 {result.mingGongGan}{result.mingGongZhi} · 身宫 {result.shenGongGan}{result.shenGongZhi} · {result.wuxingJu}
                {result.isMingShenSame && ' · 命身同宫'}
              </div>
              <div>{result.zodiac} · {result.sign}</div>
            </div>

            {/* 时间导航 */}
            <TimeNav
              currentScope={currentScope}
              onScopeChange={handleScopeChange}
              currentYear={targetYear}
              currentMonth={targetMonth}
              currentDay={targetDay}
              currentHour={targetHour}
              onDateChange={handleDateChange}
            />

            {/* 方形命盘 */}
            <ZiweiChartBoard
              result={result}
              horoscopeData={horoscopeData}
              currentScope={currentScope}
              selectedPalaceIndex={selectedPalaceIndex}
              onSelectPalace={setSelectedPalaceIndex}
            />

            {/* 摘要 */}
            <CopyableSummary summary={summary} />

            {/* 生成报告按钮 */}
            <div className="flex justify-center pt-2">
              <button
                onClick={onGenerateAll}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-[#C96F3D] text-white rounded-lg text-sm font-medium hover:bg-[#B5602F] active:scale-95 transition-all disabled:opacity-50"
              >
                {isGenerating ? '生成中...' : '生成 AI 解读报告'}
              </button>
            </div>
          </div>
        )}

        {step === 'report' && result && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('result')}
              className="text-sm text-[#C96F3D] hover:underline"
            >
              ← 返回命盘
            </button>
            <CopyableSummary summary={summary} />
            <FortuneReport
              report={report}
              isGenerating={isGenerating}
              reportError={reportError}
              onRetry={onGenerateAll}
            />
          </div>
        )}
      </main>
    </div>
  );
}
