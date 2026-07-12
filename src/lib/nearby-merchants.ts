/**
 * 附近真实商家：类型、筛选、人数适配启发式
 * 数据来自服务端 /api/nearby（百度优先；美团/点评为深链跳转）
 */

import type { MerchantActionLink } from './merchant-links';

export interface NearbyMerchant {
  id: string;
  name: string;
  category: string;
  rating: number | null; // 真实评分；无则 null，不造假
  distanceM: number;
  address: string;
  tel?: string;
  detailUrl?: string;
  blameLine: string;
  lat: number;
  lng: number;
  sourceLabel: '百度地图' | '腾讯地图' | '虚拟推荐';
  /** 适合就餐人数下限（启发式，基于品类/店名） */
  minPeople: number;
  /** 适合就餐人数上限 */
  maxPeople: number;
  price?: string;
  commentNum?: number;
  /** 品牌名（百度有则带回） */
  brand?: string;
  /** 营业时间文案 */
  shopHours?: string;
  /** 封面图 */
  image?: string;
  /** 百度热度等补充文案 */
  heatHint?: string;
  /** 城市（用于美团搜店） */
  city?: string;
  /** 百度 uid */
  uid?: string;
  /** 平台跳转：百度详情/导航 + 美团/点评搜店 */
  actions?: MerchantActionLink[];
}

export type NearbySort = 'recommend' | 'distance' | 'rating';

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

/**
 * 综合推荐分（越高越好）：评分 60% + 距离 40%。
 * - 无评分按 3.6 中位偏保守，避免无分店靠前；勾选「仅有评分」后不会进入列表
 * - 距离相对 maxDistanceM 归一化，越近越高
 */
export function recommendScore(
  m: NearbyMerchant,
  maxDistanceM: number,
  opts?: { nullRatingFallback?: number }
): number {
  const fallback = opts?.nullRatingFallback ?? 3.6;
  const rating = m.rating == null ? fallback : m.rating;
  const ratingPart = Math.min(Math.max(rating / 5, 0), 1);
  const cap = Math.max(maxDistanceM, 1);
  const distPart = 1 - Math.min(Math.max(m.distanceM, 0) / cap, 1);
  return ratingPart * 0.6 + distPart * 0.4;
}

/** 按人数选择检索关键词（传给地图 API） */
export function keywordForPartySize(people: number, cuisineHint?: string): string {
  const hint = (cuisineHint || '').trim();
  if (hint) {
    const parts = hint
      .split(/[、,，/\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    if (parts.length) return `${parts.join('$')}$餐厅$美食`;
  }
  if (people <= 2) return '咖啡$小馆$私房菜$甜品';
  if (people <= 4) return '家常菜$餐厅$美食$中餐厅';
  if (people <= 8) return '火锅$聚餐$烧烤$中餐厅';
  return '自助餐$火锅$宴会$大排档';
}

/** 腾讯地图 keyword（不支持 $ 并集时用单关键词） */
export function tencentKeywordForPartySize(people: number, cuisineHint?: string): string {
  const hint = (cuisineHint || '')
    .trim()
    .split(/[、,，/\s]+/)
    .filter(Boolean)[0];
  if (hint) return hint;
  if (people <= 2) return '咖啡馆';
  if (people <= 4) return '美食';
  if (people <= 8) return '火锅';
  return '自助餐';
}

/** 语义检索自然语言（百度 Agent Plan）— 默认按评分优先、限定半径 */
export function partyRawRequest(people: number, radiusM: number, cuisineHint?: string): string {
  const km = Math.max(0.5, Math.round((radiusM || 3000) / 1000) || 3);
  const cuisine = (cuisineHint || '').trim();
  const taste = cuisine ? `，口味偏向${cuisine}` : '';
  return `查找我附近${km}公里内适合${people}人就餐的美食餐厅${taste}，按评分从高到低排序，优先评分高的店`;
}

/** 多路检索关键词，用于凑齐 3km 内可排名的美食 POI */
export function nearbyRatingSearchQueries(people: number, cuisineHint?: string): string[] {
  const hint = (cuisineHint || '')
    .trim()
    .split(/[、,，/\s]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (hint.length) {
    return hint.map((h) => `附近3公里内高分${h}餐厅，按评分从高到低`);
  }
  if (people <= 2) {
    return [
      '附近3公里内高分咖啡馆小馆，按评分从高到低',
      '附近3公里内高分私房菜餐厅，按评分从高到低',
    ];
  }
  if (people <= 4) {
    return [
      '附近3公里内高分美食餐厅，按评分从高到低',
      '附近3公里内高分杭帮菜中餐厅，按评分从高到低',
      '附近3公里内高分火锅店，按评分从高到低',
    ];
  }
  return [
    '附近3公里内高分火锅聚餐，按评分从高到低',
    '附近3公里内高分中餐厅，按评分从高到低',
    '附近3公里内高分自助餐，按评分从高到低',
  ];
}

/**
 * 根据品类/店名估计适合人数区间（地图 API 无「可容纳人数」字段）
 */
export function estimatePeopleRange(name: string, category: string): { min: number; max: number } {
  const text = `${name} ${category}`.toLowerCase();
  if (/宴会|婚宴|包间|包厢|团建|年会/.test(text)) return { min: 8, max: 40 };
  if (/自助/.test(text)) return { min: 2, max: 20 };
  if (/火锅|烧烤|烤肉|大排档|海鲜/.test(text)) return { min: 3, max: 16 };
  if (/咖啡|甜品|奶茶|小吃|面馆|快餐|简餐/.test(text)) return { min: 1, max: 4 };
  if (/私房|小馆|清吧|酒吧/.test(text)) return { min: 1, max: 6 };
  if (/家常|中餐|餐厅|菜馆|饭店/.test(text)) return { min: 2, max: 12 };
  return { min: 2, max: 10 };
}

export function blameLineFor(category: string, people: number): string {
  if (people >= 8) return `今晚 ${people} 人，选能坐大桌的更稳`;
  if (people >= 5) return `按 ${people} 人聚餐场景挑的，别让我一个人背锅点菜`;
  if (/火锅|烧烤/.test(category)) return '人多热闹，适合破冰';
  if (/咖啡|甜品/.test(category)) return '人少也合适，先暖场再决定正餐';
  return `按你附近真实商家推荐，适合约 ${people} 人`;
}

export function filterAndSortMerchants(
  items: NearbyMerchant[],
  opts: {
    minRating: number;
    maxDistanceM: number;
    sort: NearbySort;
    people: number;
    requireRating?: boolean;
  }
): NearbyMerchant[] {
  const requireRating = opts.requireRating ?? opts.minRating > 0;
  const filtered = items.filter((m) => {
    if (m.distanceM > opts.maxDistanceM) return false;
    // 虚拟店仍按人数区间筛；真实百度/腾讯店放宽，避免启发式过严导致「全被滤掉又像没接上」
    if (m.sourceLabel === '虚拟推荐') {
      if (opts.people < m.minPeople || opts.people > m.maxPeople) return false;
    }
    if (requireRating) {
      if (m.rating == null || m.rating < opts.minRating) return false;
    } else if (m.rating != null && m.rating < opts.minRating) {
      return false;
    }
    return true;
  });

  // 有评分门槛时不静默回退到未筛选列表，方便用户下调分数看到更多店
  return [...filtered].sort((a, b) => {
    if (opts.sort === 'recommend') {
      const sa = recommendScore(a, opts.maxDistanceM);
      const sb = recommendScore(b, opts.maxDistanceM);
      if (sb !== sa) return sb - sa;
      if (a.distanceM !== b.distanceM) return a.distanceM - b.distanceM;
      return (b.rating ?? 0) - (a.rating ?? 0);
    }
    if (opts.sort === 'rating') {
      const ar = a.rating ?? -1;
      const br = b.rating ?? -1;
      if (br !== ar) return br - ar;
      return a.distanceM - b.distanceM;
    }
    if (a.distanceM !== b.distanceM) return a.distanceM - b.distanceM;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}
