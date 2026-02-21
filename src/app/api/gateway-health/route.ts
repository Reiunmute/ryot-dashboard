import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const CLI_PATH = "/opt/homebrew/bin/openclaw";

function isLocal(gateway: string): boolean {
  try {
    const u = new URL(gateway);
    return ["localhost", "127.0.0.1", "::1"].includes(u.hostname);
  } catch {
    return true;
  }
}

export async function GET(req: NextRequest) {
  const gateway = req.nextUrl.searchParams.get("gateway") || "http://localhost:18789";

  if (isLocal(gateway)) {
    // Local: use CLI directly
    try {
      const out = execSync(`${CLI_PATH} gateway call health --json`, {
        timeout: 10000,
        encoding: "utf-8",
        env: { ...process.env, NO_COLOR: "1" },
      });
      const data = JSON.parse(out);
      return NextResponse.json({ ok: !!data.ok, data });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg });
    }
  }

  // Remote: use gateway call --url
  try {
    const wsUrl = gateway.replace(/^http/, "ws");
    const out = execSync(`${CLI_PATH} gateway call health --json --url "${wsUrl}"`, {
      timeout: 15000,
      encoding: "utf-8",
      env: { ...process.env, NO_COLOR: "1" },
    });
    const data = JSON.parse(out);
    return NextResponse.json({ ok: !!data.ok, data });
  } catch (e: unknown) {
    // Fallback: try HTTP fetch
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(gateway, { signal: controller.signal, headers: { Accept: "text/html" } });
      clearTimeout(timeout);
      return NextResponse.json({ ok: res.ok, status: res.status });
    } catch {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg });
    }
  }
}
