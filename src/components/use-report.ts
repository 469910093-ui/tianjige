'use client';

import { useState, useCallback, useRef } from 'react';

export interface FortuneSection {
  overall: { score: number; text: string };
  career: { score: number; text: string };
  love: { score: number; text: string };
  wealth: { score: number; text: string };
  health: { score: number; text: string };
  advice: string;
}

export interface ReportData {
  overview?: FortuneSection | null;
  daily?: FortuneSection | null;
  monthly?: FortuneSection | null;
  yearly?: FortuneSection | null;
  /** 一句重点：今天适合吃什么 / 不适合吃什么 */
  foodSummary?: string | null;
}

const REPORT_TIMEOUT = 180000;

interface UseReportReturn {
  report: ReportData | null;
  isGenerating: boolean;
  reportError: string | null;
  handleGenerateReport: (engineData: unknown, engineType: string, birthInfo?: string) => Promise<void>;
  clearReportError: () => void;
}

export function useReport(): UseReportReturn {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearReportError = useCallback(() => setReportError(null), []);

  const handleGenerateReport = useCallback(async (engineData: unknown, engineType: string, birthInfo?: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setReportError(null);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REPORT_TIMEOUT);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineData, engineType, birthInfo }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorMsg = `服务器错误 (${res.status})`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          try { const text = await res.text(); if (text) errorMsg += `: ${text.substring(0, 100)}`; } catch {}
        }
        throw new Error(errorMsg);
      }

      const responseText = await res.text();

      let data: { success?: boolean; reports?: ReportData; error?: string };
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('服务器返回数据格式异常，请重试');
      }

      if (data.success && data.reports) {
        setReport(data.reports);
        const nullCount = Object.values(data.reports).filter(v => v === null || v === undefined).length;
        if (nullCount === 4) {
          throw new Error('报告生成失败，请重试');
        }
      } else {
        throw new Error(data.error || '报告生成失败，请重试');
      }
    } catch (err) {
      if (controller.signal.aborted) {
        setReportError('报告生成超时（3分钟），请检查网络后重试');
      } else {
        const message = err instanceof Error ? err.message : '报告生成失败';
        setReportError(message);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, []);

  return { report, isGenerating, reportError, handleGenerateReport, clearReportError };
}
