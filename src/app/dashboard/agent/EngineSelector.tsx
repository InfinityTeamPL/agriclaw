'use client';

// Wybór silnika czatu AI per gospodarstwo (decyzja rolnika, nie automat):
//  - auto:      OpenClaw jeśli wdrożony, inaczej wbudowany (rozsądny default)
//  - agroagent: wbudowany (MiniMax) — działa od razu, bez własnego serwera
//  - openclaw:  autonomiczny agent na własnym serwerze (heartbeat, pamięć plikowa)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Zap, Server, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Engine = 'auto' | 'agroagent' | 'openclaw';

const OPTIONS: Array<{
  value: Engine;
  icon: typeof Zap;
  title: string;
  desc: string;
}> = [
  {
    value: 'auto',
    icon: Wand2,
    title: 'Auto',
    desc: 'OpenClaw, jeśli wdrożony — inaczej wbudowany. Dobre ustawienie na start.',
  },
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
  const [value, setValue] = useState<Engine>(current);
  const [saving, setSaving] = useState(false);

  const choose = async (next: Engine) => {
    if (saving || next === value) return;
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
      router.refresh();
    } catch {
      setValue(prev);
      toast.error('Nie udało się zapisać wyboru silnika.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-card border border-border shadow-card p-4">
      <div className="hud-label mb-3">Silnik czatu AI</div>
      <div className="grid sm:grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              disabled={saving}
              onClick={() => choose(o.value)}
              className={cn(
                'text-left rounded-md border p-3 transition disabled:opacity-60',
                active
                  ? 'border-signal-healthy/60 bg-signal-healthy/5 ring-1 ring-signal-healthy/25'
                  : 'border-border bg-background hover:border-foreground/25',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <o.icon className={cn('w-4 h-4', active ? 'text-signal-healthy' : 'text-muted-foreground')} />
                <span className="text-sm font-semibold text-foreground">{o.title}</span>
                {o.value === 'openclaw' && !hasReadyAgent && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border bg-secondary text-muted-foreground border-border">
                    wymaga wdrożenia
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{o.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
