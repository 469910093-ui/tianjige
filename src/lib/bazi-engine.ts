import { Solar, Lunar } from 'lunar-javascript';

export interface BaziResult {
  bazi: string;
  yearPillar: { gan: string; zhi: string };
  monthPillar: { gan: string; zhi: string };
  dayPillar: { gan: string; zhi: string };
  hourPillar: { gan: string; zhi: string };
  wuxing: Record<string, number>;
  shishen: string[];
  shensha: string[];
  nayin: string[];
  shengxiao: string;
  riZhuQiangRuo: string;
  wuxingQue: string[];
}

export function calculateBazi(year: number, month: number, day: number, hour: number): BaziResult {
  const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const yearPillar = { gan: eightChar.getYearGan(), zhi: eightChar.getYearZhi() };
  const monthPillar = { gan: eightChar.getMonthGan(), zhi: eightChar.getMonthZhi() };
  const dayPillar = { gan: eightChar.getDayGan(), zhi: eightChar.getDayZhi() };
  const hourPillar = { gan: eightChar.getTimeGan(), zhi: eightChar.getTimeZhi() };

  const wuxing: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
  const ganWuxing: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const zhiWuxing: Record<string, string> = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

  for (const p of pillars) {
    if (ganWuxing[p.gan]) wuxing[ganWuxing[p.gan]]++;
    if (zhiWuxing[p.zhi]) wuxing[zhiWuxing[p.zhi]]++;
  }

  const totalWuxing = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const wuxingQue = Object.entries(wuxing)
    .filter(([, v]) => v === 0)
    .map(([k]) => k);

  const riGan = dayPillar.gan;
  const riWuxing = ganWuxing[riGan] || '土';
  const qiangruo = (wuxing[riWuxing] || 0) >= 3 ? '偏旺' : (wuxing[riWuxing] || 0) >= 2 ? '中和' : '偏弱';

  return {
    bazi: `${yearPillar.gan}${yearPillar.zhi}年 ${monthPillar.gan}${monthPillar.zhi}月 ${dayPillar.gan}${dayPillar.zhi}日 ${hourPillar.gan}${hourPillar.zhi}时`,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    wuxing,
    shishen: ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
    shensha: ['天乙贵人', '驿马', '桃花', '文昌', '将星', '羊刃', '华盖', '亡神'],
    nayin: [`${yearPillar.gan}${yearPillar.zhi}纳音`, `${monthPillar.gan}${monthPillar.zhi}纳音`, `${dayPillar.gan}${dayPillar.zhi}纳音`, `${hourPillar.gan}${hourPillar.zhi}纳音`],
    shengxiao: lunar.getYearShengXiao(),
    riZhuQiangRuo: qiangruo,
    wuxingQue,
  };
}

export interface HoroscopeResult {
  zodiac: string;
  zodiacEn: string;
  element: string;
  ruler: string;
  todayGanZhi: string;
  yi: string[];
  ji: string[];
  fangwei: { xiShen: string; caiShen: string; fuShen: string };
}

const zodiacList = [
  { name: '白羊座', symbol: '♈', en: 'Aries', dates: '3.21-4.19', element: '火', ruler: '火星' },
  { name: '金牛座', symbol: '♉', en: 'Taurus', dates: '4.20-5.20', element: '土', ruler: '金星' },
  { name: '双子座', symbol: '♊', en: 'Gemini', dates: '5.21-6.21', element: '风', ruler: '水星' },
  { name: '巨蟹座', symbol: '♋', en: 'Cancer', dates: '6.22-7.22', element: '水', ruler: '月亮' },
  { name: '狮子座', symbol: '♌', en: 'Leo', dates: '7.23-8.22', element: '火', ruler: '太阳' },
  { name: '处女座', symbol: '♍', en: 'Virgo', dates: '8.23-9.22', element: '土', ruler: '水星' },
  { name: '天秤座', symbol: '♎', en: 'Libra', dates: '9.23-10.23', element: '风', ruler: '金星' },
  { name: '天蝎座', symbol: '♏', en: 'Scorpio', dates: '10.24-11.22', element: '水', ruler: '冥王星' },
  { name: '射手座', symbol: '♐', en: 'Sagittarius', dates: '11.23-12.21', element: '火', ruler: '木星' },
  { name: '摩羯座', symbol: '♑', en: 'Capricorn', dates: '12.22-1.19', element: '土', ruler: '土星' },
  { name: '水瓶座', symbol: '♒', en: 'Aquarius', dates: '1.20-2.18', element: '风', ruler: '天王星' },
  { name: '双鱼座', symbol: '♓', en: 'Pisces', dates: '2.19-3.20', element: '水', ruler: '海王星' },
];

/** 根据出生月日推算星座 */
export function getZodiacFromDate(month: number, day: number): string {
  const zodiacDates = [
    { name: '摩羯座', end: [1, 19] },
    { name: '水瓶座', end: [2, 18] },
    { name: '双鱼座', end: [3, 20] },
    { name: '白羊座', end: [4, 19] },
    { name: '金牛座', end: [5, 20] },
    { name: '双子座', end: [6, 21] },
    { name: '巨蟹座', end: [7, 22] },
    { name: '狮子座', end: [8, 22] },
    { name: '处女座', end: [9, 22] },
    { name: '天秤座', end: [10, 23] },
    { name: '天蝎座', end: [11, 22] },
    { name: '射手座', end: [12, 21] },
    { name: '摩羯座', end: [12, 31] },
  ];
  for (const z of zodiacDates) {
    if (month < z.end[0] || (month === z.end[0] && day <= z.end[1])) {
      return z.name;
    }
  }
  return '摩羯座';
}

export function getZodiacList() {
  return zodiacList;
}

export function calculateHoroscope(zodiacName: string): HoroscopeResult {
  const zodiac = zodiacList.find(z => z.name === zodiacName) || zodiacList[7];
  const today = Solar.fromDate(new Date());
  const lunar = today.getLunar();
  const ganZhi = lunar.getYearInGanZhi() + '年 ' + lunar.getMonthInGanZhi() + '月 ' + lunar.getDayInGanZhi() + '日';

  return {
    zodiac: zodiac.name,
    zodiacEn: zodiac.en,
    element: zodiac.element,
    ruler: zodiac.ruler,
    todayGanZhi: ganZhi,
    yi: ['祭祀', '出行', '纳财', '开市'],
    ji: ['动土', '安葬', '开仓', '掘井'],
    fangwei: { xiShen: '东南', caiShen: '正南', fuShen: '正东' },
  };
}
