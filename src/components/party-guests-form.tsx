'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { defaultGuest, type PartyGuestInput } from '@/lib/party-synth';

export interface PartyGuestsFormProps {
  value: PartyGuestInput[];
  onChange: (guests: PartyGuestInput[]) => void;
  /** 合盘提交；不传则只编辑名单 */
  onSubmit?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

function toDateValue(g: PartyGuestInput): string {
  const m = String(g.month).padStart(2, '0');
  const d = String(g.day).padStart(2, '0');
  return `${g.year}-${m}-${d}`;
}

export function syncHostAsFirstGuest(
  guests: PartyGuestInput[],
  host: { year: number; month: number; day: number; name?: string }
): PartyGuestInput[] {
  const first = defaultGuest({
    id: guests[0]?.id || 'host',
    name: host.name || guests[0]?.name || '我',
    gender: guests[0]?.gender || '男',
    year: host.year,
    month: host.month,
    day: host.day,
    shichenIndex: guests[0]?.shichenIndex ?? 6,
    mbti: guests[0]?.mbti || '',
  });
  if (guests.length <= 1) return [first];
  return [first, ...guests.slice(1)];
}

export default function PartyGuestsForm({
  value,
  onChange,
  onSubmit,
  loading,
  submitLabel = '合盘起卦',
}: PartyGuestsFormProps) {
  const [openId, setOpenId] = useState<string | null>(value[0]?.id ?? null);
  const pendingScrollId = useRef<string | null>(null);

  useEffect(() => {
    const id = pendingScrollId.current;
    if (!id) return;
    pendingScrollId.current = null;
    document.getElementById(`guest-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        同行 · 名字 + 生日
      </h2>
      <p className="text-xs text-muted-foreground">时辰默认午时，够用合盘与附近落座。</p>

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
                    名字
                    <input
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-outline-variant/40 bg-background px-3 text-sm text-foreground"
                      value={g.name}
                      onChange={(e) => update(g.id, { name: e.target.value })}
                      placeholder="如：阿伟"
                    />
                  </label>
                  <label className="block text-xs text-muted-foreground">
                    生日
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

      {onSubmit && (
        <button
          type="button"
          disabled={loading || value.length < 1}
          onClick={() => onSubmit()}
          className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {loading ? '测算中…' : submitLabel}
        </button>
      )}
    </section>
  );
}
