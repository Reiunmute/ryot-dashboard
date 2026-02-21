"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import useSWR, { mutate } from "swr";
import { KANBAN_COLUMNS, KanbanStatus, PRIORITIES, Priority, PRIORITY_COLORS } from "@/lib/constants";

const TAG_PALETTE = [
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-green-500/20 text-green-400 border-green-500/30",
  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "bg-red-500/20 text-red-400 border-red-500/30",
];

function getTagStyle(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

interface KanbanCard {
  id: string;
  title: string;
  description: string;
  tags: string[];
  priority: Priority;
  created_at: string;
  due_date: string;
  status: KanbanStatus;
  summary?: string;
  history?: string;
  nextSteps?: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function KanbanTab() {
  const { data: cards = [], isLoading } = useSWR<KanbanCard[]>("/api/kanban", fetcher);
  const [showModal, setShowModal] = useState(false);
  const [detailCard, setDetailCard] = useState<KanbanCard | null>(null);
  const [editCard, setEditCard] = useState<KanbanCard | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<KanbanStatus>("todo");
  const tagInputRef = useRef<HTMLInputElement>(null);

  const allTags = Array.from(new Set(cards.flatMap(c => c.tags || []).filter(Boolean)));

  const filteredCards = tagFilter ? cards.filter(c => (c.tags || []).includes(tagFilter)) : cards;

  const resetForm = () => {
    setTitle(""); setDescription(""); setTagsInput(""); setSelectedTags([]);
    setPriority("medium"); setDueDate(""); setStatus("todo");
    setShowModal(false); setEditCard(null); setShowTagDropdown(false);
  };

  const openNew = (col: KanbanStatus) => {
    resetForm();
    setStatus(col);
    setShowModal(true);
  };

  const openDetail = (card: KanbanCard) => {
    setDetailCard(card);
  };

  const openEdit = (card: KanbanCard) => {
    setEditCard(card);
    setTitle(card.title); setDescription(card.description);
    setSelectedTags(card.tags || []);
    setPriority(card.priority); setDueDate(card.due_date); setStatus(card.status);
    setDetailCard(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    const body = { id: editCard?.id, title, description, tags: selectedTags, priority, due_date: dueDate, status };
    await fetch("/api/kanban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    mutate("/api/kanban");
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/kanban?id=${id}`, { method: "DELETE" });
    mutate("/api/kanban");
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !selectedTags.includes(t)) setSelectedTags([...selectedTags, t]);
    setTagsInput("");
    setShowTagDropdown(false);
  };

  const removeTag = (tag: string) => setSelectedTags(selectedTags.filter(t => t !== tag));

  const filteredDropdownTags = allTags.filter(t => !selectedTags.includes(t) && t.toLowerCase().includes(tagsInput.toLowerCase()));

  // Drag & Drop
  const handleDragStart = (e: DragEvent, cardId: string) => { setDraggedId(cardId); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: DragEvent, colId: string) => { e.preventDefault(); setOverColumn(colId); };
  const handleDragLeave = () => setOverColumn(null);
  const handleDrop = async (e: DragEvent, colId: KanbanStatus) => {
    e.preventDefault(); setOverColumn(null);
    if (!draggedId) return;
    const card = cards.find(c => c.id === draggedId);
    if (!card || card.status === colId) { setDraggedId(null); return; }
    await fetch("/api/kanban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...card, status: colId }) });
    setDraggedId(null); mutate("/api/kanban");
  };

  return (
    <div className="space-y-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">📌 Kanban Board</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => { import("swr").then(m => m.mutate("/api/kanban")); }} className="px-2 py-1 text-xs hover:bg-white/10 rounded-lg transition-colors" title="새로고침">🔄</button>
          {tagFilter && (
            <button onClick={() => setTagFilter("")} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1">✕ Clear filter</button>
          )}
          {allTags.map(tag => (
            <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${getTagStyle(tag)} ${tagFilter === tag ? "ring-1 ring-white/30" : "opacity-70 hover:opacity-100"}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-xs text-[var(--text-muted)]">Loading...</p>
      ) : (
        <div className="grid grid-cols-4 gap-3 min-h-[500px]">
          {KANBAN_COLUMNS.map(col => {
            const colCards = filteredCards.filter(c => c.status === col.id);
            return (
              <div key={col.id}
                className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 flex flex-col transition-colors ${overColumn === col.id ? "bg-[var(--surface-2)]" : ""}`}
                onDragOver={e => handleDragOver(e, col.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, col.id as KanbanStatus)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{col.label}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{colCards.length}</span>
                </div>
                <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin">
                  {colCards.map(card => (
                    <div key={card.id} draggable onDragStart={e => handleDragStart(e, card.id)} onClick={() => openDetail(card)}
                      className={`rounded-lg border border-[var(--border)] bg-[var(--card)] p-2.5 cursor-pointer hover:border-[var(--surface-3)] transition-all ${draggedId === card.id ? "opacity-50 rotate-1" : ""}`}>
                      <p className="text-xs font-medium mb-0.5">{card.title}</p>
                      {card.description && <p className="text-[10px] text-[var(--text-muted)] mb-1.5 line-clamp-2">{card.description}</p>}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`${PRIORITY_COLORS[card.priority]} text-[9px] px-1.5 py-0.5 rounded-full`}>{card.priority}</span>
                        {(card.tags || []).map(tag => (
                          <span key={tag} className={`${getTagStyle(tag)} text-[9px] px-1.5 py-0.5 rounded-full border`}>{tag}</span>
                        ))}
                        {card.due_date && <span className="text-[9px] text-[var(--text-muted)]">📅 {card.due_date}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => openNew(col.id as KanbanStatus)}
                  className="mt-1.5 w-full py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg transition-colors">
                  + Add card
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailCard(null)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{detailCard.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`${PRIORITY_COLORS[detailCard.priority]} text-[10px] px-1.5 py-0.5 rounded-full`}>{detailCard.priority}</span>
                  {(detailCard.tags || []).map(tag => (
                    <span key={tag} className={`${getTagStyle(tag)} text-[10px] px-1.5 py-0.5 rounded-full border`}>{tag}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => openEdit(detailCard)} className="text-xs text-[var(--accent)] hover:underline shrink-0">Edit</button>
            </div>
            {detailCard.description && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Description</p>
                <p className="text-xs text-[var(--text)]">{detailCard.description}</p>
              </div>
            )}
            {detailCard.summary && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Summary</p>
                <p className="text-xs text-[var(--text)]">{detailCard.summary}</p>
              </div>
            )}
            {detailCard.history && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">History</p>
                <p className="text-xs text-[var(--text)] whitespace-pre-wrap">{detailCard.history.replace(/ · /g, '\n')}</p>
              </div>
            )}
            {detailCard.nextSteps && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Next Steps</p>
                <p className="text-xs text-[var(--text)]">{detailCard.nextSteps}</p>
              </div>
            )}
            {detailCard.due_date && (
              <p className="text-[10px] text-[var(--text-muted)]">📅 Due: {detailCard.due_date}</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={resetForm}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 w-full max-w-lg space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm">{editCard ? "Edit Card" : "New Card"}</h3>
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Card title"
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[var(--accent)] resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Tags</label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {selectedTags.map(tag => (
                  <span key={tag} className={`${getTagStyle(tag)} text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1`}>
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input ref={tagInputRef} type="text" value={tagsInput}
                  onChange={e => { setTagsInput(e.target.value); setShowTagDropdown(true); }}
                  onFocus={() => setShowTagDropdown(true)}
                  onKeyDown={e => { if (e.key === "Enter" && tagsInput.trim()) { e.preventDefault(); addTag(tagsInput); } }}
                  placeholder="Add tag..."
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)]" />
                {showTagDropdown && (filteredDropdownTags.length > 0 || tagsInput.trim()) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                    {tagsInput.trim() && !allTags.includes(tagsInput.trim()) && (
                      <button onClick={() => addTag(tagsInput)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--surface-2)] text-[var(--accent)]">
                        + Create &quot;{tagsInput.trim()}&quot;
                      </button>
                    )}
                    {filteredDropdownTags.map(tag => (
                      <button key={tag} onClick={() => addTag(tag)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--surface-2)]">
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                {editCard && (
                  <button onClick={() => { handleDelete(editCard.id); resetForm(); }} className="text-[10px] text-red-400 hover:text-red-300 px-3 py-1.5">Delete</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={resetForm} className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">Cancel</button>
                <button onClick={handleSave} disabled={!title.trim()} className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
