import { NextResponse } from "next/server";
import { getHealth } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getHealth());
}
