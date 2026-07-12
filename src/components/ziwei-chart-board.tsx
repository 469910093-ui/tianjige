'use client';

import { ZiweiResult, ZiweiPalaceResult, ZiweiHoroscopeResult } from '@/lib/ziwei-engine';
import { useCallback } from 'react';

// 四化颜色
const SIHUA_COLORS: Record<string, string> = {
  '禄': 'bg-green-600 text-white',
  '权': 'bg-yellow-500 text-white',
  '科': 'bg-blue-500 text-white',
  '忌': 'bg-red-600 text-white',
};

// 宫位索引 → 4×4 网格位置 [row, col]
// iztro palaces[0..11] 固定对应地支: 寅卯辰巳午未申酉戌亥子丑
// 传统命盘布局: 巳午未申/辰_中心_酉/卯_中心_戌/寅丑子亥
const PALACE_INDEX_TO_GRID: Record<number, [number, number]> = {
  3: [0, 0],   // 巳
  4: [0, 1],   // 午
  5: [0, 2],   // 未
  6: [0, 3],   // 申
  2: [1, 0],   // 辰
  7: [1, 3],   // 酉
  1: [2, 0],   // 卯
  8: [2, 3],   // 戌
  0: [3, 0],   // 寅
  11: [3, 1],  // 丑
  10: [3, 2],  // 子
  9: [3, 3],   // 亥
};

// 三方四正
function getSanFang(palaceIndex: number): number[] {
  const duigong = (palaceIndex + 6) % 12;
  const sanhe1 = (palaceIndex + 4) % 12;
  const sanhe2 = (palaceIndex + 8) % 12;
  return [palaceIndex, duigong, sanhe1, sanhe2];
}

/* ===== PalaceCell ===== */
// 参考图排列顺序（从上到下）：
// 1. 星曜区（竖排：星名+庙旺+四化，两列排布）
// 2. 大限年龄范围
// 3. 流年神煞（jiangqian12/suiqian12）
// 4. 宫名
// 5. 长生十二神
// 6. 天干地支（最底部）
function PalaceCell({
  palace,
  palaceIndex,
  isSelected,
  isHighlighted,
  onClick,
}: {
  palace: ZiweiPalaceResult;
  palaceIndex: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  // 合并所有星曜，保持参考图顺序：主星 → 杂曜/形容词星
  const allStars: { name: string; brightness: string; siHua?: string; type: string }[] = [
    ...palace.majorStars,
    ...palace.minorStars,
  ];

  // 四化集合
  const sihuaSet = new Set<string>();
  allStars.forEach(s => { if (s.siHua) sihuaSet.add(s.name); });

  return (
    <div
      className={`relative border border-border/20 p-1 sm:p-1.5 cursor-pointer transition-colors min-h-[100px] sm:min-h-[130px] flex flex-col
        ${isSelected ? 'bg-[#C96F3D]/10 ring-1 ring-[#C96F3D]/40' : ''}
        ${isHighlighted && !isSelected ? 'bg-[#C96F3D]/5' : ''}
        hover:bg-[#C96F3D]/5
      `}
      onClick={onClick}
    >
      {/* 1. 星曜区 — 竖排两列：星名列 + 庙旺列 */}
      <div className="flex-1 flex flex-col">
        {allStars.map((star, i) => (
          <div key={i} className="flex items-baseline leading-tight">
            <span className={`text-[9px] sm:text-[10px] ${
              star.type === 'major' ? 'font-bold text-foreground' :
              star.type === 'evil' ? 'text-red-600' :
              star.type === 'lucky' ? 'text-green-700' :
              'text-muted-foreground/80'
            }`}>
              {star.name}
            </span>
            {star.brightness && (
              <span className={`text-[6px] sm:text-[7px] ml-0.5 ${
                star.brightness === '庙' ? 'text-red-600' :
                star.brightness === '旺' ? 'text-orange-500' :
                star.brightness === '得' ? 'text-green-600' :
                star.brightness === '利' ? 'text-blue-500' :
                star.brightness === '平' ? 'text-muted-foreground' :
                star.brightness === '不' ? 'text-muted-foreground/50' :
                star.brightness === '陷' ? 'text-muted-foreground/40' :
                'text-muted-foreground/50'
              }`}>
                {star.brightness}
              </span>
            )}
            {star.siHua && (
              <span className={`text-[5px] sm:text-[6px] px-0.5 rounded-sm ml-0.5 ${SIHUA_COLORS[star.siHua]}`}>
                {star.siHua}
              </span>
            )}
          </div>
        ))}

      </div>

      {/* 2. 大限年龄范围 */}
      {palace.decadalRange && (
        <div className="text-[7px] sm:text-[8px] text-[#C96F3D]/70 text-center leading-tight mt-0.5">
          {palace.decadalRange}
        </div>
      )}

      {/* 3. 流年神煞 + 大限范围 */}
      {(palace.jiangqian12 || palace.suiqian12) && (
        <div className="text-[6px] sm:text-[7px] text-muted-foreground/60 text-center leading-tight">
          {palace.jiangqian12 && <span className="mr-1">{palace.jiangqian12}</span>}
          {palace.suiqian12 && <span>{palace.suiqian12}</span>}
        </div>
      )}

      {/* 4. 宫名 */}
      <div className="text-[8px] sm:text-[10px] text-[#C96F3D] font-bold text-center leading-tight mt-0.5 border-t border-border/10 pt-0.5">
        {palace.name}
        {palace.isBodyPalace && <span className="text-[6px] text-purple-600 ml-0.5">身</span>}
      </div>

      {/* 5. 长生十二神 */}
      {palace.changsheng12 && (
        <div className="text-[6px] sm:text-[7px] text-muted-foreground/50 text-center leading-tight">
          {palace.changsheng12}
        </div>
      )}

      {/* 6. 天干地支（最底部） */}
      <div className="text-[7px] sm:text-[8px] text-muted-foreground/40 text-center font-mono leading-tight">
        {palace.heavenlyStem}{palace.earthlyBranch}
      </div>
    </div>
  );
}

/* ===== 主组件 ===== */
interface ZiweiChartBoardProps {
  result: ZiweiResult;
  horoscopeData?: ZiweiHoroscopeResult | null;
  currentScope?: string;
  selectedPalaceIndex?: number | null;
  onSelectPalace?: (index: number | null) => void;
}

export default function ZiweiChartBoard({
  result,
  horoscopeData,
  currentScope = 'origin',
  selectedPalaceIndex = null,
  onSelectPalace,
}: ZiweiChartBoardProps) {
  const highlightedPalaces = selectedPalaceIndex !== null
    ? getSanFang(selectedPalaceIndex)
    : [];

  const handlePalaceClick = useCallback((index: number) => {
    onSelectPalace?.(selectedPalaceIndex === index ? null : index);
  }, [selectedPalaceIndex, onSelectPalace]);

  // 构建 4×4 网格
  const grid: (ZiweiPalaceResult | null)[][] = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => null)
  );

  result.palaces.forEach((palace, i) => {
    const pos = PALACE_INDEX_TO_GRID[i];
    if (pos) grid[pos[0]][pos[1]] = palace;
  });

  // 中心区域信息
  const centerInfo = (
    <div className="col-span-2 row-span-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-2 sm:p-3 border border-border/20 bg-[#FFF9F1]">
      {/* 阴阳 + 性别 + 五行局 */}
      <div className="text-[10px] sm:text-xs text-foreground font-bold text-center">
        {result.gender === '男' ? '阳男' : '阴女'} {result.wuxingJu}
      </div>

      {/* 农历日期 */}
      <div className="text-[7px] sm:text-[9px] text-muted-foreground text-center leading-snug">
        {result.lunarDate}
      </div>

      {/* 四柱 */}
      {result.chineseDate && (
        <div className="text-[7px] sm:text-[9px] text-muted-foreground/70 text-center font-mono">
          {result.chineseDate}
        </div>
      )}

      {/* 命主身主 */}
      <div className="text-[7px] sm:text-[9px] text-muted-foreground text-center">
        命主 {result.soul} · 身主 {result.body}
      </div>

      {/* 命宫位置 */}
      <div className="text-[7px] sm:text-[9px] text-muted-foreground/60 text-center">
        命宫 {result.mingGongGan}{result.mingGongZhi}
        {result.isMingShenSame && ' · 命身同宫'}
      </div>

      {/* 当前运限 */}
      {horoscopeData && (
        <div className="text-[7px] sm:text-[9px] text-[#C96F3D] text-center">
          {currentScope === 'decadal' && `大限 ${horoscopeData.decadal.heavenlyStem}${horoscopeData.decadal.earthlyBranch}`}
          {currentScope === 'yearly' && `流年 ${horoscopeData.yearly.heavenlyStem}${horoscopeData.yearly.earthlyBranch}`}
          {currentScope === 'monthly' && `流月 ${horoscopeData.monthly.heavenlyStem}${horoscopeData.monthly.earthlyBranch}`}
          {currentScope === 'daily' && `流日 ${horoscopeData.daily.heavenlyStem}${horoscopeData.daily.earthlyBranch}`}
          {currentScope === 'hourly' && `流时 ${horoscopeData.hourly.heavenlyStem}${horoscopeData.hourly.earthlyBranch}`}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-[560px] mx-auto">
      {/* 命盘网格 */}
      <div className="grid grid-cols-4 gap-0 border border-border/40 bg-background rounded-lg overflow-hidden">
        {grid.map((row, ri) =>
          row.map((palace, ci) => {
            // 中心 2×2 区域
            if (ri >= 1 && ri <= 2 && ci >= 1 && ci <= 2) {
              if (ri === 1 && ci === 1) {
                return (
                  <div key={`${ri}-${ci}`} className="col-span-2 row-span-2">
                    {centerInfo}
                  </div>
                );
              }
              return null;
            }

            if (!palace) {
              return <div key={`${ri}-${ci}`} className="min-h-[100px] sm:min-h-[130px] border border-border/20" />;
            }

            const palaceIndex = result.palaces.indexOf(palace);
            return (
              <PalaceCell
                key={`${ri}-${ci}`}
                palace={palace}
                palaceIndex={palaceIndex}
                isSelected={selectedPalaceIndex === palaceIndex}
                isHighlighted={highlightedPalaces.includes(palaceIndex)}
                onClick={() => handlePalaceClick(palaceIndex)}
              />
            );
          })
        )}
      </div>

      {/* 选中宫位详情 */}
      {selectedPalaceIndex !== null && result.palaces[selectedPalaceIndex] && (
        <PalaceDetail
          palace={result.palaces[selectedPalaceIndex]}
          horoscopeData={horoscopeData}
          currentScope={currentScope}
        />
      )}
    </div>
  );
}

/* ===== 宫位详情面板 ===== */
function PalaceDetail({
  palace,
  horoscopeData,
  currentScope,
}: {
  palace: ZiweiPalaceResult;
  horoscopeData?: ZiweiHoroscopeResult | null;
  currentScope: string;
}) {
  const majorStars = palace.majorStars;
  const luckyStars = palace.minorStars.filter(s => s.type === 'lucky');
  const evilStars = palace.minorStars.filter(s => s.type === 'evil');
  const adjStars = palace.minorStars.filter(s => s.type === 'adj');

  return (
    <div className="mt-3 p-3 bg-[#FFF9F1] rounded-lg border border-border/30 text-sm">
      <div className="font-bold text-[#C96F3D] mb-2">
        {palace.name} ({palace.heavenlyStem}{palace.earthlyBranch})
        {palace.isBodyPalace && <span className="text-purple-600 ml-1">身宫</span>}
      </div>

      {/* 主星 */}
      {majorStars.length > 0 && (
        <div className="mb-1.5">
          <span className="text-xs text-muted-foreground mr-1">主星:</span>
          {majorStars.map((s, i) => (
            <span key={i} className="text-sm font-bold mr-2">
              {s.name}
              {s.brightness && <span className="text-xs text-muted-foreground ml-0.5">{s.brightness}</span>}
              {s.siHua && <span className={`text-[10px] px-1 py-0.5 rounded ml-0.5 ${SIHUA_COLORS[s.siHua]}`}>{s.siHua}</span>}
            </span>
          ))}
        </div>
      )}

      {/* 吉星 */}
      {luckyStars.length > 0 && (
        <div className="mb-1">
          <span className="text-xs text-muted-foreground mr-1">吉星:</span>
          {luckyStars.map((s, i) => (
            <span key={i} className="text-xs text-green-700 mr-1.5">
              {s.name}
              {s.siHua && <span className={`text-[9px] px-0.5 rounded ml-0.5 ${SIHUA_COLORS[s.siHua]}`}>{s.siHua}</span>}
            </span>
          ))}
        </div>
      )}

      {/* 煞星 */}
      {evilStars.length > 0 && (
        <div className="mb-1">
          <span className="text-xs text-muted-foreground mr-1">煞星:</span>
          {evilStars.map((s, i) => (
            <span key={i} className="text-xs text-red-600 mr-1.5">
              {s.name}
              {s.siHua && <span className={`text-[9px] px-0.5 rounded ml-0.5 ${SIHUA_COLORS[s.siHua]}`}>{s.siHua}</span>}
            </span>
          ))}
        </div>
      )}

      {/* 杂曜 */}
      {adjStars.length > 0 && (
        <div className="mb-1">
          <span className="text-xs text-muted-foreground mr-1">杂曜:</span>
          {adjStars.map((s, i) => (
            <span key={i} className="text-xs text-muted-foreground/70 mr-1.5">{s.name}</span>
          ))}
        </div>
      )}

      {/* 形容词星 */}
      {palace.adjectiveStars.length > 0 && (
        <div className="mb-1">
          <span className="text-xs text-muted-foreground mr-1">附星:</span>
          {palace.adjectiveStars.map((name, i) => (
            <span key={i} className="text-xs text-muted-foreground/70 mr-1.5">{name}</span>
          ))}
        </div>
      )}

      {/* 长生十二神 */}
      {palace.changsheng12 && (
        <div className="text-xs text-muted-foreground mb-1">
          长生: {palace.changsheng12}
        </div>
      )}

      {/* 博士十二神 */}
      {palace.boshi12 && (
        <div className="text-xs text-muted-foreground mb-1">
          博士: {palace.boshi12}
        </div>
      )}

      {/* 大限 */}
      {palace.decadalRange && (
        <div className="text-xs text-muted-foreground">
          大限: {palace.decadalRange}
        </div>
      )}
    </div>
  );
}
