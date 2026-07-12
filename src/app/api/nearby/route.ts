import { NextRequest, NextResponse } from 'next/server';
import {
  blameLineFor,
  estimatePeopleRange,
  keywordForPartySize,
  recommendScore,
  tencentKeywordForPartySize,
  type NearbyMerchant,
} from '@/lib/nearby-merchants';
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

function partyRawRequest(people: number, radiusM: number): string {
  const km = Math.max(0.5, Math.round(radiusM) / 1000);
  if (people <= 2) {
    return `离我最近的适合${people}人的咖啡馆或小馆，优先评分高，${km}公里内`;
  }
  if (people <= 4) {
    return `离我最近的适合${people}人吃饭的餐厅，优先评分高，${km}公里内`;
  }
  if (people <= 8) {
    return `离我最近的适合${people}人聚餐的火锅或中餐厅，优先评分高，${km}公里内`;
  }
  return `离我最近的适合${people}人聚餐的自助餐或宴会餐厅，优先评分高，${km}公里内`;
}

interface BaiduPlaceItem {
  name?: string;
  uid?: string;
  address?: string;
  telephone?: string;
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

function clampRadius(m: number): number {
  return Math.max(200, Math.min(Math.round(m), 5000));
}

function mapBaiduItems(
  items: BaiduPlaceItem[],
  people: number,
  center?: { lat: number; lng: number },
  sourceLabel: NearbyMerchant['sourceLabel'] = '百度地图'
): NearbyMerchant[] {
  return items
    .filter((p) => p.name && p.location)
    .map((p) => {
      const category =
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
      return {
        id: p.uid || `bd-${p.name}-${p.location!.lat}`,
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
      };
    });
}

/** 百度 Agent Plan：Bearer SK + 语义检索（baidu-ai-map skill） */
async function fetchBaiduAgent(opts: {
  lat: number;
  lng: number;
  radius: number;
  people: number;
  token: string;
}): Promise<NearbyMerchant[]> {
  const gcj = wgs84ToGcj02(opts.lat, opts.lng);
  const center = `${fmtCoord(gcj.lat)},${fmtCoord(gcj.lng)}`;
  const auth = { Authorization: `Bearer ${opts.token}` };

  // 先逆地理拿城市，满足 place 的 region 必填
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
  placeUrl.searchParams.set('user_raw_request', partyRawRequest(opts.people, opts.radius));
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

  return mapBaiduItems(placeJson.results || [], opts.people, gcj, '百度地图');
}

async function fetchBaidu(opts: {
  lat: number;
  lng: number;
  radius: number;
  people: number;
  ak: string;
}): Promise<NearbyMerchant[]> {
  const radius = clampRadius(opts.radius);
  const query = keywordForPartySize(opts.people);
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
}): Promise<NearbyMerchant[]> {
  const want = clampRadius(opts.radius);
  const apiRadius = Math.min(want, 1000);
  const keyword = tencentKeywordForPartySize(opts.people);
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

  const items = json.data || [];
  return items
    .filter((p) => p.title && p.location)
    .map((p) => {
      const category = p.category || '美食';
      const range = estimatePeopleRange(p.title || '', category);
      return {
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
        sourceLabel: '腾讯地图' as const,
        minPeople: range.min,
        maxPeople: range.max,
      };
    });
}

/**
 * GET /api/nearby?lat=&lng=&radius=1500&people=6
 * 优先 BAIDU_MAP_AUTH_TOKEN（Agent Plan）→ BAIDU_MAP_AK → TENCENT_MAP_KEY
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get('lat'));
  const lng = Number(sp.get('lng'));
  const radius = Number(sp.get('radius') || 1500);
  const people = Math.max(1, Math.min(30, Number(sp.get('people') || 4)));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ ok: false, error: '缺少有效 lat/lng' }, { status: 400 });
  }

  const agentToken = process.env.BAIDU_MAP_AUTH_TOKEN || '';
  const baiduAk = process.env.BAIDU_MAP_AK || process.env.BAIDU_AK || '';
  const tencentKey = process.env.TENCENT_MAP_KEY || process.env.QQ_MAP_KEY || '';

  const errors: string[] = [];
  let provider: Provider | null = null;
  let merchants: NearbyMerchant[] = [];

  if (agentToken) {
    try {
      merchants = await fetchBaiduAgent({ lat, lng, radius, people, token: agentToken });
      if (merchants.length > 0) provider = 'baidu-agent';
      else errors.push('百度 Agent 无结果');
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if ((!provider || merchants.length === 0) && baiduAk) {
    try {
      merchants = await fetchBaidu({ lat, lng, radius, people, ak: baiduAk });
      if (merchants.length > 0) provider = 'baidu';
      else errors.push('百度 Place 无结果');
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if ((!provider || merchants.length === 0) && tencentKey) {
    try {
      merchants = await fetchTencent({ lat, lng, radius, people, key: tencentKey });
      if (merchants.length > 0) provider = 'tencent';
      else errors.push('腾讯地图无结果');
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  // 查不到真实结果 → 虚拟推荐（诚实标签，不冒充真实 POI）
  if (!provider || merchants.length === 0) {
    merchants = buildVirtualMerchants({ lat, lng, people, radius: clampRadius(radius) });
    provider = 'virtual';
  }

  // 默认按「评分 60% + 距离 40%」综合最推荐排序（前端仍可切换）
  const radiusCap = clampRadius(radius);
  merchants = [...merchants].sort(
    (a, b) =>
      recommendScore(b, radiusCap) - recommendScore(a, radiusCap) ||
      a.distanceM - b.distanceM ||
      (b.rating ?? 0) - (a.rating ?? 0)
  );

  return NextResponse.json({
    ok: true,
    provider,
    people,
    radius: radiusCap,
    count: merchants.length,
    merchants,
    sort: 'recommend',
    virtual: provider === 'virtual',
    note:
      provider === 'virtual'
        ? `未查到真实商家，已给出虚拟推荐（仅供参考）${errors.length ? '；原因：' + errors.slice(0, 2).join('；') : ''}`
        : provider === 'tencent'
          ? '腾讯地点搜索不返回评分；建议配置 BAIDU_MAP_AUTH_TOKEN'
          : provider === 'baidu-agent'
            ? '已使用百度地图 Agent Plan 真实检索'
            : undefined,
  });
}
