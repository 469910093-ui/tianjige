'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-[8px] border-b border-border">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 min-h-[44px]">
          <span className="inline-flex h-7 w-7 items-center justify-center text-accent-foreground" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a9 9 0 0 1 0 18 4.5 4.5 0 0 1 0-9 4.5 4.5 0 0 0 0-9z" fill="currentColor" stroke="none" />
              <circle cx="12" cy="7.5" r="1.2" fill="#F7F4EE" stroke="none" />
              <circle cx="12" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="font-serif text-lg tracking-[-0.01em] text-foreground">今天吃什么</span>
        </Link>

        <Link
          href="/unified"
          className="inline-flex items-center px-5 py-2.5 min-h-[40px] text-[12px] rounded-sm bg-primary text-primary-foreground font-semibold tracking-[0.12em] uppercase hover:bg-black transition-colors"
        >
          综合测算
        </Link>
      </div>
    </header>
  );
}
