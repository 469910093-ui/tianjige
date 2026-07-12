import * as Astronomy from 'astronomy-engine';

export interface AstrologyResult {
  sun: string;
  moon: string;
  ascendant: string;
  sunDegree: number;
  moonDegree: number;
  ascendantDegree: number;
  planets: { name: string; sign: string; degree: number; house: string; retrograde: boolean }[];
  aspects: { type: string; planet1: string; planet2: string; orb: number }[];
  elements: Record<string, number>;
}

const zodiacSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const zodiacSignsEn = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const elementMap: Record<string, string> = {
  '白羊座': '火', '狮子座': '火', '射手座': '火',
  '金牛座': '土', '处女座': '土', '摩羯座': '土',
  '双子座': '风', '天秤座': '风', '水瓶座': '风',
  '巨蟹座': '水', '天蝎座': '水', '双鱼座': '水',
};

function lonToSign(degree: number): string {
  const idx = Math.floor(((degree % 360) + 360) % 360 / 30);
  return zodiacSigns[idx];
}

function lonToDegreeInSign(degree: number): number {
  return ((degree % 360) + 360) % 360 % 30;
}

function getPlanetLon(body: Astronomy.Body, date: Astronomy.AstroTime): number {
  try {
    return Astronomy.EclipticLongitude(body, date);
  } catch {
    return 0;
  }
}

function isRetrograde(body: Astronomy.Body, date: Astronomy.AstroTime): boolean {
  try {
    const gv1 = Astronomy.GeoVector(body, date, false);
    const gv2 = Astronomy.GeoVector(body, date.AddDays(1), false);
    const lon1 = Math.atan2(gv1.y, gv1.x);
    const lon2 = Math.atan2(gv2.y, gv2.x);
    return (lon2 - lon1) < 0;
  } catch {
    return false;
  }
}

function calculateAscendant(date: Astronomy.AstroTime, latitude: number, longitude: number): number {
  const gmst = Astronomy.SiderealTime(date);
  let lst = gmst + longitude / 15;
  if (lst < 0) lst += 24;
  if (lst >= 24) lst -= 24;

  const ramc = lst * 15 * Math.PI / 180;
  const obl = 23.4393 * Math.PI / 180;
  const lat = latitude * Math.PI / 180;

  const ascRad = Math.atan2(
    -Math.cos(ramc),
    Math.sin(obl) * Math.tan(lat) + Math.cos(obl) * Math.sin(ramc)
  );
  let ascDeg = ascRad * 180 / Math.PI;
  if (ascDeg < 0) ascDeg += 360;
  return ascDeg;
}

function calculatePlacidusHouseCusps(ascDeg: number, mcDeg: number): number[] {
  const cusps: number[] = [0];
  cusps[1] = ascDeg;
  cusps[10] = mcDeg;
  cusps[4] = (mcDeg + 180) % 360;
  cusps[7] = (ascDeg + 180) % 360;

  // Simplified interpolation for intermediate houses
  for (let i = 2; i <= 3; i++) {
    cusps[i] = (ascDeg + (mcDeg - ascDeg + 360) % 360 * (i - 1) / 3) % 360;
  }
  for (let i = 5; i <= 6; i++) {
    cusps[i] = (mcDeg + (ascDeg + 180 - mcDeg + 360) % 360 * (i - 10 + 3) / 3) % 360;
  }
  for (let i = 8; i <= 9; i++) {
    cusps[i] = (ascDeg + 180 + (mcDeg + 180 - ascDeg - 180 + 360) % 360 * (i - 7) / 3) % 360;
  }
  for (let i = 11; i <= 12; i++) {
    cusps[i] = (mcDeg + 180 + (ascDeg - mcDeg - 180 + 360) % 360 * (i - 10) / 3) % 360;
  }

  return cusps;
}

function getHouse(planetDeg: number, cusps: number[]): number {
  if (cusps.length < 13) return 1;
  for (let i = 1; i <= 12; i++) {
    const next = i < 12 ? i + 1 : 1;
    const c1 = cusps[i];
    const c2 = cusps[next];
    if (c2 > c1) {
      if (planetDeg >= c1 && planetDeg < c2) return i;
    } else {
      if (planetDeg >= c1 || planetDeg < c2) return i;
    }
  }
  return 1;
}

const planetConfigs = [
  { name: '水星', body: Astronomy.Body.Mercury },
  { name: '金星', body: Astronomy.Body.Venus },
  { name: '火星', body: Astronomy.Body.Mars },
  { name: '木星', body: Astronomy.Body.Jupiter },
  { name: '土星', body: Astronomy.Body.Saturn },
  { name: '天王星', body: Astronomy.Body.Uranus },
  { name: '海王星', body: Astronomy.Body.Neptune },
  { name: '冥王星', body: Astronomy.Body.Pluto },
];

function calculateAspects(positions: { name: string; degree: number }[]): { type: string; planet1: string; planet2: string; orb: number }[] {
  const aspects: { type: string; planet1: string; planet2: string; orb: number }[] = [];
  const aspectAngles = [
    { angle: 0, name: '合', orb: 8 },
    { angle: 60, name: '六合', orb: 6 },
    { angle: 90, name: '刑', orb: 6 },
    { angle: 120, name: '拱', orb: 6 },
    { angle: 180, name: '冲', orb: 8 },
  ];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const diff = Math.abs(positions[i].degree - positions[j].degree);
      const normalized = diff > 180 ? 360 - diff : diff;

      for (const asp of aspectAngles) {
        const orb = Math.abs(normalized - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({
            type: asp.name,
            planet1: positions[i].name,
            planet2: positions[j].name,
            orb: Math.round(orb * 10) / 10,
          });
          break;
        }
      }
    }
  }

  return aspects;
}

export function calculateAstrology(
  year: number, month: number, day: number, hour: number,
  latitude: number = 39.9, longitude: number = 116.4
): AstrologyResult {
  const utcHour = hour - 8;
  const utcDate = new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0));
  const date = new Astronomy.AstroTime(utcDate);

  // Sun position
  const sunPos = Astronomy.SunPosition(date);
  const sunDeg = ((sunPos.elon % 360) + 360) % 360;

  // Moon position
  const moonDeg = ((getPlanetLon(Astronomy.Body.Moon, date) % 360) + 360) % 360;

  // Ascendant
  const ascDeg = calculateAscendant(date, latitude, longitude);

  // MC (Midheaven / Medium Coeli)
  const gmst = Astronomy.SiderealTime(date);
  let lst = gmst + longitude / 15;
  if (lst < 0) lst += 24;
  if (lst >= 24) lst -= 24;
  const ramcDeg = (lst * 15) % 360;

  // House cusps (Placidus simplified)
  const cusps = calculatePlacidusHouseCusps(ascDeg, ramcDeg);

  // Planets
  const planets = planetConfigs.map(p => {
    const deg = ((getPlanetLon(p.body, date) % 360) + 360) % 360;
    return {
      name: p.name,
      sign: lonToSign(deg),
      degree: Math.round(lonToDegreeInSign(deg) * 10) / 10,
      house: `${getHouse(deg, cusps)}宫`,
      retrograde: isRetrograde(p.body, date),
    };
  });

  // Aspects
  const allPositions = [
    { name: '太阳', degree: sunDeg },
    { name: '月亮', degree: moonDeg },
    ...planetConfigs.map((p, i) => ({ name: p.name, degree: ((getPlanetLon(p.body, date) % 360) + 360) % 360 })),
  ];
  const aspects = calculateAspects(allPositions);

  // Elements
  const elements: Record<string, number> = { '火': 0, '土': 0, '风': 0, '水': 0 };
  const allSigns = [lonToSign(sunDeg), lonToSign(moonDeg), lonToSign(ascDeg), ...planets.map(p => p.sign)];
  for (const s of allSigns) {
    const el = elementMap[s];
    if (el) elements[el]++;
  }

  return {
    sun: lonToSign(sunDeg),
    moon: lonToSign(moonDeg),
    ascendant: lonToSign(ascDeg),
    sunDegree: Math.round(lonToDegreeInSign(sunDeg) * 10) / 10,
    moonDegree: Math.round(lonToDegreeInSign(moonDeg) * 10) / 10,
    ascendantDegree: Math.round(lonToDegreeInSign(ascDeg) * 10) / 10,
    planets,
    aspects,
    elements,
  };
}
