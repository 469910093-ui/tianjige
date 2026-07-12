/**
 * 附近真实商家：类型、筛选、人数适配启发式
 * 数据来自服务端 /api/nearby（百度优先，腾讯备选）
 */

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
export function keywordForPartySize(people: number): string {
  if (people <= 2) return '咖啡$小馆$私房菜$甜品';
  if (people <= 4) return '家常菜$餐厅$美食$中餐厅';
  if (people <= 8) return '火锅$聚餐$烧烤$中餐厅';
  return '自助餐$火锅$宴会$大排档';
}

/** 腾讯地图 keyword（不支持 $ 并集时用单关键词） */
export function tencentKeywordForPartySize(people: number): string {
  if (people <= 2) return '咖啡馆';
  if (people <= 4) return '美食';
  if (people <= 8) return '火锅';
  return '自助餐';
}

/**
 * 根据品类/店名估计适合人数区间（地图 API 无「可容纳人数」字段）
 * 用于客户端按人数筛选；检索关键词已按人数偏向
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
    /** 无评分的店是否保留；默认保留但评分排序时靠后 */
    requireRating?: boolean;
  }
): NearbyMerchant[] {
  const requireRating = opts.requireRating ?? false;
  const filtered = items.filter((m) => {
    if (m.distanceM > opts.maxDistanceM) return false;
    if (opts.people < m.minPeople || opts.people > m.maxPeople) return false;
    if (requireRating) {
      if (m.rating == null || m.rating < opts.minRating) return false;
    } else if (m.rating != null && m.rating < opts.minRating) {
      return false;
    }
    // 无评分：只要用户把最低分抬到 >0 且勾选「仅看有评分」才剔除；默认无评分也展示
    if (m.rating == null && opts.minRating > 0 && requireRating) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (opts.sort === 'recommend') {
      const sa = recommendScore(a, opts.maxDistanceM);
      const sb = recommendScore(b, opts.maxDistanceM);
      if (sb !== sa) return sb - sa;
      // 同分：先更近，再更高分
      if (a.distanceM !== b.distanceM) return a.distanceM - b.distanceM;
      return (b.rating ?? 0) - (a.rating ?? 0);
    }
    if (opts.sort === 'rating') {
      const ar = a.rating ?? -1;
      const br = b.rating ?? -1;
      if (br !== ar) return br - ar;
      return a.distanceM - b.distanceM;
    }
    // distance
    if (a.distanceM !== b.distanceM) return a.distanceM - b.distanceM;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}
