// ponytail: 只为常用城市维护经纬度，全量368城市加latitude数据量太大，需要时再补
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  '北京': { lat: 39.9, lon: 116.4 }, '上海': { lat: 31.2, lon: 121.5 },
  '广州': { lat: 23.1, lon: 113.3 }, '深圳': { lat: 22.5, lon: 114.1 },
  '成都': { lat: 30.6, lon: 104.1 }, '杭州': { lat: 30.3, lon: 120.2 },
  '天津': { lat: 39.1, lon: 117.2 }, '重庆': { lat: 29.6, lon: 106.6 },
  '武汉': { lat: 30.6, lon: 114.3 }, '南京': { lat: 32.1, lon: 118.8 },
  '西安': { lat: 34.3, lon: 108.9 }, '长沙': { lat: 28.2, lon: 113.0 },
  '沈阳': { lat: 41.8, lon: 123.4 }, '哈尔滨': { lat: 45.8, lon: 126.5 },
  '大连': { lat: 38.9, lon: 121.6 }, '济南': { lat: 36.7, lon: 117.0 },
  '青岛': { lat: 36.1, lon: 120.4 }, '郑州': { lat: 34.7, lon: 113.7 },
  '昆明': { lat: 25.0, lon: 102.7 }, '厦门': { lat: 24.5, lon: 118.1 },
  '福州': { lat: 26.1, lon: 119.3 }, '合肥': { lat: 31.8, lon: 117.3 },
  '苏州': { lat: 31.3, lon: 120.6 }, '无锡': { lat: 31.6, lon: 120.3 },
  '宁波': { lat: 29.9, lon: 121.6 }, '东莞': { lat: 23.0, lon: 113.7 },
  '佛山': { lat: 23.0, lon: 113.1 }, '石家庄': { lat: 38.0, lon: 114.5 },
  '太原': { lat: 37.9, lon: 112.5 }, '兰州': { lat: 36.1, lon: 103.8 },
  '乌鲁木齐': { lat: 43.8, lon: 87.6 }, '拉萨': { lat: 29.6, lon: 91.1 },
  '呼和浩特': { lat: 40.8, lon: 111.7 }, '南宁': { lat: 22.8, lon: 108.3 },
  '贵阳': { lat: 26.6, lon: 106.7 }, '海口': { lat: 20.0, lon: 110.3 },
  '银川': { lat: 38.5, lon: 106.3 }, '西宁': { lat: 36.6, lon: 101.8 },
  '长春': { lat: 43.9, lon: 125.3 }, '南昌': { lat: 28.7, lon: 115.9 },
};

export function getCityLatLon(city: string): { lat: number; lon: number } {
  return CITY_COORDS[city] || { lat: 39.9, lon: 116.4 };
}
