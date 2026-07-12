'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/navbar';
import InputForm, { type DateSelection, type CitySelection, SHICHEN_TO_HOUR } from '@/components/input-form';
import FortuneReport from '@/components/fortune-report';
import CopyableSummary from '@/components/copyable-summary';
import NearbyMerchants from '@/components/nearby-merchants';
import PartyGuestsForm, { syncHostAsFirstGuest } from '@/components/party-guests-form';
import PartySynthPanel from '@/components/party-synth-panel';
import { useReport } from '@/components/use-report';
import { calculateBazi, getZodiacFromDate, type BaziResult } from '@/lib/bazi-engine';
import { calculateAstrology, type AstrologyResult } from '@/lib/astrology-engine';
import { drawCards, type TarotReading } from '@/lib/tarot-engine';
import { calculateHoroscope, type HoroscopeResult } from '@/lib/bazi-engine';
import { calculateZiwei, type ZiweiResult } from '@/lib/ziwei-engine';
import { calculateQiMen, type QiMenResult } from '@/lib/qimen-engine';
import { calculateLiuYao, type LiuYaoResult, YAO_WEI } from '@/lib/liuyao-engine';
import ZiweiChartBoard from '@/components/ziwei-chart-board';
import { defaultGuest, synthesizeParty, type PartyGuestInput, type PartySynthResult } from '@/lib/party-synth';

interface EngineResults {
  bazi: BaziResult | null;
  ziwei: ZiweiResult | null;
  qimen: QiMenResult | null;
  liuyao: LiuYaoResult | null;
  astrology: AstrologyResult | null;
  tarot: TarotReading | null;
  horoscope: HoroscopeResult | null;
}

type Step = 'input' | 'result' | 'report';

function CollapsibleSection({ title, icon, children, defaultOpen = true }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between min-h-[44px] text-left"
      >
        <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-primary">{icon}</span> {title}
        </h2>
        <span className={`text-muted-foreground text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && <div>{children}</div>}
    </section>
  );
}

export default function UnifiedPage() {
  const [step, setStep] = useState<Step>('input');
  const [engineResults, setEngineResults] = useState<EngineResults>({
    bazi: null, ziwei: null, qimen: null, liuyao: null,
    astrology: null, tarot: null, horoscope: null,
  });
  const [summary, setSummary] = useState('');
  const { report, isGenerating, reportError, handleGenerateReport, clearReportError } = useReport();
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [formLoading, setFormLoading] = useState(false);
  const [partyGuests, setPartyGuests] = useState<PartyGuestInput[]>([
    defaultGuest({ id: 'host', name: '我', year: 1998, month: 7, day: 12, shichenIndex: 6 }),
  ]);
  const [partySynth, setPartySynth] = useState<PartySynthResult | null>(null);

  const handleFormSubmit = useCallback(async (data: {
    date: DateSelection;
    gender?: string;
    city?: CitySelection;
    mbti?: string;
  }) => {
    setFormLoading(true);
    const { year, month, day, shichenIndex } = data.date;
    const shichenNames = [
      '子时(23-1点)', '丑时(1-3点)', '寅时(3-5点)', '卯时(5-7点)',
      '辰时(7-9点)', '巳时(9-11点)', '午时(11-13点)', '未时(13-15点)',
      '申时(15-17点)', '酉时(17-19点)', '戌时(19-21点)', '亥时(21-23点)',
    ];

    const guests = syncHostAsFirstGuest(partyGuests, {
      date: data.date,
      gender: data.gender,
      mbti: data.mbti,
      name: partyGuests[0]?.name || '我',
    });
    setPartyGuests(guests);
    const synth = synthesizeParty(guests);
    setPartySynth(synth);

    const guestLines = synth.guests
      .map((g) => `- ${g.name}${g.mbti ? ` MBTI:${g.mbti}` : ''}｜${g.bazi.bazi}｜属${g.bazi.shengxiao}`)
      .join('\n');
    setSummary(
      `【多人聚餐综合测算】\n人数：${synth.peopleCount}\n` +
      `主测出生：${year}年${month}月${day}日 ${shichenNames[shichenIndex]}` +
      `${data.gender ? ' 性别：' + data.gender : ''}` +
      `${data.city ? ' 出生地：' + data.city.province + data.city.city : ''}\n` +
      `${synth.groupFoodSummary}\n\n同行八字：\n${guestLines}\n\n来源：今天吃什么 AI 算命`
    );

    const hour = SHICHEN_TO_HOUR[shichenIndex];
    const gender = data.gender || '男';
    const results: EngineResults = {
      bazi: null, ziwei: null, qimen: null, liuyao: null,
      astrology: null, tarot: null, horoscope: null,
    };

    try { results.bazi = calculateBazi(year, month, day, hour); } catch { results.bazi = calculateBazi(1990, 6, 15, 12); }
    try {
      results.ziwei = calculateZiwei(
        year, month, day, shichenIndex, gender,
        data.city?.province, data.city?.city, data.city?.longitude
      );
    } catch { results.ziwei = calculateZiwei(1990, 6, 15, 6, '男'); }
    try { results.qimen = calculateQiMen(year, month, day, hour); } catch { results.qimen = calculateQiMen(1990, 6, 15, 12); }
    {
      const dongCount = 1 + Math.floor(Math.random() * 3);
      const dongYaoIdxs: number[] = [];
      while (dongYaoIdxs.length < dongCount) {
        const idx = Math.floor(Math.random() * 6);
        if (!dongYaoIdxs.includes(idx)) dongYaoIdxs.push(idx);
      }
      try { results.liuyao = calculateLiuYao(year, month, day, hour, dongYaoIdxs); }
      catch { results.liuyao = calculateLiuYao(1990, 6, 15, 12, [2]); }
    }
    {
      const lat = 39.9;
      const lon = data.city?.longitude || 116.4;
      try { results.astrology = calculateAstrology(year, month, day, hour, lat, lon); }
      catch { results.astrology = calculateAstrology(1995, 3, 15, 15, 39.9, 116.4); }
    }
    results.tarot = drawCards(3);
    {
      const zodiac = getZodiacFromDate(month, day);
      try { results.horoscope = calculateHoroscope(zodiac); }
      catch { results.horoscope = calculateHoroscope('天蝎'); }
    }

    setEngineResults(results);
    setFlippedCards(new Set());
    setStep('report');
    setFormLoading(false);

    const partyMbti = synth.guests.map((g) => g.mbti).filter(Boolean).join(',');
    const birthInfo =
      `${year}-${month}-${day} ${shichenNames[shichenIndex]} ${gender}` +
      `${data.city ? ` 出生地${data.city.city}` : ''}` +
      `${partyMbti ? ` MBTI:${partyMbti}` : ''}` +
      ` 聚餐${synth.peopleCount}人 ${synth.groupFoodSummary}`;
    await handleGenerateReport(results, 'unified', birthInfo);
  }, [handleGenerateReport, partyGuests]);

  const handleFlipCard = useCallback((index: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="mb-5 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">AI 一键算命</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            多人聚餐可填各位生辰与 MBTI，综合八字后再推荐吃什么与破冰
          </p>
        </div>

        {step === 'input' && (
          <div className="max-w-lg mx-auto space-y-4">
            <PartyGuestsForm value={partyGuests} onChange={setPartyGuests} />
            <InputForm
              showDate={true}
              showShichen={true}
              showGender={true}
              showCity={true}
              showMbti={true}
              loading={formLoading}
              onSubmit={handleFormSubmit}
              title="主测人生辰（同步为第一位）"
              description="主测人信息会写入同行人列表第一位；可在上方继续添加同伴"
              submitLabel="开始多人综合测算"
            />
          </div>
        )}

        {(step === 'result' || step === 'report') && (
          <div className="space-y-5 md:space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                已按 {partySynth?.peopleCount || 1} 人综合测算
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  clearReportError();
                  setPartySynth(null);
                }}
                className="min-h-[44px] px-3 rounded-xl text-sm text-primary border border-primary/30"
              >
                重新填写
              </button>
            </div>
            {summary && <CopyableSummary summary={summary} />}
            {partySynth && <PartySynthPanel synth={partySynth} />}

            <FortuneReport
              report={
                report && partySynth?.groupFoodSummary
                  ? { ...report, foodSummary: partySynth.groupFoodSummary }
                  : report
              }
              isGenerating={isGenerating}
              reportError={reportError}
              onRetry={() => handleGenerateReport(engineResults, 'unified')}
            />

            <NearbyMerchants
              defaultPeople={partySynth?.peopleCount || partyGuests.length || 4}
              cuisineHint={partySynth?.cuisineKeywords?.join('、')}
            />

            {engineResults.bazi && (
              <CollapsibleSection title="八字命盘（主测）" icon="✦" defaultOpen={false}>
                <div className="bg-card rounded-xl p-3 md:p-5">
                  <div className="text-center mb-3 text-sm text-muted-foreground">
                    {engineResults.bazi.bazi} | {engineResults.bazi.shengxiao}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '年柱', ...engineResults.bazi.yearPillar },
                      { label: '月柱', ...engineResults.bazi.monthPillar },
                      { label: '日柱', ...engineResults.bazi.dayPillar },
                      { label: '时柱', ...engineResults.bazi.hourPillar },
                    ].map((p) => (
                      <div key={p.label} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">{p.label}</div>
                        <div className="bg-primary/5 rounded-lg py-2 border border-primary/10">
                          <div className="text-base font-bold text-primary">{p.gan}</div>
                          <div className="text-base font-bold text-foreground">{p.zhi}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {engineResults.ziwei && (
              <CollapsibleSection title="紫微斗数" icon="♕" defaultOpen={false}>
                <ZiweiChartBoard result={engineResults.ziwei} />
              </CollapsibleSection>
            )}

            {engineResults.qimen && (
              <CollapsibleSection title="奇门遁甲" icon="⚔" defaultOpen={false}>
                <div className="bg-card rounded-xl p-3 text-sm text-muted-foreground">
                  {engineResults.qimen.dunType}第{engineResults.qimen.juNumber}局 · {engineResults.qimen.solarTerm}
                </div>
              </CollapsibleSection>
            )}

            {engineResults.liuyao && (
              <CollapsibleSection title="六爻占卜" icon="☲" defaultOpen={false}>
                <div className="bg-card rounded-xl p-3 text-sm">
                  本卦 {engineResults.liuyao.benGua} · 变卦 {engineResults.liuyao.bianGua || '无'}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {[...engineResults.liuyao.yaoDetails].reverse().map((yao) => (
                      <div key={yao.position}>{YAO_WEI[yao.position]} {yao.ganZhi} {yao.liuQin}</div>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {engineResults.astrology && (
              <CollapsibleSection title="星座星盘" icon="☉" defaultOpen={false}>
                <div className="bg-card rounded-xl p-3 text-sm">
                  太阳{engineResults.astrology.sun} · 月亮{engineResults.astrology.moon} · 上升{engineResults.astrology.ascendant}
                </div>
              </CollapsibleSection>
            )}

            {engineResults.tarot && (
              <CollapsibleSection title="塔罗占卜" icon="☽" defaultOpen={false}>
                <div className="grid grid-cols-3 gap-2">
                  {engineResults.tarot.cards.map((cardInfo, idx) => {
                    const isFlipped = flippedCards.has(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleFlipCard(idx)}
                        className="min-h-[120px] rounded-xl border border-primary/20 bg-card p-2 text-xs"
                      >
                        {!isFlipped
                          ? '点击翻牌'
                          : `${cardInfo.position} ${cardInfo.card.name}${cardInfo.isReversed ? '（逆）' : ''}`}
                      </button>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {engineResults.horoscope && (
              <CollapsibleSection title="每日运势" icon="★" defaultOpen={false}>
                <div className="bg-card rounded-xl p-3 text-sm">
                  {engineResults.horoscope.zodiac} · 宜 {engineResults.horoscope.yi.join('、')} · 忌 {engineResults.horoscope.ji.join('、')}
                </div>
              </CollapsibleSection>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
