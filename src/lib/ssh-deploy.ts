// SSH deployment helper dla AgriClaw.
// Model wzorowany na clawlabspro: łączymy się po SSH do świeżo utworzonego
// Hetzner VM i uruchamiamy skrypt provisioningowy który:
//  - przygotuje katalogi agenta
//  - zapisze workspace markdowny (SOUL/IDENTITY/HEARTBEAT/TOOLS/BOOTSTRAP/USER/AGENTS)
//  - uruchomi docker compose z obrazem OpenClaw Gateway
//  - skonfiguruje model AI, kanały, skille
//
// Używane przez /api/agents/deploy.

import { Client } from "ssh2";
import { AI_MODELS } from "@/lib/agent-models";
import { generateProvisionScript, type ProvisionConfig } from "@/lib/provision-script";

export function validateModelApiKey(
  modelId: string,
  userKeys?: { anthropic?: string; openai?: string; google?: string }
): { valid: boolean; missingProvider?: string } {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (!model) return { valid: false, missingProvider: "unknown" };

  // Free tier models use platform key — always valid
  if (model.tier === "free") return { valid: true };

  const provider = model.provider.toLowerCase();
  const keyMap: Record<string, { userKey?: string; platformKey?: string }> = {
    anthropic: { userKey: userKeys?.anthropic, platformKey: process.env.PLATFORM_ANTHROPIC_KEY },
    openai: { userKey: userKeys?.openai, platformKey: process.env.PLATFORM_OPENAI_KEY },
    google: { userKey: userKeys?.google, platformKey: process.env.PLATFORM_GOOGLE_AI_KEY },
    deepseek: { userKey: userKeys?.openai, platformKey: process.env.PLATFORM_OPENAI_KEY },
    meta: { userKey: userKeys?.openai, platformKey: process.env.PLATFORM_OPENAI_KEY },
    minimax: { platformKey: process.env.PLATFORM_MINIMAX_KEY },
  };

  const keys = keyMap[provider];
  if (!keys) return { valid: false, missingProvider: provider };
  if (keys.userKey || keys.platformKey) return { valid: true };
  return { valid: false, missingProvider: model.provider };
}

function getPrivateKey(): Buffer {
  const raw = process.env.HETZNER_SSH_PRIVATE_KEY;
  if (!raw) throw new Error("HETZNER_SSH_PRIVATE_KEY env var is required");
  // Accept either raw PEM or base64-encoded PEM (easier for Vercel env vars).
  if (raw.includes("BEGIN") && raw.includes("PRIVATE KEY")) {
    return Buffer.from(raw, "utf8");
  }
  return Buffer.from(raw, "base64");
}

/**
 * Execute a single shell command over SSH and collect stdout/stderr.
 * Resolves with the exit code. Rejects only on connection errors.
 */
function runRemote(
  client: Client,
  command: string,
  timeoutMs = 20 * 60 * 1000
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`SSH command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    client.exec(command, (err, stream) => {
      if (err) {
        clearTimeout(timer);
        return reject(err);
      }
      let stdout = "";
      let stderr = "";
      stream
        .on("close", (code: number) => {
          clearTimeout(timer);
          resolve({ code: code ?? 0, stdout, stderr });
        })
        .on("data", (data: Buffer) => {
          stdout += data.toString("utf8");
        })
        .stderr.on("data", (data: Buffer) => {
          stderr += data.toString("utf8");
        });
    });
  });
}

/** Retry SSH connection until sshd is up (VM just booted). */
async function connectWithRetry(host: string, privateKey: Buffer, maxAttempts = 30): Promise<Client> {
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client: Client = await new Promise((resolve, reject) => {
        const c = new Client();
        c.on("ready", () => resolve(c))
          .on("error", (err) => reject(err))
          .connect({
            host,
            port: 22,
            username: "root",
            privateKey,
            readyTimeout: 15_000,
          });
      });
      return client;
    } catch (err) {
      lastErr = err as Error;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw lastErr ?? new Error(`SSH connect failed to ${host}`);
}

export interface DeployAgentParams {
  host: string;
  config: ProvisionConfig;
}

/**
 * Run the provisioning script on a freshly-booted Hetzner VM over SSH.
 * Returns when the script exits — callers poll the callback URL for
 * status updates during the provision.
 */
export async function deployAgent({ host, config }: DeployAgentParams): Promise<void> {
  const script = generateProvisionScript(config);
  const pk = getPrivateKey();

  const client = await connectWithRetry(host, pk);
  try {
    // Upload the provision script via heredoc so we avoid dealing with SFTP
    // and keep the deploy self-contained.
    const encoded = Buffer.from(script, "utf8").toString("base64");
    const uploadCmd = `echo '${encoded}' | base64 -d > /root/provision.sh && chmod +x /root/provision.sh`;
    const upload = await runRemote(client, uploadCmd, 60_000);
    if (upload.code !== 0) {
      throw new Error(`Failed to upload provision script: ${upload.stderr || upload.stdout}`);
    }

    // Execute asynchronously — long-running (can take 5-15 minutes). We fire
    // nohup and let the script report progress via the callback URL so the
    // SSH handle can close cleanly.
    const runCmd =
      "nohup bash /root/provision.sh > /var/log/provision.log 2>&1 &";
    const run = await runRemote(client, runCmd, 30_000);
    if (run.code !== 0) {
      throw new Error(`Failed to launch provision script: ${run.stderr || run.stdout}`);
    }
  } finally {
    client.end();
  }
}
