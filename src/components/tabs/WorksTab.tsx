"use client";

import { useState } from "react";
import { useSessions } from "@/lib/hooks";

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function sessionLabel(id: string) {
  if (id.includes("subagent")) return "Subagent";
  if (id.includes("cron")) return "Cron";
  return "Main";
}

type SortDir = "asc" | "desc";

export default function WorksTab() {
  const { data, isLoading } = useSessions();
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const sessions = data?.sessions || [];

  const sorted = [...sessions].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aLabel = sessionLabel(a.id as string);
    const bLabel = sessionLabel(b.id as string);
    const cmp = aLabel.localeCompare(bLabel);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">🔨 Sessions & Tasks</h2>
        <button onClick={() => { import("swr").then(m => m.mutate("/api/sessions")); }} className="px-2 py-1 text-xs hover:bg-white/10 rounded-lg transition-colors" title="새로고침">🔄</button>
      </div>
      <div className="card">
        {isLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--text-muted)] text-left border-b border-[var(--border)]">
                <th
                  className="pb-3 cursor-pointer hover:text-[var(--text)] select-none"
                  onClick={toggleSort}
                >
                  Type {sortDir === "asc" ? "↑" : "↓"}
                </th>
                <th className="pb-3">Session ID</th>
                <th className="pb-3">Label</th>
                <th className="pb-3">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">
                    No sessions found
                  </td>
                </tr>
              ) : (
                sorted.map((s: Record<string, unknown>) => (
                  <tr key={s.id as string} className="border-b border-[var(--border)]/30 hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-3">
                      <span className={`tag ${
                        sessionLabel(s.id as string) === "Cron"
                          ? "tag-purple"
                          : sessionLabel(s.id as string) === "Subagent"
                          ? "tag-blue"
                          : "tag-green"
                      }`}>
                        {sessionLabel(s.id as string)}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-xs text-[var(--text-muted)]">
                      {(s.id as string).split(":").slice(-1)[0].substring(0, 12)}
                    </td>
                    <td className="py-3 text-xs">{(s.label as string) || (s.id as string)}</td>
                    <td className="py-3 text-[var(--text-muted)] text-xs">
                      {s.updatedAt ? timeAgo(Number(s.updatedAt)) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
