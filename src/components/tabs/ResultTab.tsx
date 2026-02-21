"use client";

import { useState } from "react";
import useSWR from "swr";
import { getTagColor } from "@/lib/constants";

interface Result {
  id: string;
  title: string;
  type: string;
  url?: string;
  thumbnail?: string;
  date: string;
  tags: string[];
  description?: string;
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error("Failed to fetch");
  return r.json();
}).then(data => Array.isArray(data) ? data : []).catch(() => []);

export default function ResultTab() {
  const { data: results = [], isLoading, error, mutate } = useSWR<Result[]>("/api/results", fetcher);
  const [filterType, setFilterType] = useState("");
  const [detailResult, setDetailResult] = useState<Result | null>(null);

  const allTypes = Array.from(new Set((results || []).map(r => r.type).filter(Boolean)));
  const filtered = filterType ? (results || []).filter(r => r.type === filterType) : (results || []);

  if (error) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold">🏆 Published Results</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--text-muted)]">
          <p>데이터를 불러오는데 실패했습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">🏆 Published Results</h2>
        <div className="flex gap-2 items-center">
          <button onClick={() => mutate()} className="px-2 py-1 text-xs hover:bg-white/10 rounded-lg transition-colors" title="새로고침">🔄</button>
          {allTypes.length > 1 && (
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs">
              <option value="">All Types</option>
              {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setDetailResult(null)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            {detailResult.thumbnail && (
              <div className="w-full max-h-64 overflow-hidden bg-[var(--surface)]">
                <img src={detailResult.thumbnail} alt={detailResult.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-sm">{detailResult.title}</h3>
                <button onClick={() => setDetailResult(null)} className="text-[var(--text-muted)] hover:text-white text-sm ml-2">✕</button>
              </div>
              {detailResult.description && (
                <p className="text-xs text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">{detailResult.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="tag-cyan text-[10px] px-2 py-0.5 rounded-full uppercase">{detailResult.type}</span>
                {detailResult.tags?.map(tag => (
                  <span key={tag} className={`${getTagColor(tag)} text-[10px] px-2 py-0.5 rounded-full`}>{tag}</span>
                ))}
                <span className="text-[10px] text-[var(--text-muted)]">{new Date(detailResult.date).toLocaleDateString("ko-KR")}</span>
              </div>
              {detailResult.url && (
                <a href={detailResult.url} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-xs text-[var(--accent)] hover:underline">
                  🔗 원본 보기
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-[var(--text-muted)]">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-10 text-center text-[var(--text-muted)]">
          <p className="text-3xl mb-2">🎨</p>
          <p className="text-xs">퍼블리시된 결과물이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(result => (
            <div
              key={result.id}
              onClick={() => setDetailResult(result)}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--surface-3)] transition-colors group cursor-pointer"
            >
              {result.thumbnail && (
                <div className="aspect-video bg-[var(--surface)] overflow-hidden">
                  <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="tag-cyan text-[9px] px-1.5 py-0.5 rounded-full uppercase">{result.type}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{new Date(result.date).toLocaleDateString("ko-KR")}</span>
                </div>
                <h3 className="font-medium text-xs mb-0.5 group-hover:text-[var(--accent)] transition-colors">{result.title}</h3>
                {result.description && <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">{result.description}</p>}
                {result.tags && result.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {result.tags.map(tag => (
                      <span key={tag} className={`${getTagColor(tag)} text-[9px] px-1.5 py-0.5 rounded-full`}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
