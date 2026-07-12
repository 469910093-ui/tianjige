'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/90 backdrop-blur-[8px]">
        <div className="max-w-[1200px] mx-auto h-16 flex items-center justify-between px-6 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center text-accent-foreground" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a9 9 0 0 1 0 18 4.5 4.5 0 0 1 0-9 4.5 4.5 0 0 0 0-9z" fill="currentColor" stroke="none" />
                <circle cx="12" cy="7.5" r="1.2" fill="#F7F4EE" stroke="none" />
                <circle cx="12" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="text-[18px] font-serif tracking-[-0.01em] text-foreground">今天吃什么</span>
          </Link>
          <Link
            href="/unified"
            className="min-h-[40px] px-5 rounded-sm bg-primary text-primary-foreground text-[12px] font-semibold tracking-[0.12em] uppercase inline-flex items-center"
          >
            开始
          </Link>
        </div>
      </header>

      <section className="relative flex-1">
        <div className="max-w-[640px] mx-auto px-6 pt-12 pb-10 md:pt-16 text-center">
          <div className="mx-auto mb-7 h-40 w-40 text-accent-foreground motion-safe:animate-[pulse_8s_ease-in-out_infinite]" aria-hidden>
            <svg viewBox="0 0 120 120" className="h-full w-full origin-center">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="60" cy="60" r="12" fill="none" stroke="currentColor" strokeWidth="1.2" />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const x1 = 60 + Math.cos(rad) * 40;
                const y1 = 60 + Math.sin(rad) * 40;
                const x2 = 60 + Math.cos(rad) * 54;
                const y2 = 60 + Math.sin(rad) * 54;
                return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.8" />;
              })}
              <circle cx="60" cy="60" r="3" fill="currentColor" />
            </svg>
          </div>

          <h1 className="text-[42px] md:text-[56px] font-serif font-normal leading-[1.08] tracking-[-0.02em] text-foreground">
            今天吃什么
          </h1>
          <p className="mt-4 text-[16px] text-muted-foreground">合盘 · 定今晚</p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/unified"
              className="min-h-[52px] px-8 rounded-sm bg-primary text-primary-foreground text-[12px] font-semibold tracking-[0.12em] uppercase inline-flex items-center justify-center hover:bg-black transition-colors"
            >
              起卦
            </Link>
          </div>
        </div>

        <div className="max-w-[640px] mx-auto px-6 grid grid-cols-2 gap-3 pb-12">
          {['金线合盘', '席间破冰', '今日食签', '附近落座'].map((title) => (
            <div
              key={title}
              className="rounded-md border border-border bg-card px-4 py-5 text-center"
            >
              <strong className="block font-serif font-normal text-[17px] text-foreground">{title}</strong>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-10 text-[12px] font-serif tracking-[0.08em] text-muted-foreground border-t border-border">
        仅供娱乐
      </footer>
    </div>
  );
}
