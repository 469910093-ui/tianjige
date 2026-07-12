import fs from 'fs';

const centers = [
  { name: '西湖', lat: 30.242, lng: 120.1485, radius: 3000, people: 4 },
  { name: '武林', lat: 30.2741, lng: 120.1551, radius: 2500, people: 6 },
  { name: '钱江新城', lat: 30.259, lng: 120.219, radius: 2500, people: 4 },
];

const map = new Map();
for (const c of centers) {
  const url = `http://127.0.0.1:5000/api/nearby?lat=${c.lat}&lng=${c.lng}&radius=${c.radius}&people=${c.people}`;
  const res = await fetch(url);
  const j = await res.json();
  console.log(c.name, j.provider, j.count, j.virtual);
  for (const m of j.merchants || []) {
    const key = `${m.name}|${m.address}`;
    if (!map.has(key)) map.set(key, m);
  }
}

const merchants = [...map.values()].sort(
  (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.distanceM - b.distanceM
);
const ge45 = merchants.filter((m) => m.rating != null && m.rating >= 4.5);
const payload = {
  city: '杭州',
  fetchedAt: new Date().toISOString(),
  source: 'baidu-via-/api/nearby',
  centers: centers.map((c) => c.name),
  defaultMinRating: 4.5,
  total: merchants.length,
  countGe45: ge45.length,
  merchants,
};

fs.mkdirSync('data', { recursive: true });
fs.mkdirSync('public/data', { recursive: true });
const text = JSON.stringify(payload, null, 2);
fs.writeFileSync('data/hangzhou-restaurants.json', text, 'utf8');
fs.writeFileSync('public/data/hangzhou-restaurants.json', text, 'utf8');
console.log('saved', merchants.length, 'ge45', ge45.length);
console.log(ge45.slice(0, 12).map((m) => `${m.rating} ${m.name}`).join('\n'));
