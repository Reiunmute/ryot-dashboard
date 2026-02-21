import { NextResponse } from "next/server";
import { getCronJobs } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getCronJobs());
}
