'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Navigation,
  Star,
  SlidersHorizontal,
  Users,
  ExternalLink,
  Gamepad2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import {
  filterAndSortMerchants,
  formatDistance,
  type NearbyMerchant,
  type NearbySort,
  type SpiceFilter,
} from '@/lib/nearby-merchants';
import { buildVirtualMerchants } from '@/lib/virtual-merchants';
import {
  composeHostScript,
  pickIcebreakGames,
  type IceScene,
  type IcebreakGame,
} from '@/lib/icebreak-games';

type LocState = 'idle' | 'locating' | 'loading' | 'ready' | 'denied' | 'error';

/** 定位失败时的默认中心：杭州仓南广场（余杭景兴路 636 号） */
const FALLBACK_LOC = { name: '杭州仓南广场', lat: 30.27258, lng: 120.0057 };

export default function NearbyMerchants({
  defaultPeople = 4,
  cuisineHint,
}: {
  defaultPeople?: number;
  /** 多人综合后的菜系提示，展示在标题旁 */
  cuisineHint?: string;
}) {
  const [locState, setLocState] = useState<LocState>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [raw, setRaw] = useState<NearbyMerchant[]>([]);
  const [provider, setProvider] = useState<string>('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [apiNote, setApiNote] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxDistanceM, setMaxDistanceM] = useState(3000);
  const [people, setPeople] = useState(defaultPeople);
  const [onlyRated, setOnlyRated] = useState(true);
  const [spice, setSpice] = useState<SpiceFilter>('any');
  const [sort, setSort] = useState<NearbySort>('rating');
  const [errorMsg, setErrorMsg] = useState('');
  const [locLabel, setLocLabel] = useState(FALLBACK_LOC.name);
  const [scene, setScene] = useState<IceScene>('table');
  const [adultOk, setAdultOk] = useState(false);
  const [gameSeed, setGameSeed] = useState(1);
  const [copyTip, setCopyTip] = useState('');

  const applyVirtual = useCallback((lat: number, lng: number, partySize: number, radius: number, reason?: string) => {
    const list = buildVirtualMerchants({ lat, lng, people: partySize, radius });
    setRaw(list);
    setProvider('虚拟推荐');
    setIsVirtual(true);
    setApiNote(reason || '');
    setLocState('ready');
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number, partySize: number, radius: number) => {
    setLocState('loading');
    setErrorMsg('');
    setCoords({ lat, lng });
    try {
      const qs = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
        people: String(partySize),
      });
      if (cuisineHint?.trim()) qs.set('cuisine', cuisineHint.trim());
      const res = await fetch(`/api/nearby?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok || !json.merchants?.length) {
        applyVirtual(lat, lng, partySize, radius, json.error || json.note);
        return;
      }
      setRaw(json.merchants || []);
      const virt = json.provider === 'virtual' || json.virtual === true;
      setIsVirtual(virt);
      setProvider(
        virt
          ? '虚拟推荐'
          : json.provider === 'baidu-agent' || json.provider === 'baidu'
            ? '百度地图'
            : '腾讯地图'
      );
      setApiNote(json.note || json.platforms?.note || '');
      setLocState('ready');
    } catch {
      applyVirtual(lat, lng, partySize, radius, '');
    }
  }, [applyVirtual, cuisineHint]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocLabel(FALLBACK_LOC.name);
      void fetchNearby(FALLBACK_LOC.lat, FALLBACK_LOC.lng, people, maxDistanceM);
      setErrorMsg(`浏览器不支持定位，已展示${FALLBACK_LOC.name} 3 公里美食评分榜`);
      return;
    }
    setLocState('locating');
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocLabel('当前位置');
        void fetchNearby(pos.coords.latitude, pos.coords.longitude, people, maxDistanceM);
      },
      () => {
        setLocLabel(FALLBACK_LOC.name);
        void fetchNearby(FALLBACK_LOC.lat, FALLBACK_LOC.lng, people, maxDistanceM);
        setErrorMsg(`未授权定位，已展示${FALLBACK_LOC.name} 3 公里美食评分榜`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [fetchNearby, people, maxDistanceM]);

  useEffect(() => {
    // 直接展示仓南广场 3km 评分降序榜；需要真实定位再点「重新定位」
    setLocLabel(FALLBACK_LOC.name);
    void fetchNearby(FALLBACK_LOC.lat, FALLBACK_LOC.lng, people, maxDistanceM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!coords) return;
    const t = window.setTimeout(() => {
      void fetchNearby(coords.lat, coords.lng, people, maxDistanceM);
    }, 400);
    return () => clearTimeout(t);
  }, [people, maxDistanceM, cuisineHint]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(
    () =>
      filterAndSortMerchants(raw, {
        minRating,
        maxDistanceM: isVirtual ? 99999 : maxDistanceM,
        sort,
        people,
        requireRating: onlyRated,
        spice,
      }),
    [raw, minRating, maxDistanceM, sort, people, onlyRated, isVirtual, spice]
  );

  const games: IcebreakGame[] = useMemo(
    () =>
      pickIcebreakGames(people, scene, {
        adultConfirmed: adultOk,
        count: 3,
        seed: gameSeed + people,
      }),
    [people, scene, adultOk, gameSeed]
  );

  const hostScript = useMemo(() => composeHostScript(games, people), [games, people]);

  const demoCities = [
    { name: '杭州仓南广场', lat: FALLBACK_LOC.lat, lng: FALLBACK_LOC.lng },
    { name: '上海人民广场', lat: 31.2337, lng: 121.4762 },
    { name: '北京国贸', lat: 39.9087, lng: 116.4604 },
    { name: '杭州西湖', lat: 30.242, lng: 120.1485 },
  ];

  const copyHost = async () => {
    try {
      await navigator.clipboard.writeText(hostScript);
      setCopyTip('已复制主持词');
      setTimeout(() => setCopyTip(''), 2000);
    } catch {
      setCopyTip('复制失败，请手动选中');
      setTimeout(() => setCopyTip(''), 2000);
    }
  };

  return (
    <section className="bg-card rounded-xl p-3 md:p-5 shadow-[0_2px_8px_rgba(49,37,27,0.08)] border border-outline-variant/20 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            附近美食评分榜
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            {locLabel} · {formatDistance(maxDistanceM)}内 · 按评分降序
          </p>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          className="shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-primary/10 text-primary text-sm font-medium active:scale-[0.98]"
        >
          <Navigation className="w-4 h-4" />
          重新定位
        </button>
      </div>

      {(locState === 'locating' || locState === 'loading') && (
        <div className="text-sm text-muted-foreground py-6 text-center">
          {locState === 'locating' ? '正在获取定位…' : '正在查询今天吃什么…'}
        </div>
      )}

      {(locState === 'denied' || locState === 'error') && (
        <div className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground space-y-2">
          <p>{errorMsg}</p>
          <div className="flex flex-wrap gap-2">
            {demoCities.map((c) => (
              <button
                key={c.name}
                type="button"
                className="min-h-[44px] px-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                onClick={() => {
                  setLocLabel(c.name);
                  void fetchNearby(c.lat, c.lng, people, maxDistanceM);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {(locState === 'ready' || raw.length > 0) && (
        <>
          {coords && isVirtual && (
            <div className="text-[11px] text-muted-foreground">示例店</div>
          )}

          <div className="rounded-lg bg-muted/40 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              筛选
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground shrink-0">就餐人数</span>
              <button
                type="button"
                className="w-10 h-10 rounded-xl bg-background border border-outline-variant/40 text-lg"
                onClick={() => setPeople((p) => Math.max(1, p - 1))}
              >
                −
              </button>
              <strong className="min-w-[2ch] text-center text-base">{people}</strong>
              <button
                type="button"
                className="w-10 h-10 rounded-xl bg-background border border-outline-variant/40 text-lg"
                onClick={() => setPeople((p) => Math.min(30, p + 1))}
              >
                +
              </button>
              <span className="text-xs text-muted-foreground">人</span>
            </div>

            <label className="block text-xs text-muted-foreground">
              最低评分：{minRating <= 0 ? '不限（完整排名）' : `≥ ${minRating.toFixed(1)}`}
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={minRating}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMinRating(v);
                  if (v > 0) setOnlyRated(true);
                }}
                className="w-full mt-1 accent-[#B8945A]"
              />
              <span className="mt-1 block text-[11px] opacity-80">
                默认展示 3 公里内全部有评分店；拖动可提高门槛 · 当前 {list.length} 家
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs text-muted-foreground min-h-[44px]">
              <input
                type="checkbox"
                checked={onlyRated}
                onChange={(e) => setOnlyRated(e.target.checked)}
                className="accent-[#d4af37] w-4 h-4"
              />
              仅显示有评分的商家
            </label>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">口味</p>
              <div className="flex gap-2">
                {(
                  [
                    { id: 'any' as const, label: '不限' },
                    { id: 'spicy' as const, label: '能吃辣' },
                    { id: 'mild' as const, label: '不吃辣' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSpice(opt.id)}
                    className={`flex-1 min-h-[44px] rounded-sm text-[12px] font-medium ${
                      spice === opt.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground border border-outline-variant/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                按店名/品类粗分（川湘火锅等算辣；粤菜日料咖啡等偏清淡）
              </p>
            </div>

            {!isVirtual && (
              <label className="block text-xs text-muted-foreground">
                最远距离：{formatDistance(maxDistanceM)}
                <input
                  type="range"
                  min={300}
                  max={5000}
                  step={100}
                  value={maxDistanceM}
                  onChange={(e) => setMaxDistanceM(Number(e.target.value))}
                  className="w-full mt-1 accent-[#d4af37]"
                />
              </label>
            )}

            <div className="flex gap-2">
              {(
                [
                  { id: 'rating' as const, label: '评分最高' },
                  { id: 'recommend' as const, label: '综合推荐' },
                  { id: 'distance' as const, label: '距离最近' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSort(opt.id)}
                  className={`flex-1 min-h-[44px] rounded-sm text-[11px] font-semibold tracking-[0.06em] ${
                    sort === opt.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground border border-outline-variant/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {sort === 'rating' && (
              <p className="text-[11px] text-muted-foreground">
                默认：{FALLBACK_LOC.name} 周边 3 公里，按评分从高到低；同分看距离
              </p>
            )}
            {sort === 'recommend' && (
              <p className="text-[11px] text-muted-foreground">
                综合规则：评分权重 60% + 距离权重 40%，榜首标「最推荐」
              </p>
            )}
          </div>

          {list.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              没有符合筛选的商家，试试改口味、调低评分或改人数
            </div>
          ) : (
            <ul className="space-y-2">
              <li className="text-[11px] text-muted-foreground list-none px-0.5">
                {locLabel} · {formatDistance(maxDistanceM)} · {provider || '附近'}
                {minRating > 0 ? ` · ≥${minRating.toFixed(1)}分` : ''} · 共 {list.length} 家
                {sort === 'rating' ? '（评分降序）' : ''}
              </li>
              {list.map((m, idx) => (
                <li
                  key={m.id}
                  className={`rounded-xl border bg-background/60 p-3 ${
                    (sort === 'rating' || sort === 'recommend') && idx === 0
                      ? 'border-accent-foreground/50'
                      : 'border-outline-variant/25'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 shrink-0 text-center pt-1">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          idx < 3 ? 'text-accent-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    {m.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.image}
                        alt=""
                        className="w-16 h-16 rounded-md object-cover shrink-0 bg-muted"
                      />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground text-sm flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{m.name}</span>
                            {sort === 'rating' && idx === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-foreground text-primary shrink-0 font-semibold tracking-[0.06em]">
                                评分第1
                              </span>
                            )}
                            {sort === 'recommend' && idx === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-foreground text-primary shrink-0 font-semibold tracking-[0.06em]">
                                最推荐
                              </span>
                            )}
                            {sort === 'recommend' && idx > 0 && idx < 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-accent-foreground shrink-0">
                                推荐 {idx + 1}
                              </span>
                            )}
                            {m.sourceLabel === '虚拟推荐' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                                虚拟
                              </span>
                            )}
                            {m.sourceLabel === '百度地图' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground shrink-0">
                                百度
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {m.category}
                            {m.price ? ` · 人均¥${m.price}` : ''}
                            {m.commentNum != null ? ` · ${m.commentNum}条评价` : ''}
                            {` · 约${m.minPeople}-${m.maxPeople}人`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{m.address}</div>
                          {m.shopHours && (
                            <div className="text-xs text-muted-foreground mt-0.5">营业 {m.shopHours}</div>
                          )}
                          {m.heatHint && (
                            <div className="text-xs text-accent-foreground mt-0.5">{m.heatHint}</div>
                          )}
                          <div className="text-xs text-primary mt-1">{m.blameLine}</div>
                          {m.actions && m.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {m.actions
                                .filter((a) => a.platform === 'meituan' || a.platform === 'dianping' || a.label === '百度详情' || a.label === '百度导航')
                                .slice(0, 4)
                                .map((a) => (
                                  <a
                                    key={`${m.id}-${a.platform}-${a.label}`}
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={a.hint}
                                    className={`inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-sm text-[11px] font-semibold tracking-[0.04em] border ${
                                      a.platform === 'meituan'
                                        ? 'border-[#FFC300]/40 bg-[#FFC300]/15 text-foreground'
                                        : a.platform === 'dianping'
                                          ? 'border-orange-400/40 bg-orange-400/10 text-foreground'
                                          : 'border-border text-muted-foreground'
                                    }`}
                                  >
                                    {a.label}
                                    <ExternalLink className="w-3 h-3 opacity-70" />
                                  </a>
                                ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                            <Star className="w-3.5 h-3.5 text-accent-foreground fill-accent-foreground" />
                            {m.rating != null ? m.rating.toFixed(1) : '暂无'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{formatDistance(m.distanceM)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 破冰游戏 */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-primary" />
                破冰 · {people} 人
              </h3>
              <button
                type="button"
                onClick={() => setGameSeed((s) => s + 1)}
                className="inline-flex items-center gap-1 text-xs text-primary min-h-[36px] px-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                换一组
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScene('table')}
                className={`flex-1 min-h-[40px] rounded-xl text-sm ${
                  scene === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-outline-variant/40 text-muted-foreground'
                }`}
              >
                饭桌
              </button>
              <button
                type="button"
                onClick={() => setScene('drink')}
                className={`flex-1 min-h-[40px] rounded-xl text-sm ${
                  scene === 'drink'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-outline-variant/40 text-muted-foreground'
                }`}
              >
                酒桌
              </button>
            </div>

            {scene === 'drink' && (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={adultOk}
                  onChange={(e) => setAdultOk(e.target.checked)}
                  className="mt-0.5 accent-[#d4af37] w-4 h-4"
                />
                <span>我确认全员已成年。酒桌游戏禁止劝酒、禁止危险饮酒惩罚；可不喝酒改喝茶。</span>
              </label>
            )}

            {scene === 'drink' && !adultOk ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                未确认成年前，仅展示饭桌游戏。勾选后再看酒桌推荐。
              </p>
            ) : null}

            <ul className="space-y-2">
              {(scene === 'drink' && !adultOk
                ? pickIcebreakGames(people, 'table', { count: 3, seed: gameSeed + people })
                : games
              ).map((g, i) => (
                <li key={g.id} className="rounded-lg bg-background/70 border border-outline-variant/20 p-3">
                  <div className="text-sm font-medium text-foreground">
                    {i + 1}. {g.name}
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      适合 {g.minPeople}-{g.maxPeople} 人 · 约 {g.minutes} 分钟
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{g.rule}</p>
                  <p className="text-xs text-primary mt-1.5">主持：{g.hostLine}</p>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => void copyHost()}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                复制主持词
              </button>
              {copyTip && <span className="text-xs text-muted-foreground">{copyTip}</span>}
            </div>
          </div>
        </>
      )}

      {locState === 'idle' && (
        <button
          type="button"
          onClick={requestLocation}
          className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium"
        >
          开启定位，查询今天吃什么
        </button>
      )}
    </section>
  );
}
