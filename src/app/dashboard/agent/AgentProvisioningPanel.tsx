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

  useEffect(() => {
    const started = Date.now();
    let aborted = false;

    const timer = setInterval(() => {
      if (!aborted) setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    const poll = async () => {
      while (!aborted) {
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
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
      {nowReady ? (
        <>
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-semibold text-gray-900">Agent gotowy</h2>
          <p className="text-sm text-gray-500">Przeładowuję stronę...</p>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-emerald-600 mx-auto animate-spin" />
          <h2 className="text-lg font-semibold text-gray-900">
            {mock ? 'Mock provisioning w toku' : 'Tworzę Twojego agenta'}
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {mock
              ? 'Dev mode — symulacja, zwykle 3 sekundy.'
              : 'Tworzę VM na Hetznerze i stawiam OpenClaw Gateway. Zwykle 5-10 minut. Możesz zamknąć stronę — provisioning pracuje w tle.'}
          </p>
          <div className="text-xs text-gray-400">
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
