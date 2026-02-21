export const TABS = [
  { id: "ops", label: "Ops", icon: "⚙️" },
  { id: "activity", label: "Activity Log", icon: "📋" },
  { id: "notes", label: "Memo", icon: "📝" },
  { id: "works", label: "Work", icon: "🔨" },
  { id: "kanban", label: "Kanban", icon: "📌" },
  { id: "results", label: "Result", icon: "🏆" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

const SHOWDOWN_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";

export const AGENTS = [
  { name: "Rei", role: "Main Supervisor", color: "#3b82f6", pokemon: "umbreon", pokemonId: 197 },
  { name: "Misa", role: "Research & Code Review", color: "#06b6d4", pokemon: "sylveon", pokemonId: 700 },
  { name: "Researcher", role: "Cron: Viral Intel / Daily News", color: "#a855f7", pokemon: "flareon", pokemonId: 136 },
  { name: "Writer", role: "Content Writer", color: "#ec4899", pokemon: "leafeon", pokemonId: 470 },
  { name: "Coder", role: "Code Tasks", color: "#22c55e", pokemon: "glaceon", pokemonId: 471 },
  { name: "Image Creator", role: "Image Generation", color: "#f97316", pokemon: "jolteon", pokemonId: 135 },
  { name: "Watchdog", role: "Cron Monitor", color: "#eab308", pokemon: "espeon", pokemonId: 196 },
] as const;

export function getPokemonSprite(pokemonId: number) {
  return `${SHOWDOWN_BASE}/${pokemonId}.gif`;
}

export const REFRESH_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL || "1800000",
  10
);

export const KANBAN_COLUMNS = [
  { id: "todo", label: "TO DO", color: "#64748b" },
  { id: "working", label: "WORKING ON IT", color: "#3b82f6" },
  { id: "review", label: "NEEDS REVIEW", color: "#eab308" },
  { id: "done", label: "DONE", color: "#22c55e" },
] as const;

export type KanbanStatus = (typeof KANBAN_COLUMNS)[number]["id"];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "tag-blue",
  medium: "tag-yellow",
  high: "tag-orange",
  urgent: "tag-red",
};

export const TAG_COLORS = [
  "tag-blue", "tag-green", "tag-purple", "tag-pink",
  "tag-orange", "tag-cyan", "tag-yellow", "tag-red",
];

export function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export const PLATFORM_COLORS: Record<string, string> = {
  X: "tag-blue",
  Article: "tag-purple",
  Telegram: "tag-cyan",
  YouTube: "tag-red",
  Discord: "tag-purple",
  Reddit: "tag-orange",
  default: "tag-green",
};
