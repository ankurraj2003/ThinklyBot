"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronDown,
  ArrowRight,
  Sparkles,
  ArrowUp,
  BrainCircuit,
  Loader2,
  RefreshCw,
  AlertTriangle,
  User,
} from "lucide-react";

/* ─── Suggestion Pills Data ─── */
const SUGGESTIONS = [
  "What does ThinklyLabs do?",
  "We manually send 200 investor emails/week. How can you help us automate this?",
  "Our team manually extracts data from 300 PDF vendor invoices every month. How can you help us automate this?",
];

/* ─── Markdown Components ─── */
function useMarkdownComponents() {
  return {
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const codeString = String(children).replace(/\n$/, "");

      if (!className) {
        return (
          <code
            className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-800 font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <div className="my-3 overflow-hidden rounded-xl border border-gray-200">
          {language && (
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {language}
              </span>
            </div>
          )}
          <pre className="overflow-x-auto bg-gray-50 p-4">
            <code className="text-sm text-gray-800 font-mono" {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    },
    h1: ({ children, ...props }: any) => (
      <h1 className="mt-5 mb-3 text-xl font-bold tracking-tight text-gray-900" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="mt-4 mb-2 text-lg font-semibold tracking-tight text-gray-900" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="mt-3 mb-2 text-base font-semibold tracking-tight text-gray-800" {...props}>
        {children}
      </h3>
    ),
    p: ({ children, ...props }: any) => (
      <p className="mb-2.5 leading-relaxed text-gray-700 text-sm" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="mb-2.5 ml-4 list-disc space-y-1 text-gray-700 text-sm marker:text-gray-400" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="mb-3 ml-5 list-decimal space-y-1 text-gray-700 marker:text-gray-400" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="leading-relaxed pl-0.5" {...props}>
        {children}
      </li>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-gray-900" {...props}>
        {children}
      </strong>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="my-4 border-l-4 border-teal-500 bg-teal-50/50 py-2 pl-4 italic text-gray-700 rounded-r-lg" {...props}>
        {children}
      </blockquote>
    ),
    table: ({ children, ...props }: any) => (
      <div className="my-4 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm text-left" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-4 py-3 font-semibold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border-t border-gray-100 px-4 py-3 text-gray-700" {...props}>
        {children}
      </td>
    ),
    hr: (props: any) => <hr className="my-6 border-gray-200" {...props} />,
    a: ({ children, ...props }: any) => (
      <a className="text-teal-600 font-medium underline underline-offset-4 hover:text-teal-700 transition-colors" target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
  };
}

/* ─── Thinking Skeleton ─── */
function ThinkingSkeleton() {
  return (
    <div className="flex gap-4 py-4 animate-in fade-in duration-500">
      <div className="flex-shrink-0 mt-1">
        <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
          <BrainCircuit className="h-4 w-4 text-teal-600 animate-pulse" />
        </div>
      </div>
      <div className="flex-1 space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-gray-500 italic">Thinking...</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Helper: Extract text from message ─── */
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/* ─── Shared Navbar Component ─── */
function Navbar({ onLogoClick }: { onLogoClick?: () => void }) {
  return (
    <div className="w-full px-4 pt-6 z-50">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full bg-[#111111] px-2 pl-6 shadow-xl shadow-black/10">
        <div className="flex items-center gap-10">
          <button
            onClick={onLogoClick}
            className="text-lg font-bold tracking-tight text-white select-none hover:opacity-80 transition-opacity"
          >
            ThinklyBot
          </button>
          <nav className="hidden md:flex items-center gap-6">
          </nav>
        </div>
        <div className="flex items-center gap-2 pr-1 md:gap-3">

          <button className="group flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-4 py-2 text-xs sm:text-sm font-semibold text-gray-900 transition-all hover:bg-white active:scale-95 md:px-5">
            Book a demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── LocalStorage Key ─── */
const CHAT_STORAGE_KEY = "thinklybot-chat-history";

/* ─── Main Page ─── */
export default function SachiChatPage() {
  const [chatStarted, setChatStarted] = useState(false);
  const [input, setInput] = useState("");

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mdComponents = useMarkdownComponents();

  const { messages, setMessages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, status, scrollToBottom]);

  // Restore chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length > 0) {
          setMessages(parsed.messages);
          setChatStarted(true);
        }
      }
    } catch (err) {
      console.warn("Failed to restore chat history:", err);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && status === "ready") {
      try {
        localStorage.setItem(
          CHAT_STORAGE_KEY,
          JSON.stringify({ messages })
        );
      } catch (err) {
        console.warn("Failed to save chat history:", err);
      }
    }
  }, [messages, status]);

  // Handle back button & URL state
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we're in the chat state but the history says we're not
      if (chatStarted && !event.state?.chat) {
        setChatStarted(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [chatStarted]);

  // If user hits start, flip state. Focus input if it exists.
  const handleStartChat = () => {
    setChatStarted(true);
    window.history.pushState({ chat: true }, "");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSuggestionClick = (prompt: string) => {
    setChatStarted(true);
    window.history.pushState({ chat: true }, "");
    setInput(prompt);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleLogoClick = () => {
    if (chatStarted) {
      setChatStarted(false);
      setMessages([]);
      localStorage.removeItem(CHAT_STORAGE_KEY);
      // If we pushed state, go back
      if (window.history.state?.chat) {
        window.history.back();
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      setChatStarted(true);
      if (!window.history.state?.chat) {
        window.history.pushState({ chat: true }, "");
      }
      sendMessage({ text: input });
      setInput("");
    }
  };

  const isProcessing = status === "submitted" || status === "streaming";
  const canSubmit = input.trim().length > 0 && status === "ready";
  const hasMessages = messages.length > 0;

  return (
    <div className="relative h-[100dvh] w-full transition-colors duration-700 ease-in-out flex flex-col bg-transparent overflow-hidden">

      {/* ── Background Video for App ── */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-black">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-90"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>

      <Navbar onLogoClick={handleLogoClick} />

      {/* ── Main Content Container (Grid for overlapping elements) ── */}
      <div className="flex-1 relative w-full flex flex-col items-center justify-center">
        
        {/* ── State A: Hero Section ── */}
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center px-4 -mt-20 md:-mt-10 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            chatStarted 
              ? "opacity-0 scale-95 blur-md -translate-y-12 pointer-events-none" 
              : "opacity-100 scale-100 blur-none translate-y-0 pointer-events-auto"
          }`}
        >
          <h1 className="text-4xl sm:text-5xl md:text-[5rem] font-bold text-white mb-4 md:mb-6 text-center leading-[1.15] md:leading-[1.1] tracking-tight text-shadow-sm font-sans">
            Your AI strategy session starts here.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-100 text-center max-w-3xl mb-8 md:mb-12 font-medium leading-relaxed opacity-90 px-2 font-sans">
            Tell ThinklyBot what slows your team down. In minutes, you will get a clear diagnosis, a
            mapped solution and a path to implementation.
          </p>
          <button
            onClick={handleStartChat}
            className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 md:px-8 md:py-3.5 text-sm md:text-base font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
          >
            Start the conversation
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* ── State B: Chat Interface ── */}
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center px-0 sm:px-4 py-0 sm:py-8 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform ${
            chatStarted
              ? "opacity-100 scale-100 blur-none translate-y-0 pointer-events-auto delay-100"
              : "opacity-0 scale-[1.02] blur-md translate-y-12 pointer-events-none"
          }`}
        >
          {/* We only render the inner content if it's either active or was just active, 
              but since we want the DOM there to fade it out nicely, we keep it rendered 
              but invisible via CSS. To avoid breaking SSR or causing unnecessary initial 
              paints, we can optionally just render it always. */}
          <div className="w-full h-full max-w-[1000px] bg-white border-x-0 sm:border border-gray-100 sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:h-[calc(100vh-140px)] overflow-hidden">

            {/* Scrollable Messages Area */}
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">

              {/* Initial Sachi Greeting Bubble */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {/* Sachi Avatar Placeholder */}
                  <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 shadow-sm">
                    <BrainCircuit className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
                <div className="flex-1 pt-0">
                  <div className="inline-block bg-[#f8fafc] border border-gray-100 rounded-2xl rounded-tl-sm px-6 py-4 max-w-[85%]">
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      Hi, I'm your ThinklyLabs guide. Tell me what you're solving & I'll help map it to the right automation solution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Chat Messages */}
              <div className="mt-8 space-y-8">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const text = getMessageText(message.parts);

                  return (
                    <div key={message.id} className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
                      <div className="flex-shrink-0 mt-1">
                        {isUser ? (
                          <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                            <img
                              src="https://api.dicebear.com/7.x/notionists/svg?seed=User&backgroundColor=f8fafc"
                              alt="User"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 shadow-sm">
                            <BrainCircuit className="h-5 w-5 text-teal-600" />
                          </div>
                        )}
                      </div>
                      <div className={`flex-1 ${isUser ? "flex flex-col items-end" : "min-w-0"}`}>
                        {isUser ? (
                          <div className="inline-block bg-gray-900 text-white rounded-2xl rounded-tr-sm px-4 md:px-6 py-3 md:py-4 max-w-[95%] md:max-w-[85%] break-words">
                            <p className="text-sm leading-relaxed">{text}</p>
                          </div>
                        ) : (
                          <div className="inline-block bg-[#f8fafc] border border-gray-100 rounded-2xl rounded-tl-sm px-4 md:px-6 py-3 md:py-4 w-full max-w-[100%] md:max-w-[95%] overflow-x-auto">
                            <div className="prose-thinkly">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                                {text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading State */}
                {status === "submitted" && <ThinkingSkeleton />}

                {/* Error State */}
                {error && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="inline-block bg-red-50 border border-red-100 rounded-2xl rounded-tl-sm px-6 py-4">
                        <p className="text-sm text-red-800 font-medium">
                          Auditor disconnected. Please try describing your workflow again.
                        </p>
                        <button
                          onClick={() => regenerate()}
                          className="mt-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retry Connection
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white shrink-0">
              {/* Note: In absolute layout, we check chatStarted || local state, but since this container hides, logic is the same */}
              {!hasMessages && status !== "submitted" && !error && (
                <div className="mb-4 animate-in fade-in duration-500 delay-300">
                  <p className="text-sm font-medium text-gray-400 mb-3 px-2">Try asking:</p>
                  <div className="flex flex-wrap gap-2 px-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="relative flex items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about ThinklyLabs..."
                  disabled={isProcessing}
                  className="w-full rounded-[1.5rem] bg-[#f8fafc] border border-gray-200 px-6 py-4 pr-16 text-base text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 disabled:opacity-60"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`absolute right-3 flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 ${canSubmit
                    ? "bg-gray-900 text-white hover:bg-black shadow-md"
                    : "bg-gray-200 text-white cursor-not-allowed"
                    }`}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
