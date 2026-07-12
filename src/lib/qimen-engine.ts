/**
 * 奇门遁甲引擎
 * 使用 3meta 专业奇门遁甲排盘库
 * 支持：时家奇门拆补法、天地人神四盘、九宫、值符值使、格局判断、天干克应、击刑/门迫/入墓
 */
import { QimenChart } from '3meta';

export interface QiMenResult {
  /** 遁类型 (阳遁/阴遁) */
  dunType: string;
  /** 局数 */
  juNumber: number;
  /** 元 (上元/中元/下元) */
  yuan: string;
  /** 当前节气 */
  solarTerm: string;
  /** 月份五行 */
  monthElement: string;
  /** 值符 */
  zhiFu: {
    star: string;
    position: number;
    heavenlyStem: string;
  };
  /** 值使 */
  zhiShi: {
    gate: string;
    position: number;
  };
  /** 驿马 */
  postHorse: {
    branch: string;
    position: number;
  };
  /** 四柱 */
  fourPillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
  };
  /** 农历日期 */
  lunarDate: string;
  /** 旬首 */
  xunShou: string;
  /** 空亡 */
  voidness: string[];
  /** 九宫详细信息 */
  gongDetails: {
    gong: number;
    trigram: string;
    gate: string;
    star: string;
    deity: string;
    heavenlyStem: string;
    earthlyStem: string;
    earthBranch: string;
    isZhiFu: boolean;
    isZhiShi: boolean;
    fiveElements: string;
    innerOuter: string;
    gatePressure: string;
    starStatus: string;
    gateStatus: string;
    heavenlyStemGrowth: string;
    earthlyStemGrowth: string;
    isPostHorse: boolean;
    voidnessInPalace: string[];
    auspiciousPatterns: { name: string; description: string }[];
    inauspiciousPatterns: { name: string; description: string }[];
    tenStemResponse: {
      heavenlyToEarthly: { relation: string; description: string; isAuspicious: boolean };
      timeToDay: { relation: string; description: string; isAuspicious: boolean };
      heavenlyToDay: { relation: string; description: string; isAuspicious: boolean };
    };
  }[];
  /** 全局吉格 */
  globalAuspiciousPatterns: { name: string; description: string; position: number }[];
  /** 全局凶格 */
  globalInauspiciousPatterns: { name: string; description: string; position: number }[];
  /** 宜 (来自黄历) */
  yi: string[];
  /** 忌 (来自黄历) */
  ji: string[];
}

export function calculateQiMen(year: number, month: number, day: number, hour: number): QiMenResult {
  // 补零格式化日期字符串
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:00:00`;

  const chart = QimenChart.byDatetime(dateStr);

  // 四柱
  const fourPillars = {
    year: { stem: chart.fourPillars.year.stem, branch: chart.fourPillars.year.branch },
    month: { stem: chart.fourPillars.month.stem, branch: chart.fourPillars.month.branch },
    day: { stem: chart.fourPillars.day.stem, branch: chart.fourPillars.day.branch },
    hour: { stem: chart.fourPillars.hour.stem, branch: chart.fourPillars.hour.branch },
  };

  // 九宫详细信息
  // ponytail: iching-shifa types are untyped, use any to avoid nested access errors
  const gongDetails = chart.palaces.map((p: Record<string, any>) => ({
    gong: p.position,
    trigram: p.trigram || '',
    gate: p.gate || '',
    star: p.star || '',
    deity: p.deity || '',
    heavenlyStem: p.heavenlyStem || '',
    earthlyStem: p.earthlyStem || '',
    earthBranch: p.earthBranch || '',
    isZhiFu: p.isZhiFu || false,
    isZhiShi: p.isZhiShi || false,
    fiveElements: p.fiveElements || '',
    innerOuter: p.innerOuter || '',
    gatePressure: p.gatePressure || '',
    starStatus: p.status?.star || '',
    gateStatus: p.status?.gate || '',
    heavenlyStemGrowth: p.growthInfo?.heavenlyStem || '',
    earthlyStemGrowth: p.growthInfo?.earthlyStem || '',
    isPostHorse: p.isPostHorse || false,
    voidnessInPalace: p.voidness?.voidInPalace || [],
    auspiciousPatterns: (p.auspiciousPatterns || []).map((pat: Record<string, unknown>) => ({
      name: pat.name || pat.type || '',
      description: pat.description || '',
    })),
    inauspiciousPatterns: (p.inAuspiciousPatterns || p.inauspiciousPatterns || []).map((pat: Record<string, unknown>) => ({
      name: pat.name || pat.type || '',
      description: pat.description || '',
    })),
    tenStemResponse: {
      heavenlyToEarthly: {
        relation: p.tenStemResponse?.heavenlyToEarthly?.relation || '',
        description: p.tenStemResponse?.heavenlyToEarthly?.description || '',
        isAuspicious: p.tenStemResponse?.heavenlyToEarthly?.isAuspicious || false,
      },
      timeToDay: {
        relation: p.tenStemResponse?.timeToDay?.relation || '',
        description: p.tenStemResponse?.timeToDay?.description || '',
        isAuspicious: p.tenStemResponse?.timeToDay?.isAuspicious || false,
      },
      heavenlyToDay: {
        relation: p.tenStemResponse?.heavenlyToDay?.relation || '',
        description: p.tenStemResponse?.heavenlyToDay?.description || '',
        isAuspicious: p.tenStemResponse?.heavenlyToDay?.isAuspicious || false,
      },
    },
  }));

  // 全局吉格凶格
  const specialPatterns = chart.specialPatterns || {};
  const globalAuspiciousPatterns = (specialPatterns.auspiciousPatterns || []).map((pat: Record<string, unknown>) => ({
    name: pat.name || pat.type || '',
    description: pat.description || '',
    position: pat.position || 0,
  }));
  const globalInauspiciousPatterns = (specialPatterns.inauspiciousPatterns || []).map((pat: Record<string, unknown>) => ({
    name: pat.name || pat.type || '',
    description: pat.description || '',
    position: pat.position || 0,
  }));

  return {
    dunType: chart.ju?.type || '',
    juNumber: chart.ju?.number || 1,
    yuan: chart.yuan || '',
    solarTerm: chart.timeInfo?.solarTerm || '',
    monthElement: chart.monthElement || '',
    zhiFu: {
      star: chart.zhiFu?.star || '',
      position: chart.zhiFu?.position || 0,
      heavenlyStem: chart.zhiFu?.heavenlyStem || '',
    },
    zhiShi: {
      gate: chart.zhiShi?.gate || '',
      position: chart.zhiShi?.position || 0,
    },
    postHorse: {
      branch: chart.postHorse?.branch || '',
      position: chart.postHorse?.position || 0,
    },
    fourPillars,
    lunarDate: chart.timeInfo?.lunarDate || '',
    xunShou: chart.timeInfo?.xunShou || '',
    voidness: chart.timeInfo?.voidness || [],
    gongDetails,
    globalAuspiciousPatterns,
    globalInauspiciousPatterns,
    yi: [],
    ji: [],
  };
}
