import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '今天吃什么 · 天机食鉴',
    template: '%s | 今天吃什么',
  },
  description:
    '天机食鉴：多人合盘破冰 + 白话饮食宜忌 + 附近落座推荐。把生辰摆上桌，让「今天吃什么」成为今晚的社交仪式。',
  keywords: ['今天吃什么', '多人合盘', '八字', 'MBTI', '破冰游戏', '聚餐推荐', '天机食鉴'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
