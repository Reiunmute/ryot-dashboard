import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const DATA_PATH = join(homedir(), "projects/ryot-dashboard/data/notes.json");

interface NoteRaw {
  id: string;
  title?: string;
  content: string;
  date: string;
  platform: string;
  tags: string[];
  source_url: string;
}

function readNotes(): NoteRaw[] {
  if (!existsSync(DATA_PATH)) return [];
  try { return JSON.parse(readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}

function migrateNote(n: NoteRaw): NoteRaw {
  if (n.title) return n;
  // Migrate: first line of content becomes title
  const lines = n.content.split("\n");
  const title = lines[0].trim();
  const rest = lines.slice(1).join("\n").trim();
  return { ...n, title, content: rest || title };
}

function writeNotes(notes: NoteRaw[]) {
  writeFileSync(DATA_PATH, JSON.stringify(notes, null, 2));
}

export function GET() {
  const notes = readNotes().map(migrateNote);
  // Persist migration
  writeNotes(notes);
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const notes = readNotes().map(migrateNote);
  
  if (body.id) {
    const idx = notes.findIndex(n => n.id === body.id);
    if (idx >= 0) {
      notes[idx] = { ...notes[idx], title: body.title ?? notes[idx].title, content: body.content ?? notes[idx].content, platform: body.platform ?? notes[idx].platform, tags: body.tags ?? notes[idx].tags, source_url: body.source_url ?? notes[idx].source_url };
      writeNotes(notes);
      return NextResponse.json(notes[idx]);
    }
  }
  
  const note: NoteRaw = {
    id: randomUUID(),
    title: body.title || "",
    content: body.content || "",
    date: new Date().toISOString(),
    platform: body.platform || "",
    tags: body.tags || [],
    source_url: body.source_url || "",
  };
  notes.unshift(note);
  writeNotes(notes);
  return NextResponse.json(note);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  
  const notes = readNotes();
  const filtered = notes.filter(n => n.id !== id);
  writeNotes(filtered);
  return NextResponse.json({ ok: true });
}
