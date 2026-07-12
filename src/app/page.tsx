'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/90 backdrop-blur-[8px] data-[scrolled]:border-border">
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
            开始测算
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

          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase text-accent-foreground mb-4">
            天机食鉴 · Social Dining
          </p>
          <h1 className="text-[42px] md:text-[56px] font-serif font-normal leading-[1.08] tracking-[-0.02em] text-foreground">
            今天吃什么
          </h1>
          <p className="mt-5 text-[17px] leading-[1.6] text-muted-foreground max-w-[28em] mx-auto">
            把生辰摆上桌，把合盘当成开场白。七派同算给出白话宜忌，再配附近店与破冰游戏——让「吃什么」变成今晚的社交仪式。
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <span className="inline-flex px-3 py-1 rounded-full bg-accent-foreground text-primary text-[11px] font-semibold tracking-[0.12em] uppercase">
              多人合盘
            </span>
            <span className="text-[12px] font-semibold tracking-[0.12em] uppercase text-accent-foreground">
              Party · Table
            </span>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/unified"
              className="min-h-[52px] px-8 rounded-sm bg-primary text-primary-foreground text-[12px] font-semibold tracking-[0.12em] uppercase inline-flex items-center justify-center hover:bg-black transition-colors"
            >
              起一卦 · 定今晚
            </Link>
            <a
              href="#ritual"
              className="min-h-[52px] px-8 rounded-sm border border-primary text-primary text-[12px] font-semibold tracking-[0.12em] uppercase inline-flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              聚会怎么玩
            </a>
          </div>
        </div>

        <div className="max-w-[640px] mx-auto px-6 py-10 text-center">
          <div className="mx-auto mb-5 h-px w-12 bg-accent-foreground/70" />
          <blockquote className="font-serif text-[20px] md:text-[22px] font-normal leading-[1.45] tracking-[-0.01em] text-foreground max-w-[18em] mx-auto">
            「席未定，先问天机；人已齐，再定今晚。」
          </blockquote>
          <p className="mt-3 text-[12px] tracking-[0.12em] uppercase text-muted-foreground">天机食鉴 · 合席签</p>
          <div className="mx-auto mt-5 h-px w-12 bg-accent-foreground/70" />
        </div>

        <div className="max-w-[640px] mx-auto px-6 grid grid-cols-2 gap-3 pb-2">
          {[
            { title: '金线合盘', desc: '八字五行对坐，宜忌一句说清' },
            { title: '席间破冰', desc: '饭桌 / 酒桌游戏，把沉默变话题' },
            { title: '今日食签', desc: '适合吃 / 暂缓吃，像拆开轻盈签文' },
            { title: '附近落座', desc: '真实商家优先；无密钥诚实标虚拟' },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-md border border-border bg-card px-4 py-5 text-center"
            >
              <strong className="block font-serif font-normal text-[17px] text-foreground mb-1.5">{item.title}</strong>
              <span className="text-[13px] leading-[1.45] text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>

        <div id="ritual" className="max-w-[640px] mx-auto px-6 py-12">
          <div className="rounded-md border border-border bg-card px-6 py-8 text-center">
            <p className="text-[12px] font-semibold tracking-[0.12em] uppercase text-accent-foreground">社交饭局仪式</p>
            <h2 className="mt-3 font-serif font-normal text-[28px] tracking-[-0.015em] text-foreground">聚齐 · 测算 · 分享</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">三人即可开局——合盘是破冰，推荐是续航，游戏是高潮</p>
            <ol className="mt-6 space-y-3 text-left">
              {[
                { k: 'Gather · 聚齐', v: '把同伴生辰与 MBTI 加进来，主测人像「主位」一样先落座' },
                { k: 'Cast · 起卦', v: '七派同算 → 群体今日饮食宜忌 + 各人白话签' },
                { k: 'Share · 落座', v: '附近商家候选 + 桌面破冰游戏，把天机落到真实饭局' },
              ].map((step) => (
                <li key={step.k} className="border-l-2 border-accent-foreground bg-background px-3.5 py-3">
                  <span className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-accent-foreground mb-1">
                    {step.k}
                  </span>
                  <span className="text-[14px] text-foreground">{step.v}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 pt-4 border-t border-border text-[13px] text-muted-foreground">
              今晚建议人数 <span className="text-accent-foreground font-semibold tracking-[0.08em]">3–8</span>
              {' · '}先合盘再点菜 · 酒桌需成年确认
            </p>
            <Link
              href="/unified"
              className="mt-8 inline-flex min-h-[52px] px-8 rounded-sm bg-primary text-primary-foreground text-[12px] font-semibold tracking-[0.12em] uppercase items-center justify-center hover:bg-black transition-colors"
            >
              填写生辰 · 开席
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-center py-14 text-[12px] font-serif tracking-[0.08em] text-muted-foreground border-t border-border">
        ☆ 仅供娱乐参考 · 不构成任何决策建议 ☆
      </footer>
    </div>
  );
}
