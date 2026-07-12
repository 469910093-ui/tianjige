'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, User, Sparkles } from 'lucide-react';
import { PROVINCES, type ProvinceInfo, type CityInfo } from '@/lib/ziwei-engine';

export const SHICHEN_LABELS = [
  '子时 (23-1点)', '丑时 (1-3点)', '寅时 (3-5点)', '卯时 (5-7点)',
  '辰时 (7-9点)', '巳时 (9-11点)', '午时 (11-13点)', '未时 (13-15点)',
  '申时 (15-17点)', '酉时 (17-19点)', '戌时 (19-21点)', '亥时 (21-23点)',
];

export const SHICHEN_TO_HOUR = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

export interface DateSelection {
  year: number;
  month: number;
  day: number;
  shichenIndex: number;
}

export interface CitySelection {
  province: string;
  city: string;
  longitude: number;
}

export const MBTI_OPTIONS = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;

export interface InputFormProps {
  /** Which fields to show */
  showDate?: boolean;
  showShichen?: boolean;
  showGender?: boolean;
  showCity?: boolean;
  /** 可选 MBTI，非必填、不做强校验 */
  showMbti?: boolean;
  /** Callback when user clicks "开始测算" */
  onSubmit: (data: {
    date: DateSelection;
    gender?: string;
    city?: CitySelection;
    /** 选填；空字符串视为未填 */
    mbti?: string;
  }) => void;
  /** Loading state */
  loading?: boolean;
  /** Title shown at top */
  title: string;
  /** Description text */
  description?: string;
  /** Submit button label */
  submitLabel?: string;
}

// Wheel column component
function WheelColumn({ items, selectedIndex, onChange, itemHeight = 44 }: {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  itemHeight?: number;
}) {
  const columnRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimer = useRef<number>(0);

  useEffect(() => {
    if (columnRef.current && !isScrolling.current) {
      const top = selectedIndex * itemHeight;
      columnRef.current.scrollTop = top;
    }
  }, [selectedIndex, itemHeight]);

  const handleScroll = () => {
    if (!columnRef.current) return;
    isScrolling.current = true;
    const scrollTop = columnRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (clamped !== selectedIndex) {
      onChange(clamped);
    }
    // Snap after scroll settles
    clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      if (columnRef.current) {
        columnRef.current.scrollTop = clamped * itemHeight;
      }
      isScrolling.current = false;
    }, 80);
  };

  return (
    <div
      className="relative h-[220px] overflow-hidden rounded-md bg-background"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Top/bottom fade masks — 页面底色 */}
      <div
        className="absolute top-0 left-0 right-0 h-[88px] z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, var(--background), transparent)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[88px] z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--background), transparent)' }}
      />
      {/* Selection indicator */}
      <div className="absolute top-[88px] left-0 right-0 h-[44px] border-y border-[#D4848A]/45 rounded-md z-5 pointer-events-none" />
      {/* Scrollable items */}
      <div
        ref={columnRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {/* Top padding */}
        <div style={{ height: 88 }} />
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-center snap-center transition-all duration-150 cursor-pointer select-none ${
              i === selectedIndex
                ? 'text-[#D4848A] font-[480] text-base'
                : 'text-[#D4848A]/45 text-sm'
            }`}
            style={{ height: itemHeight }}
            onClick={() => onChange(i)}
          >
            {item}
          </div>
        ))}
        {/* Bottom padding */}
        <div style={{ height: 88 }} />
      </div>
    </div>
  );
}

export default function InputForm({
  showDate = true,
  showShichen = true,
  showGender = false,
  showCity = false,
  showMbti = false,
  onSubmit,
  loading = false,
  title,
  description,
  submitLabel = '开始测算',
}: InputFormProps) {
  // Date state
  const currentYear = new Date().getFullYear();
  const startYear = 1940;
  const [yearIdx, setYearIdx] = useState(50); // Default 1990 (1940 + 50)
  const [monthIdx, setMonthIdx] = useState(0); // January
  const [dayIdx, setDayIdx] = useState(0); // 1st
  const [shichenIdx, setShichenIdx] = useState(6); // 午时

  // Gender state
  const [gender, setGender] = useState<string>('男');

  // City state
  const [provinceIdx, setProvinceIdx] = useState(0);
  const [cityIdx, setCityIdx] = useState(0);

  // MBTI（选填，允许任意输入 / 快捷点选，不做强校验）
  const [mbti, setMbti] = useState('');

  // Generate year range (1940 to current year - more practical for birth dates)
  const yearCount = currentYear - startYear + 1;
  const years = Array.from({ length: yearCount }, (_, i) => `${startYear + i}`);
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
  const daysInMonth = new Date(startYear + yearIdx, monthIdx + 2, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);

  // Clamp day index when month changes
  useEffect(() => {
    if (dayIdx >= daysInMonth) setDayIdx(daysInMonth - 1);
  }, [daysInMonth, dayIdx]);

  // Get current city info
  const currentProvince: ProvinceInfo = PROVINCES[provinceIdx] || PROVINCES[0];
  const cities: CityInfo[] = currentProvince?.cities || [];
  const currentCity: CityInfo = cities[cityIdx] || cities[0];

  // Clamp city index when province changes
  useEffect(() => {
    setCityIdx(0);
  }, [provinceIdx]);

  const handleSubmit = () => {
    const date: DateSelection = {
      year: startYear + yearIdx,
      month: monthIdx + 1,
      day: dayIdx + 1,
      shichenIndex: shichenIdx,
    };

    // MBTI 选填：仅 trim，不拦截非法值
    const mbtiTrimmed = mbti.trim();

    onSubmit({
      date,
      gender: showGender ? gender : undefined,
      city: showCity && currentCity ? {
        province: currentProvince.name,
        city: currentCity.name,
        longitude: currentCity.longitude,
      } : undefined,
      mbti: showMbti && mbtiTrimmed ? mbtiTrimmed : undefined,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 md:px-4 py-4 md:py-6">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-[480] tracking-[0.015em] text-ivory-text flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {title}
        </h1>
        {description && (
          <p className="text-[14px] text-ash-text mt-3 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Date + Shichen Wheel */}
      {showDate && (
        <div className="bg-card rounded-[12px] p-4 md:p-8 mb-3">
          <div className="flex items-center gap-2 mb-3 text-ivory-text text-[16px] font-[480]">
            <Calendar className="w-4 h-4 text-ash-text" />
            <span>出生日期</span>
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 min-w-0">
              <WheelColumn items={years} selectedIndex={yearIdx} onChange={setYearIdx} />
            </div>
            <div className="w-[72px] shrink-0">
              <WheelColumn items={months} selectedIndex={monthIdx} onChange={setMonthIdx} />
            </div>
            <div className="w-[64px] shrink-0">
              <WheelColumn items={days} selectedIndex={dayIdx} onChange={setDayIdx} />
            </div>
          </div>
        </div>
      )}

      {/* Shichen Wheel */}
      {showShichen && (
        <div className="bg-card rounded-[12px] p-4 md:p-8 mb-3">
          <div className="flex items-center gap-2 mb-3 text-ivory-text text-[16px] font-[480]">
            <span>出生时辰</span>
          </div>
          <WheelColumn items={SHICHEN_LABELS} selectedIndex={shichenIdx} onChange={setShichenIdx} />
        </div>
      )}

      {/* Gender Selection */}
      {showGender && (
        <div className="bg-card rounded-[12px] p-4 md:p-8 mb-3">
          <div className="flex items-center gap-2 mb-3 text-ivory-text text-[16px] font-[480]">
            <User className="w-4 h-4 text-ash-text" />
            <span>性别</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setGender('男')}
              className={`flex-1 py-3 min-h-[44px] rounded-[32px] text-[16px] font-normal transition-colors ${
                gender === '男'
                  ? 'bg-primary text-pure-white'
                  : 'bg-secondary text-ash-text'
              }`}
            >
              男
            </button>
            <button
              onClick={() => setGender('女')}
              className={`flex-1 py-3 min-h-[44px] rounded-[32px] text-[16px] font-normal transition-colors ${
                gender === '女'
                  ? 'bg-primary text-pure-white'
                  : 'bg-secondary text-ash-text'
              }`}
            >
              女
            </button>
          </div>
        </div>
      )}

      {/* City Selection */}
      {showCity && (
        <div className="bg-card rounded-[12px] p-4 md:p-8 mb-3">
          <div className="flex items-center gap-2 mb-3 text-ivory-text text-[16px] font-[480]">
            <MapPin className="w-4 h-4 text-ash-text" />
            <span>出生地</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <WheelColumn
                items={PROVINCES.map(p => p.name.replace(/(省|市|自治区|壮族|回族|维吾尔)/, ''))}
                selectedIndex={provinceIdx}
                onChange={setProvinceIdx}
              />
            </div>
            <div className="flex-1">
              <WheelColumn
                items={cities.map(c => c.name)}
                selectedIndex={Math.min(cityIdx, cities.length - 1)}
                onChange={setCityIdx}
              />
            </div>
          </div>
        </div>
      )}

      {/* MBTI */}
      {showMbti && (
        <div className="bg-card rounded-[12px] p-4 md:p-8 mb-3">
          <div className="flex items-center gap-2 mb-3 text-ivory-text text-[16px] font-[480]">
            <span>MBTI</span>
          </div>
          <input
            type="text"
            value={mbti}
            onChange={(e) => setMbti(e.target.value)}
            placeholder="选填"
            maxLength={16}
            className="w-full min-h-[48px] rounded-[32px] border border-mist-border/50 bg-transparent px-5 text-ivory-text placeholder:text-ash-text outline-none focus:border-primary"
            autoComplete="off"
            aria-label="MBTI"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {MBTI_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMbti(t)}
                className={`min-h-[36px] px-3 rounded-[40px] text-[12px] transition-colors ${
                  mbti.trim().toUpperCase() === t
                    ? 'bg-primary text-pure-white'
                    : 'bg-secondary text-ash-text'
                }`}
              >
                {t}
              </button>
            ))}
            {mbti && (
              <button
                type="button"
                onClick={() => setMbti('')}
                className="min-h-[36px] px-3 rounded-[40px] text-[12px] text-ash-text underline"
              >
                清空
              </button>
            )}
          </div>
          <p className="mt-3 text-[12px] text-ash-text tracking-[0.01em]">不填也可测算；填写后报告会参考性格语气，不做格式强校验。</p>
        </div>
      )}

      {/* Submit Button — sole Cobalt CTA */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 min-h-[52px] bg-primary text-pure-white text-[16px] font-normal rounded-[32px]
          active:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 mt-4"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            测算中...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {submitLabel}
          </>
        )}
      </button>
    </div>
  );
}
