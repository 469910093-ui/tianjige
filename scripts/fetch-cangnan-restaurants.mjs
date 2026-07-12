/**
 * 拉取仓南广场 3km 百度真实店 → docs/data/cangnan-restaurants.json
 * 供 ShipStatic 静态站在无 /api 时按评分降序兜底
 *
 * 用法：先 pnpm next dev --port 5000，再 node scripts/fetch-cangnan-restaurants.mjs
 */
import fs from 'fs';

const center = { name: '杭州仓南广场', lat: 30.27258, lng: 120.0057, radius: 3000, people: 4 };
const url = `http://127.0.0.1:5000/api/nearby?lat=${center.lat}&lng=${center.lng}&radius=${center.radius}&people=${center.people}`;
const res = await fetch(url);
const j = await res.json();
console.log(center.name, j.provider, j.count, j.virtual, j.note);

const merchants = [...(j.merchants || [])].sort(
  (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.distanceM - b.distanceM
);

const payload = {
  city: j.city || '杭州市',
  center: { name: center.name, lat: center.lat, lng: center.lng, radius: center.radius },
  fetchedAt: new Date().toISOString(),
  source: j.provider || 'baidu',
  note: j.note || '仓南广场3公里美食按评分降序',
  count: merchants.length,
  merchants,
};

const text = JSON.stringify(payload, null, 2);
for (const dir of ['docs/data', 'public/data', 'data']) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/cangnan-restaurants.json`, text, 'utf8');
}
console.log('saved', merchants.length, '→ docs/data/cangnan-restaurants.json');
console.log(merchants.slice(0, 8).map((m) => `${m.rating} ${m.name}`).join('\n'));
