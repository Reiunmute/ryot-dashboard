"use client";
import AgentStatus from "@/components/AgentStatus";
import { useCronJobs, useHealth, useAgentStatus } from "@/lib/hooks";
import { mutate } from "swr";

function formatTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function formatDuration(ms: number) {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

export default function OpsTab() {
  const { data: cronData, isLoading: cronLoading } = useCronJobs();
  const { data: healthData, isLoading: healthLoading } = useHealth();

  const jobs = cronData?.jobs || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">⚙️ Ops</h2>
        <button onClick={() => { mutate("/api/agents/status"); mutate("/api/cron"); mutate("/api/health"); }} className="px-2 py-1 text-xs hover:bg-white/10 rounded-lg transition-colors" title="새로고침">🔄</button>
      </div>
      <section>
        <h2 className="text-xl font-semibold mb-4 text-white">Agent Status</h2>
        <AgentStatus />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4 text-white">Cron Jobs</h2>
        <div className="card">
          {cronLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading...</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job: Record<string, unknown>) => {
                const state = job.state as Record<string, unknown> | undefined;
                const isOk = state?.lastStatus === "ok";
                const nextRun = state?.nextRunAtMs as number | undefined;
                const lastDuration = state?.lastDurationMs as number | undefined;
                return (
                  <div
                    key={job.id as string}
                    className="flex items-center justify-between text-sm py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOk ? "bg-[var(--green)]" : "bg-[var(--red)]"}`} />
                      <span className="font-medium text-white">{job.name as string}</span>
                      {!job.enabled && (
                        <span className="tag tag-yellow">disabled</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      {lastDuration && (
                        <span className="text-[var(--text-muted)]">
                          took {formatDuration(lastDuration)}
                        </span>
                      )}
                      {nextRun && (
                        <span className="text-[var(--text-muted)]">
                          next: {formatTime(nextRun)}
                        </span>
                      )}
                      <span className={isOk ? "tag tag-green" : "tag tag-red"}>
                        {isOk ? "✓ ok" : `✗ ${state?.lastStatus || "unknown"}`}
                      </span>
                    </div>
                  </div>
                );
              })}
              {jobs.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">No cron jobs found</p>
              )}
            </div>
          )}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4 text-white">Service Health</h2>
        <div className="card text-sm">
          {healthLoading ? (
            <p className="text-[var(--text-muted)]">Loading...</p>
          ) : healthData?.ok ? (
            <div className="space-y-2">
              <p className="text-[var(--green)]">✓ Gateway running</p>
              {healthData.channels?.telegram?.probe?.ok && (
                <p className="text-[var(--green)]">
                  ✓ Telegram: @{healthData.channels.telegram.probe.bot?.username}
                </p>
              )}
              <p className="text-[var(--text-muted)] text-xs">
                Last checked: {formatTime(healthData.ts)}
              </p>
            </div>
          ) : (
            <p className="text-red-400">✗ Gateway health check failed</p>
          )}
        </div>
      </section>
    </div>
  );
}
