import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus, Trash2, Send, Loader2, Sparkles, ChevronLeft, ChevronRight,
  AlertCircle, MessageSquare, Edit2, Check, X, Cpu, Zap,
} from "lucide-react";
import api from "../api/axios.js";
import Layout from "../components/Layout.jsx";

// ── Markdown renderer (bold + newlines, HTML-escaped) ─────────────────────────
function MsgContent({ content }) {
  const html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/gs, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gs, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code style='background:var(--color-bg);padding:1px 4px;border-radius:3px;font-size:0.85em'>$1</code>")
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── LLM status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (!status) return null;
  const active = status.active;
  if (!active) return (
    <div className="flex items-center gap-1.5 text-xs text-danger bg-danger/10 border border-danger/20 px-2.5 py-1 rounded-lg">
      <AlertCircle className="w-3 h-3" />
      No AI backend — {status.setup_hint ? "see setup below" : "check .env"}
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-lg">
      {active === "ollama" ? <Cpu className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
      {active === "ollama"
        ? `Ollama · ${status.ollama.model}`
        : `Gemini · ${status.gemini.model} (free tier)`}
    </div>
  );
}

export default function AIAssistant() {
  const [searchParams]                    = useSearchParams();

  const [sessions,       setSessions]     = useState([]);
  const [currentId,      setCurrentId]    = useState(null);
  const [messages,       setMessages]     = useState([]);
  const [streamText,     setStreamText]   = useState("");
  const [isStreaming,    setIsStreaming]   = useState(false);
  const [input,          setInput]        = useState("");
  const [loading,        setLoading]      = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [llmStatus,      setLlmStatus]    = useState(null);
  const [sidebarOpen,    setSidebarOpen]  = useState(true);
  const [renaming,       setRenaming]     = useState(null);    // {id, title}
  const [error,          setError]        = useState("");

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const currentRef = useRef(null);   // tracks currentId for closure use

  currentRef.current = currentId;

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // Initial load
  useEffect(() => {
    Promise.allSettled([
      api.get("/ai/sessions/"),
      api.get("/ai/status/"),
    ]).then(([s, st]) => {
      if (s.status  === "fulfilled") setSessions(s.value.data.results ?? s.value.data);
      if (st.status === "fulfilled") setLlmStatus(st.value.data);
    }).finally(() => setLoading(false));
  }, []);

  // Pre-fill from URL param
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setInput(q);
  }, [searchParams]);

  const loadSession = useCallback(async (id) => {
    setSessionLoading(true);
    setError("");
    setStreamText("");
    try {
      const { data } = await api.get(`/ai/sessions/${id}/`);
      setCurrentId(id);
      setMessages(data.messages || []);
    } catch {
      setError("Failed to load conversation.");
    } finally {
      setSessionLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const newChat = () => {
    setCurrentId(null);
    setMessages([]);
    setStreamText("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    await api.delete(`/ai/sessions/${id}/`);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentRef.current === id) newChat();
  };

  const saveRename = async () => {
    if (!renaming?.title?.trim()) { setRenaming(null); return; }
    try {
      const { data } = await api.patch(`/ai/sessions/${renaming.id}/rename/`, { title: renaming.title.trim() });
      setSessions(prev => prev.map(s => s.id === data.id ? { ...s, title: data.title } : s));
    } catch { /* silent */ }
    setRenaming(null);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    setError("");
    setIsStreaming(true);
    setStreamText("");

    // Optimistic user bubble
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, role: "user", content: text, created_at: new Date().toISOString() }]);

    const token = localStorage.getItem("access_token");
    let accumulated = "";

    try {
      const resp = await fetch("/api/ai/chat/", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body:    JSON.stringify({ message: text, session_id: currentRef.current }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          const ev = JSON.parse(raw);

          if (ev.type === "session") {
            setCurrentId(ev.session_id);
            setSessions(prev => {
              if (prev.find(s => s.id === ev.session_id)) return prev;
              return [{ id: ev.session_id, title: ev.session_title, model_used: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev];
            });
          } else if (ev.type === "token") {
            accumulated += ev.token;
            setStreamText(accumulated);
          } else if (ev.type === "done") {
            const assistantMsg = { id: Date.now() + 1, role: "assistant", content: accumulated, created_at: new Date().toISOString() };
            setMessages(prev => [...prev, assistantMsg]);
            setStreamText("");
            accumulated = "";
            // Refresh session list (updates last_message + updated_at)
            api.get("/ai/sessions/").then(r => setSessions(r.data.results ?? r.data)).catch(() => {});
          } else if (ev.type === "error") {
            setError(ev.error || "AI response failed.");
            if (accumulated) {
              setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: accumulated, created_at: new Date().toISOString() }]);
              setStreamText("");
            }
          }
        }
      }
    } catch (exc) {
      setError(`Connection failed: ${exc.message}`);
    } finally {
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const hasNoBackend = llmStatus && !llmStatus.active;

  return (
    <Layout breadcrumb={["AI Health Copilot"]}>
      <div className="flex border border-border rounded-xl overflow-hidden bg-surface" style={{ height: "calc(100vh - 9rem)" }}>

        {/* ── Session sidebar ───────────────────────────────────────────────── */}
        <div className={`flex flex-col border-r border-border transition-all duration-200 ${sidebarOpen ? "w-60 min-w-[15rem]" : "w-0 overflow-hidden"}`}>
          <div className="p-3 border-b border-border">
            <button onClick={newChat}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors">
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {loading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-4 h-4 text-muted animate-spin" />
              </div>
            )}
            {!loading && sessions.length === 0 && (
              <p className="text-xs text-muted text-center py-6 px-3">No conversations yet</p>
            )}
            {sessions.map(s => (
              <div key={s.id}
                onClick={() => loadSession(s.id)}
                className={`group relative flex items-start gap-2 px-3 py-2.5 mx-2 mb-0.5 rounded-lg cursor-pointer transition-colors ${
                  currentId === s.id ? "bg-accent/10 text-accent" : "hover:bg-bg text-muted hover:text-foreground"
                }`}>
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {renaming?.id === s.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={renaming.title}
                        onChange={e => setRenaming(r => ({ ...r, title: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(null); }}
                        className="flex-1 text-xs bg-bg border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <button onClick={saveRename} className="text-success"><Check className="w-3 h-3" /></button>
                      <button onClick={() => setRenaming(null)} className="text-muted"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <p className="text-xs truncate">{s.title}</p>
                  )}
                </div>
                {renaming?.id !== s.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); setRenaming({ id: s.id, title: s.title }); }}
                      className="p-0.5 hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={e => deleteSession(s.id, e)}
                      className="p-0.5 hover:text-danger"><Trash2 className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Main chat area ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <div className="h-11 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
            <button onClick={() => setSidebarOpen(v => !v)} className="text-muted hover:text-foreground transition-colors">
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <StatusBadge status={llmStatus} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {sessionLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              </div>
            )}

            {!sessionLoading && messages.length === 0 && !streamText && (
              <div className="flex flex-col items-center justify-center h-full text-center pb-8">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-foreground">MediLocker AI Copilot</h3>
                <p className="text-sm text-muted mt-1 max-w-sm">
                  Ask me to explain your medical records, lab values, or medications in plain language.
                </p>
                {hasNoBackend && (
                  <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-left max-w-md">
                    <p className="text-xs font-medium text-danger mb-1">No AI backend configured</p>
                    <p className="text-xs text-muted">
                      <strong>Option A (local):</strong> Install <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-accent hover:underline">Ollama</a>, run <code className="bg-bg px-1 rounded">ollama serve</code>, then <code className="bg-bg px-1 rounded">ollama pull llama3.2:3b</code><br /><br />
                      <strong>Option B (cloud free):</strong> Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-accent hover:underline">aistudio.google.com</a> and set <code className="bg-bg px-1 rounded">GEMINI_API_KEY</code> in <code className="bg-bg px-1 rounded">.env</code>
                    </p>
                  </div>
                )}
                {!hasNoBackend && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {[
                      "Explain my latest lab report",
                      "What do my creatinine values mean?",
                      "Are my blood sugar levels normal?",
                      "Summarise my medical history",
                      "Which medications am I currently on?",
                    ].map(ex => (
                      <button key={ex} onClick={() => setInput(ex)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors">
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-tr-sm"
                      : "bg-bg border border-border text-foreground rounded-tl-sm"
                  }`}>
                    {msg.role === "user"
                      ? msg.content
                      : <MsgContent content={msg.content} />}
                  </div>
                </div>
              ))}

              {/* Streaming bubble */}
              {streamText && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed bg-bg border border-border text-foreground">
                    <MsgContent content={streamText} />
                    <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
                  </div>
                </div>
              )}

              {/* Thinking indicator */}
              {isStreaming && !streamText && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mr-2">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="bg-bg border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 p-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={hasNoBackend ? "Configure an AI backend first…" : "Ask about your health records… (Enter to send, Shift+Enter for new line)"}
                disabled={isStreaming || hasNoBackend}
                className="flex-1 resize-none bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors disabled:opacity-50"
                style={{ maxHeight: "120px", overflowY: "auto" }}
              />
              <button onClick={sendMessage} disabled={isStreaming || !input.trim() || hasNoBackend}
                className="flex-shrink-0 w-10 h-10 self-end rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {isStreaming
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-muted mt-2">
              MediLocker AI explains records — it does not diagnose conditions or replace medical advice.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}