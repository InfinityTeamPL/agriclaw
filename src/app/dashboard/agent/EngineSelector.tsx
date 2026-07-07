'use client';

// Wybór silnika czatu AI per gospodarstwo — kompaktowy, żeby nie zabierać
// miejsca oknu czatu: zwinięty to jedna linijka ze stanem, opcje pokazują się
// dopiero po rozwinięciu. Domyślnie działa wbudowany agent (MiniMax);
// OpenClaw jest jawnym wyborem zaawansowanym.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Zap, Server, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Engine = 'auto' | 'agroagent' | 'openclaw';
// W UI są dwie opcje; 'auto' (legacy default w DB) prezentujemy jako wbudowany,
// bo tak też rozstrzyga go resolveChatEngine.
type UiEngine = 'agroagent' | 'openclaw';

const OPTIONS: Array<{
  value: UiEngine;
  icon: typeof Zap;
  title: string;
  desc: string;
}> = [
  {
    value: 'agroagent',
    icon: Zap,
    title: 'Wbudowany',
    desc: 'Działa od razu, bez serwera. Dane pól, pogoda i rejestr ŚOR w rozmowie.',
  },
  {
    value: 'openclaw',
    icon: Server,
    title: 'OpenClaw (autonomiczny)',
    desc: 'Własny serwer agenta: poranny heartbeat, pamięć plikowa, pełna autonomia.',
  },
];

export function EngineSelector({
  farmId,
  current,
  hasReadyAgent,
}: {
  farmId: string;
  current: Engine;
  hasReadyAgent: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<UiEngine>(current === 'openclaw' ? 'openclaw' : 'agroagent');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const active = OPTIONS.find((o) => o.value === value)!;

  const choose = async (next: UiEngine) => {
    if (saving) return;
    if (next === value) {
      setOpen(false);
      return;
    }
    const prev = value;
    setValue(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/farms/${farmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatEngine: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(
        next === 'openclaw' && !hasReadyAgent
          ? 'Silnik: OpenClaw. Uwaga — agent nie jest jeszcze wdrożony.'
          : 'Silnik czatu zapisany.',
      );
      setOpen(false);
      router.refresh();
    } catch {
      setValue(prev);
      toast.error('Nie udało się zapisać wyboru silnika.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-card border border-border shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className="hud-label">Silnik</span>
        <active.icon className="w-3.5 h-3.5 text-signal-healthy" />
        <span className="text-sm font-medium text-foreground">
          {value === 'agroagent' ? 'Wbudowany (MiniMax)' : 'OpenClaw'}
        </span>
        {value === 'openclaw' && !hasReadyAgent && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-secondary text-muted-foreground border-border">
            wymaga wdrożenia
          </span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground ml-auto transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="grid sm:grid-cols-2 gap-2 p-3 pt-0">
          {OPTIONS.map((o) => {
            const isActive = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                disabled={saving}
                onClick={() => choose(o.value)}
                className={cn(
                  'text-left rounded-md border p-3 transition disabled:opacity-60',
                  isActive
                    ? 'border-signal-healthy/60 bg-signal-healthy/5 ring-1 ring-signal-healthy/25'
                    : 'border-border bg-background hover:border-foreground/25',
                )}
              >
                <div className="flex items-center gap-2 sm:mb-1">
                  <o.icon
                    className={cn('w-4 h-4', isActive ? 'text-signal-healthy' : 'text-muted-foreground')}
                  />
                  <span className="text-sm font-semibold text-foreground">{o.title}</span>
                  {o.value === 'openclaw' && !hasReadyAgent && (
                    <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border bg-secondary text-muted-foreground border-border">
                      wymaga wdrożenia
                    </span>
                  )}
                </div>
                {/* Opisy tylko od sm — na telefonie selektor ma być kompaktowy */}
                <p className="hidden sm:block text-xs text-muted-foreground leading-relaxed">{o.desc}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
