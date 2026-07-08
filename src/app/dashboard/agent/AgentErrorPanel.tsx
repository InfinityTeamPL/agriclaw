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

  const handleRetry = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Nie mogę usunąć agenta');
      }
      toast.success('Usunięto uszkodzonego agenta — zaczynam od nowa');
      router.push('/dashboard/agent/deploy');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      setBusy(false);
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
      <button
        type="button"
        onClick={handleRetry}
        disabled={busy}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md shadow-card hover:brightness-110 disabled:opacity-50 transition"
      >
        <RotateCcw className={busy ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
        {busy ? 'Usuwam...' : 'Uruchom ponownie'}
      </button>
    </div>
  );
}
