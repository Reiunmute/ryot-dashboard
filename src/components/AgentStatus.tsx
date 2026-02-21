"use client";

import { AGENTS, getPokemonSprite } from "@/lib/constants";
import { useAgentStatus } from "@/lib/hooks";

export default function AgentStatus() {
  const { data, isLoading } = useAgentStatus();

  const getAgentState = (agentName: string) => {
    if (!data) return { status: "unknown", detail: "loading..." };
    
    const cronJobs = data.cronJobs || [];
    const agentCrons = cronJobs.filter((j: Record<string, unknown>) => {
      const name = (j.name as string) || "";
      if (agentName === "Researcher") return name.includes("Viral") || name.includes("News");
      if (agentName === "Watchdog") return name.includes("Watchdog") || name.includes("watchdog");
      return false;
    });

    if (agentCrons.length > 0) {
      const lastRun = agentCrons[0]?.state as Record<string, unknown> | undefined;
      if (lastRun?.lastStatus === "ok") {
        const ago = Date.now() - (lastRun.lastRunAtMs as number);
        const mins = Math.floor(ago / 60000);
        return { status: "active", detail: `last run ${mins}m ago` };
      }
      if (lastRun?.lastStatus === "error") {
        return { status: "error", detail: "last run failed" };
      }
    }

    if (agentName === "Rei") {
      const health = data.health;
      return health?.ok
        ? { status: "active", detail: "gateway running" }
        : { status: "error", detail: "gateway down" };
    }

    return { status: "idle", detail: "idle" };
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {AGENTS.map((agent) => {
        const state = getAgentState(agent.name);
        const isActive = state.status === "active";
        const isError = state.status === "error";
        const statusColor = isActive ? "var(--green)" : isError ? "var(--red)" : "var(--text-muted)";
        const spriteUrl = getPokemonSprite(agent.pokemonId);

        return (
          <div
            key={agent.name}
            className="card flex items-center gap-3 hover:border-[var(--surface-3)] transition-colors"
          >
            {/* Pokemon sprite - GIF animates when active, static PNG when idle */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src={isActive ? spriteUrl : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${agent.pokemonId}.png`}
                alt={agent.pokemon}
                className="pokemon-sprite"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${agent.pokemonId}.png`;
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="font-medium text-sm text-white">{agent.name}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{agent.role}</p>
              <p className="text-xs mt-1" style={{ color: statusColor }}>
                {isLoading ? "⏳ loading..." : `● ${state.detail}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
