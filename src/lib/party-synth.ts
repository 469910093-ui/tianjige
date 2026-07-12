/**
 * 多人聚餐：综合各位 MBTI + 八字五行，给出群体「今天吃什么」建议
 */

import { calculateBazi, type BaziResult } from './bazi-engine';
import { buildFoodSummary } from './mock-report';

export interface PartyGuestInput {
  id: string;
  name: string;
  gender?: string;
  year: number;
  month: number;
  day: number;
  /** 0-11 时辰索引，默认午时 6 */
  shichenIndex?: number;
  mbti?: string;
}

export interface PartyGuestResult {
  id: string;
  name: string;
  mbti?: string;
  gender?: string;
  bazi: BaziResult;
  strong: string;
  weak: string;
  personalFood: string;
  toneHint: string;
}

export interface PartySynthResult {
  guests: PartyGuestResult[];
  peopleCount: number;
  /** 群体一句重点 */
  groupFoodSummary: string;
  /** 八字求同存异短述 */
  baziConsensus: string;
  /** MBTI 场域建议 */
  mbtiFieldNote: string;
  /** 推荐菜系关键词（给商家检索用） */
  cuisineKeywords: string[];
  /** 忌口关键词 */
  avoidKeywords: string[];
}

const WUXING = ['金', '木', '水', '火', '土'] as const;

function pickStrongWeak(wuxing: Record<string, number>): { strong: string; weak: string } {
  const entries = Object.entries(wuxing).sort((a, b) => b[1] - a[1]);
  return {
    strong: entries[0]?.[0] || '土',
    weak: entries[entries.length - 1]?.[0] || '金',
  };
}

function toneHint(mbti?: string): string {
  if (!mbti) return '节奏随大流即可';
  const t = mbti.toUpperCase();
  if (t.startsWith('E')) return '外向气场足，适合热闹桌';
  if (t.startsWith('I')) return '偏安静，宜留说话空隙';
  return '按当场气氛调整即可';
}

const EAT_BY_WEAK: Record<string, string[]> = {
  木: ['青绿时蔬', '菌菇', '清淡酸香'],
  火: ['苦瓜', '绿叶菜', '清汤'],
  土: ['杂粮', '南瓜', '温热家常'],
  金: ['白肉清汤', '萝卜白菜', '辛香适中'],
  水: ['温热汤羹', '豆制品', '略偏咸鲜'],
};

const AVOID_BY_STRONG: Record<string, string[]> = {
  木: ['过酸', '生冷硬撑'],
  火: ['过烫油炸', '重辣烧烤'],
  土: ['过甜油腻', '冷饮冰品'],
  金: ['过咸熏烤', '燥热辛辣堆叠'],
  水: ['过量冰饮', '过咸腌制'],
};

function shichenToHour(idx: number): number {
  const map = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
  return map[Math.max(0, Math.min(11, idx))] ?? 12;
}

function normalizeMbti(raw?: string): string | undefined {
  if (!raw) return undefined;
  const m = raw.trim().toUpperCase().match(/^[EI][NS][TF][JP]$/);
  return m ? m[0] : raw.trim().toUpperCase() || undefined;
}

/** 综合多位宾客的八字 + MBTI */
export function synthesizeParty(guestsIn: PartyGuestInput[]): PartySynthResult {
  const guests = guestsIn
    .filter((g) => g.year && g.month && g.day)
    .map((g) => {
      const hour = shichenToHour(g.shichenIndex ?? 6);
      let bazi: BaziResult;
      try {
        bazi = calculateBazi(g.year, g.month, g.day, hour);
      } catch {
        bazi = calculateBazi(1990, 6, 15, 12);
      }
      const { strong, weak } = pickStrongWeak(bazi.wuxing);
      const mbti = normalizeMbti(g.mbti);
      return {
        id: g.id,
        name: g.name || '未命名',
        mbti,
        gender: g.gender,
        bazi,
        strong,
        weak,
        personalFood: buildFoodSummary(strong, weak),
        toneHint: toneHint(mbti),
      } satisfies PartyGuestResult;
    });

  if (guests.length === 0) {
    return {
      guests: [],
      peopleCount: 0,
      groupFoodSummary: '先添加至少一位用餐人的生辰，再综合推荐。',
      baziConsensus: '',
      mbtiFieldNote: '',
      cuisineKeywords: ['家常菜'],
      avoidKeywords: ['过油过辣'],
    };
  }

  // 聚合五行：弱项求和优先补，强项过高则群体忌口
  const weakScore: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  const strongScore: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  for (const g of guests) {
    weakScore[g.weak] = (weakScore[g.weak] || 0) + 1;
    strongScore[g.strong] = (strongScore[g.strong] || 0) + 1;
  }
  const topWeak = Object.entries(weakScore).sort((a, b) => b[1] - a[1])[0][0];
  const topStrong = Object.entries(strongScore).sort((a, b) => b[1] - a[1])[0][0];

  const eatBits = [...new Set((EAT_BY_WEAK[topWeak] || []).concat(
    guests.flatMap((g) => EAT_BY_WEAK[g.weak] || []).slice(0, 4)
  ))].slice(0, 4);
  const avoidBits = [...new Set((AVOID_BY_STRONG[topStrong] || []).concat(
    guests.flatMap((g) => AVOID_BY_STRONG[g.strong] || []).slice(0, 3)
  ))].slice(0, 3);

  const names = guests.map((g) => g.name).join('、');
  const groupFoodSummary =
    `今晚 ${guests.length} 人（${names}）综合：适合吃「${eatBits.join('、')}」；不太适合「${avoidBits.join('、')}」。` +
    `群体五行偏补${topWeak}、慎过旺${topStrong}。`;

  const shengxiaoLine = guests.map((g) => `${g.name}属${g.bazi.shengxiao}·日主${g.bazi.riZhuQiangRuo}`).join('；');
  const baziConsensus =
    `${shengxiaoLine}。求同：协作点菜、少硬刚口味；存异：个人忌口见各人卡片，上菜时留清淡与微辣两档更稳。`;

  const mbtis = guests.map((g) => g.mbti).filter(Boolean) as string[];
  const eCount = mbtis.filter((m) => m.startsWith('E')).length;
  const iCount = mbtis.filter((m) => m.startsWith('I')).length;
  const fCount = mbtis.filter((m) => m.includes('F')).length;
  let mbtiFieldNote = mbtis.length
    ? `MBTI 场域：${mbtis.join(' / ')}。`
    : '本局未填 MBTI，按八字综合即可。';
  if (eCount > iCount) mbtiFieldNote += '外向偏多，适合热闹局与破冰游戏。';
  else if (iCount > eCount) mbtiFieldNote += '内向偏多，座位别太挤，话题先轻后深。';
  if (fCount >= Math.ceil(mbtis.length / 2) && mbtis.length) {
    mbtiFieldNote += '感受型不少，点菜先问忌口再下单。';
  }

  return {
    guests,
    peopleCount: guests.length,
    groupFoodSummary,
    baziConsensus,
    mbtiFieldNote,
    cuisineKeywords: eatBits,
    avoidKeywords: avoidBits,
  };
}

export function defaultGuest(partial?: Partial<PartyGuestInput>): PartyGuestInput {
  return {
    id: partial?.id || `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: partial?.name || '',
    gender: partial?.gender || '男',
    year: partial?.year || 1998,
    month: partial?.month || 7,
    day: partial?.day || 12,
    shichenIndex: partial?.shichenIndex ?? 6,
    mbti: partial?.mbti || '',
  };
}

export { WUXING };
