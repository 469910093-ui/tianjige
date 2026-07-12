/**
 * 破冰游戏目录：饭桌 / 酒桌两套互不重叠
 * 酒桌需成年确认；规则一律允许喝茶代酒，禁止劝酒与危险惩罚
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
  // ─── 饭桌：合盘、点菜、聊天破冰（无饮酒环节）───
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
    id: 'taste-memory',
    name: '味觉记忆挑战',
    scene: 'table',
    minPeople: 3,
    maxPeople: 10,
    minutes: 5,
    rule: '一人闭眼或背对，其余人描述桌上某道菜的味道关键词；猜对者下一轮出题。',
    hostLine: '闭眼听味道——猜对的人指定下一位挑战者。',
  },
  {
    id: 'seat-swap-story',
    name: '换座三分钟',
    scene: 'table',
    minPeople: 6,
    maxPeople: 16,
    minutes: 6,
    rule: '每轮计时 3 分钟，邻座交换一个「本周小事」；铃声一响全体顺时针换一位。',
    hostLine: '三分钟换一次座位聊小事——认识新邻居，别聊工作。',
  },
  {
    id: 'dish-auction',
    name: '招牌菜拍卖会',
    scene: 'table',
    minPeople: 3,
    maxPeople: 12,
    minutes: 5,
    rule: '主持人报店里一道招牌，每人用一句话「竞拍理由」；全桌投票谁最想点，胜者决定是否点这道。',
    hostLine: '我报招牌，你们竞拍——理由最燃的人说了算。',
  },

  // ─── 酒桌：干杯、划拳、话题轮次（可改喝茶，禁止劝酒）───
  {
    id: 'cheers-topic',
    name: '干杯话题轮盘',
    scene: 'drink',
    minPeople: 3,
    maxPeople: 12,
    minutes: 5,
    rule: '抽轻松话题（近一年最幸运的事/最想感谢的人）后举杯；可不喝酒改喝茶，禁止劝酒。',
    hostLine: '抽个轻松话题干杯——不想喝酒就改喝茶，气氛到了就行。',
    needsAdult: true,
  },
  {
    id: 'finger-guess',
    name: '划拳轻局',
    scene: 'drink',
    minPeople: 2,
    maxPeople: 8,
    minutes: 6,
    rule: '两人一组石头剪刀布或经典划拳，负者小酌一口或喝茶；三局两胜换对手，禁止灌酒。',
    hostLine: '划拳轻局，输一口就停——喝茶代酒完全可以。',
    needsAdult: true,
  },
  {
    id: 'number-bomb',
    name: '数字炸弹',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 14,
    minutes: 5,
    rule: '主持人心里定 1–50 的数，轮流猜区间；踩中「炸弹」者小酌或喝茶，再由该人定下一枚炸弹。',
    hostLine: '猜数字踩炸弹——踩中的人定下一枚，一口为限。',
    needsAdult: true,
  },
  {
    id: 'never-have-i',
    name: '我从来没有…',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 12,
    minutes: 7,
    rule: '一人说「我从来没有做过××」；做过的人举杯小酌或喝茶。话题保持轻松，禁止隐私逼问。',
    hostLine: '「我从来没有」开场——做过的人举杯，没做过的人看戏。',
    needsAdult: true,
  },
  {
    id: 'king-order',
    name: '国王令（温和版）',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 10,
    minutes: 8,
    rule: '抽签当国王，发温和指令（对某人说谢谢/学动物叫/换座位）；拒绝则小酌或喝茶。禁止羞辱与危险动作。',
    hostLine: '今晚国王令只要好玩——拒绝就一口，别整羞耻戏。',
    needsAdult: true,
  },
  {
    id: 'toast-ladder',
    name: '敬酒阶梯',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 16,
    minutes: 6,
    rule: '从东道主起，每人选一位尚未被敬过的人，说一句具体感谢后干杯；一轮内每人只被敬一次。',
    hostLine: '一轮敬一轮谢——每人只敬一次，话要具体，茶酒都行。',
    needsAdult: true,
  },
  {
    id: 'rhyme-cup',
    name: '押韵干杯',
    scene: 'drink',
    minPeople: 3,
    maxPeople: 10,
    minutes: 5,
    rule: '主持人给一个韵脚字，轮流用该韵说一句祝福再举杯；卡住超过 5 秒者小酌或喝茶。',
    hostLine: '我给韵脚，你们押韵祝福——卡壳就一口，喝茶也行。',
    needsAdult: true,
  },
  {
    id: 'spy-word',
    name: '酒桌卧底词',
    scene: 'drink',
    minPeople: 5,
    maxPeople: 12,
    minutes: 10,
    rule: '多数人同一词、1–2 人卧底词；轮流描述后投票。投错平民小酌/喝茶，卧底胜则平民各一口。',
    hostLine: '谁是卧底？描述别太直——猜错喝一口，猜对卧底喝。',
    needsAdult: true,
  },
  {
    id: 'speed-cheers',
    name: '击鼓传杯',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 14,
    minutes: 4,
    rule: '传空杯或筷套，主持人背对喊停；停在谁手里谁说一句今晚愿望后小酌或喝茶。',
    hostLine: '传起来——停在谁那儿，说愿望再一口。',
    needsAdult: true,
  },
  {
    id: 'truth-or-sip',
    name: '真心话 or 小酌',
    scene: 'drink',
    minPeople: 3,
    maxPeople: 10,
    minutes: 8,
    rule: '抽到者选答轻松真心话，或改小酌/喝茶跳过。禁止过度私密与强迫；每人有一次免答金牌。',
    hostLine: '真心话或小酌——不想答就喝茶跳过，有免死金牌。',
    needsAdult: true,
  },
  {
    id: 'left-right',
    name: '左右互搏干杯',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 12,
    minutes: 5,
    rule: '主持人说「左」或「右」，该侧邻座同时对视干杯；说错方向者小酌。可改成「茶碰茶」。',
    hostLine: '听口令左右碰杯——听错就一口，茶碰茶也算数。',
    needsAdult: true,
  },
  {
    id: 'story-sip',
    name: '故事接龙·干杯节点',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 12,
    minutes: 6,
    rule: '每人加一句故事；说到约定关键词（如「突然」「结果」）全桌干杯。卡壳者小酌或喝茶。',
    hostLine: '故事接龙，撞到关键词就干杯——卡壳的人先一口。',
    needsAdult: true,
  },
  {
    id: 'dice-toast',
    name: '骰子敬谁',
    scene: 'drink',
    minPeople: 3,
    maxPeople: 10,
    minutes: 5,
    rule: '掷骰点数对应座位顺位，与该人干杯并说一句夸赞；无骰子可用手机随机数。',
    hostLine: '骰子决定敬谁——点数指到谁，夸一句再碰杯。',
    needsAdult: true,
  },
  {
    id: 'category-cup',
    name: '类别快说',
    scene: 'drink',
    minPeople: 3,
    maxPeople: 12,
    minutes: 5,
    rule: '主持人报类别（车标/城市/菜名），轮流不重复快说；超时或重复者小酌或喝茶。',
    hostLine: '报类别，你们快说——重复或超时，一口走人下一题。',
    needsAdult: true,
  },
  {
    id: 'mirror-toast',
    name: '镜像干杯',
    scene: 'drink',
    minPeople: 4,
    maxPeople: 16,
    minutes: 4,
    rule: '两人一组，一方做简单手势，另一方同时镜像并干杯；没同步上的一侧小酌或喝茶。',
    hostLine: '对着镜子干杯——手势没同步，慢的那口先喝。',
    needsAdult: true,
  },
  {
    id: 'wish-round',
    name: '愿望轮干杯',
    scene: 'drink',
    minPeople: 3,
    maxPeople: 14,
    minutes: 6,
    rule: '每人说一个可公开的小愿望，全桌为其干杯一次；说完一轮可互相追问一句「怎么帮你」。',
    hostLine: '每人一个小愿望，我们为你干杯——说完可以互相帮一把。',
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
