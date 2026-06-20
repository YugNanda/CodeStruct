import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Bot,
  User,
  Lightbulb
} from "lucide-react";

export default function AITutorChat({
  isOpen,
  onClose,
  messages,
  isLoading,
  suggestions,
  quickActions,
  onSendMessage,
  onExecuteQuickAction,
  onClearChat,
  context // algorithm context
}) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue("");
    
    await onSendMessage(message);
  };

  const handleQuickAction = async (actionId) => {
    await onExecuteQuickAction(actionId);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-violet-600/20 to-indigo-600/20 px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Tutor</h3>
                  <p className="text-[10px] text-violet-300">
                    {context?.algorithmName || 'Algorithm Assistant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onClearChat}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  title="Clear chat"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Context Info */}
            {context && (
              <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Step {context.currentStep || 0} of {context.totalSteps || 0}</span>
                  <span className="capitalize">{context.category || 'Algorithm'}</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                    <Bot size={24} className="text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">
                    Hi! I'm your Algorithm Tutor
                  </p>
                  <p className="text-xs text-slate-400 max-w-[240px]">
                    Ask me anything about the current visualization or use quick actions below.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        msg.role === 'user' 
                          ? 'bg-cyan-500/20 text-cyan-400' 
                          : 'bg-violet-500/20 text-violet-400'
                      }`}>
                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                      </div>
                      <div className={`rounded-2xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-cyan-500/20 text-cyan-100 rounded-br-md'
                          : msg.isError
                            ? 'bg-red-500/10 text-red-200 border border-red-500/20'
                            : 'bg-white/10 text-slate-200 rounded-bl-md'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-slate-400"
                >
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 0 && quickActions && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-1 mb-2">
                  <Lightbulb size={12} className="text-amber-400" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Quick Questions
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.slice(0, 4).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 transition-colors disabled:opacity-50"
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="px-4 pb-2">
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-400 mb-2"
                >
                  <ChevronUp size={12} />
                  <span>Suggestions</span>
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(suggestion)}
                      disabled={isLoading}
                      className="text-left px-2 py-1.5 text-[10px] font-medium rounded-lg bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 border border-amber-500/20 transition-colors disabled:opacity-50 line-clamp-2"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating button when chat is closed
export function AITutorButton({ onClick, unreadCount = 0 }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
    >
      {unreadCount > 0 ? (
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
        </span>
      ) : (
        <MessageCircle size={24} />
      )}
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
        AI
      </span>
    </motion.button>
  );
}
