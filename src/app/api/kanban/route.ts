import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const DATA_PATH = join(homedir(), "projects/ryot-dashboard/data/kanban.json");

function readCards() {
  if (!existsSync(DATA_PATH)) return [];
  try { return JSON.parse(readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}

function writeCards(cards: unknown[]) {
  writeFileSync(DATA_PATH, JSON.stringify(cards, null, 2));
}

export function GET() {
  return NextResponse.json(readCards());
}

export async function POST(req: Request) {
  const body = await req.json();
  const cards = readCards();
  
  if (body.id) {
    const idx = cards.findIndex((c: { id: string }) => c.id === body.id);
    if (idx >= 0) {
      cards[idx] = { ...cards[idx], ...body };
      writeCards(cards);
      return NextResponse.json(cards[idx]);
    }
  }
  
  const card = {
    id: randomUUID(),
    title: body.title || "",
    description: body.description || "",
    tags: body.tags || [],
    priority: body.priority || "medium",
    created_at: new Date().toISOString(),
    due_date: body.due_date || "",
    status: body.status || "todo",
    summary: body.summary || "",
    history: body.history || "",
    nextSteps: body.nextSteps || "",
  };
  cards.push(card);
  writeCards(cards);
  return NextResponse.json(card);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  
  const cards = readCards();
  const filtered = cards.filter((c: { id: string }) => c.id !== id);
  writeCards(filtered);
  return NextResponse.json({ ok: true });
}
