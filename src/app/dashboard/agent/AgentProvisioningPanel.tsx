'use client';

// Panel pokazywany gdy agent jest w trakcie prowizjonowania.
// Odpytuje /api/agents/[id]/health co 5 sek aż status zmieni się na READY.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  agentId: string;
  mock: boolean;
}

export function AgentProvisioningPanel({ agentId, mock }: Props) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [nowReady, setNowReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const started = Date.now();
    let aborted = false;

    const timer = setInterval(() => {
      if (!aborted) setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    const poll = async () => {
      while (!aborted) {
        // Bez limitu spinner kręcił się w nieskończoność, gdy API zwracało błąd.
        if (Date.now() - started > 20 * 60 * 1000) {
          if (!aborted) setTimedOut(true);
          return;
        }
        try {
          const res = await fetch(`/api/agents/${agentId}/health`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'READY' && data.ok) {
              if (aborted) return;
              setNowReady(true);
              setTimeout(() => router.refresh(), 800);
              return;
            }
            if (data.status === 'ERROR') {
              if (aborted) return;
              router.refresh();
              return;
            }
          }
        } catch {
          // retry
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
    };
    poll();

    return () => {
      aborted = true;
      clearInterval(timer);
    };
  }, [agentId, router]);

  return (
    <div className="bg-card border border-border rounded-lg shadow-card p-8 text-center space-y-4">
      {timedOut ? (
        <>
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Wdrożenie trwa dłużej niż zwykle
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Zwykle zajmuje to 5-10 minut. Odśwież stronę za chwilę. Jeśli agent dalej się nie uruchamia,
            napisz do nas: contact@infinityteam.io.
          </p>
        </>
      ) : nowReady ? (
        <>
          <CheckCircle2 className="w-12 h-12 text-signal-healthy mx-auto" />
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Agent gotowy</h2>
          <p className="text-sm text-muted-foreground">Przeładowuję stronę...</p>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            {mock ? 'Symulacja wdrożenia (tryb deweloperski)' : 'Tworzę Twojego agenta'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {mock
              ? 'To tylko symulacja, zwykle trwa kilka sekund.'
              : 'Przygotowuję Twojego agenta na osobnym, bezpiecznym serwerze. Zwykle 5-10 minut. Możesz zamknąć stronę — wdrożenie trwa w tle.'}
          </p>
          <div className="text-xs text-muted-foreground">
            {formatElapsed(elapsed)} · sprawdzam status co 5 sekund
          </div>
        </>
      )}
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
