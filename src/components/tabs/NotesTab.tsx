"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { getTagColor } from "@/lib/constants";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  platform: string;
  tags: string[];
  source_url: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NotesTab() {
  const { data: notes = [], isLoading, mutate: mutateNotes } = useSWR<Note[]>("/api/notes", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [detailNote, setDetailNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("");
  const [tags, setTags] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));
  const allPlatforms = Array.from(new Set(notes.map(n => n.platform).filter(Boolean)));

  const filtered = notes.filter(n => {
    const q = searchQuery.toLowerCase();
    if (q && !n.title?.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false;
    if (filterTag && !n.tags.includes(filterTag)) return false;
    if (filterPlatform && n.platform !== filterPlatform) return false;
    return true;
  });

  const resetForm = () => {
    setTitle(""); setContent(""); setPlatform(""); setTags(""); setSourceUrl("");
    setShowForm(false); setEditNote(null);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setTitle(note.title || "");
    setContent(note.content);
    setPlatform(note.platform);
    setTags(note.tags.join(", "));
    setSourceUrl(note.source_url);
    setDetailNote(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    const body = {
      id: editNote?.id,
      title,
      content,
      platform,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      source_url: sourceUrl,
    };
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    mutate("/api/notes");
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/notes?id=" + id, { method: "DELETE" });
    mutate("/api/notes");
  };

  const handleRefresh = () => mutateNotes();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">📝 메모장</h2>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="px-2 py-1 text-xs hover:bg-white/10 rounded-lg transition-colors" title="새로고침">🔄</button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-2.5 py-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg text-xs font-medium transition-colors"
          >
            + 새 메모
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          type="text" placeholder="검색..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs flex-1 min-w-[200px] focus:outline-none focus:border-[var(--accent)]"
        />
        {allPlatforms.length > 0 && (
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs">
            <option value="">All Platforms</option>
            {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        {allTags.length > 0 && (
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs">
            <option value="">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Detail Modal */}
      {detailNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setDetailNote(null)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 w-full max-w-lg space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-sm">{detailNote.title || "(제목 없음)"}</h3>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(detailNote)} className="text-[10px] text-[var(--accent)] hover:underline px-2 py-1">수정</button>
                <button onClick={() => { handleDelete(detailNote.id); setDetailNote(null); }} className="text-[10px] text-red-400 hover:underline px-2 py-1">삭제</button>
              </div>
            </div>
            <p className="text-xs whitespace-pre-wrap leading-relaxed">{detailNote.content}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {detailNote.platform && <span className="tag-cyan text-[10px] px-2 py-0.5 rounded-full">{detailNote.platform}</span>}
              {detailNote.tags.map(tag => (
                <span key={tag} className={`${getTagColor(tag)} text-[10px] px-2 py-0.5 rounded-full`}>{tag}</span>
              ))}
              <span className="text-[10px] text-[var(--text-muted)]">{new Date(detailNote.date).toLocaleDateString("ko-KR")}</span>
            </div>
            {detailNote.source_url && (
              <a href={detailNote.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--accent)] hover:underline block truncate">
                {detailNote.source_url}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Edit/New Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={resetForm}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 w-full max-w-lg space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm">{editNote ? "메모 수정" : "새 메모"}</h3>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="제목..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)]" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="메모 내용..." rows={5}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[var(--accent)] resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={platform} onChange={e => setPlatform(e.target.value)} placeholder="플랫폼 (telegram, x, web...)"
                className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)]" />
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="태그 (comma separated)"
                className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <input type="text" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="소스 URL (optional)"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)]" />
            <div className="flex justify-end gap-2">
              <button onClick={resetForm} className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">취소</button>
              <button onClick={handleSave} disabled={!title.trim() && !content.trim()}
                className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-1.5">
        {isLoading ? (
          <p className="text-xs text-[var(--text-muted)]">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--text-muted)]">
            {notes.length === 0 ? "아직 메모가 없습니다. 새 메모를 추가해보세요!" : "검색 결과가 없습니다"}
          </div>
        ) : (
          filtered.map(note => (
            <div key={note.id} onClick={() => setDetailNote(note)}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 hover:border-[var(--surface-3)] transition-colors cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{note.title || "(제목 없음)"}</p>
                  {note.content && (
                    <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                      {note.content.length > 120 ? note.content.slice(0, 120) + "…" : note.content}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {note.platform && <span className="tag-cyan text-[9px] px-1.5 py-0.5 rounded-full">{note.platform}</span>}
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className={`${getTagColor(tag)} text-[9px] px-1.5 py-0.5 rounded-full`}>{tag}</span>
                  ))}
                  <span className="text-[9px] text-[var(--text-muted)]">{new Date(note.date).toLocaleDateString("ko-KR")}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
