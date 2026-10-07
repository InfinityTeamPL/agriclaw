'use client';

// Panel gdy agent w stanie ERROR. Przycisk Retry:
//  1. DELETE /api/agents/[id]   — usuwa agenta + VM
//  2. redirect /dashboard/agent/deploy   — żeby user zrobił świeży deploy

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  agentId: string;
}

export function AgentErrorPanel({ agentId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleRetry = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === 'string' ? body.error : 'Nie udało się usunąć agenta.');
      }
      toast.success('Usunięto uszkodzonego agenta — zaczynam od nowa');
      router.push('/dashboard/agent/deploy');
    } catch (err) {
      const msg =
        err instanceof TypeError
          ? 'Brak połączenia z serwerem. Spróbuj ponownie.'
          : err instanceof Error
            ? err.message
            : 'Nie udało się usunąć agenta.';
      toast.error(msg);
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <div className="bg-card border border-destructive/30 rounded-lg shadow-card p-8 text-center space-y-4">
      <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Agent wymaga ponownego wdrożenia
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Ostatni provisioning się nie udał. Usuniemy uszkodzonego agenta (i jego VM) i zaczniemy od
          nowa — zajmie to kilka minut.
        </p>
      </div>
      {confirming ? (
        <div className="space-y-3" role="alert">
          <p className="text-sm font-medium text-foreground">
            Na pewno? Uszkodzony agent i jego serwer zostaną trwale usunięte.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={handleRetry}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 min-h-11 bg-destructive text-destructive-foreground font-semibold px-4 rounded-md shadow-card hover:brightness-110 disabled:opacity-50 transition"
            >
              <RotateCcw className={busy ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
              {busy ? 'Usuwam...' : 'Tak, usuń i wdróż od nowa'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="inline-flex items-center justify-center min-h-11 px-4 rounded-md border border-border font-medium text-foreground hover:bg-secondary transition"
            >
              Anuluj
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-2 min-h-11 bg-primary text-primary-foreground font-semibold px-4 rounded-md shadow-card hover:brightness-110 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Wdróż od nowa
        </button>
      )}
    </div>
  );
}
