import useSWR, { mutate } from "swr";
import { REFRESH_INTERVAL } from "./constants";
import { useEffect, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useGatewayUrl() {
  const [gw, setGw] = useState("http://localhost:18789");
  useEffect(() => {
    const stored = localStorage.getItem("openclaw-gateway-url");
    if (stored) setGw(stored);
    const onChanged = () => {
      setGw(localStorage.getItem("openclaw-gateway-url") || "http://localhost:18789");
    };
    window.addEventListener("gateway-url-changed", onChanged);
    return () => window.removeEventListener("gateway-url-changed", onChanged);
  }, []);
  return gw;
}

function withGateway(path: string, gw: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}gateway=${encodeURIComponent(gw)}`;
}

export function useSessions() {
  const gw = useGatewayUrl();
  return useSWR(withGateway("/api/sessions", gw), fetcher, { refreshInterval: REFRESH_INTERVAL });
}

export function useCronJobs() {
  const gw = useGatewayUrl();
  return useSWR(withGateway("/api/cron", gw), fetcher, { refreshInterval: REFRESH_INTERVAL });
}

export function useLogs(limit = 50) {
  const gw = useGatewayUrl();
  return useSWR(withGateway(`/api/logs?limit=${limit}`, gw), fetcher, {
    refreshInterval: REFRESH_INTERVAL,
  });
}

export function useMemoryFiles() {
  const gw = useGatewayUrl();
  return useSWR(withGateway("/api/memory", gw), fetcher, { refreshInterval: REFRESH_INTERVAL });
}

export function useMemoryFile(file: string | null) {
  const gw = useGatewayUrl();
  return useSWR(file ? withGateway(`/api/memory?file=${encodeURIComponent(file)}`, gw) : null, fetcher);
}

export function useAgentStatus() {
  const gw = useGatewayUrl();
  return useSWR(withGateway("/api/agents/status", gw), fetcher, {
    refreshInterval: REFRESH_INTERVAL,
  });
}

export function useHealth() {
  const gw = useGatewayUrl();
  return useSWR(withGateway("/api/health", gw), fetcher, { refreshInterval: REFRESH_INTERVAL });
}

// Notes
export function useNotes(params?: { platform?: string; tag?: string; search?: string }) {
  const gw = useGatewayUrl();
  const query = new URLSearchParams();
  if (params?.platform) query.set("platform", params.platform);
  if (params?.tag) query.set("tag", params.tag);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return useSWR(withGateway(`/api/notes${qs ? `?${qs}` : ""}`, gw), fetcher, { refreshInterval: REFRESH_INTERVAL });
}

export async function createNote(note: { content: string; platform?: string; tags?: string[]; source_url?: string }) {
  const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(note) });
  const data = await res.json();
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/notes"));
  return data;
}

export async function deleteNote(id: string) {
  await fetch(`/api/notes/${id}`, { method: "DELETE" });
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/notes"));
}

// Kanban
export function useKanban() {
  const gw = useGatewayUrl();
  return useSWR(withGateway("/api/kanban", gw), fetcher, { refreshInterval: REFRESH_INTERVAL });
}

export async function createKanbanCard(card: Record<string, unknown>) {
  const res = await fetch("/api/kanban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(card) });
  const data = await res.json();
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/kanban"));
  return data;
}

export async function updateKanbanCard(id: string, updates: Record<string, unknown>) {
  const res = await fetch(`/api/kanban/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
  const data = await res.json();
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/kanban"));
  return data;
}

export async function deleteKanbanCard(id: string) {
  await fetch(`/api/kanban/${id}`, { method: "DELETE" });
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/kanban"));
}

// Results
export function useResults() {
  const gw = useGatewayUrl();
  return useSWR(withGateway("/api/results", gw), fetcher, { refreshInterval: REFRESH_INTERVAL });
}

export async function createResult(result: Record<string, unknown>) {
  const res = await fetch("/api/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
  const data = await res.json();
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/results"));
  return data;
}

export async function deleteResult(id: string) {
  await fetch(`/api/results/${id}`, { method: "DELETE" });
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/results"));
}
