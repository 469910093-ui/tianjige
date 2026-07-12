export interface TarotCard {
  id: number;
  name: string;
  nameEn: string;
  arcana: 'major' | 'minor';
  suit?: string;
  number: number;
  upright: string[];
  reversed: string[];
  description: string;
}

const majorArcana: TarotCard[] = [
  { id: 0, name: '愚者', nameEn: 'The Fool', arcana: 'major', number: 0, upright: ['新开始', '冒险', '自由', '天真'], reversed: ['鲁莽', '恐惧', '冒险过度'], description: '愚者牌象征着新的旅程和无限的可能性。它代表着一个新的开始，充满了希望和未知。' },
  { id: 1, name: '魔术师', nameEn: 'The Magician', arcana: 'major', number: 1, upright: ['意志力', '创造', '技能', '资源'], reversed: ['操控', '欺骗', '缺乏方向'], description: '魔术师拥有将想法变为现实的能力，代表着行动力和创造力。' },
  { id: 2, name: '女祭司', nameEn: 'The High Priestess', arcana: 'major', number: 2, upright: ['直觉', '潜意识', '神秘', '智慧'], reversed: ['秘密', '疏离', '压抑直觉'], description: '女祭司代表内在的智慧和直觉力量，提醒我们倾听内心的声音。' },
  { id: 3, name: '女皇', nameEn: 'The Empress', arcana: 'major', number: 3, upright: ['丰饶', '母性', '自然', '创造'], reversed: ['依赖', '过度保护', '创造力受阻'], description: '女皇象征着丰饶与创造力，代表着生命的孕育和成长。' },
  { id: 4, name: '皇帝', nameEn: 'The Emperor', arcana: 'major', number: 4, upright: ['权威', '结构', '控制', '稳定'], reversed: ['专制', '固执', '过度控制'], description: '皇帝代表着秩序与权威，象征着规则和结构的力量。' },
  { id: 5, name: '教皇', nameEn: 'The Hierophant', arcana: 'major', number: 5, upright: ['传统', '信仰', '教育', '指导'], reversed: ['叛逆', '非传统', '自由思想'], description: '教皇代表传统智慧和灵性指导，象征着信仰与传承。' },
  { id: 6, name: '恋人', nameEn: 'The Lovers', arcana: 'major', number: 6, upright: ['爱情', '选择', '和谐', '关系'], reversed: ['失衡', '选择困难', '价值观冲突'], description: '恋人牌象征着爱情与选择，提醒我们在关系中保持真诚。' },
  { id: 7, name: '战车', nameEn: 'The Chariot', arcana: 'major', number: 7, upright: ['胜利', '意志', '决心', '前进'], reversed: ['失控', '攻击性', '方向迷失'], description: '战车代表着坚定的意志和前进的力量，象征着克服困难走向胜利。' },
  { id: 8, name: '力量', nameEn: 'Strength', arcana: 'major', number: 8, upright: ['勇气', '耐心', '内在力量', '慈悲'], reversed: ['软弱', '自我怀疑', '缺乏自信'], description: '力量牌代表内在的勇气和慈悲的力量，不是蛮力而是心灵的坚韧。' },
  { id: 9, name: '隐者', nameEn: 'The Hermit', arcana: 'major', number: 9, upright: ['内省', '独处', '智慧', '寻找'], reversed: ['孤立', '逃避', '拒绝帮助'], description: '隐者代表着向内探索的智慧，在独处中寻找生命的真谛。' },
  { id: 10, name: '命运之轮', nameEn: 'Wheel of Fortune', arcana: 'major', number: 10, upright: ['转变', '机遇', '循环', '命运'], reversed: ['厄运', '抗拒改变', '失控'], description: '命运之轮象征着命运的循环和转变，提醒我们接受变化。' },
  { id: 11, name: '正义', nameEn: 'Justice', arcana: 'major', number: 11, upright: ['公正', '真相', '因果', '平衡'], reversed: ['不公', '逃避责任', '偏见'], description: '正义牌代表着公平和真相，象征着因果循环和道德准则。' },
  { id: 12, name: '倒吊人', nameEn: 'The Hanged Man', arcana: 'major', number: 12, upright: ['牺牲', '等待', '新视角', '放手'], reversed: ['拖延', '无谓牺牲', '固执'], description: '倒吊人代表着从不同角度看世界，在静止中获得新的洞察。' },
  { id: 13, name: '死神', nameEn: 'Death', arcana: 'major', number: 13, upright: ['结束', '转变', '重生', '放下'], reversed: ['抗拒改变', '恐惧', '停滞'], description: '死神牌并非字面意义的死亡，而是象征着旧的结束和新的开始。' },
  { id: 14, name: '节制', nameEn: 'Temperance', arcana: 'major', number: 14, upright: ['平衡', '节制', '中庸', '和谐'], reversed: ['失衡', '过度', '缺乏耐心'], description: '节制牌代表着平衡和调和，提醒我们在生活中寻找中庸之道。' },
  { id: 15, name: '恶魔', nameEn: 'The Devil', arcana: 'major', number: 15, upright: ['束缚', '欲望', '执念', '阴影'], reversed: ['释放', '觉醒', '挣脱束缚'], description: '恶魔牌代表着内心的执念和束缚，提醒我们正视自己的阴影面。' },
  { id: 16, name: '塔', nameEn: 'The Tower', arcana: 'major', number: 16, upright: ['崩塌', '突变', '觉醒', '解放'], reversed: ['逃避灾难', '恐惧变化', '延缓'], description: '塔牌象征着突然的变化和崩塌，但也是从虚假中觉醒的契机。' },
  { id: 17, name: '星星', nameEn: 'The Star', arcana: 'major', number: 17, upright: ['希望', '灵感', '宁静', '治愈'], reversed: ['失望', '失去信心', '断开连接'], description: '星星牌代表希望和灵感，在黑暗中指引我们前行的方向。' },
  { id: 18, name: '月亮', nameEn: 'The Moon', arcana: 'major', number: 18, upright: ['幻觉', '恐惧', '潜意识', '不确定'], reversed: ['真相浮现', '释放恐惧', '清晰'], description: '月亮牌代表着潜意识的恐惧和幻觉，提醒我们区分现实与想象。' },
  { id: 19, name: '太阳', nameEn: 'The Sun', arcana: 'major', number: 19, upright: ['成功', '快乐', '活力', '光明'], reversed: ['暂时挫折', '过度乐观', '自我中心'], description: '太阳牌是塔罗中最积极的牌之一，象征着成功、快乐和生命力。' },
  { id: 20, name: '审判', nameEn: 'Judgement', arcana: 'major', number: 20, upright: ['觉醒', '重生', '反思', '召唤'], reversed: ['自我怀疑', '拒绝反思', '无法原谅'], description: '审判牌代表着灵魂的觉醒和重生，是对过去的反思和对未来的召唤。' },
  { id: 21, name: '世界', nameEn: 'The World', arcana: 'major', number: 21, upright: ['完成', '圆满', '成就', '整合'], reversed: ['未完成', '缺失', '延迟'], description: '世界牌象征着一个循环的完成和圆满，是塔罗旅程的终点和新的起点。' },
];

export function getAllCards(): TarotCard[] {
  return majorArcana;
}

export interface TarotReading {
  cards: {
    card: TarotCard;
    isReversed: boolean;
    position: string;
  }[];
}

export function drawCards(count: number = 3): TarotReading {
  const cards = [...majorArcana];
  const drawn: TarotReading['cards'] = [];
  const positions = ['过去', '现在', '未来'];

  for (let i = 0; i < count && cards.length > 0; i++) {
    const idx = Math.floor(Math.random() * cards.length);
    const card = cards.splice(idx, 1)[0];
    drawn.push({
      card,
      isReversed: Math.random() > 0.6,
      position: positions[i] || `第${i + 1}张`,
    });
  }

  return { cards: drawn };
}
