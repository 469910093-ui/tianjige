/**
 * 破冰游戏目录：按人数过滤，饭桌默认；酒桌需成年确认
 */

export type IceScene = 'table' | 'drink';

export interface IcebreakGame {
  id: string;
  name: string;
  scene: IceScene;
  minPeople: number;
  maxPeople: number;
  minutes: number;
  rule: string;
  hostLine: string;
  needsAdult?: boolean;
}

export const ICEBREAK_CATALOG: IcebreakGame[] = [
  {
    id: 'keyword-relay',
    name: '命运关键词接龙',
    scene: 'table',
    minPeople: 3,
    maxPeople: 10,
    minutes: 5,
    rule: '每人抽一个关键词（宜/忌/口味都行），用一句话讲一件小事，下一位接上一个词结尾。',
    hostLine: '今晚别先聊业绩——从关键词接龙开始，谁卡壳谁点下一道菜。',
  },
  {
    id: 'who-most-yi',
    name: '谁最像「今日宜」',
    scene: 'table',
    minPeople: 3,
    maxPeople: 12,
    minutes: 4,
    rule: '主持人报一个「今日宜」词，全员指认最符合的人，被指最多者分享一件近况。',
    hostLine: '我报一个词，你们指人；被指中最多的那位，给我们一句开场白。',
  },
  {
    id: 'two-truths',
    name: '两真一假',
    scene: 'table',
    minPeople: 3,
    maxPeople: 8,
    minutes: 6,
    rule: '每人说三句关于自己的话，其中一句假；其他人投票找假话。',
    hostLine: '每人三句话，藏一句假的——猜错的人负责倒茶。',
  },
  {
    id: 'menu-roulette',
    name: '菜单命运盘',
    scene: 'table',
    minPeople: 2,
    maxPeople: 8,
    minutes: 3,
    rule: '转瓶子或抽签决定下一道菜品类；可声明一次「免死金牌」跳过。',
    hostLine: '转一下，决定下一道——今晚点菜别纠结，交给命运盘。',
  },
  {
    id: 'pair-interview',
    name: '邻座快问快答',
    scene: 'table',
    minPeople: 4,
    maxPeople: 16,
    minutes: 5,
    rule: '两人一组，60 秒互相问三个问题（家乡/最近开心事/本周愿望）。',
    hostLine: '和旁边的人组队，一分钟三个问题，结束后互换邻居再来一轮。',
  },
  {
    id: 'story-chain',
    name: '一句话故事链',
    scene: 'table',
    minPeople: 4,
    maxPeople: 12,
    minutes: 5,
    rule: '从「今天我本来…」起头，每人只加一句，串成一个离谱故事。',
    hostLine: '我起头一句，你们每人只加一句——看我们能离谱到什么程度。',
  },
  {
    id: 'emoji-guess',
    name: '表情包猜菜名',
    scene: 'table',
    minPeople: 2,
    maxPeople: 10,
    minutes: 4,
    rule: '一人只用表情或手势描述一道菜，其他人猜；猜中者下一轮出题。',
    hostLine: '不许说话，只用表情猜菜——猜中的人点下一道。',
  },
  {
    id: 'toast-truth',
    name: '干杯版真假话',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 12,
    minutes: 6,
    rule: '一人说真或假经历，众人举杯表决；猜错者小酌或喝茶代酒（禁止劝酒、禁止猛灌）。',
    hostLine: '举杯表决真假——猜错就小酌一口，喝茶也完全可以，禁止劝酒。',
    needsAdult: true,
  },
  {
    id: 'cheers-topic',
    name: '干杯话题轮盘',
    scene: 'drink',
    minPeople: 3,
    maxPeople: 10,
    minutes: 5,
    rule: '抽话题干杯（近一年最幸运的事/最想感谢的人）；可随时换成无酒精。',
    hostLine: '抽个轻松话题干杯——不想喝酒就改喝茶，气氛到了就行。',
    needsAdult: true,
  },
];

export function pickIcebreakGames(
  people: number,
  scene: IceScene,
  opts?: { adultConfirmed?: boolean; count?: number; seed?: number }
): IcebreakGame[] {
  const n = Math.max(2, Math.min(20, people || 4));
  const count = opts?.count ?? 3;
  const adult = opts?.adultConfirmed ?? false;

  let pool = ICEBREAK_CATALOG.filter(
    (g) =>
      g.scene === scene &&
      n >= g.minPeople &&
      n <= g.maxPeople &&
      (!g.needsAdult || adult)
  );

  // 酒桌未确认成年 → 回落饭桌
  if (pool.length === 0 && scene === 'drink' && !adult) {
    pool = ICEBREAK_CATALOG.filter(
      (g) => g.scene === 'table' && n >= g.minPeople && n <= g.maxPeople
    );
  }
  if (pool.length === 0) {
    pool = ICEBREAK_CATALOG.filter((g) => g.scene === 'table');
  }

  const seed = opts?.seed ?? n * 13 + (scene === 'drink' ? 7 : 3);
  const sorted = [...pool].sort((a, b) => {
    const ha = Math.abs((a.id.charCodeAt(0) * 31 + seed) % 97);
    const hb = Math.abs((b.id.charCodeAt(0) * 31 + seed) % 97);
    return ha - hb;
  });

  return sorted.slice(0, Math.min(count, sorted.length));
}

export function composeHostScript(games: IcebreakGame[], people: number): string {
  const lines = [
    `今晚 ${people} 人，破冰三连：`,
    ...games.map((g, i) => `${i + 1}. ${g.name}（约${g.minutes}分钟）：${g.hostLine}`),
    '规则随时可改，开心最重要。仅供娱乐～',
  ];
  return lines.join('\n');
}
