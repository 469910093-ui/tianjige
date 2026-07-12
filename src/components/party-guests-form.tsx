'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { MBTI_OPTIONS, SHICHEN_LABELS, type DateSelection } from '@/components/input-form';
import { defaultGuest, type PartyGuestInput } from '@/lib/party-synth';

export interface PartyGuestsFormProps {
  value: PartyGuestInput[];
  onChange: (guests: PartyGuestInput[]) => void;
  /** 主测人（表单里那一位）同步为第一位宾客时的提示 */
  hostHint?: string;
}

function toDateValue(g: PartyGuestInput): string {
  const m = String(g.month).padStart(2, '0');
  const d = String(g.day).padStart(2, '0');
  return `${g.year}-${m}-${d}`;
}

export function syncHostAsFirstGuest(
  guests: PartyGuestInput[],
  host: { date: DateSelection; gender?: string; mbti?: string; name?: string }
): PartyGuestInput[] {
  const first = defaultGuest({
    id: guests[0]?.id || 'host',
    name: host.name || guests[0]?.name || '我',
    gender: host.gender || '男',
    year: host.date.year,
    month: host.date.month,
    day: host.date.day,
    shichenIndex: host.date.shichenIndex,
    mbti: host.mbti || '',
  });
  if (guests.length <= 1) return [first];
  return [first, ...guests.slice(1)];
}

export default function PartyGuestsForm({ value, onChange }: PartyGuestsFormProps) {
  const [openId, setOpenId] = useState<string | null>(value[0]?.id ?? null);
  const pendingScrollId = useRef<string | null>(null);

  useEffect(() => {
    const id = pendingScrollId.current;
    if (!id) return;
    pendingScrollId.current = null;
    const el = document.getElementById(`guest-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [value]);

  const update = (id: string, patch: Partial<PartyGuestInput>) => {
    onChange(value.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const addGuest = () => {
    if (value.length >= 12) return;
    const g = defaultGuest({
      name: `同伴${Math.max(1, value.length)}`,
      year: 1995,
      month: 3,
      day: 8,
    });
    pendingScrollId.current = g.id;
    onChange([...value, g]);
    setOpenId(g.id);
  };

  const removeGuest = (id: string) => {
    if (value.length <= 1) return;
    const next = value.filter((g) => g.id !== id);
    onChange(next);
    if (openId === id) setOpenId(next[0]?.id ?? null);
  };

  return (
    <section className="bg-card rounded-xl p-3 md:p-5 border border-outline-variant/25 space-y-3">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        同行
      </h2>

      <ul className="space-y-2">
        {value.map((g, idx) => {
          const open = openId === g.id;
          return (
            <li
              key={g.id}
              id={`guest-${g.id}`}
              className="rounded-xl border border-outline-variant/30 bg-background/50 overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 min-h-[48px] px-3 text-left"
                onClick={() => setOpenId(open ? null : g.id)}
              >
                <span className="text-sm font-medium text-foreground truncate">
                  {idx === 0 ? '主测 · ' : ''}
                  {g.name || `同伴${idx + 1}`}
                  {g.mbti ? ` · ${g.mbti}` : ''}
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    · {g.year}/{g.month}/{g.day}
                  </span>
                </span>
                {value.length > 1 && idx > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-destructive p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGuest(g.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') removeGuest(g.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </span>
                )}
              </button>

              {open && (
                <div className="px-3 pb-3 space-y-2 border-t border-outline-variant/20 pt-2">
                  <label className="block text-xs text-muted-foreground">
                    称呼
                    <input
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-outline-variant/40 bg-background px-3 text-sm text-foreground"
                      value={g.name}
                      onChange={(e) => update(g.id, { name: e.target.value })}
                      placeholder="如：阿伟"
                    />
                  </label>
                  <div className="flex gap-2">
                    {(['男', '女'] as const).map((sex) => (
                      <button
                        key={sex}
                        type="button"
                        onClick={() => update(g.id, { gender: sex })}
                        className={`flex-1 min-h-[40px] rounded-xl text-sm ${
                          g.gender === sex
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {sex}
                      </button>
                    ))}
                  </div>
                  <label className="block text-xs text-muted-foreground">
                    出生日期
                    <input
                      type="date"
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-outline-variant/40 bg-background px-3 text-sm text-foreground"
                      value={toDateValue(g)}
                      onChange={(e) => {
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        if (y && m && d) update(g.id, { year: y, month: m, day: d });
                      }}
                    />
                  </label>
                  <label className="block text-xs text-muted-foreground">
                    时辰
                    <select
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-outline-variant/40 bg-background px-3 text-sm text-foreground"
                      value={g.shichenIndex ?? 6}
                      onChange={(e) => update(g.id, { shichenIndex: Number(e.target.value) })}
                    >
                      {SHICHEN_LABELS.map((lab, i) => (
                        <option key={lab} value={i}>
                          {lab}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-muted-foreground">
                    MBTI（选填）
                    <input
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-outline-variant/40 bg-background px-3 text-sm text-foreground"
                      value={g.mbti || ''}
                      maxLength={8}
                      placeholder="如 INFP"
                      onChange={(e) => update(g.id, { mbti: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MBTI_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update(g.id, { mbti: t })}
                        className={`min-h-[32px] px-2 rounded-full text-[11px] ${
                          g.mbti === t
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addGuest();
        }}
        disabled={value.length >= 12}
        className="w-full inline-flex items-center justify-center gap-1.5 min-h-[48px] px-3 rounded-xl border border-primary text-primary text-sm font-medium disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <Plus className="w-4 h-4" />
        添加同伴
      </button>
    </section>
  );
}
