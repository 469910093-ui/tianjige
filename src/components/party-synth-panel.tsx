'use client';

import type { PartySynthResult } from '@/lib/party-synth';

export default function PartySynthPanel({ synth }: { synth: PartySynthResult }) {
  if (!synth.guests.length) return null;

  return (
    <section className="bg-card rounded-xl p-3 md:p-5 border border-primary/25 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-primary">今晚怎么吃</h2>
        <p className="text-sm text-foreground mt-2 leading-relaxed font-medium">{synth.groupFoodSummary}</p>
      </div>

      <ul className="space-y-2">
        {synth.guests.map((g) => (
          <li
            key={g.id}
            className="rounded-lg border border-outline-variant/25 bg-background/60 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                {g.name}
                {g.mbti ? ` · ${g.mbti}` : ''}
              </span>
              <span className="text-xs text-primary">
                属{g.bazi.shengxiao} · {g.strong}旺/{g.weak}弱
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{g.bazi.bazi}</div>
            <div className="text-xs text-foreground/90 mt-1.5">{g.personalFood}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{g.toneHint}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
