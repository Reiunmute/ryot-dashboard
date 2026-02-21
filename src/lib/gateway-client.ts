"use client";

const DEFAULT_GATEWAY = "wss://reimini-macmini.tailfa1d9d.ts.net";
const STORAGE_KEY = "openclaw-gateway-url";
const TOKEN_KEY = "openclaw-gateway-token";
const PROTOCOL_VERSION = 3;

export function getGatewayUrl(): string {
  if (typeof window === "undefined") return DEFAULT_GATEWAY;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_GATEWAY;
}

export function setGatewayUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, url);
  window.dispatchEvent(new Event("gateway-url-changed"));
}

export function getGatewayToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setGatewayToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("gateway-url-changed"));
}

function uuid(): string {
  return crypto.randomUUID();
}

interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: number; message: string };
}

interface EventFrame {
  type: "evt";
  event: string;
  payload?: unknown;
}

type Frame = RequestFrame | ResponseFrame | EventFrame;

export class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private requestId = 0;
  private pending: Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }> = new Map();
  private connectPromise: Promise<void> | null = null;
  private connected = false;

  constructor(url?: string, token?: string) {
    this.url = url || getGatewayUrl();
    this.token = token || getGatewayToken();
  }

  async connect(): Promise<void> {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          // Send connect handshake
          this.sendConnectHandshake()
            .then(() => {
              this.connected = true;
              this.connectPromise = null;
              resolve();
            })
            .catch((err) => {
              this.connectPromise = null;
              reject(err);
            });
        };

        this.ws.onerror = () => {
          this.connectPromise = null;
          reject(new Error("WebSocket connection failed"));
        };

        this.ws.onclose = () => {
          this.connectPromise = null;
          this.connected = false;
          this.ws = null;
          this.pending.forEach(({ reject }) => {
            reject(new Error("Connection closed"));
          });
          this.pending.clear();
        };

        this.ws.onmessage = (event) => {
          try {
            const frame = JSON.parse(event.data) as Frame;
            this.handleFrame(frame);
          } catch {
            // Ignore parse errors
          }
        };
      } catch (e) {
        this.connectPromise = null;
        reject(e);
      }
    });

    return this.connectPromise;
  }

  private handleFrame(frame: Frame): void {
    if (frame.type === "res") {
      const pending = this.pending.get(frame.id);
      if (pending) {
        this.pending.delete(frame.id);
        if (frame.ok) {
          pending.resolve(frame.payload);
        } else {
          pending.reject(new Error(frame.error?.message || "Unknown error"));
        }
      }
    }
    // Handle events if needed
  }

  private async sendConnectHandshake(): Promise<unknown> {
    const id = uuid();
    const frame: RequestFrame = {
      type: "req",
      id,
      method: "connect",
      params: {
        minProtocol: PROTOCOL_VERSION,
        maxProtocol: PROTOCOL_VERSION,
        client: {
          id: "webchat-ui",
          displayName: "Ryot Dashboard",
          version: "1.0.0",
          platform: "browser",
          mode: "webchat",
        },
        caps: [],
        auth: this.token ? { token: this.token } : undefined,
        role: "operator",
        scopes: ["operator.admin"],
      },
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Connect handshake timeout"));
      }, 10000);

      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timeout);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
      });

      this.ws!.send(JSON.stringify(frame));
    });
  }

  async call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    await this.connect();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected");
    }

    const id = uuid();
    const frame: RequestFrame = {
      type: "req",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Request timeout"));
      }, 15000);

      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timeout);
          resolve(v as T);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
      });

      this.ws!.send(JSON.stringify(frame));
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let client: GatewayClient | null = null;

export function getClient(): GatewayClient {
  if (!client) {
    client = new GatewayClient();
  }
  return client;
}

export function resetClient(): void {
  if (client) {
    client.disconnect();
    client = null;
  }
}

// API wrapper functions
export async function fetchHealth() {
  const c = getClient();
  return c.call<{
    ok: boolean;
    channels: Record<string, unknown>;
    agents: Array<{
      agentId: string;
      name: string;
      isDefault: boolean;
      sessions: { count: number; recent: Array<{ key: string; updatedAt: number; age: number }> };
    }>;
  }>("health");
}

export async function fetchStatus() {
  const c = getClient();
  return c.call<{
    heartbeat: { defaultAgentId: string; agents: Array<{ agentId: string; enabled: boolean; every: string }> };
    sessions: {
      count: number;
      recent: Array<{
        agentId: string;
        key: string;
        sessionId: string;
        updatedAt: number;
        age: number;
        totalTokens: number | null;
        percentUsed: number | null;
        model: string;
      }>;
      byAgent: Array<{
        agentId: string;
        count: number;
        recent: Array<unknown>;
      }>;
    };
  }>("status");
}

export async function fetchCrons() {
  const c = getClient();
  return c.call<{
    jobs: Array<{
      id: string;
      agentId: string;
      name: string;
      enabled: boolean;
      schedule: { kind: string; everyMs?: number; expr?: string; tz?: string };
      state: {
        lastRunAtMs: number;
        lastStatus: string;
        lastDurationMs: number;
        consecutiveErrors: number;
        nextRunAtMs: number;
      };
    }>;
  }>("cron.list");
}

export async function testConnection(url: string, token?: string): Promise<boolean> {
  const testClient = new GatewayClient(url, token);
  try {
    await testClient.connect();
    await testClient.call("health");
    testClient.disconnect();
    return true;
  } catch {
    testClient.disconnect();
    return false;
  }
}
