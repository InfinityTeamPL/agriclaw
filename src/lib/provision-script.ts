import { AI_MODELS } from "@/lib/agent-models";

export interface ProvisionConfig {
  agentName: string;
  agentId: string;
  gatewayToken: string;
  model: string;
  channelType: string;
  channelToken: string;
  workspaceFiles: Record<string, string>;
  callbackUrl: string;
  callbackToken: string;
  apiKeys: { anthropic?: string; openai?: string; google?: string };
  minimaxKey?: string;
  serverTier?: "PREMIUM" | "PRO" | "ULTRA_PRO";
  skills: string[];
  deepseekKey?: string;
  channelConfig?: Record<string, unknown>;
  integrationKeys?: Record<string, unknown>;
}

function resolveModelId(model: string): string {
  const found = AI_MODELS.find((m) => m.id === model);
  return found?.providerModelId || model;
}

function getApiKeyEnv(
  model: string,
  userKeys: { anthropic?: string; openai?: string; google?: string }
): { name: string; value: string } {
  const found = AI_MODELS.find((m) => m.id === model);
  const provider = found?.provider.toLowerCase() || "openai";

  if (provider === "anthropic" && userKeys.anthropic)
    return { name: "ANTHROPIC_API_KEY", value: userKeys.anthropic };
  if (provider === "openai" && userKeys.openai)
    return { name: "OPENAI_API_KEY", value: userKeys.openai };
  if (provider === "google" && userKeys.google)
    return { name: "GOOGLE_AI_API_KEY", value: userKeys.google };

  return { name: "", value: "" };
}

function shellEscape(s: string): string {
  return s
    .replace(/\0/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/`/g, "\\`")
    .replace(/"/g, '\\"')
    .replace(/!/g, "\\!")
    .replace(/\r?\n/g, " ");
}

function getMemoryLimit(tier?: string): string {
  if (tier === "PRO") return "6g";
  if (tier === "ULTRA_PRO") return "12g";
  return "3g";
}

function getNodeMaxOldSpace(tier?: string): string {
  if (tier === "PRO") return "4096";
  if (tier === "ULTRA_PRO") return "8192";
  return "2048";
}

function getSandboxMode(tier?: string): string {
  if (tier === "PRO") return "non-main";
  if (tier === "ULTRA_PRO") return "all";
  return "off";
}

function getToolsProfile(_tier?: string): string {
  return "full";
}

function buildDockerComposeYaml(config: ProvisionConfig): string {
  const envLines = [
    `      - NODE_OPTIONS=--max-old-space-size=${getNodeMaxOldSpace(config.serverTier)}`,
    `      - OPENCLAW_GATEWAY_TOKEN=${config.gatewayToken}`,
    // Allow subagent processes inside the container to connect to the local
    // gateway without device pairing. OpenClaw auto-approves only loopback
    // connects, but our gateway binds to 0.0.0.0 (needed for the dashboard
    // reverse proxy), so in-container subagents connect over a non-loopback
    // path and get close code 1008 "pairing required". This is the
    // documented break-glass for trusted private-network ws:// paths.
    // Ref: docs.openclaw.ai /gateway/security
    `      - OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`,
  ];

  if (config.apiKeys.anthropic)
    envLines.push(`      - ANTHROPIC_API_KEY=${config.apiKeys.anthropic}`);
  if (config.apiKeys.openai)
    envLines.push(`      - OPENAI_API_KEY=${config.apiKeys.openai}`);
  if (config.apiKeys.google)
    envLines.push(`      - GOOGLE_AI_API_KEY=${config.apiKeys.google}`);
  if (config.deepseekKey)
    envLines.push(`      - DEEPSEEK_API_KEY=${config.deepseekKey}`);
  // MiniMax key is NOT passed to the container — requests go through our proxy

  const cmd =
    "rm -f /home/node/.openclaw/sessions/*.lock 2>/dev/null; exec node openclaw.mjs gateway --allow-unconfigured";
  const commandYaml = cmd.replace(/'/g, "''");

  return `services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw-agent
    restart: unless-stopped
    entrypoint: ["sh", "-c"]
    command: ['${commandYaml}']
    ports:
      - "0.0.0.0:18789:18789"
      - "0.0.0.0:18790:18790"
    volumes:
      - ./openclaw:/home/node/.openclaw
      - playwright-data:/home/node/.cache
    environment:
${envLines.join("\n")}
    deploy:
      resources:
        limits:
          memory: ${getMemoryLimit(config.serverTier)}
          pids: ${config.serverTier === "ULTRA_PRO" ? 512 : 256}
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=256m
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:18789/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 90s
volumes:
  playwright-data:
`;
}

function buildChannelsConfig(config: ProvisionConfig): Record<string, unknown> | undefined {
  const channels: Record<string, unknown> = {};
  const chCfg = config.channelConfig as
    | Record<string, { enabled?: boolean; botToken?: string; token?: string; dmPolicy?: string }>
    | undefined;

  if (chCfg) {
    for (const [chName, chData] of Object.entries(chCfg)) {
      if (!chData?.enabled) continue;
      const tok = chData.botToken || chData.token || "";
      if (!tok) continue;
      const dmPolicy =
        chData.dmPolicy === "open" ||
        chData.dmPolicy === "pairing" ||
        chData.dmPolicy === "allowlist" ||
        chData.dmPolicy === "disabled"
          ? chData.dmPolicy
          : "open";

      if (chName === "telegram") {
        channels.telegram = { enabled: true, botToken: tok, dmPolicy };
      } else if (chName === "discord") {
        channels.discord = { enabled: true, botToken: tok };
      } else if (chName === "slack") {
        channels.slack = { enabled: true, botToken: tok };
      }
    }
  }

  // Legacy single-channel props
  if (config.channelType && config.channelToken) {
    const ch = config.channelType.toLowerCase();
    if (!channels[ch]) {
      if (ch === "telegram") {
        channels.telegram = { enabled: true, botToken: config.channelToken, dmPolicy: "open" };
      } else if (ch === "discord") {
        channels.discord = { enabled: true, botToken: config.channelToken };
      } else if (ch === "slack") {
        channels.slack = { enabled: true, botToken: config.channelToken };
      }
    }
  }

  return Object.keys(channels).length > 0 ? channels : undefined;
}

function buildSeedConfig(config: ProvisionConfig): string {
  const now = new Date().toISOString();
  const modelId = resolveModelId(config.model);
  const isMinimaxModel = modelId.startsWith("minimax/");

  const minimaxModels = [
    {
      id: "MiniMax-M2.5-highspeed",
      name: "MiniMax M2.5 Highspeed",
      reasoning: true,
      input: ["text"],
      cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
      contextWindow: 200000,
      maxTokens: 8192,
    },
    {
      id: "MiniMax-M2.7",
      name: "MiniMax M2.7",
      reasoning: true,
      input: ["text"],
      cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
      contextWindow: 205000,
      maxTokens: 8192,
    },
    {
      id: "MiniMax-M2.7-highspeed",
      name: "MiniMax M2.7 Highspeed",
      reasoning: true,
      input: ["text"],
      cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
      contextWindow: 205000,
      maxTokens: 8192,
    },
  ];

  const modelsProviders = isMinimaxModel
    ? {
        minimax: {
          baseUrl: "https://clawlabs.pro/api/minimax",
          apiKey: config.gatewayToken,
          api: "anthropic-messages",
          models: minimaxModels,
        },
      }
    : undefined;

  // Channels and integrations are NOT in the seed config because
  // `openclaw onboard` wipes non-standard keys. They are added via CLI
  // after onboard (see channelCliBlock / integrationCliBlock below).
  const toolsConfig: Record<string, unknown> = { profile: getToolsProfile(config.serverTier) };

  return JSON.stringify(
    {
      meta: { lastTouchedVersion: "2026.3.1", lastTouchedAt: now },
      wizard: {
        lastRunAt: now,
        lastRunVersion: "2026.3.1",
        lastRunCommand: "onboard",
        lastRunMode: "local",
      },
      auth: {
        profiles: { "openai:default": { provider: "openai", mode: "api_key" } },
      },
      ...(modelsProviders && {
        models: {
          mode: "merge",
          providers: modelsProviders,
        },
      }),
      agents: {
        defaults: {
          model: { primary: modelId },
          models: {},
          workspace: "/home/node/.openclaw/workspace",
          compaction: { mode: "safeguard" },
          maxConcurrent: 4,
          subagents: { maxConcurrent: 8 },
        },
        list: [{ id: "main", identity: { name: "AI Agent" } }],
      },
      messages: { ackReactionScope: "group-mentions" },
      commands: {
        native: "auto",
        nativeSkills: "auto",
        restart: true,
        ownerDisplay: "raw",
      },
      session: { dmScope: "per-channel-peer" },
      web: { enabled: true },
      tools: toolsConfig,
      gateway: {
        port: 18789,
        mode: "local",
        bind: "custom",
        customBindHost: "0.0.0.0",
        controlUi: {
          allowedOrigins: [
            "http://localhost:18789",
            "http://127.0.0.1:18789",
            "https://clawlabs.pro",
            "https://www.clawlabs.pro",
          ],
          dangerouslyAllowHostHeaderOriginFallback: true,
          dangerouslyDisableDeviceAuth: true,
        },
        http: {
          endpoints: {
            chatCompletions: { enabled: true },
          },
        },
        auth: { mode: "token", token: config.gatewayToken },
        tailscale: { mode: "off", resetOnExit: false },
      },
    },
    null,
    2
  );
}

export function generateProvisionScript(config: ProvisionConfig): string {
  const modelId = resolveModelId(config.model);
  const apiKeyEnv = getApiKeyEnv(config.model, config.apiKeys);
  const safeModelId = shellEscape(modelId);
  const safeName = shellEscape(config.agentName);
  const safeCallbackUrl = shellEscape(config.callbackUrl);
  const safeCallbackToken = shellEscape(config.callbackToken);

  const dockerCompose = buildDockerComposeYaml(config);
  const seedConfig = buildSeedConfig(config);

  const workspaceFileMap: Record<string, string> = {
    soulMd: "SOUL.md",
    identityMd: "IDENTITY.md",
    userMd: "USER.md",
    agentsMd: "AGENTS.md",
    heartbeatMd: "HEARTBEAT.md",
    toolsMd: "TOOLS.md",
    bootstrapMd: "BOOTSTRAP.md",
  };

  let workspaceWriteBlock = "";
  for (const [key, filename] of Object.entries(workspaceFileMap)) {
    const content = config.workspaceFiles[key];
    if (content) {
      // Sanitize: strip NUL bytes and the heredoc delimiter to prevent injection
      const safe = content.replace(/\0/g, "").replace(/^WORKSPACE_EOF$/gm, "");
      workspaceWriteBlock += `
cat > /root/agent/openclaw/workspace/${filename} << 'WORKSPACE_EOF'
${safe}
WORKSPACE_EOF
chown 1000:1000 /root/agent/openclaw/workspace/${filename}
`;
    }
  }

  // Channels added via `openclaw config set` after onboard.
  // Using `config set` (not `channels add`) because:
  //  - `channels add` may hang inside running gateway container
  //  - `config set` is proven to work (used for gateway/model config above)
  //  - Handles JSON5 format natively
  let channelCliBlock = "";
  const chCfg = config.channelConfig as
    | Record<string, { enabled?: boolean; botToken?: string; token?: string; dmPolicy?: string }>
    | undefined;
  const channelCmds: string[] = [];

  if (chCfg) {
    for (const [chName, chData] of Object.entries(chCfg)) {
      if (!chData?.enabled) continue;
      const tok = chData.botToken || chData.token || "";
      if (!tok) continue;
      if (chName === "telegram") {
        channelCmds.push(`dexec openclaw config set channels.telegram.botToken "${shellEscape(tok)}" || true`);
        channelCmds.push(`dexec openclaw config set channels.telegram.enabled true --strict-json || true`);
        const dm = chData.dmPolicy || "pairing";
        channelCmds.push(`dexec openclaw config set channels.telegram.dmPolicy "${shellEscape(dm)}" || true`);
      } else if (chName === "discord") {
        channelCmds.push(`dexec openclaw config set channels.discord.token "${shellEscape(tok)}" || true`);
        channelCmds.push(`dexec openclaw config set channels.discord.enabled true --strict-json || true`);
      } else if (chName === "slack") {
        channelCmds.push(`dexec openclaw config set channels.slack.botToken "${shellEscape(tok)}" || true`);
        channelCmds.push(`dexec openclaw config set channels.slack.enabled true --strict-json || true`);
      }
    }
  }
  // Legacy single-channel props
  if (config.channelType && config.channelToken) {
    const ch = config.channelType.toLowerCase();
    if (ch === "telegram") {
      channelCmds.push(`dexec openclaw config set channels.telegram.botToken "${shellEscape(config.channelToken)}" || true`);
      channelCmds.push(`dexec openclaw config set channels.telegram.enabled true --strict-json || true`);
      channelCmds.push(`dexec openclaw config set channels.telegram.dmPolicy "pairing" || true`);
    } else if (ch === "discord") {
      channelCmds.push(`dexec openclaw config set channels.discord.token "${shellEscape(config.channelToken)}" || true`);
      channelCmds.push(`dexec openclaw config set channels.discord.enabled true --strict-json || true`);
    } else if (ch === "slack") {
      channelCmds.push(`dexec openclaw config set channels.slack.botToken "${shellEscape(config.channelToken)}" || true`);
      channelCmds.push(`dexec openclaw config set channels.slack.enabled true --strict-json || true`);
    }
  }

  if (channelCmds.length > 0) {
    channelCliBlock = `
progress "Konfiguracja kanałów komunikacji"
${channelCmds.join("\n")}
`;
  }

  // Search provider integration via config set
  let integrationCliBlock = "";
  const intKeys = config.integrationKeys as
    | Record<string, { enabled?: boolean; apiKey?: string }>
    | undefined;
  if (intKeys?.braveSearch?.enabled && intKeys.braveSearch.apiKey) {
    integrationCliBlock = `
progress "Konfiguracja Brave Search"
dexec openclaw config set tools.web.search.provider "brave" || true
dexec openclaw config set tools.web.search.apiKey "${shellEscape(intKeys.braveSearch.apiKey)}" || true
`;
  } else {
    // Default: DuckDuckGo (no API key required)
    integrationCliBlock = `
progress "Konfiguracja DuckDuckGo Search (domyślny)"
dexec openclaw config set tools.web.search.provider "duckduckgo" || true
`;
  }

  let skillsBlock = "";
  if (config.skills && config.skills.length > 0) {
    const skillCmds = config.skills
      .map((s) => `  dexec npx --yes clawhub install "${shellEscape(s)}" --no-input || true`)
      .join("\n");
    skillsBlock = `
progress "Instalacja ${config.skills.length} skilli"
${skillCmds}
`;
  }

  const apiKeySetBlock = apiKeyEnv.value
    ? `dexec openclaw config set env.${apiKeyEnv.name} "${shellEscape(apiKeyEnv.value)}"`
    : "";

  return `#!/bin/bash
set -uo pipefail

CALLBACK_URL="${safeCallbackUrl}"
CALLBACK_TOKEN="${safeCallbackToken}"

progress() {
  local step="$1"
  echo "[provision] $step"
  curl -sfL -X POST "$CALLBACK_URL" \\
    -H "Content-Type: application/json" \\
    -H "x-agent-token: $CALLBACK_TOKEN" \\
    -d "{\\"status\\":\\"progress\\",\\"step\\":\\"$step\\"}" || true
}

fail() {
  local msg="$1"
  echo "[provision] FAILED: $msg"
  curl -sfL -X POST "$CALLBACK_URL" \\
    -H "Content-Type: application/json" \\
    -H "x-agent-token: $CALLBACK_TOKEN" \\
    -d "{\\"status\\":\\"error\\",\\"message\\":\\"$msg\\"}" || true
  rm -f /root/provision.sh
  exit 1
}

dexec() {
  docker exec openclaw-agent "$@" 2>&1
}

trap 'fail "Unexpected error at line $LINENO"' ERR

progress "Konfiguracja swap"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

progress "Przygotowanie katalogów agenta"
mkdir -p /root/agent/openclaw/{credentials,memory,logs,cron,canvas,agents,workspace}
chown -R 1000:1000 /root/agent/openclaw

progress "Zapis konfiguracji OpenClaw"
cat > /root/agent/openclaw/openclaw.json << 'CONFIG_EOF'
${seedConfig}
CONFIG_EOF
chown 1000:1000 /root/agent/openclaw/openclaw.json

progress "Zapis docker-compose.yml"
cat > /root/agent/docker-compose.yml << 'COMPOSE_EOF'
${dockerCompose}
COMPOSE_EOF

progress "Pobieranie najnowszego obrazu OpenClaw"
docker pull ghcr.io/openclaw/openclaw:latest 2>&1 || true

progress "Uruchamianie kontenera Docker"
cd /root/agent && docker compose up -d 2>&1 || true

progress "Czekam na kontener (max 180s)"
CONTAINER_WAIT=0
STATE="false"
while [ $CONTAINER_WAIT -lt 180 ]; do
  STATE=$(docker inspect -f '{{.State.Running}}' openclaw-agent 2>/dev/null || echo "false")
  if [ "$STATE" = "true" ]; then
    break
  fi
  # If container exited, try restarting once
  if [ $CONTAINER_WAIT -eq 60 ]; then
    echo "[provision] Container not running after 60s, attempting restart..."
    docker compose up -d 2>&1 || true
  fi
  sleep 3
  CONTAINER_WAIT=$((CONTAINER_WAIT + 3))
done

if [ "$STATE" != "true" ]; then
  docker logs openclaw-agent --tail 60 2>&1 || true
  fail "Kontener nie uruchomil sie po 180s"
fi

progress "Konfiguracja agenta (model, gateway, tożsamość)"
dexec openclaw setup --workspace /home/node/.openclaw/workspace --non-interactive --accept-risk || dexec openclaw onboard --non-interactive --accept-risk || true
dexec openclaw config set agents.defaults.model.primary "${safeModelId}" || true
${apiKeySetBlock ? apiKeySetBlock + " || true" : ""}
dexec openclaw agents set-identity --agent main --name "${safeName}" || true

dexec openclaw config set gateway.bind custom || true
dexec openclaw config set gateway.customBindHost 0.0.0.0 || true
dexec openclaw config set gateway.port 18789 --strict-json || true
dexec openclaw config set gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback true --strict-json || true
dexec openclaw config set gateway.controlUi.dangerouslyDisableDeviceAuth true --strict-json || true
dexec openclaw config set gateway.http.endpoints.chatCompletions.enabled true --strict-json || true
dexec openclaw config set web.enabled true --strict-json || true
dexec openclaw config set gateway.auth.rateLimit '{"maxAttempts":10,"windowMs":60000,"lockoutMs":300000}' --strict-json || true

progress "Konfiguracja Active Memory, Dreaming, Sandbox"
dexec openclaw config set plugins.entries.active-memory.enabled true --strict-json || true
dexec openclaw config set plugins.entries.memory-core.config.dreaming.enabled true --strict-json || true
dexec openclaw config set agents.defaults.humanDelay '{"mode":"natural"}' --strict-json || true
dexec openclaw config set agents.defaults.sandbox.mode "${getSandboxMode(config.serverTier)}" || true

chmod 700 /root/agent/openclaw /root/agent/openclaw/credentials 2>/dev/null || true
${channelCliBlock}${integrationCliBlock}${workspaceWriteBlock ? `progress "Zapis plików workspace"\n${workspaceWriteBlock}` : ""}

rm -f /root/agent/openclaw/sessions/*.lock 2>/dev/null || true

progress "Restart kontenera"
docker restart openclaw-agent 2>&1 || true

progress "Czekam na health check /healthz (max 300s)"
HEALTH_WAIT=0
HEALTHY=false
while [ $HEALTH_WAIT -lt 300 ]; do
  RESULT=$(curl -sf http://localhost:18789/healthz 2>/dev/null) && HEALTHY=true && break
  sleep 5
  HEALTH_WAIT=$((HEALTH_WAIT + 5))
done

if [ "$HEALTHY" != "true" ]; then
  echo "[provision] Healthcheck failed after 300s, attempting container restart..."
  docker restart openclaw-agent 2>&1 || true
  sleep 10
  RESULT=$(curl -sf http://localhost:18789/healthz 2>/dev/null) && HEALTHY=true || true
fi

if [ "$HEALTHY" != "true" ]; then
  docker logs openclaw-agent --tail 60 2>&1 || true
  fail "Agent nie odpowiada na /healthz po 300s + restart"
fi

progress "Agent ONLINE — health check OK"

progress "Instalacja Playwright Chromium (headless browser)"
docker exec -u root -e PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright openclaw-agent \
  sh -c "node /app/node_modules/playwright-core/cli.js install --with-deps chromium 2>&1" || true
docker exec -u root openclaw-agent chown -R 1000:1000 /home/node/.cache 2>/dev/null || true
${skillsBlock}

progress "Instalacja management cron"
cat > /root/agent/manage-poll.sh << 'MANAGE_EOF'
#!/bin/bash
APP_URL="${shellEscape(config.callbackUrl.replace(/\/api\/agents\/callback.*$/, ""))}"
AGENT_ID="${shellEscape(config.agentId)}"
GATEWAY_TOKEN="${shellEscape(config.gatewayToken)}"

while true; do
  SCRIPT=$(curl -sfL "$APP_URL/api/agents/reconfigure?agentId=$AGENT_ID&token=$GATEWAY_TOKEN" 2>/dev/null)
  if [ -n "$SCRIPT" ] && [ "$SCRIPT" != "" ]; then
    echo "[manage] Applying pending config..."
    echo "$SCRIPT" | bash 2>&1 || true
    echo "[manage] Config applied."
  fi
  sleep 60
done
MANAGE_EOF
chmod +x /root/agent/manage-poll.sh
nohup /root/agent/manage-poll.sh >> /var/log/manage-poll.log 2>&1 &
(crontab -l 2>/dev/null; echo "@reboot nohup /root/agent/manage-poll.sh >> /var/log/manage-poll.log 2>&1 &") | crontab - 2>/dev/null || true

curl -sfL -X POST "$CALLBACK_URL" \\
  -H "Content-Type: application/json" \\
  -H "x-agent-token: $CALLBACK_TOKEN" \\
  -d '{"status":"ready"}' || true

echo "[provision] Done — agent is online"
rm -f /root/provision.sh /var/log/provision.log
`;
}
