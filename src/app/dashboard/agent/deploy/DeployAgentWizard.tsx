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
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-600" />
          Uruchom AgroAgenta
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Agent AgriClaw Advisor dla {farmName}. Własny serwer, własne dane, własny model.
        </p>
      </div>

      <Stepper step={step} />

      {step === 1 && (
        <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Krok 1. Wybierz silnik</h2>
          </div>
          <p className="text-sm text-gray-500">
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
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon}</span>
                  <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                  <span
                    className={cn(
                      'ml-auto text-xs px-1.5 py-0.5 rounded-full border',
                      m.tier === 'premium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : m.tier === 'free'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : m.tier === 'budget'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200',
                    )}
                  >
                    {m.tier}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Dalej
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Krok 2. Wybierz kanał</h2>
          </div>
          <p className="text-sm text-gray-500">
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
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0',
                      channel === c.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{c.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.desc}</div>
                    {c.warning && channel === c.id && (
                      <div className="mt-2 inline-flex items-start gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
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
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              Wstecz
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Dalej
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Krok 3. Potwierdzenie</h2>
          </div>
          <dl className="text-sm space-y-2">
            <Row label="Gospodarstwo" value={farmName} />
            <Row label="Silnik" value={`${selectedModel?.icon ?? ''} ${selectedModel?.name ?? model}`} />
            <Row label="Kanał" value={CHANNELS.find((c) => c.id === channel)?.label ?? channel} />
            <Row label="Template" value="AgriClaw Advisor (agri-advisor)" />
            <Row label="Skille" value="agri-fields, agri-satellite, agri-weather, agri-notify" />
          </dl>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            Provisioning tworzy dedykowany serwer VM (Hetzner CX23) i stawia na nim OpenClaw Gateway
            z Twoją konfiguracją. Potrwa około 5-10 minut.
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              Wstecz
            </button>
            <button
              onClick={handleDeploy}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700"
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
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium text-right">{value}</dd>
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
                ? 'bg-emerald-600 text-white'
                : step > it.n
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-200 text-gray-600',
            )}
          >
            {step > it.n ? <CheckCircle2 className="w-4 h-4" /> : it.n}
          </div>
          <span
            className={cn(
              'text-sm',
              step === it.n ? 'font-semibold text-gray-900' : 'text-gray-500',
            )}
          >
            {it.label}
          </span>
          {idx < items.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center space-y-4">
      {status === 'READY' ? (
        <>
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Agent gotowy</h2>
          <p className="text-sm text-gray-500">Przekierowuję do panelu agenta...</p>
        </>
      ) : status === 'ERROR' ? (
        <>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Provisioning nie powiódł się</h2>
          <p className="text-sm text-gray-500">
            Spróbuj ponownie albo skontaktuj się z supportem jeśli błąd się powtarza.
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Spróbuj jeszcze raz
          </button>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-emerald-600 mx-auto animate-spin" />
          <h2 className="text-xl font-bold text-gray-900">
            {mock ? 'Mock provisioning...' : 'Tworzę agenta...'}
          </h2>
          <p className="text-sm text-gray-500">
            {mock
              ? 'Dev mode — symulowane uruchomienie. Status zmieni się na READY za chwilę.'
              : 'Tworzę VM na Hetznerze i stawiam OpenClaw Gateway. Potrwa 5-10 minut. Możesz zamknąć tę stronę — provisioning pracuje w tle.'}
          </p>
          <div className="text-xs text-gray-400">Sprawdzam status co 5 sekund...</div>
        </>
      )}
    </div>
  );
}
