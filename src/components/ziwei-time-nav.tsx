'use client';

import { useState, useCallback, useEffect } from 'react';

type ScopeTab = 'origin' | 'decadal' | 'yearly' | 'monthly' | 'daily' | 'hourly';

const SCOPE_TABS: { key: ScopeTab; label: string; icon: string }[] = [
  { key: 'origin', label: '本命', icon: '☯' },
  { key: 'decadal', label: '大限', icon: '◈' },
  { key: 'yearly', label: '流年', icon: '☀' },
  { key: 'monthly', label: '流月', icon: '☽' },
  { key: 'daily', label: '流日', icon: '◆' },
  { key: 'hourly', label: '流时', icon: '◇' },
];

interface TimeNavProps {
  currentScope: ScopeTab;
  onScopeChange: (scope: ScopeTab) => void;
  currentYear: number;
  currentMonth: number;
  currentDay: number;
  currentHour: number;
  onDateChange: (year: number, month: number, day: number, hour: number) => void;
}

const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SHI_CHEN = DI_ZHI.map((z, i) => `${z}时(${String(i * 2).padStart(2, '0')}-${String(i * 2 + 2 === 24 ? 0 : i * 2 + 2).padStart(2, '0')})`);

export default function TimeNav({
  currentScope,
  onScopeChange,
  currentYear,
  currentMonth,
  currentDay,
  currentHour,
  onDateChange,
}: TimeNavProps) {
  const [showDatePanel, setShowDatePanel] = useState(false);

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const thisDay = now.getDate();

  const handleQuickToday = useCallback(() => {
    const h = now.getHours();
    onDateChange(thisYear, thisMonth, thisDay, h);
  }, [now, onDateChange]);

  return (
    <div className="w-full max-w-[560px] mx-auto">
      {/* Scope tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {SCOPE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => onScopeChange(tab.key)}
            className={`
              flex-shrink-0 px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-medium
              transition-all duration-200 border
              ${currentScope === tab.key
                ? 'bg-[#C96F3D] text-white border-[#C96F3D]'
                : 'bg-card text-muted-foreground border-border/40 hover:bg-[#FFF5EC] hover:text-foreground'
              }
            `}
          >
            <span className="mr-0.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date picker for 流年/流月/流日/流时 */}
      {currentScope !== 'origin' && (
        <div className="mt-2 p-2 bg-card border border-border/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleQuickToday}
              className="text-[10px] px-2 py-1 bg-[#C96F3D]/10 text-[#C96F3D] rounded border border-[#C96F3D]/20 hover:bg-[#C96F3D]/20"
            >
              今天
            </button>
            <span className="text-[10px] text-muted-foreground">
              {currentYear}年{currentMonth}月{currentDay}日 {DI_ZHI[Math.floor(currentHour / 2)]}时
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {currentScope === 'yearly' || currentScope === 'decadal' ? (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-muted-foreground">年份</label>
                <input
                  type="range"
                  min={1940}
                  max={thisYear + 1}
                  value={currentYear}
                  onChange={e => onDateChange(parseInt(e.target.value), currentMonth, currentDay, currentHour)}
                  className="w-full h-1 accent-[#C96F3D]"
                />
                <span className="text-[10px] text-center text-foreground">{currentYear}</span>
              </div>
            ) : null}

            {currentScope === 'monthly' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-muted-foreground">年份</label>
                  <input
                    type="range"
                    min={1940}
                    max={thisYear + 1}
                    value={currentYear}
                    onChange={e => onDateChange(parseInt(e.target.value), currentMonth, currentDay, currentHour)}
                    className="w-full h-1 accent-[#C96F3D]"
                  />
                  <span className="text-[10px] text-center">{currentYear}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-muted-foreground">月份</label>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={currentMonth}
                    onChange={e => onDateChange(currentYear, parseInt(e.target.value), currentDay, currentHour)}
                    className="w-full h-1 accent-[#C96F3D]"
                  />
                  <span className="text-[10px] text-center">{currentMonth}月</span>
                </div>
              </>
            )}

            {currentScope === 'daily' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-muted-foreground">月份</label>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={currentMonth}
                    onChange={e => onDateChange(currentYear, parseInt(e.target.value), currentDay, currentHour)}
                    className="w-full h-1 accent-[#C96F3D]"
                  />
                  <span className="text-[10px] text-center">{currentMonth}月</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-muted-foreground">日期</label>
                  <input
                    type="range"
                    min={1}
                    max={31}
                    value={currentDay}
                    onChange={e => onDateChange(currentYear, currentMonth, parseInt(e.target.value), currentHour)}
                    className="w-full h-1 accent-[#C96F3D]"
                  />
                  <span className="text-[10px] text-center">{currentDay}日</span>
                </div>
              </>
            )}

            {currentScope === 'hourly' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-muted-foreground">日期</label>
                  <input
                    type="range"
                    min={1}
                    max={31}
                    value={currentDay}
                    onChange={e => onDateChange(currentYear, currentMonth, parseInt(e.target.value), currentHour)}
                    className="w-full h-1 accent-[#C96F3D]"
                  />
                  <span className="text-[10px] text-center">{currentDay}日</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-muted-foreground">时辰</label>
                  <input
                    type="range"
                    min={0}
                    max={11}
                    value={Math.floor(currentHour / 2)}
                    onChange={e => onDateChange(currentYear, currentMonth, currentDay, parseInt(e.target.value) * 2)}
                    className="w-full h-1 accent-[#C96F3D]"
                  />
                  <span className="text-[10px] text-center">{DI_ZHI[Math.floor(currentHour / 2)]}时</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { ScopeTab };
