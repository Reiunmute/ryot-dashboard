"use client";

const DEFAULT_GATEWAY = "wss://reimini-macmini.tailfa1d9d.ts.net";
const STORAGE_KEY = "openclaw-gateway-url";
const TOKEN_KEY = "openclaw-gateway-token";

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

interface RpcMessage {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface RpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private requestId = 0;
  private pending: Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }> = new Map();
  private connectPromise: Promise<void> | null = null;

  constructor(url?: string, token?: string) {
    this.url = url || getGatewayUrl();
    this.token = token || getGatewayToken();
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        // Add token as query param if provided
        let wsUrl = this.url;
        if (this.token) {
          const separator = wsUrl.includes("?") ? "&" : "?";
          wsUrl = `${wsUrl}${separator}token=${encodeURIComponent(this.token)}`;
        }
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.connectPromise = null;
          resolve();
        };

        this.ws.onerror = (e) => {
          this.connectPromise = null;
          reject(new Error("WebSocket connection failed"));
        };

        this.ws.onclose = () => {
          this.connectPromise = null;
          this.ws = null;
          // Reject all pending requests
          this.pending.forEach(({ reject }) => {
            reject(new Error("Connection closed"));
          });
          this.pending.clear();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as RpcResponse;
            const pending = this.pending.get(data.id);
            if (pending) {
              this.pending.delete(data.id);
              if (data.error) {
                pending.reject(new Error(data.error.message));
              } else {
                pending.resolve(data.result);
              }
            }
          } catch {
            // Ignore non-JSON messages
          }
        };
      } catch (e) {
        this.connectPromise = null;
        reject(e);
      }
    });

    return this.connectPromise;
  }

  async call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    await this.connect();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected");
    }

    const id = ++this.requestId;
    const message: RpcMessage = {
      jsonrpc: "2.0",
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

      this.ws!.send(JSON.stringify(message));
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
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
