'use client';

import { useState } from 'react';
import { FortuneSection, ReportData } from './use-report';

const TABS = [
  { key: 'overview', label: '概况' },
  { key: 'daily', label: '今日运势' },
  { key: 'monthly', label: '本月运势' },
  { key: 'yearly', label: '今年运势' },
] as const;

type TabKey = typeof TABS[number]['key'];

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = Math.max(0, Math.min(100, score));
  let color = 'bg-emerald-600';
  if (pct < 40) color = 'bg-red-500';
  else if (pct < 60) color = 'bg-amber-500';
  else if (pct < 80) color = 'bg-emerald-500';

  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-[#8B7662] w-10 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[#F0E6D6] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-[#31251B] w-8 text-right">{score}</span>
    </div>
  );
}

function SectionCard({ section }: { section: FortuneSection | null | undefined }) {
  if (!section) {
    return (
      <div className="text-center py-8 text-[#8B7662]">
        该部分生成失败，请重试
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score bars */}
      <div className="bg-[#FFF9F1] rounded-lg p-4">
        <ScoreBar score={section.overall.score} label="总评" />
        <ScoreBar score={section.career.score} label="事业" />
        <ScoreBar score={section.love.score} label="感情" />
        <ScoreBar score={section.wealth.score} label="财运" />
        <ScoreBar score={section.health.score} label="健康" />
      </div>

      {/* Text sections */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-[#C96F3D] mb-1">总论</h4>
          <p className="text-sm text-[#31251B] leading-relaxed whitespace-pre-wrap">{section.overall.text}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#C96F3D] mb-1">事业</h4>
          <p className="text-sm text-[#31251B] leading-relaxed whitespace-pre-wrap">{section.career.text}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#C96F3D] mb-1">感情</h4>
          <p className="text-sm text-[#31251B] leading-relaxed whitespace-pre-wrap">{section.love.text}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#C96F3D] mb-1">财运</h4>
          <p className="text-sm text-[#31251B] leading-relaxed whitespace-pre-wrap">{section.wealth.text}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#C96F3D] mb-1">健康</h4>
          <p className="text-sm text-[#31251B] leading-relaxed whitespace-pre-wrap">{section.health.text}</p>
        </div>
      </div>

      {/* Advice */}
      {section.advice && (
        <div className="bg-[#C96F3D]/10 rounded-lg p-4 border border-[#C96F3D]/20">
          <p className="text-sm text-[#C96F3D] font-medium">
            {section.advice}
          </p>
        </div>
      )}
    </div>
  );
}

interface FortuneReportProps {
  report: ReportData | null;
  isGenerating: boolean;
  reportError: string | null;
  onRetry: () => void;
  engineData?: unknown;
}

export default function FortuneReport({ report, isGenerating, reportError, onRetry }: FortuneReportProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  if (isGenerating) {
    return (
      <div className="bg-[#FFF9F1] rounded-xl p-6 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[#F0E6D6] rounded w-1/2 mx-auto" />
          <div className="h-4 bg-[#F0E6D6] rounded w-2/3 mx-auto" />
          <div className="h-4 bg-[#F0E6D6] rounded w-1/3 mx-auto" />
        </div>
        <p className="text-[#8B7662] text-sm mt-4">师傅正在推演命盘，请稍候...</p>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="bg-red-50 rounded-xl p-6 text-center border border-red-200">
        <p className="text-red-600 text-sm mb-3">{reportError}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#C96F3D] text-white rounded-lg text-sm hover:bg-[#B55E2E] transition-colors"
        >
          重新生成
        </button>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const hasAnyReport = TABS.some(t => report[t.key]);

  if (!hasAnyReport) {
    return (
      <div className="bg-[#FFF9F1] rounded-xl p-6 text-center">
        <p className="text-[#8B7662] text-sm">报告生成失败</p>
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 bg-[#C96F3D] text-white rounded-lg text-sm hover:bg-[#B55E2E] transition-colors"
        >
          重新生成
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF9F1] rounded-xl overflow-hidden">
      {report.foodSummary && (
        <div className="mx-4 mt-4 md:mx-6 md:mt-6 rounded-lg border border-[#C96F3D]/25 bg-[#C96F3D]/10 px-4 py-3">
          <p className="text-xs font-semibold text-[#C96F3D] mb-1">一句重点 · 今天吃什么</p>
          <p className="text-sm text-[#31251B] leading-relaxed font-medium">{report.foodSummary}</p>
        </div>
      )}
      {/* Tab bar */}
      <div className="flex border-b border-[#F0E6D6]">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-[#C96F3D] border-b-2 border-[#C96F3D] bg-white/50'
                : 'text-[#8B7662] hover:text-[#31251B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-6">
        <SectionCard section={report[activeTab]} />
      </div>

      {/* Reward QR code */}
      <div className="border-t border-[#F0E6D6] py-6 flex flex-col items-center gap-2">
        <img
          src="/reward-qrcode.png"
          alt="赞赏码"
          className="w-40 h-40 rounded-lg"
        />
        <p className="text-[#8B7662] text-xs">我这可是冒着泄露天机的风险，您看着办～</p>
      </div>
    </div>
  );
}
