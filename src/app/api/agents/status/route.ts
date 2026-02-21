import { NextResponse } from "next/server";
import { getAgentStatus } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getAgentStatus());
}
