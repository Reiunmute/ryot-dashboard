"use client";

import { useState, useEffect } from "react";

const DEFAULT_GATEWAY = "http://localhost:18789";
const STORAGE_KEY = "openclaw-gateway-url";

export function getGatewayUrl(): string {
  if (typeof window === "undefined") return DEFAULT_GATEWAY;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_GATEWAY;
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState(DEFAULT_GATEWAY);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  useEffect(() => {
    setUrl(getGatewayUrl());
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, url);
    window.dispatchEvent(new Event("gateway-url-changed"));
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/gateway-health?gateway=${encodeURIComponent(url)}`);
      const data = await res.json();
      setTestResult(data.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg w-[420px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-white mb-4">⚙️ Settings</h2>

        <label className="block text-xs text-[var(--text-muted)] mb-1.5">Gateway URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={DEFAULT_GATEWAY}
          className="w-full px-3 py-2 text-xs rounded-md bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] mb-3"
        />

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-3 py-1.5 text-xs rounded-md bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-colors disabled:opacity-50"
          >
            {testing ? "Testing..." : "연결 테스트"}
          </button>
          {testResult === "ok" && (
            <span className="text-xs text-green-400">✅ 연결 성공</span>
          )}
          {testResult === "fail" && (
            <span className="text-xs text-red-400">❌ 연결 실패</span>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-md text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
