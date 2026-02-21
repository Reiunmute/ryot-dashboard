import { NextResponse } from "next/server";
import { getMemoryFiles, readMemoryFile } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  const file = url.searchParams.get("file");
  if (file) {
    return NextResponse.json(readMemoryFile(file));
  }
  return NextResponse.json(getMemoryFiles());
}
