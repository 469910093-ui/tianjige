'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableSummaryProps {
  summary: string;
  title?: string;
}

export default function CopyableSummary({ summary, title = '信息摘要' }: CopyableSummaryProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-card rounded-xl p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <div className="bg-background rounded-lg p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono">
        {summary}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        下次测算可直接粘贴此文本，无需重新输入
      </p>
    </div>
  );
}
