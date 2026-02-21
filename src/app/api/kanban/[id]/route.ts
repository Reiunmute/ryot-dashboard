import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const DATA_PATH = join(homedir(), "projects/ryot-dashboard/data/kanban.json");

function readCards() {
  if (!existsSync(DATA_PATH)) return [];
  try { return JSON.parse(readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}

function writeCards(cards: unknown[]) {
  writeFileSync(DATA_PATH, JSON.stringify(cards, null, 2));
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const cards = readCards();
  const idx = cards.findIndex((c: Record<string, unknown>) => c.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  cards[idx] = { ...cards[idx], ...body };
  writeCards(cards);
  return NextResponse.json(cards[idx]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const cards = readCards();
  const filtered = cards.filter((c: Record<string, unknown>) => c.id !== params.id);
  writeCards(filtered);
  return NextResponse.json({ ok: true });
}
