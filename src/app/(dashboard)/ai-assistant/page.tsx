"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  User,
  Bot,
  Trash2,
  AlertCircle,
  Wrench,
  DollarSign,
  Fuel,
  Bell,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { FormattedMessage } from "@/components/ai/FormattedMessage";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  isError?: boolean;
}

const EXAMPLE_QUESTIONS = [
  {
    icon: DollarSign,
    title: "Fleet Spending",
    prompt: "How much have I spent on my vehicles?",
    description: "Get a complete spending summary across services & expenses",
    accent: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    icon: Bell,
    title: "Upcoming Reminders",
    prompt: "What maintenance is due soon?",
    description: "Check pending service & odometer reminders",
    accent: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    icon: Fuel,
    title: "Fuel Efficiency",
    prompt: "Which vehicle has the highest fuel expenses?",
    description: "Analyze fuel logs & refuelling costs",
    accent: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  },
  {
    icon: Wrench,
    title: "Service History",
    prompt: "Show me my recent service history.",
    description: "Review past service records & oil changes",
    accent: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle message submit
  async function handleSubmit(textToSend?: string) {
    const messageText = (textToSend ?? input).trim();
    if (!messageText || isLoading) return;

    setError(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsLoading(true);

    try {
      // Build conversation history payload for the backend API
      const conversationHistory = newMessages.map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: conversationHistory.slice(0, -1), // send previous context
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to get a response from AutoLog AI.");
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || "No answer generated.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolsUsed: data.toolsUsed,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMsg);

      const errorAiMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };

      setMessages((prev) => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleClearChat() {
    setMessages([]);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 w-full min-w-0 flex flex-col h-[calc(100vh-6.5rem)]">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-elevated">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground truncate">
                AutoLog AI
              </h2>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Smart Assistant
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Ask anything about your fleet spending, fuel efficiency, services, or maintenance.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 cursor-pointer shrink-0"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear chat
          </button>
        )}
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 shadow-elevated flex flex-col space-y-4 min-w-0">

        {messages.length === 0 ? (
          /* ── Empty State ── */
          <div className="my-auto flex flex-col items-center justify-center py-6 text-center max-w-2xl mx-auto space-y-6">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                How can AutoLog AI help your fleet today?
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                AutoLog AI has secure server-side access to your vehicles, service history, expenses, fuel logs, and maintenance reminders.
              </p>
            </div>

            {/* Example Questions Grid */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full pt-2">
              {EXAMPLE_QUESTIONS.map((q) => {
                const IconComp = q.icon;
                return (
                  <button
                    key={q.prompt}
                    onClick={() => handleSubmit(q.prompt)}
                    className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 text-left transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer min-w-0"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${q.accent}`}>
                      <IconComp className="h-4 w-4 shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {q.title}
                        </p>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        &quot;{q.prompt}&quot;
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Message List ── */
          <div className="space-y-4 flex-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border shadow-sm ${msg.role === "user"
                    ? "bg-primary text-primary-foreground border-primary"
                    : msg.isError
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : "bg-gradient-primary text-primary-foreground border-primary/20"
                    }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Bubble Container */}
                <div className={`flex flex-col min-w-0 max-w-[85%] sm:max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"
                  }`}>

                  {/* Header info */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground/80">
                      {msg.role === "user" ? "You" : "AutoLog AI"}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Bubble content */}
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-xs"
                      : msg.isError
                        ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-xs"
                        : "bg-card border border-border/80 text-foreground rounded-tl-xs"
                      }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <FormattedMessage content={msg.content} />
                    )}
                  </div>

                </div>
              </div>
            ))}

            {/* ── Loading Indicator ── */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-sm border border-primary/20">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex flex-col min-w-0 max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1 px-1 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground/80">AutoLog AI</span>
                    <span>·</span>
                    <span>Thinking...</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-xs border border-border/80 bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                    </div>
                    <span>Querying your garage data...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[11px] font-semibold underline hover:no-underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Message Input Bar ── */}
      <div className="shrink-0 rounded-2xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-elevated">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-adjust height
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask AutoLog AI about your vehicles, expenses, fuel logs, or maintenance..."
              rows={1}
              disabled={isLoading}
              className="block w-full resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:hover:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Send message (Enter)"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
