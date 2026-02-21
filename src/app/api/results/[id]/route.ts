import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const DATA_PATH = join(homedir(), "projects/ryot-dashboard/data/results.json");

function readResults() {
  if (!existsSync(DATA_PATH)) return [];
  try { return JSON.parse(readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}

function writeResults(results: unknown[]) {
  writeFileSync(DATA_PATH, JSON.stringify(results, null, 2));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const results = readResults();
  const filtered = results.filter((r: Record<string, unknown>) => r.id !== params.id);
  writeResults(filtered);
  return NextResponse.json({ ok: true });
}
