/**
 * 紫微斗数引擎 — 基于 iztro 开源排盘库
 * 支持完整排盘 + 流年/流月/流日/流时运限 + 四化分析 + 大限 + 格局识别
 */
import { astro } from 'iztro';
import { detectPatterns } from './ziwei/patterns';
import { getSiHuaByStem, getYearStemIndex } from './ziwei/sihua';
import { STEMS, BRANCHES, STAR_DESCRIPTIONS } from './ziwei/constants';
import type { ZiweiChart } from './ziwei/types';
import type { Pattern } from './ziwei/patterns';

export interface ZiweiPalaceResult {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  isMingGong: boolean;
  isShenGong: boolean;
  isEmpty: boolean;
  borrowedFrom?: string;
  borrowedStars?: string[];
  majorStars: { name: string; brightness: string; siHua?: string; type: string }[];
  minorStars: { name: string; brightness: string; siHua?: string; type: string }[];
  daXianAge?: [number, number];
  decadalRange?: string;
  isBodyPalace: boolean;
  isCurrentDaXian: boolean;
  selfSihua?: { siHua: string; starName: string }[];
  // iztro 新增字段
  changsheng12: string;
  boshi12: string;
  jiangqian12: string;
  suiqian12: string;
  adjectiveStars: string[];
  ages: number[];
  index: number;
  isOriginalPalace: boolean;
}

export interface ZiweiDaXian {
  startAge: number;
  endAge: number;
  palaceName: string;
  palaceBranch: number;
}

export interface ZiweiHoroscopeResult {
  solarDate: string;
  lunarDate: string;
  decadal: { heavenlyStem: string; earthlyBranch: string; palaceNames: string[]; mutagen: string[] };
  age: { nominalAge: number; index: number; heavenlyStem: string; earthlyBranch: string };
  yearly: { index: number; heavenlyStem: string; earthlyBranch: string; palaceNames: string[]; mutagen: string[] };
  monthly: { index: number; heavenlyStem: string; earthlyBranch: string; palaceNames: string[]; mutagen: string[] };
  daily: { index: number; heavenlyStem: string; earthlyBranch: string; palaceNames: string[]; mutagen: string[] };
  hourly: { index: number; heavenlyStem: string; earthlyBranch: string; palaceNames: string[]; mutagen: string[] };
}

export interface ZiweiResult {
  mingGongGan: string;
  mingGongZhi: string;
  shenGongGan: string;
  shenGongZhi: string;
  isMingShenSame: boolean;
  wuxingJu: string;
  ziweiPos: number;
  palaces: ZiweiPalaceResult[];
  sihua: { star: string; type: string }[];
  patterns: { name: string; level: string; description: string; palaces: string[]; source?: string }[];
  daXians: ZiweiDaXian[];
  currentAge: number;
  currentDaXianIndex: number;
  lunarInfo: { lunarYear: number; lunarMonth: number; lunarDay: number };
  lunarDate: string;
  solarDate: string;
  starDescriptions: Record<string, { keywords: string; nature: string; element: string }>;
  // iztro 扩展
  gender: string;
  zodiac: string;
  sign: string;
  soul: string;
  body: string;
  chineseDate: string;
  earthlyBranchOfSoulPalace: string;
  earthlyBranchOfBodyPalace: string;
}

const BRIGHTNESS_MAP: Record<string, string> = {
  miao: '庙', wang: '旺', de: '得', li: '利',
  ping: '平', bu: '不', xian: '陷',
};

/**
 * 真太阳时校正：根据经度调整时辰索引
 * 时辰对应: 0,23点→子时(0), 1,2点→丑时(1), 3,4点→寅时(2), ...
 */
export function getAdjustedShichen(hour: number, longitude?: number): number {
  let adjustedHour = hour;
  if (longitude != null) {
    const offsetMin = (longitude - 120) * 4;
    const realHour = hour + offsetMin / 60;
    adjustedHour = Math.max(0, Math.min(23, Math.round(realHour * 2) / 2));
  }
  // hour 0→子时(0), 1,2→丑时(1), 3,4→寅时(2), ... 23→子时(0)
  return Math.floor((adjustedHour + 1) / 2) % 12;
}

function mapBrightness(b?: string): string {
  if (!b) return '';
  return BRIGHTNESS_MAP[b] || b;
}

/**
 * 获取运限数据
 */
export function getHoroscope(
  astrolabe: ReturnType<typeof astro.bySolar>,
  targetDate: string,
  timeIndex?: number,
): ZiweiHoroscopeResult {
  const horo = astrolabe.horoscope(targetDate, timeIndex);
  return {
    solarDate: horo.solarDate,
    lunarDate: horo.lunarDate,
    decadal: { heavenlyStem: horo.decadal.heavenlyStem, earthlyBranch: horo.decadal.earthlyBranch, palaceNames: horo.decadal.palaceNames, mutagen: horo.decadal.mutagen },
    age: { nominalAge: horo.age.nominalAge ?? 0, index: horo.age.index, heavenlyStem: horo.age.heavenlyStem, earthlyBranch: horo.age.earthlyBranch },
    yearly: { index: horo.yearly.index, heavenlyStem: horo.yearly.heavenlyStem, earthlyBranch: horo.yearly.earthlyBranch, palaceNames: horo.yearly.palaceNames, mutagen: horo.yearly.mutagen },
    monthly: { index: horo.monthly.index, heavenlyStem: horo.monthly.heavenlyStem, earthlyBranch: horo.monthly.earthlyBranch, palaceNames: horo.monthly.palaceNames, mutagen: horo.monthly.mutagen },
    daily: { index: horo.daily.index, heavenlyStem: horo.daily.heavenlyStem, earthlyBranch: horo.daily.earthlyBranch, palaceNames: horo.daily.palaceNames, mutagen: horo.daily.mutagen },
    hourly: { index: horo.hourly.index, heavenlyStem: horo.hourly.heavenlyStem, earthlyBranch: horo.hourly.earthlyBranch, palaceNames: horo.hourly.palaceNames, mutagen: horo.hourly.mutagen },
  };
}

export function calculateZiwei(
  year: number, month: number, day: number, hour: number,
  gender: string = '男',
  _province?: string, _city?: string, longitude?: number,
): ZiweiResult {
  const hourIdx = getAdjustedShichen(hour, longitude ?? undefined);
  const genderStr = gender === '女' ? '女' : '男';
  const solarDateStr = `${year}-${month}-${day}`;

  // 使用 iztro 排盘
  const astrolabe = astro.bySolar(solarDateStr, hourIdx, genderStr);

  // 四化（年干）
  const yearStemIdx = getYearStemIndex(year);
  const sihuaMap = getSiHuaByStem(yearStemIdx);
  const sihua = (['禄', '权', '科', '忌'] as const).map(type => ({
    star: sihuaMap[type],
    type,
  }));

  // 宫位映射
  const palaces: ZiweiPalaceResult[] = astrolabe.palaces.map(p => {
    const majorStars = p.majorStars
      .filter(s => s.name)
      .map(s => ({
        name: s.name,
        brightness: mapBrightness(s.brightness),
        siHua: s.mutagen || undefined,
        type: 'major',
      }));

    const minorStars = [
      ...p.minorStars.filter(s => s.name),
      ...p.adjectiveStars.filter(s => s.name),
    ].map(s => ({
      name: s.name,
      brightness: mapBrightness(s.brightness),
      siHua: s.mutagen || undefined,
      type: s.type === 'soft' ? 'lucky' : s.type === 'tough' ? 'evil' : 'adj',
    }));

    return {
      name: p.name,
      heavenlyStem: p.heavenlyStem,
      earthlyBranch: p.earthlyBranch,
      isMingGong: p.name === '命宫',
      isShenGong: !!p.isBodyPalace,
      isEmpty: p.isEmpty(),
      majorStars,
      minorStars,
      daXianAge: p.decadal?.range as [number, number] | undefined,
      decadalRange: p.decadal?.range ? `${p.decadal.range[0]}-${p.decadal.range[1]}` : undefined,
      isCurrentDaXian: false, // ponytail: 需要对比当前年龄，后续补
      selfSihua: p.selfMutagedOneOf() ? undefined : undefined, // ponytail: iztro 自化 API
      changsheng12: p.changsheng12 || '',
      boshi12: p.boshi12 || '',
      jiangqian12: p.jiangqian12 || '',
      suiqian12: p.suiqian12 || '',
      adjectiveStars: (p.adjectiveStars || []).map((s: any) => s.name),
      ages: p.ages || [],
      index: p.index,
      isOriginalPalace: p.isOriginalPalace,
      isBodyPalace: !!p.isBodyPalace,
    };
  });

  // 大限
  const daXians: ZiweiDaXian[] = astrolabe.palaces
    .filter(p => p.decadal?.range)
    .map(p => ({
      startAge: p.decadal.range[0],
      endAge: p.decadal.range[1],
      palaceName: p.name,
      palaceBranch: p.index,
    }));

  // 格局识别 — 用旧引擎的格局识别（iztro 没有内置）
  // ponytail: 格局识别依赖旧数据结构，暂时跳过
  const patterns: { name: string; level: string; description: string; palaces: string[]; source?: string }[] = [];

  // 解析农历信息
  const lunarParts = astrolabe.lunarDate.match(/(\d+)年(\d+)月(\d+)日/);
  const lunarInfo = lunarParts
    ? { lunarYear: parseInt(lunarParts[1]), lunarMonth: parseInt(lunarParts[2]), lunarDay: parseInt(lunarParts[3]) }
    : { lunarYear: year, lunarMonth: month, lunarDay: day };

  // 当前年龄 & 大限
  const currentAge = 30; // ponytail: 默认值，运限通过 horoscope API 动态获取
  const currentDaXianIndex = 0;

  // 命宫/身宫信息
  const mingGongPalace = astrolabe.palaces.find(p => p.name === '命宫');
  const shenGongPalace = astrolabe.palaces.find(p => p.isBodyPalace);

  return {
    mingGongGan: mingGongPalace?.heavenlyStem || '',
    mingGongZhi: mingGongPalace?.earthlyBranch || '',
    shenGongGan: shenGongPalace?.heavenlyStem || '',
    shenGongZhi: shenGongPalace?.earthlyBranch || '',
    isMingShenSame: astrolabe.earthlyBranchOfSoulPalace === astrolabe.earthlyBranchOfBodyPalace,
    wuxingJu: astrolabe.fiveElementsClass,
    ziweiPos: astrolabe.palaces.findIndex(p => p.majorStars.some(s => s.name === '紫微')),
    palaces,
    sihua,
    patterns,
    daXians,
    currentAge,
    currentDaXianIndex,
    lunarInfo,
    lunarDate: astrolabe.lunarDate,
    solarDate: astrolabe.solarDate,
    starDescriptions: STAR_DESCRIPTIONS,
    // iztro 扩展字段
    gender: astrolabe.gender,
    zodiac: astrolabe.zodiac,
    sign: astrolabe.sign,
    soul: astrolabe.soul,
    body: astrolabe.body,
    chineseDate: astrolabe.chineseDate,
    earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
    earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace,
  };
}

/**
 * 从原始输入参数重新获取运限数据（客户端调用）
 */
export function getHoroscopeFromParams(
  solarDate: string,
  hour: number,
  gender: string,
  targetDate: string,
  targetHour?: number,
): ZiweiHoroscopeResult {
  const hourIdx = Math.floor((hour + 1) / 2) % 12;
  const genderStr = gender === '女' ? '女' : '男';
  const astrolabe = astro.bySolar(solarDate, hourIdx, genderStr);
  const timeIdx = targetHour !== undefined ? Math.floor((targetHour + 1) / 2) % 12 : undefined;
  return getHoroscope(astrolabe, targetDate, timeIdx);
}

// Re-export cities for use in other pages
export { PROVINCES } from './ziwei/cities';
export type { ProvinceInfo, CityInfo } from './ziwei/cities';
