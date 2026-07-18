'use client';

// Wybór silnika czatu AI per gospodarstwo — kompaktowy dropdown w nagłówku
// (obok profilu/dzwonka), żeby NIE zabierać miejsca oknu rozmowy. Menu wysuwa
// się absolutnie, więc otwarcie nie przepycha layoutu ani nie skraca czatu.
// Domyślnie działa wbudowany agent (MiniMax); OpenClaw to jawny wybór zaawansowany.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Zap, Server, ChevronDown, Check } from 'lucide-react';
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
    title: 'Wbudowany (MiniMax)',
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
  const rootRef = useRef<HTMLDivElement | null>(null);

  const active = OPTIONS.find((o) => o.value === value)!;

  // Zamknij po kliknięciu poza dropdownem lub klawiszem Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

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
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex items-center gap-2 h-10 px-3 rounded-md border bg-card text-left transition',
          open ? 'border-foreground/25' : 'border-border hover:border-foreground/25',
        )}
      >
        <span className="hud-label hidden sm:inline">Silnik</span>
        <active.icon className="w-4 h-4 text-signal-healthy shrink-0" />
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {value === 'agroagent' ? 'Wbudowany' : 'OpenClaw'}
        </span>
        {value === 'openclaw' && !hasReadyAgent && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-secondary text-muted-foreground border-border hidden sm:inline">
            wymaga wdrożenia
          </span>
        )}
        <ChevronDown
          className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          // Na mobile selektor ląduje po lewej (zawinięcie nagłówka) — kotwiczymy
          // menu do lewej, żeby nie uciekło poza ekran; na desktopie selektor jest
          // po prawej, więc kotwiczymy do prawej.
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-card shadow-pop p-1.5"
        >
          <div className="hud-label px-2 py-1.5">Silnik czatu AI</div>
          {OPTIONS.map((o) => {
            const isActive = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                disabled={saving}
                onClick={() => choose(o.value)}
                className={cn(
                  'w-full text-left rounded-md p-2.5 transition disabled:opacity-60',
                  isActive ? 'bg-signal-healthy/5' : 'hover:bg-secondary',
                )}
              >
                <div className="flex items-center gap-2">
                  <o.icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-signal-healthy' : 'text-muted-foreground',
                    )}
                  />
                  <span className="text-sm font-semibold text-foreground">{o.title}</span>
                  {o.value === 'openclaw' && !hasReadyAgent && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-secondary text-muted-foreground border-border">
                      wymaga wdrożenia
                    </span>
                  )}
                  {isActive && <Check className="w-4 h-4 text-signal-healthy ml-auto shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1 pl-6">{o.desc}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
