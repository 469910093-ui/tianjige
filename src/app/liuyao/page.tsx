'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/navbar';
import InputForm, { type DateSelection, type CitySelection, SHICHEN_LABELS, SHICHEN_TO_HOUR } from '@/components/input-form';
import FortuneReport from '@/components/fortune-report';
import { useReport } from '@/components/use-report';
import CopyableSummary from '@/components/copyable-summary';
import { calculateLiuYao, type LiuYaoResult, type YaoDetail, YAO_WEI } from '@/lib/liuyao-engine';

type Step = 'input' | 'result' | 'report';

/** 颜色映射 */
const LIU_QIN_COLORS: Record<string, string> = {
  '官鬼': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  '妻财': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  '子孙': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  '父母': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  '兄弟': 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400',
};

const WANG_SHUAI_COLORS: Record<string, string> = {
  '旺': 'text-red-600 font-bold',
  '相': 'text-orange-500 font-medium',
  '休': 'text-muted-foreground',
  '囚': 'text-blue-500',
  '死': 'text-gray-400',
};

export default function LiuYaoPage() {
  const [step, setStep] = useState<Step>('input');
  const [liuyaoResult, setLiuYaoResult] = useState<LiuYaoResult | null>(null);
  const [summary, setSummary] = useState('');
  const { report, isGenerating, reportError, handleGenerateReport, clearReportError } = useReport();

  const handleSubmit = useCallback((data: { date: DateSelection; gender?: string; city?: CitySelection }) => {
    const { year, month, day, shichenIndex } = data.date;
    const hour = SHICHEN_TO_HOUR[shichenIndex];
    // 自动随机动爻（1-3个动爻）
    const dongCount = 1 + Math.floor(Math.random() * 3);
    const dongYaoIdxs: number[] = [];
    while (dongYaoIdxs.length < dongCount) {
      const idx = Math.floor(Math.random() * 6);
      if (!dongYaoIdxs.includes(idx)) dongYaoIdxs.push(idx);
    }
    const result = calculateLiuYao(year, month, day, hour, dongYaoIdxs);
    setLiuYaoResult(result);
    const shichenName = SHICHEN_LABELS[shichenIndex];
    setSummary(`【六爻占卜测算信息】\n时间：${year}年${month}月${day}日 ${shichenName}\n本卦：${result.benGua}　变卦：${result.bianGua}\n来源：今天吃什么 AI 算命`);
    setStep('result');
  }, []);

  const onGenerateAll = useCallback(async () => {
    if (!liuyaoResult) return;
    await handleGenerateReport(liuyaoResult, 'liuyao');
    setStep('report');
  }, [liuyaoResult, handleGenerateReport]);

  const yaoLine = (yy: number, isDong: boolean): string => {
    if (yy === 1) return isDong ? '━━○' : '━━━━';
    return isDong ? '━　×' : '━　━';
  };

  const renderYaoRow = (yao: YaoDetail, displayIdx: number) => (
    <div className={`flex items-center gap-1.5 md:gap-3 p-2 rounded-lg text-xs md:text-sm ${yao.isDong ? 'bg-primary/5 border border-primary/15' : 'bg-surface-container'}`}>
      {/* 爻位 */}
      <span className="font-medium text-foreground w-6 shrink-0 text-right">{YAO_WEI[yao.position]}</span>
      {/* 阴阳符号 */}
      <span className="text-base shrink-0 font-mono tracking-wider">{yaoLine(yao.yinYang, yao.isDong)}</span>
      {/* 六亲 */}
      <span className={`px-1.5 py-0.5 rounded text-[11px] md:text-xs shrink-0 font-medium ${LIU_QIN_COLORS[yao.liuQin] || 'bg-muted text-muted-foreground'}`}>{yao.liuQin}</span>
      {/* 纳甲干支 */}
      <span className="text-foreground shrink-0 font-medium">{yao.ganZhi}</span>
      {/* 六神 */}
      <span className="text-muted-foreground shrink-0 text-[11px] md:text-xs">{yao.liuShen}</span>
      {/* 旺衰 */}
      <span className={`shrink-0 text-[11px] md:text-xs ${WANG_SHUAI_COLORS[yao.wangShuai.status]}`}>
        {yao.wangShuai.status}
      </span>
      {/* 世应 */}
      <span className="shrink-0 w-4 text-center">
        {yao.isShi && <span className="text-primary font-bold">世</span>}
        {yao.isYing && <span className="text-accent font-bold">应</span>}
      </span>
      {/* 旬空标记 */}
      {yao.isKong && <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground shrink-0">空</span>}
      {/* 回头生克 */}
      {yao.huiTou && (
        <span className={`text-[10px] px-1 py-0.5 rounded shrink-0 ${yao.huiTou === '回头生' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {yao.huiTou}
        </span>
      )}
    </div>
  );

  const renderResult = () => {
    if (!liuyaoResult) return null;
    const r = liuyaoResult;
    return (
      <div className="space-y-4">
        {/* 卦名信息 */}
        <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">卦象</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/10">
              <div className="text-xs text-muted-foreground mb-1">本宫</div>
              <div className="text-base font-bold text-foreground">{r.benGong}</div>
              <div className="text-xs text-muted-foreground">{r.guaType}</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/10">
              <div className="text-xs text-muted-foreground mb-1">本卦</div>
              <div className="text-lg font-bold text-primary">{r.benGua}</div>
            </div>
            {r.bianGua && (
              <div className="bg-accent/5 rounded-lg p-3 text-center border border-accent/10">
                <div className="text-xs text-muted-foreground mb-1">变卦</div>
                <div className="text-lg font-bold text-accent">{r.bianGua}</div>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>月建：<strong className="text-foreground">{r.monthGanZhi}</strong></span>
            <span>日辰：<strong className="text-foreground">{r.dayGanZhi}</strong></span>
            <span>旬空：<strong className="text-primary">{r.xunKong.join('、')}</strong></span>
          </div>
        </div>

        {/* 卦辞 */}
        {r.guaCi && (
          <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
            <h3 className="text-sm font-semibold text-foreground mb-2">卦辞</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{r.guaCi}</p>
          </div>
        )}

        {/* 六爻排盘 */}
        <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">六爻排盘</h3>
          <div className="space-y-1.5">
            {[...r.yaoDetails].reverse().map((yao, idx) => (
              <div key={idx}>
                {renderYaoRow(yao, idx)}
                {/* 动爻爻辞 */}
                {yao.isDong && yao.yaoCi && (
                  <div className="ml-8 md:ml-12 mt-1 text-[11px] md:text-xs text-primary/70 border-l-2 border-primary/20 pl-2">
                    {yao.yaoCi}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 旺衰分析 */}
        <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">旺衰分析</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {r.yaoDetails.map((yao) => (
              <div key={yao.position} className={`rounded-lg p-2 text-xs border ${yao.isDong ? 'border-primary/20 bg-primary/5' : 'border-border bg-surface-container'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{YAO_WEI[yao.position]}爻 {yao.ganZhi}</span>
                  <span className={`text-[11px] ${WANG_SHUAI_COLORS[yao.wangShuai.status]}`}>{yao.wangShuai.status}({yao.wangShuai.score > 0 ? '+' : ''}{yao.wangShuai.score})</span>
                </div>
                <div className="text-muted-foreground space-y-0.5">
                  {yao.wangShuai.monthRel && <div>{yao.wangShuai.monthRel}</div>}
                  {yao.wangShuai.dayRel && <div>{yao.wangShuai.dayRel}</div>}
                  {yao.isKong && <div className="text-primary">旬空</div>}
                  {yao.huiTou && <div className={yao.huiTou === '回头生' ? 'text-green-600' : 'text-red-600'}>{yao.huiTou}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 六神排列 */}
        <div className="bg-card rounded-xl p-4 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
          <h3 className="text-sm font-semibold text-foreground mb-3">六神</h3>
          <div className="flex flex-wrap gap-2">
            {r.liuShenOrder.map((ls, i) => (
              <span key={i} className="px-3 py-1.5 bg-surface-container text-xs rounded-lg text-foreground font-medium">{ls}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">六爻占卜</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">京房易纳甲六爻排盘，含旺衰分析、回头生克、卦辞爻辞</p>
        </div>

        {step === 'input' && (
          <div className="max-w-md mx-auto">
            <InputForm
              showShichen={true}
              showGender={false}
              showCity={false}
              onSubmit={handleSubmit}
              title="六爻占卜"
              submitLabel="开始六爻排盘"
            />
          </div>
        )}

        {(step === 'result' || step === 'report') && liuyaoResult && (
          <div className="space-y-6">
            {summary && <CopyableSummary summary={summary} />}
            <h2 className="text-lg font-semibold text-foreground">六爻排盘结果</h2>
            {renderResult()}
            <FortuneReport
              report={report}
              isGenerating={isGenerating}
              reportError={reportError}
              onRetry={() => liuyaoResult && handleGenerateReport(liuyaoResult, 'liuyao')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
