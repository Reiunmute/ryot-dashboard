"use client";
import AgentStatus from "@/components/AgentStatus";
import { useGateway } from "@/lib/use-gateway";

function formatTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function formatDuration(ms: number) {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

export default function OpsTab() {
  const { crons, connected, connecting, error, refresh, lastUpdated, gatewayUrl } = useGateway(30000);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">⚙️ Ops</h2>
        <button
          onClick={refresh}
          className="px-2 py-1 text-xs hover:bg-white/10 rounded-lg transition-colors"
          title="새로고침"
        >
          🔄
        </button>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-white">Agent Status</h2>
        <AgentStatus />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-white">Cron Jobs</h2>
        <div className="card">
          {connecting ? (
            <p className="text-sm text-[var(--text-muted)]">Connecting...</p>
          ) : !connected ? (
            <p className="text-sm text-red-400">⚠ Not connected to gateway</p>
          ) : (
            <div className="space-y-3">
              {crons.map((job) => {
                const isOk = job.lastStatus === "ok";
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOk ? "bg-[var(--green)]" : "bg-[var(--red)]"
                        }`}
                      />
                      <span className="font-medium text-white">{job.name}</span>
                      {!job.enabled && (
                        <span className="tag tag-yellow">disabled</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[var(--text-muted)]">{job.schedule}</span>
                      {job.lastDurationMs && (
                        <span className="text-[var(--text-muted)]">
                          took {formatDuration(job.lastDurationMs)}
                        </span>
                      )}
                      {job.nextRun && (
                        <span className="text-[var(--text-muted)]">
                          next: {formatTime(job.nextRun)}
                        </span>
                      )}
                      <span className={isOk ? "tag tag-green" : "tag tag-red"}>
                        {isOk ? "✓ ok" : `✗ ${job.lastStatus || "unknown"}`}
                      </span>
                    </div>
                  </div>
                );
              })}
              {crons.length === 0 && connected && (
                <p className="text-sm text-[var(--text-muted)]">No cron jobs found</p>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-white">Service Health</h2>
        <div className="card text-sm">
          {connecting ? (
            <p className="text-[var(--text-muted)]">Connecting...</p>
          ) : connected ? (
            <div className="space-y-2">
              <p className="text-[var(--green)]">✓ Gateway connected</p>
              <p className="text-[var(--text-muted)] text-xs">
                URL: {gatewayUrl}
              </p>
              {lastUpdated && (
                <p className="text-[var(--text-muted)] text-xs">
                  Last updated: {formatTime(lastUpdated)}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-400">✗ Gateway connection failed</p>
              {error && (
                <p className="text-xs text-[var(--text-muted)]">{error}</p>
              )}
              <p className="text-xs text-[var(--text-muted)]">
                Check settings (⚙️) to configure gateway URL
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
