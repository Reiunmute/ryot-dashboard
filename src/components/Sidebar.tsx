"use client";

import { useState, useEffect, useCallback } from "react";
import { TABS, TabId } from "@/lib/constants";
import SettingsModal, { getGatewayUrl } from "./SettingsModal";

export default function Sidebar({
  active,
  onSelect,
}: {
  active: TabId;
  onSelect: (t: TabId) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const gw = getGatewayUrl();
      const res = await fetch(`/api/gateway-health?gateway=${encodeURIComponent(gw)}`);
      const data = await res.json();
      setConnected(!!data.ok);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    const onChanged = () => checkConnection();
    window.addEventListener("gateway-url-changed", onChanged);
    return () => {
      clearInterval(interval);
      window.removeEventListener("gateway-url-changed", onChanged);
    };
  }, [checkConnection]);

  return (
    <>
      <nav className="w-52 shrink-0 bg-[var(--sidebar-bg)] flex flex-col border-r border-[var(--border)]">
        <div className="px-4 py-3.5 border-b border-[var(--border)]">
          <h1 className="text-sm font-bold tracking-tight text-white">🤖 Ryot Dashboard</h1>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Agent Team Manager</p>
        </div>
        <div className="flex-1 py-2 px-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2.5 rounded-md mb-0.5 transition-all ${
                active === tab.id
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] font-medium"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="px-3 py-2.5 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                connected === null
                  ? "bg-gray-500"
                  : connected
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />
            <span className="text-[10px] text-[var(--text-muted)]">
              {connected === null ? "Checking..." : connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </nav>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
