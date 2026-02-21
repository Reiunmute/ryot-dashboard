import { execSync } from "child_process";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

function runCli(args: string): unknown {
  try {
    const out = execSync(`/opt/homebrew/bin/openclaw ${args}`, {
      timeout: 10000,
      encoding: "utf-8",
      env: { ...process.env, NO_COLOR: "1" },
    });
    return JSON.parse(out);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}

export function getCronJobs() {
  return runCli("cron list --json");
}

export function getHealth() {
  return runCli("health --json");
}

export function getLogs(limit = 50) {
  try {
    const out = execSync(
      `/opt/homebrew/bin/openclaw logs --json --limit ${limit} --no-color`,
      { timeout: 10000, encoding: "utf-8", env: { ...process.env, NO_COLOR: "1" } }
    );
    // JSONL: one JSON object per line
    const lines = out.trim().split("\n").filter(Boolean);
    return lines.map((line) => {
      try { return JSON.parse(line); } catch { return { type: "parse-error", raw: line }; }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return [{ type: "error", message: msg }];
  }
}

export function getSessions() {
  const sessionsPath = join(
    homedir(),
    ".openclaw/agents/main/sessions/sessions.json"
  );
  try {
    const data = JSON.parse(readFileSync(sessionsPath, "utf-8"));
    const sessions: Record<string, unknown>[] = Object.entries(data).map(([id, value]) => {
      const v = value as Record<string, unknown>;
      return {
        id,
        sessionId: v.sessionId,
        updatedAt: v.updatedAt,
        channel: v.channel || v.lastChannel,
        model: v.model,
        label: v.label,
        totalTokens: v.totalTokens,
      };
    });
    sessions.sort((a, b) => {
      const aTime = Number(a.updatedAt) || 0;
      const bTime = Number(b.updatedAt) || 0;
      return bTime - aTime;
    });
    return { sessions: sessions.slice(0, 50) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}

export function getMemoryFiles() {
  const wsDir = join(homedir(), ".openclaw/workspace");
  const memDir = join(wsDir, "memory");
  const files: { name: string; path: string }[] = [];

  // MEMORY.md
  if (existsSync(join(wsDir, "MEMORY.md"))) {
    files.push({ name: "MEMORY.md", path: "MEMORY.md" });
  }

  // memory/*.md
  if (existsSync(memDir)) {
    for (const f of readdirSync(memDir)) {
      if (f.endsWith(".md")) {
        files.push({ name: `memory/${f}`, path: `memory/${f}` });
      }
    }
  }

  return { files };
}

export function readMemoryFile(filePath: string) {
  // Sanitize path - only allow memory/ and MEMORY.md
  if (!filePath.match(/^(MEMORY\.md|memory\/[\w.-]+\.md)$/)) {
    return { error: "Invalid path" };
  }
  const fullPath = join(homedir(), ".openclaw/workspace", filePath);
  try {
    const content = readFileSync(fullPath, "utf-8");
    return { content, path: filePath };
  } catch {
    return { error: "File not found" };
  }
}

export function getAgentStatus() {
  const health = runCli("health --json") as Record<string, unknown>;
  const cronData = runCli("cron list --json") as { jobs?: Array<Record<string, unknown>> };
  
  return {
    health,
    cronJobs: cronData?.jobs || [],
  };
}
