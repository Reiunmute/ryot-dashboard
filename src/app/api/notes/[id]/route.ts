import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const DATA_PATH = join(homedir(), "projects/ryot-dashboard/data/notes.json");

function readNotes() {
  if (!existsSync(DATA_PATH)) return [];
  try { return JSON.parse(readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}

function writeNotes(notes: unknown[]) {
  writeFileSync(DATA_PATH, JSON.stringify(notes, null, 2));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const notes = readNotes();
  const filtered = notes.filter((n: Record<string, unknown>) => n.id !== params.id);
  writeNotes(filtered);
  return NextResponse.json({ ok: true });
}
