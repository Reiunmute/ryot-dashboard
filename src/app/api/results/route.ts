import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export const dynamic = "force-dynamic";

const DATA_PATH = join(homedir(), "projects/ryot-dashboard/data/results.json");

export function GET() {
  if (!existsSync(DATA_PATH)) return NextResponse.json([]);
  try {
    return NextResponse.json(JSON.parse(readFileSync(DATA_PATH, "utf-8")));
  } catch {
    return NextResponse.json([]);
  }
}
