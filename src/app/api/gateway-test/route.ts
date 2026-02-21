import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const gateway = request.nextUrl.searchParams.get("gateway") || "http://localhost:18789";
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${gateway}/api/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ status: "connected", gateway, data });
    } else {
      return NextResponse.json({ status: "error", gateway, error: `HTTP ${response.status}` }, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ status: "disconnected", gateway, error: message }, { status: 502 });
  }
}
