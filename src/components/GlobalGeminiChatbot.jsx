import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, Trash2, X } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function GlobalGeminiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [healthStatus, setHealthStatus] = useState("checking");
  const [chatbotMode, setChatbotMode] = useState("unknown");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chatbot/health`);

        if (!response.ok) {
          throw new Error("Health check failed");
        }

        const data = await response.json();
        if (!isMounted) return;
        setHealthStatus("online");
        setChatbotMode(data?.mode || "unknown");
      } catch (error) {
        if (!isMounted) return;
        setHealthStatus("offline");
        setChatbotMode("unknown");
      }
    };

    checkHealth();

    const intervalId = setInterval(() => {
      checkHealth();
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const healthPillClassName =
    healthStatus === "online"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
      : healthStatus === "offline"
        ? "border-rose-400/30 bg-rose-500/15 text-rose-200"
        : "border-amber-400/30 bg-amber-500/15 text-amber-200";

  const healthLabel =
    healthStatus === "online"
      ? chatbotMode === "fallback"
        ? "Online (Fallback)"
        : "Online"
      : healthStatus === "offline"
        ? "Offline"
        : "Checking...";

  const buttonDotClassName =
    healthStatus === "online"
      ? "bg-emerald-400"
      : healthStatus === "offline"
        ? "bg-rose-400"
        : "bg-amber-300";

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId })
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "I could not generate a response."
        }
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I am unable to respond right now. Please try again shortly.",
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (sessionId) {
      try {
        await fetch(`${API_BASE_URL}/api/chatbot/session/${sessionId}`, {
          method: "DELETE"
        });
      } catch (error) {
        console.error("Failed to clear chatbot session:", error);
      }
    }

    setMessages([]);
    setSessionId(null);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                  <Bot size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Gemini Chatbot</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-[11px] text-slate-400">Ask anything about DSA and this site</p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${healthPillClassName}`}
                      title="Backend chatbot service health"
                    >
                      {healthLabel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  title="Clear chat"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="h-80 overflow-y-auto px-4 py-3 text-sm">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageCircle size={24} className="mb-2 text-cyan-400" />
                  <p className="font-medium text-slate-100">How can I help?</p>
                  <p className="mt-1 max-w-[220px] text-xs text-slate-400">
                    I can explain algorithms, complexity, and how to use the visualizer.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, idx) => (
                    <div key={`${message.role}-${idx}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "rounded-br-md bg-cyan-500/20 text-cyan-100"
                            : message.isError
                              ? "border border-red-500/30 bg-red-500/10 text-red-200"
                              : "rounded-bl-md bg-white/10 text-slate-200"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && <p className="text-xs text-slate-400">Gemini is thinking...</p>}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-3">
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-500"
        aria-label="Toggle chatbot"
        title={`Chatbot status: ${healthLabel}`}
      >
        <span
          className={`absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ${buttonDotClassName}`}
          aria-hidden="true"
        />
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
