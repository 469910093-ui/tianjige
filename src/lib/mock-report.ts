/**
 * 无 LLM / Key 缺失时的降级白话报告
 * 结构对齐 MIGRATION §4.4 与 PRD §3.3：概况 / 今日 / 本月 / 今年
 * 只基于引擎排盘事实做口语化归纳，不伪造 POI、不篡改排盘数字。
 */

export interface FortuneSection {
  overall: { score: number; text: string };
  career: { score: number; text: string };
  love: { score: number; text: string };
  wealth: { score: number; text: string };
  health: { score: number; text: string };
  advice: string;
}

export interface ReportData {
  overview: FortuneSection;
  daily: FortuneSection;
  monthly: FortuneSection;
  yearly: FortuneSection;
  /** 一句重点：今天适合吃什么 / 不适合吃什么 */
  foodSummary?: string;
}

type EngineBundle = {
  bazi?: {
    bazi?: string;
    shengxiao?: string;
    riZhuQiangRuo?: string;
    wuxingQue?: string[];
    wuxing?: Record<string, number>;
  } | null;
  ziwei?: { mingGong?: string; ziwei?: string } | null;
  horoscope?: {
    zodiac?: string;
    todayGanZhi?: string;
    yi?: string[];
    ji?: string[];
  } | null;
  astrology?: { sun?: string; moon?: string; ascendant?: string } | null;
  qimen?: { dunType?: string; juNumber?: number; solarTerm?: string } | null;
  liuyao?: { benGua?: string; bianGua?: string } | null;
  tarot?: { cards?: Array<{ card?: { name?: string }; position?: string; isReversed?: boolean }> } | null;
};

function clampScore(n: number): number {
  return Math.max(35, Math.min(95, Math.round(n)));
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function scoreFrom(seed: number, base: number, spread = 18): number {
  return clampScore(base + (seed % (spread * 2 + 1)) - spread);
}

function pickStrongWeak(wuxing?: Record<string, number>): { strong: string; weak: string } {
  if (!wuxing) return { strong: '土', weak: '金' };
  const entries = Object.entries(wuxing).sort((a, b) => b[1] - a[1]);
  return {
    strong: entries[0]?.[0] || '土',
    weak: entries[entries.length - 1]?.[0] || '金',
  };
}

/** 按五行强弱给一句「今天吃什么」重点（娱乐向，不替代医嘱） */
export function buildFoodSummary(strong: string, weak: string): string {
  const eatByWeak: Record<string, string> = {
    木: '青绿时蔬、菌菇、清淡酸香小菜',
    火: '苦瓜、绿叶菜、清汤慢炖',
    土: '杂粮、南瓜、温热家常菜',
    金: '白肉清汤、萝卜白菜、辛香调味适中',
    水: '温热汤羹、豆制品、略偏咸鲜',
  };
  const avoidByStrong: Record<string, string> = {
    木: '过酸刺激、生冷硬撑',
    火: '过烫油炸、重辣烧烤',
    土: '过甜油腻、冷饮冰品',
    金: '过咸熏烤、燥热辛辣堆叠',
    水: '过量冰饮、过咸腌制',
  };
  const eat = eatByWeak[weak] || '清淡温热、好消化的家常菜';
  const avoid = avoidByStrong[strong] || '过油过辣、冰凉硬撑';
  return `今天适合吃：${eat}；不适合吃：${avoid}。`;
}

function extractMbti(birthInfo?: string): string | null {
  if (!birthInfo) return null;
  const m = birthInfo.match(/MBTI[:：]?\s*([EI][NS][TF][JP])/i);
  return m ? m[1].toUpperCase() : null;
}

function toneHint(mbti: string | null): string {
  if (!mbti) return '说话别绕弯，该推进就推进。';
  if (mbti.startsWith('E')) return '你外向气场足，场合里不妨多带动气氛，少硬扛。';
  if (mbti.includes('T')) return '你偏理性，决策时别只盯对错，也给关系留一点余地。';
  if (mbti.includes('F')) return '你重感受，边界要说清楚，别把委屈攒成闷雷。';
  return '节奏先稳住，再谈扩张。';
}

function section(
  seed: number,
  texts: {
    overall: string;
    career: string;
    love: string;
    wealth: string;
    health: string;
    advice: string;
  },
  bases = { overall: 72, career: 70, love: 68, wealth: 66, health: 74 }
): FortuneSection {
  return {
    overall: { score: scoreFrom(seed, bases.overall), text: texts.overall },
    career: { score: scoreFrom(seed >> 3, bases.career), text: texts.career },
    love: { score: scoreFrom(seed >> 5, bases.love), text: texts.love },
    wealth: { score: scoreFrom(seed >> 7, bases.wealth), text: texts.wealth },
    health: { score: scoreFrom(seed >> 9, bases.health), text: texts.health },
    advice: texts.advice,
  };
}

/**
 * 从七派引擎结果生成四 Tab 降级报告（白话、有评分、有免责语境）
 */
export function buildFallbackReport(
  engineData: unknown,
  birthInfo?: string
): ReportData {
  const bundle = (engineData || {}) as EngineBundle;
  const bazi = bundle.bazi || undefined;
  const horoscope = bundle.horoscope || undefined;
  const astrology = bundle.astrology || undefined;
  const qimen = bundle.qimen || undefined;
  const liuyao = bundle.liuyao || undefined;
  const tarot = bundle.tarot || undefined;

  const mbti = extractMbti(birthInfo);
  const { strong, weak } = pickStrongWeak(bazi?.wuxing);
  const shengxiao = bazi?.shengxiao || '未知';
  const qiangruo = bazi?.riZhuQiangRuo || '中和';
  const que = (bazi?.wuxingQue || []).join('、') || '无明显缺失';
  const baziStr = bazi?.bazi || '排盘已就绪';
  const zodiac = horoscope?.zodiac || astrology?.sun || '本命星座';
  const yi = (horoscope?.yi || ['沟通', '整理']).slice(0, 3).join('、');
  const ji = (horoscope?.ji || ['硬刚', '冲动消费']).slice(0, 3).join('、');
  const todayGz = horoscope?.todayGanZhi || '今日干支';
  const sunMoon = astrology
    ? `太阳${astrology.sun || '—'}、月亮${astrology.moon || '—'}、上升${astrology.ascendant || '—'}`
    : '星盘已排';
  const qimenLine = qimen
    ? `${qimen.dunType || ''}第${qimen.juNumber ?? '—'}局 · ${qimen.solarTerm || ''}`
    : '奇门局已成';
  const gua = liuyao?.benGua
    ? `本卦${liuyao.benGua}${liuyao.bianGua ? `，变卦${liuyao.bianGua}` : ''}`
    : '六爻已起';
  const tarotLine = tarot?.cards?.length
    ? tarot.cards
        .map((c) => `${c.position || ''}${c.card?.name || ''}${c.isReversed ? '（逆）' : ''}`)
        .filter(Boolean)
        .join('、')
    : '塔罗已抽';

  const now = new Date();
  const today = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const thisMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  const thisYear = `${now.getFullYear()}年`;

  const seed = hashSeed(`${baziStr}|${birthInfo || ''}|${today}`);
  const tone = toneHint(mbti);
  const mbtiNote = mbti ? `语气上略参考你填的 ${mbti}，不拿它盖过命盘。` : '';

  const overview = section(seed, {
    overall: `此造属${shengxiao}，日主${qiangruo}。八字作${baziStr}。五行里${strong}气更足，${weak}偏弱，缺项看「${que}」。${sunMoon}；${qimenLine}；${gua}。各派求同：做事别一个人硬刚，协作更顺。${mbtiNote}${tone}`,
    career: `事业上更适合把力气花在「选对题」而不是「证明自己」。格局不虚，但急于翻盘容易翻车。不妨先把手头一件事做透，再谈扩张。`,
    love: `感情里别把「对错」当唯一标准。愿意听、愿意让一步，气场反而更稳。单身不妨多出现在轻松场合，有伴则少翻旧账。`,
    wealth: `财运宜稳不宜赌。进账靠节奏和信用，不靠一次梭哈。有大额支出先睡一晚再定。`,
    health: `作息比补品重要。${weak}弱时更要防透支——肩颈、肠胃、睡眠任挑一个先管住。`,
    advice: `少做证明题，多做选择题。仅供娱乐，勿作人生重大决策依据。`,
  });

  const daily = section(
    seed + 11,
    {
      overall: `今天是${today}（${todayGz}日）。日运对命盘不硬冲，宜${yi}；忌${ji}。塔罗侧：${tarotLine}。今天适合把一件小事办完，别开太多头。`,
      career: `职场里沟通比硬刚管用。有分歧先对齐目标，再谈立场。`,
      love: `感情上多一句体谅，少一句反驳。约会选轻松的，别上强度。`,
      wealth: `别冲动下单。小钱可花在体验上，大钱再等等风头。`,
      health: `喝水、走动、早点睡。今天别用咖啡硬顶。`,
      advice: `今天把「一件该做的事」做完，比空想十件强。`,
    },
    { overall: 70, career: 68, love: 72, wealth: 64, health: 76 }
  );

  const monthly = section(
    seed + 29,
    {
      overall: `${thisMonth}整体走势平稳偏上。月令对${strong}有利时，适合推进协作型项目；${weak}弱的月份，别硬扛体能与情绪。`,
      career: `本月事业看「节奏」：前半月收口旧事，后半月再开新局更稳。`,
      love: `关系里多给确定性。暧昧拖太久，双方都累。`,
      wealth: `财运宜规划不宜冒险。账单、保险、备用金先理顺。`,
      health: `运动选温和的，比突然暴练更对盘。`,
      advice: `本月口诀：先收口，再开局。`,
    },
    { overall: 73, career: 71, love: 69, wealth: 67, health: 75 }
  );

  const yearly = section(
    seed + 47,
    {
      overall: `${thisYear}大势：适合把力气花在协作与长期关系上，别一个人硬刚全年。太岁年注意口舌与行程变动，备选方案比死磕更有用。`,
      career: `今年事业看「选择题」：少证明、多对齐资源。升迁与跳槽都要留缓冲。`,
      love: `感情宜真诚不宜表演。重要关系值得当面说清楚。`,
      wealth: `年运财气靠复利与信用，不靠一锤子买卖。大额投资务必冷静。`,
      health: `全年防透支。节假日补觉，比年底一次性崩盘强。`,
      advice: `今年少做证明题，多做选择题。娱乐参考，重大决策请另找专业意见。`,
    },
    { overall: 74, career: 72, love: 70, wealth: 68, health: 73 }
  );

  return {
    overview,
    daily,
    monthly,
    yearly,
    foodSummary: buildFoodSummary(strong, weak),
  };
}
