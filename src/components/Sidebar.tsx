"use client";

import { useState } from "react";
import { TABS, TabId } from "@/lib/constants";
import SettingsModal from "./SettingsModal";
import { useGateway } from "@/lib/use-gateway";

export default function Sidebar({
  active,
  onSelect,
}: {
  active: TabId;
  onSelect: (t: TabId) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const { connected, connecting, error, lastUpdated } = useGateway(30000);

  const getStatusColor = () => {
    if (connecting) return "bg-yellow-400 animate-pulse";
    if (connected) return "bg-green-400";
    return "bg-red-400";
  };

  const getStatusText = () => {
    if (connecting) return "Connecting...";
    if (connected) {
      if (lastUpdated) {
        const ago = Math.floor((Date.now() - lastUpdated) / 1000);
        return ago < 60 ? "Connected" : `Updated ${Math.floor(ago / 60)}m ago`;
      }
      return "Connected";
    }
    return error ? `Error: ${error.slice(0, 20)}...` : "Disconnected";
  };

  return (
    <>
      <nav className="w-52 shrink-0 bg-[var(--sidebar-bg)] flex flex-col border-r border-[var(--border)]">
        <div className="px-4 py-3.5 border-b border-[var(--border)]">
          <h1 className="text-sm font-bold tracking-tight text-white">
            🤖 Ryot Dashboard
          </h1>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Agent Team Manager
          </p>
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
            <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
              {getStatusText()}
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
