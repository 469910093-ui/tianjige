/**
 * 真实地图无结果时的虚拟商家降级（必须带「虚拟推荐」标签，不可冒充真实 POI）
 */

import { blameLineFor, recommendScore, type NearbyMerchant } from './nearby-merchants';

const VIRTUAL_POOL: Array<{
  name: string;
  category: string;
  rating: number;
  price: string;
  minPeople: number;
  maxPeople: number;
  addressHint: string;
}> = [
  { name: '云起小馆·家常', category: '家常菜', rating: 4.5, price: '68', minPeople: 2, maxPeople: 8, addressHint: '示例路 12 号' },
  { name: '半盏火锅局', category: '火锅', rating: 4.6, price: '98', minPeople: 3, maxPeople: 12, addressHint: '示例街 88 号' },
  { name: '青灯烧烤铺', category: '烧烤', rating: 4.3, price: '75', minPeople: 3, maxPeople: 10, addressHint: '示例巷 6 号' },
  { name: '月白咖啡馆', category: '咖啡', rating: 4.7, price: '42', minPeople: 1, maxPeople: 4, addressHint: '示例广场 B1' },
  { name: '同尘私房菜', category: '私房菜', rating: 4.8, price: '128', minPeople: 2, maxPeople: 6, addressHint: '示例里 3 弄' },
  { name: '聚气自助汇', category: '自助餐', rating: 4.2, price: '99', minPeople: 2, maxPeople: 20, addressHint: '示例大道 168 号' },
  { name: '清和素面馆', category: '面馆', rating: 4.4, price: '28', minPeople: 1, maxPeople: 4, addressHint: '示例弄堂口' },
  { name: '夜阑清吧', category: '清吧', rating: 4.5, price: '80', minPeople: 2, maxPeople: 8, addressHint: '示例夜市二层' },
  { name: '金灶海鲜舫', category: '海鲜', rating: 4.4, price: '158', minPeople: 4, maxPeople: 16, addressHint: '示例码头路' },
  { name: '团圆大桌宴', category: '宴会', rating: 4.3, price: '120', minPeople: 8, maxPeople: 30, addressHint: '示例会展旁' },
];

function hash(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  return Math.abs(x);
}

/** 按坐标+人数生成虚拟商家；全部标记为虚拟推荐 */
export function buildVirtualMerchants(opts: {
  lat: number;
  lng: number;
  people: number;
  radius?: number;
}): NearbyMerchant[] {
  const people = Math.max(1, Math.min(30, opts.people));
  const radius = opts.radius ?? 1500;
  const seed = hash(Math.round(opts.lat * 1e4) * 31 + Math.round(opts.lng * 1e4) + people * 17);

  const suited = VIRTUAL_POOL.filter((p) => people >= p.minPeople && people <= p.maxPeople);
  const pool = suited.length >= 3 ? suited : VIRTUAL_POOL;

  const picked: NearbyMerchant[] = [];
  for (let i = 0; i < Math.min(6, pool.length); i++) {
    const idx = (seed + i * 7) % pool.length;
    const p = pool[idx];
    // 避免重复
    if (picked.some((m) => m.name === p.name)) continue;
    const dist = 180 + ((seed + i * 97) % Math.max(200, radius - 200));
    const dLat = ((seed + i) % 40 - 20) * 0.00008;
    const dLng = ((seed + i * 3) % 40 - 20) * 0.00008;
    picked.push({
      id: `virtual-${i}-${p.name}`,
      name: p.name,
      category: p.category,
      rating: p.rating,
      distanceM: dist,
      address: `（虚拟）${p.addressHint}`,
      blameLine: `${blameLineFor(p.category, people)} · 虚拟示例店`,
      lat: opts.lat + dLat,
      lng: opts.lng + dLng,
      sourceLabel: '虚拟推荐',
      minPeople: p.minPeople,
      maxPeople: p.maxPeople,
      price: p.price,
    });
  }

  // 保底至少 3 家
  while (picked.length < 3) {
    const p = VIRTUAL_POOL[picked.length % VIRTUAL_POOL.length];
    picked.push({
      id: `virtual-fill-${picked.length}`,
      name: p.name,
      category: p.category,
      rating: p.rating,
      distanceM: 400 + picked.length * 120,
      address: `（虚拟）${p.addressHint}`,
      blameLine: `${blameLineFor(p.category, people)} · 虚拟示例店`,
      lat: opts.lat,
      lng: opts.lng,
      sourceLabel: '虚拟推荐',
      minPeople: 1,
      maxPeople: 30,
      price: p.price,
    });
  }

  return picked.sort(
    (a, b) => recommendScore(b, radius) - recommendScore(a, radius) || a.distanceM - b.distanceM
  );
}
