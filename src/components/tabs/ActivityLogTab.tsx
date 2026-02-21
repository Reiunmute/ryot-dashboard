"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

interface Session {
  id: string;
  sessionId?: string;
  updatedAt?: number;
  channel?: string;
  model?: string;
  label?: string;
  totalTokens?: number;
}

interface ActivityEntry {
  time: string;
  agent: string;
  summary: string;
  type: "start" | "complete" | "running" | "info";
}

function extractAgentType(label: string): string {
  if (!label) return "System";
  const lower = label.toLowerCase();
  if (lower.startsWith("coder")) return "Coder";
  if (lower.startsWith("writer")) return "Writer";
  if (lower.startsWith("researcher")) return "Researcher";
  if (lower.startsWith("image")) return "Image Creator";
  if (lower.startsWith("watchdog")) return "Watchdog";
  if (lower.includes("viral") || lower.includes("intel")) return "Researcher";
  if (lower.includes("news")) return "Researcher";
  if (lower.includes("cron")) return "System";
  return "Rei";
}

function extractTaskSummary(label: string): string {
  if (!label) return "";
  // Remove prefix like "coder-", "writer-" etc
  const cleaned = label.replace(/^(coder|writer|researcher|image|watchdog)-?/i, "").trim();
  return cleaned || label;
}

function agentColor(agent: string): string {
  switch (agent) {
    case "Rei": return "text-blue-400";
    case "Researcher": return "text-purple-400";
    case "Writer": return "text-pink-400";
    case "Coder": return "text-green-400";
    case "Image Creator": return "text-orange-400";
    case "Watchdog": return "text-yellow-400";
    default: return "text-[var(--text-muted)]";
  }
}

function dotColor(type: string): string {
  switch (type) {
    case "start": return "bg-blue-500";
    case "complete": return "bg-green-500";
    case "running": return "bg-yellow-500";
    default: return "bg-[var(--accent)]";
  }
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ActivityTab() {
  const { data: sessionData } = useSWR("/api/sessions", fetcher, { refreshInterval: 30000 });
  const prevSessionsRef = useRef<Map<string, Session>>(new Map());
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (!sessionData?.sessions) return;

    const current = new Map<string, Session>();
    for (const s of sessionData.sessions as Session[]) {
      current.set(s.id, s);
    }

    const prev = prevSessionsRef.current;
    const newActivities: ActivityEntry[] = [];

    // Only detect changes if we had previous data
    if (prev.size > 0) {
      for (const [id, session] of Array.from(current.entries())) {
        const old = prev.get(id);
        if (!old) {
          // New session detected
          const agent = extractAgentType(session.label || "");
          const task = extractTaskSummary(session.label || "");
          if (session.label?.toLowerCase().includes("cron") || session.label?.toLowerCase().includes("viral")) {
            newActivities.push({
              time: new Date(session.updatedAt || Date.now()).toISOString(),
              agent,
              summary: `Viral Intel Report 실행 중`,
              type: "running",
            });
          } else {
            newActivities.push({
              time: new Date(session.updatedAt || Date.now()).toISOString(),
              agent,
              summary: `${agent} 시작: ${task}`,
              type: "start",
            });
          }
        }
      }

      // Check for completed sessions (in prev but not in current, or tokens changed significantly)
      for (const [id, old] of Array.from(prev.entries())) {
        const cur = current.get(id);
        if (cur && old.totalTokens && cur.totalTokens && cur.totalTokens > old.totalTokens) {
          // Session progressed - could be completion
          const agent = extractAgentType(cur.label || "");
          const task = extractTaskSummary(cur.label || "");
          // Only log if significant token change (>1000)
          if (cur.totalTokens - (old.totalTokens || 0) > 1000) {
            newActivities.push({
              time: new Date(cur.updatedAt || Date.now()).toISOString(),
              agent,
              summary: `${agent} 활동 중: ${task}`,
              type: "running",
            });
          }
        }
      }
    }

    if (newActivities.length > 0) {
      setActivities(prev => [...newActivities, ...prev].slice(0, 100));
    }

    prevSessionsRef.current = current;
  }, [sessionData]);

  // Generate initial activity from current sessions
  useEffect(() => {
    if (!sessionData?.sessions || activities.length > 0) return;

    const initial: ActivityEntry[] = (sessionData.sessions as Session[])
      .filter((s: Session) => s.label)
      .slice(0, 20)
      .map((s: Session) => {
        const agent = extractAgentType(s.label || "");
        const task = extractTaskSummary(s.label || "");
        return {
          time: new Date(s.updatedAt || Date.now()).toISOString(),
          agent,
          summary: `${agent}: ${task}`,
          type: "info" as const,
        };
      });

    if (initial.length > 0) {
      setActivities(initial);
    }
  }, [sessionData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">📋 Activity Log</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => { import("swr").then(m => { m.mutate("/api/sessions"); m.mutate("/api/logs"); }); }} className="px-2 py-1 text-xs hover:bg-white/10 rounded-lg transition-colors" title="새로고침">🔄</button>
          <span className="text-xs text-[var(--text-muted)]">Auto-refresh: 30s</span>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 min-h-[400px] max-h-[700px] overflow-y-auto scrollbar-thin">
        {activities.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">세션 데이터 수집 중... 변화 감지 시 자동 표시됩니다.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border)]" />
            <div className="space-y-4">
              {activities.map((act, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 z-10 ${dotColor(act.type)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium ${agentColor(act.agent)}`}>
                        {act.agent}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(act.time).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text)]">{act.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
