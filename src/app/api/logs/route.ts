import { NextResponse } from "next/server";
import { getLogs } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  return NextResponse.json(getLogs(Math.min(limit, 200)));
}
