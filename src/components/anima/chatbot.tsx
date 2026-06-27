import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Square, RotateCw, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Logo } from "./logo";

const SUGGESTIONS = [
  "How does the digital twin work?",
  "My dog seems sluggish — what should I do?",
  "Tips for searching for a lost cat",
  "How do I report a wildlife threat?",
];

export function ChatDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [errorState, setErrorState] = useState<{ kind: "rate" | "credits" | "generic"; message: string } | null>(null);
  const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null);
  if (!transportRef.current) transportRef.current = new DefaultChatTransport<UIMessage>({ api: "/api/chat" });
  const { messages, sendMessage, status, stop, setMessages, regenerate } = useChat<UIMessage>({
    transport: transportRef.current!,
    onError: (e) => {
      console.error("chat error", e);
      const msg = (e as Error)?.message ?? "";
      if (/429|rate/i.test(msg)) setErrorState({ kind: "rate", message: "You're sending messages too quickly. Pause for a minute and try again." });
      else if (/402|credit/i.test(msg)) setErrorState({ kind: "credits", message: "AI credits exhausted. Please top up in workspace billing." });
      else setErrorState({ kind: "generic", message: msg || "Something went wrong. Tap retry." });
    },
  });
  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status]);

  const send = (text: string) => {
    if (!text.trim() || isLoading) return;
    setErrorState(null);
    sendMessage({ text: text.trim() });
    setInput("");
  };

  const retry = () => {
    setErrorState(null);
    if (messages.length === 0) return;
    // If last message is an empty/failed assistant, drop it before regenerating
    const last = messages[messages.length - 1];
    if (last.role === "assistant") {
      const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
      if (!text.trim()) setMessages(messages.slice(0, -1));
    }
    regenerate();
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] text-[oklch(0.12_0.02_260)] shadow-[0_10px_40px_-5px_oklch(0.78_0.18_200/0.6)]"
        aria-label="Open ANIMA assistant">
        <AnimatePresence mode="wait" initial={false}>
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="h-6 w-6" /></motion.span>
            : <motion.span key="msg" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><MessageSquare className="h-6 w-6" /></motion.span>}
        </AnimatePresence>
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-[var(--neon-cyan)] opacity-20" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="glass-strong fixed bottom-24 right-3 z-50 flex h-[min(72vh,640px)] w-[min(94vw,420px)] flex-col overflow-hidden border-white/15 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.18_0.04_270)]">
                <Logo className="h-6 w-6" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[oklch(0.16_0.03_265)] bg-[var(--neon-emerald)]" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-sm font-semibold">ANIMA Assistant</div>
                <div className="text-[10px] text-muted-foreground">Powered by advanced AI · always learning</div>
              </div>
            </div>

            <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
              {messages.length === 0 && (
                <div className="space-y-3 text-muted-foreground">
                  <div className="rounded-lg border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 p-3 text-foreground">
                    <div className="flex items-center gap-1.5 text-[var(--neon-cyan)]"><Sparkles className="h-3.5 w-3.5" /> <span className="text-[11px] font-mono uppercase tracking-wider">Welcome</span></div>
                    <div className="mt-1 text-sm">I'm your ANIMA Nexus guardian. Ask me anything about your animals, the platform, or what to do in an emergency.</div>
                  </div>
                  <div className="grid gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-foreground/80 hover:border-[var(--neon-cyan)]/40 hover:text-foreground">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={isUser ? "flex justify-end" : ""}>
                    {isUser ? (
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] px-3.5 py-2 text-[oklch(0.12_0.02_260)]">
                        {text}
                      </div>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none text-foreground prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-[var(--neon-cyan)]">
                        <ReactMarkdown>{text || "…"}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}
              {status === "submitted" && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--neon-cyan)]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--neon-cyan)] [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--neon-cyan)] [animation-delay:240ms]" />
                  Thinking…
                </div>
              )}
              {errorState && (
                <div className={`rounded-md border p-3 text-xs ${
                  errorState.kind === "rate" ? "border-[var(--neon-amber)]/40 bg-[var(--neon-amber)]/10 text-[var(--neon-amber)]"
                  : errorState.kind === "credits" ? "border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 text-[var(--neon-pink)]"
                  : "border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 text-[var(--neon-pink)]"}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="flex-1">
                      <div className="font-mono uppercase tracking-widest text-[10px]">
                        {errorState.kind === "rate" ? "Rate limit" : errorState.kind === "credits" ? "Credits exhausted" : "Stream error"}
                      </div>
                      <div className="mt-0.5">{errorState.message}</div>
                      {errorState.kind !== "credits" && (
                        <button onClick={retry} className="mt-2 inline-flex items-center gap-1 rounded border border-current/40 px-2 py-1 text-[10px] font-mono uppercase tracking-widest">
                          <RotateCw className="h-3 w-3" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 border-t border-white/10 p-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask about animals, health, rescue…"
                rows={1}
                className="scrollbar-thin max-h-32 flex-1 resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--neon-cyan)]/50"
              />
              {isLoading ? (
                <button type="button" onClick={() => stop()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--neon-pink)] text-black"
                  aria-label="Stop generating">
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] text-[oklch(0.12_0.02_260)] disabled:opacity-40"
                  aria-label="Send">
                  <Send className="h-4 w-4" />
                </button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
