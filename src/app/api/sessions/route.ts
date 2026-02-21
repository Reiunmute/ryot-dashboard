import { NextResponse } from "next/server";
import { getSessions } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSessions());
}
