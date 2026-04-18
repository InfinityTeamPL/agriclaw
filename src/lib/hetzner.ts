const HETZNER_API = "https://api.hetzner.cloud/v1";
const HETZNER_TOKEN = process.env.HETZNER_API_TOKEN || "";

interface HetznerServer {
  id: number;
  name: string;
  status: string;
  public_net: {
    ipv4: { ip: string };
    ipv6: { ip: string };
  };
  server_type: { name: string; description: string };
  labels?: Record<string, string>;
  created: string;
}

interface CreateServerResponse {
  server: HetznerServer;
  root_password: string;
}

async function hetznerRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${HETZNER_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${HETZNER_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Hetzner API ${res.status}: ${body}`);
  }

  return res.json();
}

let cachedFirewallId: number | null = null;

export async function ensureFirewall(): Promise<number | null> {
  const serverIp = process.env.AGENTAI_SERVER_IP;
  if (!serverIp) return null;

  if (cachedFirewallId) return cachedFirewallId;

  const list = await hetznerRequest<{ firewalls: { id: number }[] }>(
    "/firewalls?name=agentai-fw"
  );

  if (list.firewalls.length > 0) {
    cachedFirewallId = list.firewalls[0].id;
    return cachedFirewallId;
  }

  const fw = await hetznerRequest<{ firewall: { id: number } }>("/firewalls", {
    method: "POST",
    body: JSON.stringify({
      name: "agentai-fw",
      rules: [
        {
          direction: "in",
          protocol: "tcp",
          port: "22",
          source_ips: [`${serverIp}/32`],
          description: "SSH from AgentAI only",
        },
        {
          direction: "in",
          protocol: "tcp",
          port: "18789",
          source_ips: [`${serverIp}/32`],
          description: "Gateway from AgentAI only",
        },
        {
          direction: "in",
          protocol: "icmp",
          source_ips: ["0.0.0.0/0", "::/0"],
          description: "Ping",
        },
      ],
    }),
  });

  cachedFirewallId = fw.firewall.id;
  return cachedFirewallId;
}

function buildProvisioningCloudInit(provisionUrl: string): string {
  return `#!/bin/bash
set -euo pipefail
exec >> /var/log/provision-boot.log 2>&1
echo "[cloud-init] Starting provision at $(date)"

# SSH key injection from Hetzner metadata
mkdir -p /root/.ssh && chmod 700 /root/.ssh
curl -sf http://169.254.169.254/hetzner/v1/metadata/public-keys >> /root/.ssh/authorized_keys 2>/dev/null || true
chmod 600 /root/.ssh/authorized_keys
rm -f /etc/machine-id && systemd-machine-id-setup
systemctl restart ssh || systemctl restart sshd || true

# Wait for network + DNS
for i in $(seq 1 12); do
  curl -sfL https://clawlabs.pro/ -o /dev/null && break
  echo "[cloud-init] Waiting for network... attempt $i"
  sleep 5
done

# Fetch provision script (retry up to 5 min)
echo "[cloud-init] Fetching provision script..."
PROVISION_OK=false
for i in $(seq 1 30); do
  if curl -sfL "${provisionUrl}" -o /root/provision.sh; then
    PROVISION_OK=true
    break
  fi
  echo "[cloud-init] Fetch attempt $i failed, retrying in 10s..."
  sleep 10
done

if [ "$PROVISION_OK" != "true" ]; then
  echo "[cloud-init] FATAL: Could not fetch provision script after 30 attempts"
  exit 1
fi

chmod +x /root/provision.sh
echo "[cloud-init] Running provision script..."
/root/provision.sh >> /var/log/provision.log 2>&1
echo "[cloud-init] Provision complete at $(date)"
`;
}

export async function createServer(
  name: string,
  serverType: string = "cx23",
  location: string = "hel1",
  agentLabel: string = "agent",
  provisionUrl?: string
): Promise<{ serverId: number; ip: string }> {
  const snapshotId = process.env.HETZNER_SNAPSHOT_ID;
  const sshKeyId = process.env.HETZNER_SSH_KEY_ID;
  const image = snapshotId || "ubuntu-24.04";

  const firewallId = await ensureFirewall();

  let userData: string | undefined;
  if (snapshotId && provisionUrl) {
    userData = buildProvisioningCloudInit(provisionUrl);
  }

  const body: Record<string, unknown> = {
    name,
    server_type: serverType,
    image,
    location: location || process.env.HETZNER_LOCATION || "hel1",
    user_data: userData,
    labels: {
      managed_by: "agentai",
      agent_name: agentLabel.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase(),
    },
  };

  if (sshKeyId) {
    body.ssh_keys = [parseInt(sshKeyId, 10)];
  }

  if (firewallId) {
    body.firewalls = [{ firewall: firewallId }];
  }

  const data = await hetznerRequest<CreateServerResponse>("/servers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    serverId: data.server.id,
    ip: data.server.public_net.ipv4.ip,
  };
}

export async function waitForServer(
  serverId: number,
  maxWaitMs: number = 120000
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const { status, ip } = await getServerStatus(serverId);
    if (status === "running") return ip;
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Server ${serverId} did not start within ${maxWaitMs}ms`);
}

export async function deleteServer(serverId: string | number): Promise<void> {
  await hetznerRequest(`/servers/${serverId}`, { method: "DELETE" });
}

/** Graceful ACPI shutdown. May fail if guest doesn't respond. */
export async function shutdownServer(serverId: string | number): Promise<void> {
  await hetznerRequest(`/servers/${serverId}/actions/shutdown`, { method: "POST" });
}

/** Hard power-off (like pulling the plug). Always succeeds. */
export async function powerOffServer(serverId: string | number): Promise<void> {
  await hetznerRequest(`/servers/${serverId}/actions/poweroff`, { method: "POST" });
}

/** Power on a stopped server. */
export async function powerOnServer(serverId: string | number): Promise<void> {
  await hetznerRequest(`/servers/${serverId}/actions/poweron`, { method: "POST" });
}

/**
 * Try graceful shutdown, fall back to hard power-off if the server doesn't
 * stop within ~30 s. Used by the grace-period flow so customer agents stop
 * cleanly when possible but always end up powered off.
 */
export async function stopServerGraceful(serverId: string | number): Promise<void> {
  try {
    await shutdownServer(serverId);
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const { status } = await getServerStatus(serverId);
      if (status === "off") return;
    }
    // Did not stop gracefully — force it
    await powerOffServer(serverId);
  } catch (e) {
    console.warn(`[hetzner] graceful shutdown failed for ${serverId}, hard power-off:`, e);
    await powerOffServer(serverId);
  }
}

export async function getServerStatus(
  serverId: string | number
): Promise<{ status: string; ip: string }> {
  const data = await hetznerRequest<{ server: HetznerServer }>(
    `/servers/${serverId}`
  );
  return {
    status: data.server.status,
    ip: data.server.public_net.ipv4.ip,
  };
}

interface HetznerAction {
  command: string;
  status: string;
  progress: number;
  started: string;
  finished: string | null;
}

export async function getServerProgress(
  serverId: string | number
): Promise<{ serverStatus: string; createProgress: number; startProgress: number; phase: string }> {
  const [serverData, actionsData] = await Promise.all([
    hetznerRequest<{ server: HetznerServer }>(`/servers/${serverId}`),
    hetznerRequest<{ actions: HetznerAction[] }>(`/servers/${serverId}/actions?sort=started:desc`),
  ]);

  const createAction = actionsData.actions.find((a) => a.command === "create_server");
  const startAction = actionsData.actions.find((a) => a.command === "start_server");

  let phase = "Tworzenie serwera";
  if (createAction?.status === "success" && startAction?.status === "running") {
    phase = "Uruchamianie serwera";
  } else if (createAction?.status === "success" && startAction?.status === "success") {
    phase = "Serwer gotowy — auto-provisioning";
  }

  return {
    serverStatus: serverData.server.status,
    createProgress: createAction?.progress ?? 0,
    startProgress: startAction?.progress ?? 0,
    phase,
  };
}

export async function listServers(): Promise<
  { id: number; name: string; status: string; ip: string }[]
> {
  const data = await hetznerRequest<{ servers: HetznerServer[] }>(
    "/servers?label_selector=managed_by=agentai"
  );
  return data.servers.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    ip: s.public_net.ipv4.ip,
  }));
}

export async function listAllAccountServers(): Promise<
  { id: number; name: string; status: string; ip: string; managed: boolean }[]
> {
  const data = await hetznerRequest<{ servers: HetznerServer[] }>(
    "/servers?per_page=50"
  );
  return data.servers.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    ip: s.public_net.ipv4.ip,
    managed: s.labels?.managed_by === "agentai",
  }));
}

export async function createSnapshot(
  serverId: number,
  description: string = "agentai-base"
): Promise<number> {
  const data = await hetznerRequest<{ image: { id: number } }>(
    `/servers/${serverId}/actions/create_image`,
    {
      method: "POST",
      body: JSON.stringify({ type: "snapshot", description }),
    }
  );
  return data.image.id;
}

export const SERVER_TYPES = {
  // Legacy tiers (kept for backward compat with existing servers)
  STARTER: "cx23",
  PRO: "cx33",
  FIRMA: "cx43",
  // Subscription tiers
  premium: "cx23",    // 2 vCPU, 4 GB, 40 GB NVMe  ~€3.85/mo
  pro: "cx33",        // 2 vCPU, 8 GB, 80 GB NVMe  ~€7.49/mo
  ultra_pro: "cx43",  // 4 vCPU, 16 GB, 160 GB NVMe ~€14.49/mo
  free: "cx23",
};

/** Hetzner CX server specs by type */
export const SERVER_SPECS: Record<string, { cpuCores: number; ramGb: number; diskGb: number; type: string }> = {
  cx22:  { cpuCores: 2, ramGb: 4,  diskGb: 40,  type: "CX22" },
  cx23:  { cpuCores: 2, ramGb: 4,  diskGb: 40,  type: "CX23" },
  cx32:  { cpuCores: 4, ramGb: 8,  diskGb: 80,  type: "CX32" },
  cx33:  { cpuCores: 2, ramGb: 8,  diskGb: 80,  type: "CX33" },
  cx42:  { cpuCores: 8, ramGb: 16, diskGb: 160, type: "CX42" },
  cx43:  { cpuCores: 4, ramGb: 16, diskGb: 160, type: "CX43" },
  cx52:  { cpuCores: 16, ramGb: 32, diskGb: 320, type: "CX52" },
};

/** Get real CPU metrics from Hetzner Metrics API (last 5 minutes avg) */
export async function getServerMetrics(serverId: string | number): Promise<{ cpuPercent: number } | null> {
  try {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const data = await hetznerRequest<{
      metrics: {
        time_series: Record<string, { values: [number, string][] }>;
      };
    }>(`/servers/${serverId}/metrics?type=cpu&start=${start}&end=${end}`);

    const series = data.metrics?.time_series;
    if (!series) return null;

    // Sum all CPU cores' usage and average
    let totalPercent = 0;
    let count = 0;
    for (const key of Object.keys(series)) {
      const values = series[key]?.values || [];
      for (const [, val] of values) {
        totalPercent += parseFloat(val) || 0;
        count++;
      }
    }

    return { cpuPercent: count > 0 ? Math.round(totalPercent / count) : 0 };
  } catch {
    return null;
  }
}
