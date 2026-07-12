/**
 * 第三方平台跳转链接（无美团开放检索 Key 时：用店名+城市深链，不冒充美团官方 POI）
 */

export type MerchantPlatform = 'baidu' | 'meituan' | 'dianping';

export interface MerchantActionLink {
  platform: MerchantPlatform;
  label: string;
  /** 打开方式说明，展示给用户 */
  hint: string;
  url: string;
}

/** 百度地图地点详情 / 导航 */
export function buildBaiduMapLinks(opts: {
  name: string;
  lat: number;
  lng: number;
  uid?: string;
  detailUrl?: string;
}): MerchantActionLink[] {
  const links: MerchantActionLink[] = [];
  if (opts.detailUrl) {
    links.push({
      platform: 'baidu',
      label: '百度详情',
      hint: '百度地图商家页',
      url: opts.detailUrl,
    });
  } else if (opts.uid) {
    links.push({
      platform: 'baidu',
      label: '百度详情',
      hint: '百度地图商家页',
      url: `https://map.baidu.com/poi/?uid=${encodeURIComponent(opts.uid)}`,
    });
  }
  links.push({
    platform: 'baidu',
    label: '百度导航',
    hint: '调起百度地图导航',
    url: `https://api.map.baidu.com/marker?location=${opts.lat},${opts.lng}&title=${encodeURIComponent(opts.name)}&content=${encodeURIComponent(opts.name)}&output=html&coord_type=gcj02`,
  });
  return links;
}

/**
 * 美团 / 大众点评：开放平台无个人「附近餐厅检索」时，
 * 用店名+城市做 H5 搜索深链，引导用户到美团看评价/团购/预订。
 */
export function buildMeituanLinks(opts: {
  name: string;
  city?: string;
  address?: string;
}): MerchantActionLink[] {
  // 去掉括号分店名过长时保留主品牌，提高美团搜索命中
  const q = opts.name.replace(/[（(].*?[）)]/g, '').trim() || opts.name;
  const city = (opts.city || '').replace(/市$/, '');
  const query = city ? `${city} ${q}` : q;

  return [
    {
      platform: 'meituan',
      label: '美团搜店',
      hint: '在美团搜索同名店（团购/预订）',
      url: `https://m.meituan.com/s/?q=${encodeURIComponent(query)}`,
    },
    {
      platform: 'dianping',
      label: '点评搜店',
      hint: '在大众点评搜索同名店（评价）',
      url: `https://m.dianping.com/shoplist/0/r/0/c/0/s/s_-1?keyword=${encodeURIComponent(q)}`,
    },
  ];
}

export function enrichMerchantActions(opts: {
  name: string;
  lat: number;
  lng: number;
  uid?: string;
  detailUrl?: string;
  city?: string;
  address?: string;
  sourceLabel: string;
}): MerchantActionLink[] {
  const actions: MerchantActionLink[] = [];
  if (opts.sourceLabel === '百度地图' || opts.sourceLabel === '腾讯地图') {
    actions.push(...buildBaiduMapLinks(opts));
    actions.push(...buildMeituanLinks(opts));
  }
  // 虚拟店不挂真实平台链接，避免误导
  return actions;
}
