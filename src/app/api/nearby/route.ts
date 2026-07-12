import { NextRequest, NextResponse } from 'next/server';
import {
  blameLineFor,
  estimatePeopleRange,
  keywordForPartySize,
  partyRawRequest,
  recommendScore,
  tencentKeywordForPartySize,
  type NearbyMerchant,
} from '@/lib/nearby-merchants';
import { enrichMerchantActions } from '@/lib/merchant-links';
import { buildVirtualMerchants } from '@/lib/virtual-merchants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Provider = 'baidu-agent' | 'baidu' | 'tencent' | 'virtual';

/** WGS84 → GCJ-02（腾讯 / Agent Plan 国内坐标） */
function wgs84ToGcj02(lat: number, lng: number): { lat: number; lng: number } {
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  const outOfChina = lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
  if (outOfChina) return { lat, lng };

  function transformLat(x: number, y: number) {
    let r = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    r += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
    r += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
    r += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
    return r;
  }
  function transformLng(x: number, y: number) {
    let r = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    r += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
    r += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
    r += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
    return r;
  }

  const dLat = transformLat(lng - 105.0, lat - 35.0);
  const dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  const mgLat = lat + (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI);
  const mgLng = lng + (dLng * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { lat: mgLat, lng: mgLng };
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

function fmtCoord(n: number): string {
  return n.toFixed(6);
}

function clampRadius(m: number): number {
  return Math.max(200, Math.min(Math.round(m), 5000));
}

interface BaiduPlaceItem {
  name?: string;
  uid?: string;
  address?: string;
  telephone?: string;
  city?: string;
  location?: { lat: number; lng: number };
  detail_info?: {
    distance?: number | string;
    type?: string;
    tag?: string;
    classified_poi_tag?: string;
    detail_url?: string;
    price?: string;
    overall_rating?: string;
    comment_num?: string | number;
    brand?: string;
    shop_hours?: string;
    image?: string;
    heat_trend?: string;
    label?: string;
  };
}

interface TencentPlaceItem {
  id?: string;
  title?: string;
  address?: string;
  tel?: string;
  category?: string;
  location?: { lat: number; lng: number };
  _distance?: number;
}

function attachActions(m: NearbyMerchant, city?: string): NearbyMerchant {
  return {
    ...m,
    city: m.city || city,
    actions: enrichMerchantActions({
      name: m.name,
      lat: m.lat,
      lng: m.lng,
      uid: m.uid,
      detailUrl: m.detailUrl,
      city: m.city || city,
      address: m.address,
      sourceLabel: m.sourceLabel,
    }),
  };
}

function mapBaiduItems(
  items: BaiduPlaceItem[],
  people: number,
  center?: { lat: number; lng: number },
  sourceLabel: NearbyMerchant['sourceLabel'] = '百度地图',
  cityHint?: string
): NearbyMerchant[] {
  return items
    .filter((p) => p.name && p.location)
    .map((p) => {
      const category =
        p.detail_info?.label ||
        p.detail_info?.tag ||
        p.detail_info?.classified_poi_tag ||
        p.detail_info?.type ||
        '美食';
      const range = estimatePeopleRange(p.name || '', category);
      const ratingRaw = p.detail_info?.overall_rating;
      const rating = ratingRaw != null && ratingRaw !== '' ? Number(ratingRaw) : null;
      const distRaw = p.detail_info?.distance;
      let distanceM =
        distRaw != null && distRaw !== '' ? Math.round(Number(distRaw)) : 0;
      if ((!distanceM || !Number.isFinite(distanceM)) && center && p.location) {
        distanceM = haversineM(center.lat, center.lng, p.location.lat, p.location.lng);
      }
      const city = p.city || cityHint;
      const base: NearbyMerchant = {
        id: p.uid || `bd-${p.name}-${p.location!.lat}`,
        uid: p.uid,
        name: p.name!,
        category,
        rating: Number.isFinite(rating as number) ? (rating as number) : null,
        distanceM,
        address: p.address || '',
        tel: p.telephone,
        detailUrl: p.detail_info?.detail_url,
        blameLine: blameLineFor(category, people),
        lat: p.location!.lat,
        lng: p.location!.lng,
        sourceLabel,
        minPeople: range.min,
        maxPeople: range.max,
        price: p.detail_info?.price,
        commentNum:
          p.detail_info?.comment_num != null
            ? Number(p.detail_info.comment_num)
            : undefined,
        brand: p.detail_info?.brand,
        shopHours: p.detail_info?.shop_hours,
        image: p.detail_info?.image,
        heatHint: p.detail_info?.heat_trend,
        city,
      };
      return attachActions(base, city);
    });
}

/** 百度 Agent Plan：Bearer SK + 语义检索（baidu-ai-map skill） */
async function fetchBaiduAgent(opts: {
  lat: number;
  lng: number;
  radius: number;
  people: number;
  token: string;
  cuisine?: string;
}): Promise<{ merchants: NearbyMerchant[]; city: string }> {
  const gcj = wgs84ToGcj02(opts.lat, opts.lng);
  const center = `${fmtCoord(gcj.lat)},${fmtCoord(gcj.lng)}`;
  const auth = { Authorization: `Bearer ${opts.token}` };

  const revUrl = new URL('https://api.map.baidu.com/agent_plan/v1/reverse_geocoding');
  revUrl.searchParams.set('location', center);
  const revRes = await fetch(revUrl.toString(), { headers: auth, cache: 'no-store' });
  if (!revRes.ok) throw new Error(`百度 Agent 逆地理 HTTP ${revRes.status}`);
  const revJson = (await revRes.json()) as {
    status?: number;
    message?: string;
    result?: { addressComponent?: { city?: string; district?: string; province?: string } };
  };
  if (revJson.status !== 0) {
    throw new Error(revJson.message || `百度 Agent 逆地理 status=${revJson.status}`);
  }
  const ac = revJson.result?.addressComponent;
  const region = ac?.city || ac?.district || ac?.province || '全国';

  const placeUrl = new URL('https://api.map.baidu.com/agent_plan/v1/place');
  placeUrl.searchParams.set(
    'user_raw_request',
    partyRawRequest(opts.people, opts.radius, opts.cuisine)
  );
  placeUrl.searchParams.set('region', region);
  placeUrl.searchParams.set('center', center);
  placeUrl.searchParams.set('sort', 'distance');

  const placeRes = await fetch(placeUrl.toString(), { headers: auth, cache: 'no-store' });
  if (!placeRes.ok) throw new Error(`百度 Agent 地点检索 HTTP ${placeRes.status}`);
  const placeJson = (await placeRes.json()) as {
    status?: number;
    message?: string;
    results?: BaiduPlaceItem[];
  };
  if (placeJson.status !== 0) {
    throw new Error(placeJson.message || `百度 Agent 地点检索 status=${placeJson.status}`);
  }

  const merchants = mapBaiduItems(
    placeJson.results || [],
    opts.people,
    gcj,
    '百度地图',
    region
  ).filter((m) => m.distanceM <= clampRadius(opts.radius) * 1.2);

  return { merchants, city: region };
}

async function fetchBaidu(opts: {
  lat: number;
  lng: number;
  radius: number;
  people: number;
  ak: string;
  cuisine?: string;
}): Promise<NearbyMerchant[]> {
  const radius = clampRadius(opts.radius);
  const query = keywordForPartySize(opts.people, opts.cuisine);
  const params = new URLSearchParams({
    query,
    location: `${opts.lat},${opts.lng}`,
    radius: String(radius),
    output: 'json',
    ak: opts.ak,
    scope: '2',
    coord_type: '1',
    page_size: '20',
    page_num: '0',
    filter: 'industry_type:cater|sort_name:overall_rating|sort_rule:0',
  });

  const url = `https://api.map.baidu.com/place/v2/search?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`百度地图 HTTP ${res.status}`);
  const json = (await res.json()) as {
    status: number;
    message?: string;
    results?: BaiduPlaceItem[];
  };
  if (json.status !== 0) {
    throw new Error(json.message || `百度地图错误 status=${json.status}`);
  }

  return mapBaiduItems(json.results || [], opts.people, { lat: opts.lat, lng: opts.lng }, '百度地图');
}

async function fetchTencent(opts: {
  lat: number;
  lng: number;
  radius: number;
  people: number;
  key: string;
  cuisine?: string;
}): Promise<NearbyMerchant[]> {
  const want = clampRadius(opts.radius);
  const apiRadius = Math.min(want, 1000);
  const keyword = tencentKeywordForPartySize(opts.people, opts.cuisine);
  const gcj = wgs84ToGcj02(opts.lat, opts.lng);
  const params = new URLSearchParams({
    key: opts.key,
    keyword,
    boundary: `nearby(${gcj.lat},${gcj.lng},${apiRadius},1)`,
    page_size: '20',
    page_index: '1',
    orderby: '_distance',
    output: 'json',
  });

  const url = `https://apis.map.qq.com/ws/place/v1/search?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`腾讯地图 HTTP ${res.status}`);
  const json = (await res.json()) as {
    status: number;
    message?: string;
    data?: TencentPlaceItem[];
  };
  if (json.status !== 0) {
    throw new Error(json.message || `腾讯地图错误 status=${json.status}`);
  }

  return (json.data || [])
    .filter((p) => p.title && p.location)
    .map((p) => {
      const category = p.category || '美食';
      const range = estimatePeopleRange(p.title || '', category);
      const base: NearbyMerchant = {
        id: p.id || `qq-${p.title}-${p.location!.lat}`,
        name: p.title!,
        category,
        rating: null,
        distanceM: Math.round(p._distance ?? 0),
        address: p.address || '',
        tel: p.tel,
        blameLine: blameLineFor(category, opts.people),
        lat: p.location!.lat,
        lng: p.location!.lng,
        sourceLabel: '腾讯地图',
        minPeople: range.min,
        maxPeople: range.max,
      };
      return attachActions(base);
    });
}

/**
 * GET /api/nearby?lat=&lng=&radius=1500&people=6&cuisine=火锅,川菜
 * 优先 BAIDU_MAP_AUTH_TOKEN → BAIDU_MAP_AK → TENCENT_MAP_KEY
 * 真实店附带美团/点评搜店深链（非美团官方 POI 接口）
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get('lat'));
  const lng = Number(sp.get('lng'));
  const radius = Number(sp.get('radius') || 1500);
  const people = Math.max(1, Math.min(30, Number(sp.get('people') || 4)));
  const cuisine = (sp.get('cuisine') || '').trim();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ ok: false, error: '缺少有效 lat/lng' }, { status: 400 });
  }

  const agentToken = process.env.BAIDU_MAP_AUTH_TOKEN || '';
  const baiduAk = process.env.BAIDU_MAP_AK || process.env.BAIDU_AK || '';
  const tencentKey = process.env.TENCENT_MAP_KEY || process.env.QQ_MAP_KEY || '';

  const errors: string[] = [];
  let provider: Provider | null = null;
  let merchants: NearbyMerchant[] = [];
  let city = '';

  if (agentToken) {
    try {
      const r = await fetchBaiduAgent({
        lat,
        lng,
        radius,
        people,
        token: agentToken,
        cuisine,
      });
      merchants = r.merchants;
      city = r.city;
      if (merchants.length > 0) provider = 'baidu-agent';
      else errors.push('百度 Agent 无结果');
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if ((!provider || merchants.length === 0) && baiduAk) {
    try {
      merchants = await fetchBaidu({ lat, lng, radius, people, ak: baiduAk, cuisine });
      if (merchants.length > 0) provider = 'baidu';
      else errors.push('百度 Place 无结果');
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if ((!provider || merchants.length === 0) && tencentKey) {
    try {
      merchants = await fetchTencent({ lat, lng, radius, people, key: tencentKey, cuisine });
      if (merchants.length > 0) provider = 'tencent';
      else errors.push('腾讯地图无结果');
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (!provider || merchants.length === 0) {
    merchants = buildVirtualMerchants({ lat, lng, people, radius: clampRadius(radius) });
    provider = 'virtual';
  }

  const radiusCap = clampRadius(radius);
  merchants = [...merchants].sort(
    (a, b) =>
      recommendScore(b, radiusCap) - recommendScore(a, radiusCap) ||
      a.distanceM - b.distanceM ||
      (b.rating ?? 0) - (a.rating ?? 0)
  );

  const origin = req.headers.get('origin') || '*';
  const cors = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  return NextResponse.json(
    {
      ok: true,
      provider,
      people,
      radius: radiusCap,
      cuisine: cuisine || undefined,
      city: city || undefined,
      count: merchants.length,
      merchants,
      sort: 'recommend',
      virtual: provider === 'virtual',
      platforms: {
        poi: provider === 'virtual' ? 'virtual' : 'baidu',
        meituan: 'deeplink-search',
        note: '店铺 POI 来自百度地图；美团/点评为同名店搜索深链，便于看团购与评价',
      },
      note:
        provider === 'virtual'
          ? `未查到真实商家，已给出虚拟推荐（仅供参考）${errors.length ? '；原因：' + errors.slice(0, 2).join('；') : ''}`
          : provider === 'tencent'
            ? '腾讯地点搜索不返回评分；建议配置 BAIDU_MAP_AUTH_TOKEN。美团/点评为搜店深链。'
            : provider === 'baidu-agent'
              ? '已用百度地图检索真实餐厅；可点「美团搜店 / 点评搜店」查看团购与评价'
              : '已用百度地点检索；可点美团/点评搜同名店',
    },
    { headers: cors }
  );
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
