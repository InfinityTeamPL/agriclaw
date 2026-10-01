'use client';

// Włącznik powiadomień Web Push (lib/push.ts). Prowadzi rolnika przez typowe
// przeszkody: iPhone bez dodania do ekranu głównego, zablokowana zgoda, brak
// kluczy na serwerze — zamiast cichej porażki.

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

type State = 'loading' | 'unsupported' | 'ios-install' | 'not-configured' | 'denied' | 'off' | 'on';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  return navigator.serviceWorker.ready;
}

export function PushToggle() {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState(isIos && !standalone ? 'ios-install' : 'unsupported');
        return;
      }
      if (!PUBLIC_KEY) return setState('not-configured');
      if (Notification.permission === 'denied') return setState('denied');
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? 'on' : 'off');
    })().catch(() => setState('unsupported'));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const reg = await getRegistration();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY!) as BufferSource,
        }));
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('on');
      toast.success('Powiadomienia włączone na tym urządzeniu.');
    } catch {
      toast.error('Nie udało się włączyć powiadomień. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('off');
      toast.success('Powiadomienia wyłączone na tym urządzeniu.');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = (await res.json()) as { sent?: number; error?: string };
      if (!res.ok) toast.error(data.error ?? 'Nie udało się wysłać.');
      else if (!data.sent) toast.error('Brak aktywnych urządzeń — włącz powiadomienia ponownie.');
      else toast.success('Wysłano. Powiadomienie powinno pojawić się za chwilę.');
    } finally {
      setBusy(false);
    }
  };

  const hint: Partial<Record<State, string>> = {
    unsupported: 'Ta przeglądarka nie obsługuje powiadomień. Na telefonie użyj Chrome (Android) lub Safari (iPhone).',
    'ios-install':
      'Na iPhonie: w Safari stuknij „Udostępnij” → „Do ekranu początkowego”, otwórz AgriClaw z ikony i wróć tutaj.',
    'not-configured': 'Powiadomienia nie są jeszcze włączone na serwerze.',
    denied: 'Powiadomienia są zablokowane w ustawieniach przeglądarki dla tej strony — odblokuj je i odśwież.',
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary">
            {state === 'on' ? <Bell className="h-4 w-4 text-signal-healthy" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div>
            <div className="font-display font-semibold text-foreground">Powiadomienia na telefon</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Alert, gdy pole wymaga uwagi — bez instalowania aplikacji i bez SMS-ów. Działa na tym urządzeniu.
            </p>
            {hint[state] && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-signal-frost" />
                {hint[state]}
              </p>
            )}
          </div>
        </div>
        {state === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {(state === 'off' || state === 'on') && (
        <div className="mt-4 flex flex-wrap gap-2">
          {state === 'off' ? (
            <button
              onClick={enable}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Włącz powiadomienia
            </button>
          ) : (
            <>
              <button
                onClick={test}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:brightness-110 disabled:opacity-60"
              >
                Wyślij testowe
              </button>
              <button
                onClick={disable}
                disabled={busy}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-foreground/30 disabled:opacity-60"
              >
                Wyłącz
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
