"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getGatewayUrl,
  getClient,
  resetClient,
  fetchHealth,
  fetchStatus,
  fetchCrons,
} from "./gateway-client";

export interface AgentStatus {
  agentId: string;
  name: string;
  isDefault: boolean;
  sessionCount: number;
  lastActive: number | null;
  percentUsed: number | null;
  model: string | null;
  status: "active" | "idle" | "offline";
}

export interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  schedule: string;
  lastRun: number | null;
  lastStatus: string | null;
  nextRun: number | null;
  lastDurationMs: number | null;
}

export interface GatewayState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  agents: AgentStatus[];
  crons: CronJob[];
  lastUpdated: number | null;
}

const IDLE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export function useGateway(autoRefreshMs = 30000) {
  const [state, setState] = useState<GatewayState>({
    connected: false,
    connecting: false,
    error: null,
    agents: [],
    crons: [],
    lastUpdated: null,
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, connecting: !s.connected }));

    try {
      const [health, status, cronsData] = await Promise.all([
        fetchHealth(),
        fetchStatus(),
        fetchCrons(),
      ]);

      // Process agents
      const agentsMap = new Map<string, AgentStatus>();

      // From health response
      for (const agent of health.agents || []) {
        const recentSession = status.sessions?.recent?.find(
          (s) => s.agentId === agent.agentId
        );

        const lastActive = recentSession?.updatedAt || null;
        const isActive =
          lastActive && Date.now() - lastActive < IDLE_THRESHOLD_MS;

        agentsMap.set(agent.agentId, {
          agentId: agent.agentId,
          name: agent.name,
          isDefault: agent.isDefault,
          sessionCount: agent.sessions?.count || 0,
          lastActive,
          percentUsed: recentSession?.percentUsed || null,
          model: recentSession?.model || null,
          status: isActive ? "active" : lastActive ? "idle" : "offline",
        });
      }

      // Process crons
      const crons: CronJob[] = (cronsData.jobs || []).map((job) => {
        let scheduleStr = "";
        if (job.schedule.kind === "every" && job.schedule.everyMs) {
          const hours = job.schedule.everyMs / (1000 * 60 * 60);
          scheduleStr = hours >= 1 ? `Every ${hours}h` : `Every ${job.schedule.everyMs / 60000}m`;
        } else if (job.schedule.kind === "cron" && job.schedule.expr) {
          scheduleStr = `${job.schedule.expr} (${job.schedule.tz || "UTC"})`;
        }

        return {
          id: job.id,
          agentId: job.agentId,
          name: job.name,
          enabled: job.enabled,
          schedule: scheduleStr,
          lastRun: job.state?.lastRunAtMs || null,
          lastStatus: job.state?.lastStatus || null,
          nextRun: job.state?.nextRunAtMs || null,
          lastDurationMs: job.state?.lastDurationMs || null,
        };
      });

      setState({
        connected: true,
        connecting: false,
        error: null,
        agents: Array.from(agentsMap.values()),
        crons,
        lastUpdated: Date.now(),
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        connected: false,
        connecting: false,
        error: e instanceof Error ? e.message : "Unknown error",
      }));
    }
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    refresh();

    if (autoRefreshMs > 0) {
      const interval = setInterval(refresh, autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [refresh, autoRefreshMs]);

  // Listen for gateway URL changes
  useEffect(() => {
    const onUrlChange = () => {
      resetClient();
      refresh();
    };
    window.addEventListener("gateway-url-changed", onUrlChange);
    return () => window.removeEventListener("gateway-url-changed", onUrlChange);
  }, [refresh]);

  return {
    ...state,
    refresh,
    gatewayUrl: typeof window !== "undefined" ? getGatewayUrl() : "",
  };
}
