import React, { useState, useEffect, useCallback } from "react";

interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
  clipCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TopicClip {
  id: string;
  type: string;
  content: string;
  summary: string | null;
  tags: string[];
  mood: string | null;
  createdAt: string;
  topicConfidence: number;
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TopicsView() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicClips, setTopicClips] = useState<TopicClip[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const api = (window as any).ghostclip;

  const loadTopics = useCallback(async () => {
    setLoading(true);
    const t = await api?.getTopics?.();
    setTopics(t || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const loadTopicClips = useCallback(async (topicId: string) => {
    const clips = await api?.getTopicClips?.(topicId);
    setTopicClips(clips || []);
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      loadTopicClips(selectedTopic.id);
    }
  }, [selectedTopic, loadTopicClips]);

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
    if (q.trim()) {
      const results = await api?.searchTopics?.(q.trim());
      setTopics(results || []);
    } else {
      loadTopics();
    }
  }, [loadTopics]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    await api?.createTopic?.(newName.trim(), newDesc.trim(), "📂");
    setNewName("");
    setNewDesc("");
    setCreating(false);
    loadTopics();
  }, [newName, newDesc, loadTopics]);

  const handleDelete = useCallback(async (topicId: string) => {
    await api?.deleteTopic?.(topicId);
    if (selectedTopic?.id === topicId) {
      setSelectedTopic(null);
      setTopicClips([]);
    }
    loadTopics();
  }, [selectedTopic, loadTopics]);

  const handleCopyClip = useCallback(async (clip: TopicClip) => {
    await api?.writeClipboard?.(clip.content || clip.summary || "");
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Topics</h1>
          <p className="text-sm text-surface-600 mt-0.5">
            AI-organized knowledge base from your clipboard
          </p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="px-3 py-1.5 text-sm rounded-lg bg-ghost-600/20 text-ghost-300 hover:bg-ghost-600/30 transition-colors"
        >
          + New Topic
        </button>
      </div>

      {/* Create topic form */}
      {creating && (
        <div className="mb-4 p-4 rounded-xl bg-glass backdrop-blur-md border border-white/5 shadow-glass space-y-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Topic name..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-200 text-surface-900 border border-white/5 outline-none focus:border-ghost-500/30"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-200 text-surface-900 border border-white/5 outline-none focus:border-ghost-500/30"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-3 py-1.5 text-sm rounded-lg bg-ghost-600/20 text-ghost-300 hover:bg-ghost-600/30 transition-colors">
              Create
            </button>
            <button onClick={() => setCreating(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-300 text-surface-800 hover:bg-surface-400 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search topics..."
          className="w-full px-3 py-2 text-sm rounded-lg bg-surface-200 text-surface-900 border border-white/5 outline-none focus:border-ghost-500/30 placeholder:text-surface-600"
        />
      </div>

      {/* Content */}
      <div className="flex gap-4" style={{ minHeight: "400px" }}>
        {/* Topic list */}
        <div className="w-1/2 space-y-2">
          {loading ? (
            <div className="text-center text-surface-600 text-sm py-8">Loading topics...</div>
          ) : topics.length === 0 ? (
            <div className="text-center text-surface-600 text-sm py-8">
              {search ? "No topics found" : "No topics yet. Clips will be auto-categorized as they arrive."}
            </div>
          ) : (
            topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                  selectedTopic?.id === topic.id
                    ? "bg-ghost-600/15 border-ghost-500/20"
                    : "bg-glass border-white/5 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{topic.icon}</span>
                  <span className="text-sm font-medium text-surface-900 flex-1 truncate">{topic.name}</span>
                  <span className="text-xs text-surface-600 bg-surface-300 px-1.5 py-0.5 rounded-full">
                    {topic.clipCount}
                  </span>
                </div>
                {topic.description && (
                  <p className="text-xs text-surface-600 mt-1 ml-6 truncate">{topic.description}</p>
                )}
                <div className="text-[10px] text-surface-500 mt-1 ml-6">
                  Updated {relativeTime(topic.updatedAt)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Topic detail / clips */}
        <div className="w-1/2">
          {selectedTopic ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedTopic.icon}</span>
                  <h2 className="text-base font-medium text-surface-900">{selectedTopic.name}</h2>
                </div>
                <button
                  onClick={() => handleDelete(selectedTopic.id)}
                  className="text-xs text-accent-red hover:text-accent-red/80 transition-colors"
                >
                  Delete
                </button>
              </div>
              {selectedTopic.description && (
                <p className="text-sm text-surface-700">{selectedTopic.description}</p>
              )}

              <div className="text-xs text-surface-500 font-medium uppercase tracking-wider">
                {topicClips.length} clip{topicClips.length !== 1 ? "s" : ""}
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {topicClips.map((clip) => (
                  <div
                    key={clip.id}
                    onClick={() => handleCopyClip(clip)}
                    className="p-3 rounded-lg bg-glass border border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-ghost-400 shrink-0">
                          {clip.type === "url" ? "🔗" : clip.type === "image" ? "🖼" : clip.type === "file" ? "📎" : "📄"}
                        </span>
                        <p className="text-sm text-surface-900 truncate">
                          {clip.summary || clip.content?.slice(0, 80) || "No content"}
                        </p>
                      </div>
                      <span className="text-[10px] text-surface-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        click to copy
                      </span>
                    </div>
                    {clip.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
                        {clip.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded-full bg-ghost-700/20 text-ghost-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 ml-5 text-[10px] text-surface-500">
                      <span>{relativeTime(clip.createdAt)}</span>
                      <span>{Math.round(clip.topicConfidence * 100)}% match</span>
                    </div>
                  </div>
                ))}
                {topicClips.length === 0 && (
                  <div className="text-center text-surface-600 text-sm py-8">
                    No clips in this topic yet
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-surface-600 text-sm">
              Select a topic to view its clips
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
