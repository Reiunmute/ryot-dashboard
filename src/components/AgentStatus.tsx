"use client";

import { AGENTS, getPokemonSprite } from "@/lib/constants";
import { useGateway, AgentStatus as AgentStatusType } from "@/lib/use-gateway";

export default function AgentStatus() {
  const { agents, crons, connected, connecting, error } = useGateway(30000);

  const getAgentState = (agentName: string) => {
    // Find matching agent from gateway data
    const gatewayAgent = agents.find(
      (a) => a.name.toLowerCase() === agentName.toLowerCase()
    );

    if (gatewayAgent) {
      const ageMs = gatewayAgent.lastActive
        ? Date.now() - gatewayAgent.lastActive
        : null;
      const ageMins = ageMs ? Math.floor(ageMs / 60000) : null;

      let detail = "idle";
      if (gatewayAgent.status === "active") {
        detail = ageMins !== null && ageMins > 0 ? `active ${ageMins}m ago` : "active now";
      } else if (gatewayAgent.status === "idle") {
        detail = ageMins !== null ? `idle, last ${ageMins}m ago` : "idle";
      } else {
        detail = "offline";
      }

      if (gatewayAgent.percentUsed !== null) {
        detail += ` (${gatewayAgent.percentUsed}% ctx)`;
      }

      return { status: gatewayAgent.status, detail };
    }

    // Check if it's a cron-based agent
    const agentCrons = crons.filter((j) => {
      if (agentName === "Researcher") {
        return j.name.includes("Viral") || j.name.includes("News");
      }
      if (agentName === "Watchdog") {
        return j.name.toLowerCase().includes("watchdog");
      }
      return false;
    });

    if (agentCrons.length > 0) {
      const lastRun = agentCrons[0]?.lastRun;
      const lastStatus = agentCrons[0]?.lastStatus;

      if (lastStatus === "ok" && lastRun) {
        const ago = Date.now() - lastRun;
        const mins = Math.floor(ago / 60000);
        return { status: "active" as const, detail: `last run ${mins}m ago` };
      }
      if (lastStatus === "error") {
        return { status: "error" as const, detail: "last run failed" };
      }
    }

    // Fallback for other agents (Writer, Coder, Image Creator)
    // These are sub-agents that run on demand
    return { status: "idle" as const, detail: "on standby" };
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {AGENTS.map((agent) => {
        const state = getAgentState(agent.name);
        const isActive = state.status === "active";
        const isError = state.status === "error";
        const statusColor = isActive
          ? "var(--green)"
          : isError
          ? "var(--red)"
          : "var(--text-muted)";
        const spriteUrl = getPokemonSprite(agent.pokemonId);

        return (
          <div
            key={agent.name}
            className="card flex items-center gap-3 hover:border-[var(--surface-3)] transition-colors"
          >
            {/* Pokemon sprite - GIF animates when active, static PNG when idle */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src={
                  isActive
                    ? spriteUrl
                    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${agent.pokemonId}.png`
                }
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
                <span className="font-medium text-sm text-white">
                  {agent.name}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{agent.role}</p>
              <p className="text-xs mt-1" style={{ color: statusColor }}>
                {connecting ? (
                  "⏳ connecting..."
                ) : !connected ? (
                  <span className="text-red-400">⚠ disconnected</span>
                ) : (
                  `● ${state.detail}`
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
