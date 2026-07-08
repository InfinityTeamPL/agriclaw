'use client';

// Wizard 3-krokowy deployu agenta AgriClaw.
// Krok 1: wybór modelu AI (AI_MODELS z agent-models.ts)
// Krok 2: wybór kanału (WEB/WHATSAPP/TELEGRAM)
// Krok 3: podsumowanie + POST /api/agents/deploy + polling health
//
// Po READY -> redirect do /dashboard/agent.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Bot,
  ChevronRight,
  Cpu,
  MessageCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { AI_MODELS } from '@/lib/agent-models';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;
type Channel = 'WEB' | 'WHATSAPP' | 'TELEGRAM';

interface Props {
  farmId: string;
  farmName: string;
}

const CHANNELS: { id: Channel; label: string; desc: string; warning?: string }[] = [
  {
    id: 'WEB',
    label: 'Czat webowy',
    desc: 'Rozmowa w przeglądarce na stronie AgriClaw. Najprostszy start.',
  },
  {
    id: 'WHATSAPP',
    label: 'WhatsApp',
    desc: 'Alerty i rozmowa bezpośrednio na telefonie przez WhatsApp Business.',
    warning:
      'Wymaga dodatkowej konfiguracji: numer WhatsApp Business + weryfikacja Meta. Można uruchomić później.',
  },
  {
    id: 'TELEGRAM',
    label: 'Telegram',
    desc: 'Bot Telegrama — bezpłatny, szybki setup przez BotFather.',
  },
];

// Preferencje modeli dla rolnictwa — Sonnet na pierwszym miejscu (balans ceny/jakości).
const MODEL_ORDER = [
  'claude-sonnet-4',
  'claude-opus-4-6',
  'claude-haiku-3.5',
  'gpt-5.4',
  'gpt-4o',
  'gpt-4o-mini',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemma-4',
  'deepseek-r1',
  'llama-3.3-70b',
  'mistral-small-4',
  'minimax-m2.7',
];
const SORTED_MODELS = [...AI_MODELS].sort(
  (a, b) => MODEL_ORDER.indexOf(a.id) - MODEL_ORDER.indexOf(b.id),
);

export function DeployAgentWizard({ farmId, farmName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [model, setModel] = useState('claude-sonnet-4');
  const [channel, setChannel] = useState<Channel>('WEB');

  const [deploying, setDeploying] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'PROVISIONING' | 'READY' | 'ERROR' | null>(null);
  const [mock, setMock] = useState(false);

  const selectedModel = SORTED_MODELS.find((m) => m.id === model);

  const handleDeploy = async () => {
    if (deploying) return;
    setDeploying(true);
    setAgentStatus('PROVISIONING');
    try {
      const res = await fetch('/api/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, channel, model }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? 'Deploy failed');
      }
      setAgentId(data.agentId);
      setMock(Boolean(data.mock));
      await pollUntilReady(data.agentId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Nie udało się uruchomić agenta: ${msg}`);
      setAgentStatus('ERROR');
      setDeploying(false);
    }
  };

  const pollUntilReady = async (id: string) => {
    const start = Date.now();
    const timeoutMs = 20 * 60 * 1000; // 20 min

    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch(`/api/agents/${id}/health`, { cache: 'no-store' });
        if (!res.ok) continue;
        const health = await res.json();
        if (health.status === 'READY' && health.ok) {
          setAgentStatus('READY');
          toast.success('Agent gotowy — przekierowuję...');
          setTimeout(() => router.push('/dashboard/agent'), 800);
          return;
        }
        if (health.status === 'ERROR') {
          setAgentStatus('ERROR');
          toast.error('Provisioning nie powiódł się');
          setDeploying(false);
          return;
        }
      } catch {
        // keep polling
      }
    }
    setAgentStatus('ERROR');
    toast.error('Timeout — provisioning trwa zbyt długo');
    setDeploying(false);
  };

  if (deploying || agentStatus) {
    return (
      <ProvisioningView
        status={agentStatus}
        mock={mock}
        onRetry={() => {
          setAgentId(null);
          setAgentStatus(null);
          setDeploying(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          Uruchom AgroAgenta
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Agent AgriClaw Advisor dla {farmName}. Własny serwer, własne dane, własny model.
        </p>
      </div>

      <Stepper step={step} />

      {step === 1 && (
        <section className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold tracking-tight text-foreground">Krok 1. Wybierz silnik</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Claude Sonnet to zalecany domyślny model — dobry balans ceny i jakości. Modele premium dają
            lepsze reasoning ale kosztują więcej.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SORTED_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                className={cn(
                  'text-left p-3 rounded-lg border-2 transition',
                  model === m.id
                    ? 'border-signal-healthy/60 bg-signal-healthy/5 ring-1 ring-signal-healthy/25'
                    : 'border-border bg-card hover:border-foreground/25',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon}</span>
                  <span className="font-semibold text-foreground text-sm">{m.name}</span>
                  <span
                    className={cn(
                      'ml-auto text-xs px-1.5 py-0.5 rounded-full border',
                      m.tier === 'premium'
                        ? 'bg-signal-heat/10 text-signal-heat border-signal-heat/30'
                        : m.tier === 'free'
                          ? 'bg-signal-healthy/10 text-signal-healthy border-signal-healthy/30'
                          : m.tier === 'budget'
                            ? 'bg-signal-frost/10 text-signal-frost border-signal-frost/30'
                            : 'bg-secondary text-muted-foreground border-border',
                    )}
                  >
                    {m.tier}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md shadow-card hover:brightness-110 transition"
            >
              Dalej
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold tracking-tight text-foreground">Krok 2. Wybierz kanał</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Jak chcesz rozmawiać z agentem? Zawsze możesz zmienić później albo dodać kolejne kanały.
          </p>
          <div className="space-y-2">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border-2 transition',
                  channel === c.id
                    ? 'border-signal-healthy/60 bg-signal-healthy/5 ring-1 ring-signal-healthy/25'
                    : 'border-border bg-card hover:border-foreground/25',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0',
                      channel === c.id ? 'border-signal-healthy bg-signal-healthy' : 'border-input',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground text-sm">{c.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
                    {c.warning && channel === c.id && (
                      <div className="mt-2 inline-flex items-start gap-1 text-xs text-signal-heat bg-signal-heat/10 border border-signal-heat/30 rounded px-2 py-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{c.warning}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium px-4 py-2 rounded-md hover:bg-secondary transition"
            >
              Wstecz
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md shadow-card hover:brightness-110 transition"
            >
              Dalej
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="bg-card border border-border rounded-lg shadow-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold tracking-tight text-foreground">Krok 3. Potwierdzenie</h2>
          </div>
          <dl className="text-sm space-y-2">
            <Row label="Gospodarstwo" value={farmName} />
            <Row label="Silnik" value={`${selectedModel?.icon ?? ''} ${selectedModel?.name ?? model}`} />
            <Row label="Kanał" value={CHANNELS.find((c) => c.id === channel)?.label ?? channel} />
            <Row label="Template" value="AgriClaw Advisor (agri-advisor)" />
            <Row label="Skille" value="agri-fields, agri-satellite, agri-weather, agri-notify" />
          </dl>
          <div className="bg-secondary border border-border rounded-md p-3 text-xs text-muted-foreground">
            Provisioning tworzy dedykowany serwer VM (Hetzner CX23) i stawia na nim OpenClaw Gateway
            z Twoją konfiguracją. Potrwa około 5-10 minut.
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium px-4 py-2 rounded-md hover:bg-secondary transition"
            >
              Wstecz
            </button>
            <button
              onClick={handleDeploy}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md shadow-card hover:brightness-110 transition"
            >
              <Bot className="w-4 h-4" />
              Uruchom agenta
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium text-right">{value}</dd>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const items = [
    { n: 1, label: 'Model' },
    { n: 2, label: 'Kanał' },
    { n: 3, label: 'Potwierdzenie' },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((it, idx) => (
        <div key={it.n} className="flex items-center gap-2 flex-1">
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
              step === it.n
                ? 'bg-primary text-primary-foreground'
                : step > it.n
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {step > it.n ? <CheckCircle2 className="w-4 h-4" /> : it.n}
          </div>
          <span
            className={cn(
              'text-sm',
              step === it.n ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {it.label}
          </span>
          {idx < items.length - 1 && <div className="flex-1 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

function ProvisioningView({
  status,
  mock,
  onRetry,
}: {
  status: 'PROVISIONING' | 'READY' | 'ERROR' | null;
  mock: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-card p-6 sm:p-8 text-center space-y-4">
      {status === 'READY' ? (
        <>
          <CheckCircle2 className="w-12 h-12 text-signal-healthy mx-auto" />
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Agent gotowy</h2>
          <p className="text-sm text-muted-foreground">Przekierowuję do panelu agenta...</p>
        </>
      ) : status === 'ERROR' ? (
        <>
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Provisioning nie powiódł się</h2>
          <p className="text-sm text-muted-foreground">
            Spróbuj ponownie albo skontaktuj się z supportem jeśli błąd się powtarza.
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md shadow-card hover:brightness-110 transition"
          >
            Spróbuj jeszcze raz
          </button>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {mock ? 'Mock provisioning...' : 'Tworzę agenta...'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mock
              ? 'Dev mode — symulowane uruchomienie. Status zmieni się na READY za chwilę.'
              : 'Tworzę VM na Hetznerze i stawiam OpenClaw Gateway. Potrwa 5-10 minut. Możesz zamknąć tę stronę — provisioning pracuje w tle.'}
          </p>
          <div className="text-xs text-muted-foreground">Sprawdzam status co 5 sekund...</div>
        </>
      )}
    </div>
  );
}
