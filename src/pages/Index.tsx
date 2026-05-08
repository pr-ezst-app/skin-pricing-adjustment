import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Message = {
  id: number;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  hasCode?: boolean;
};

type Chat = {
  id: number;
  title: string;
  preview: string;
  date: string;
};

type Tab = "chat" | "history" | "templates" | "settings" | "profile";

const DEMO_CHATS: Chat[] = [
  { id: 1, title: "React Auth System", preview: "Build JWT auth with refresh tokens...", date: "Today" },
  { id: 2, title: "PostgreSQL Optimization", preview: "Index strategy for 10M rows...", date: "Today" },
  { id: 3, title: "Python FastAPI Setup", preview: "Async endpoints with Pydantic v2...", date: "Yesterday" },
  { id: 4, title: "Docker Compose Config", preview: "Multi-service deployment setup...", date: "Yesterday" },
  { id: 5, title: "TypeScript Generics", preview: "Advanced type utilities and...", date: "May 6" },
  { id: 6, title: "Redis Caching Layer", preview: "Implement cache-aside pattern...", date: "May 5" },
];

const TEMPLATES = [
  { icon: "Code2", label: "Debug this code", desc: "Paste code + error message", color: "#00e5ff" },
  { icon: "Zap", label: "Generate function", desc: "Describe what it should do", color: "#7c3aed" },
  { icon: "GitBranch", label: "Code review", desc: "Get improvement suggestions", color: "#e040fb" },
  { icon: "FileCode2", label: "Explain code", desc: "Break down complex logic", color: "#00e5ff" },
  { icon: "Repeat2", label: "Refactor code", desc: "Improve structure & readability", color: "#7c3aed" },
  { icon: "Shield", label: "Security audit", desc: "Find vulnerabilities in code", color: "#e040fb" },
  { icon: "Layers", label: "Architecture plan", desc: "Design system structure", color: "#00e5ff" },
  { icon: "TestTube2", label: "Write tests", desc: "Unit, integration, e2e tests", color: "#7c3aed" },
];

const CODE_SAMPLE = `import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string, options?: RequestInit) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
      const data: T = await res.json();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...state, refetch: fetchData };
}`;

const DEMO_MESSAGES: Message[] = [
  {
    id: 1,
    role: "ai",
    content: "Hello! I'm **Orion AI**, your intelligent coding assistant. I can help you write, debug, review, and architect code across any language or framework.\n\nWhat are you building today?",
    timestamp: new Date(),
  },
  {
    id: 2,
    role: "user",
    content: "Can you write a React hook for fetching data with loading and error states?",
    timestamp: new Date(),
  },
  {
    id: 3,
    role: "ai",
    content: "Here's a clean, reusable `useFetch` hook with full TypeScript support:",
    timestamp: new Date(),
    hasCode: true,
  },
];

function parseMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00e5ff">$1</strong>')
    .replace(/`(.*?)`/g, '<code style="font-family:\'Fira Code\',monospace;background:rgba(0,229,255,0.1);padding:2px 6px;border-radius:4px;font-size:13px;color:#00e5ff">$1</code>');
}

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = code
    .replace(/(import|export|from|const|let|var|function|interface|type|async|await|try|catch|throw|new|return|if|else)\b/g, '<span style="color:#7c3aed">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span style="color:#00e5ff">$1</span>')
    .replace(/(\/\/.*$)/gm, '<span style="color:#4a5568">$1</span>')
    .replace(/\b(\w+)(?=\()/g, '<span style="color:#e040fb">$1</span>');

  return (
    <div className="code-block mt-3">
      <div className="code-header">
        <span className="font-code">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-white transition-colors">
          <Icon name={copied ? "Check" : "Copy"} size={12} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,237,0.15))", border: "1px solid rgba(0,229,255,0.25)" }}>
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full border border-transparent animate-orbit" style={{ borderTopColor: "#00e5ff" }} />
          <div className="absolute inset-1 rounded-full" style={{ background: "rgba(0,229,255,0.3)" }} />
        </div>
      </div>
      <div className="flex items-center gap-1 px-3 py-2 rounded-lg message-ai">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
      </div>
    </div>
  );
}

export default function OrionAI() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChat, setActiveChat] = useState(1);
  const [chats, setChats] = useState<Chat[]>(DEMO_CHATS);
  const [model, setModel] = useState("orion-pro");
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [theme, setTheme] = useState("deep-space");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: "I understand your request. Let me help you with that. This is a demo response — connect your AI backend to enable real conversations with full code generation capabilities.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now(),
      title: "New Conversation",
      preview: "Start a new conversation...",
      date: "Now",
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setMessages([{
      id: Date.now(),
      role: "ai",
      content: "New session started. What can I help you code today?",
      timestamp: new Date(),
    }]);
    setActiveTab("chat");
  };

  const handleTemplateClick = (template: typeof TEMPLATES[0]) => {
    setInputValue(template.label + ": ");
    setActiveTab("chat");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const navItems: { tab: Tab; icon: string; label: string }[] = [
    { tab: "chat", icon: "MessageSquare", label: "Chat" },
    { tab: "history", icon: "Clock", label: "History" },
    { tab: "templates", icon: "LayoutTemplate", label: "Templates" },
    { tab: "settings", icon: "Settings2", label: "Settings" },
    { tab: "profile", icon: "UserCircle2", label: "Profile" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "hsl(220,30%,4%)" }}>
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-30" />

      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />

      {/* Sidebar */}
      <aside
        className="relative z-10 flex flex-col transition-all duration-300 flex-shrink-0"
        style={{
          width: sidebarOpen ? "260px" : "64px",
          background: "rgba(8,14,28,0.95)",
          borderRight: "1px solid rgba(0,229,255,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center px-4 py-4 gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,229,255,0.08)", height: 64 }}>
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className="absolute inset-0 rounded-full animate-orbit"
              style={{ border: "1.5px solid transparent", borderTopColor: "#00e5ff", borderRightColor: "#7c3aed" }} />
            <div className="absolute inset-1 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(124,58,237,0.2))" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "#00e5ff", boxShadow: "0 0 8px #00e5ff" }} />
            </div>
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <div className="font-rajdhani font-bold text-lg leading-none orion-text-glow" style={{ color: "#00e5ff", letterSpacing: "0.05em" }}>ORION</div>
              <div className="text-xs" style={{ color: "rgba(0,229,255,0.4)", letterSpacing: "0.15em", fontFamily: "'Fira Code', monospace" }}>v2.1 · AI</div>
            </div>
          )}
        </div>

        {/* New Chat */}
        <div className="px-3 py-3 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg btn-orion-primary text-sm font-exo"
            style={{ justifyContent: sidebarOpen ? "flex-start" : "center" }}
          >
            <Icon name="Plus" size={16} />
            {sidebarOpen && <span>New Chat</span>}
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 flex flex-col gap-0.5 flex-shrink-0">
          {navItems.map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 font-exo ${activeTab === item.tab ? "sidebar-item-active" : "hover:bg-white/5"}`}
              style={{ justifyContent: sidebarOpen ? "flex-start" : "center", color: activeTab === item.tab ? "#00e5ff" : "rgba(255,255,255,0.5)" }}
            >
              <Icon name={item.icon} size={17} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Recent chats */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-2 pb-2 mt-3">
            <div className="text-xs px-3 py-2 font-rajdhani tracking-widest" style={{ color: "rgba(0,229,255,0.35)" }}>RECENT</div>
            {chats.slice(0, 8).map(chat => (
              <button
                key={chat.id}
                onClick={() => { setActiveChat(chat.id); setActiveTab("chat"); }}
                className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 transition-all duration-200 ${activeChat === chat.id ? "sidebar-item-active" : "hover:bg-white/5"}`}
              >
                <div className="text-sm font-exo truncate" style={{ color: activeChat === chat.id ? "#00e5ff" : "rgba(255,255,255,0.7)" }}>{chat.title}</div>
                <div className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{chat.preview}</div>
              </button>
            ))}
          </div>
        )}

        {/* Toggle sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center py-3 hover:bg-white/5 transition-colors flex-shrink-0"
          style={{ borderTop: "1px solid rgba(0,229,255,0.08)", color: "rgba(0,229,255,0.4)" }}
        >
          <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={16} />
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: 64, borderBottom: "1px solid rgba(0,229,255,0.08)", background: "rgba(8,14,28,0.8)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <span className="font-rajdhani text-lg font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>
              {activeTab === "chat" && "Conversation"}
              {activeTab === "history" && "Chat History"}
              {activeTab === "templates" && "Prompt Templates"}
              {activeTab === "settings" && "Preferences"}
              {activeTab === "profile" && "Profile"}
            </span>
            {activeTab === "chat" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-code"
                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.7)" }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00e5ff" }} />
                {model === "orion-pro" ? "Orion Pro" : "Orion Lite"}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              <Icon name="Search" size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              <Icon name="Bell" size={16} />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-rajdhani font-bold text-sm cursor-pointer"
              onClick={() => setActiveTab("profile")}
              style={{ background: "linear-gradient(135deg, #00e5ff, #7c3aed)", color: "#020b14" }}>
              J
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">

          {/* CHAT */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1">
                {messages.map((msg, i) => (
                  <div key={msg.id} className="animate-slide-in-up" style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end mb-4">
                        <div className="max-w-2xl">
                          <div className="message-user rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-exo leading-relaxed"
                            style={{ color: "rgba(255,255,255,0.9)" }}>
                            {msg.content}
                          </div>
                          <div className="text-right text-xs mt-1 font-code" style={{ color: "rgba(255,255,255,0.25)" }}>
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,237,0.15))", border: "1px solid rgba(0,229,255,0.25)" }}>
                          <div className="relative w-4 h-4">
                            <div className="absolute inset-0 rounded-full border border-transparent animate-orbit" style={{ borderTopColor: "#00e5ff" }} />
                            <div className="absolute inset-1 rounded-full" style={{ background: "rgba(0,229,255,0.3)" }} />
                          </div>
                        </div>
                        <div className="flex-1 max-w-2xl">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-rajdhani font-bold tracking-widest" style={{ color: "#00e5ff" }}>ORION</span>
                            <span className="text-xs font-code" style={{ color: "rgba(255,255,255,0.2)" }}>
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="message-ai rounded-2xl rounded-tl-sm px-4 py-3 text-sm font-exo leading-relaxed"
                            style={{ color: "rgba(255,255,255,0.85)" }}>
                            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                            {msg.hasCode && <CodeBlock code={CODE_SAMPLE} language="typescript" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 px-6 pb-6">
                <div className="input-orion rounded-2xl p-3 orion-glow">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Orion anything about code..."
                    rows={1}
                    className="w-full bg-transparent text-sm font-exo resize-none outline-none leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.9)", maxHeight: "120px", minHeight: "24px" }}
                    onInput={e => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = "auto";
                      t.style.height = Math.min(t.scrollHeight, 120) + "px";
                    }}
                  />
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid rgba(0,229,255,0.08)" }}>
                    <div className="flex items-center gap-1">
                      <button className="px-2 py-1 rounded-md text-xs font-code flex items-center gap-1 hover:bg-white/5 transition-colors"
                        style={{ color: "rgba(0,229,255,0.5)" }}>
                        <Icon name="Paperclip" size={12} />
                        Attach
                      </button>
                      <button className="px-2 py-1 rounded-md text-xs font-code flex items-center gap-1 hover:bg-white/5 transition-colors"
                        style={{ color: "rgba(0,229,255,0.5)" }}>
                        <Icon name="Code2" size={12} />
                        Code
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-code" style={{ color: "rgba(255,255,255,0.2)" }}>⏎ Send</span>
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="w-8 h-8 rounded-lg flex items-center justify-center btn-orion-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Icon name="ArrowUp" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-2 text-xs font-code" style={{ color: "rgba(255,255,255,0.18)" }}>
                  Orion AI may produce errors. Verify important code.
                </div>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {activeTab === "history" && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-rajdhani font-semibold text-lg tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>All Conversations</h2>
                  <button className="text-xs font-code px-3 py-1.5 rounded-lg orion-border hover:bg-white/5 transition-colors"
                    style={{ color: "rgba(0,229,255,0.6)" }}>
                    Clear All
                  </button>
                </div>
                {["Today", "Yesterday", "May 6", "May 5"].map(date => {
                  const dateChats = chats.filter(c => c.date === date);
                  if (!dateChats.length) return null;
                  return (
                    <div key={date} className="mb-6">
                      <div className="text-xs font-code mb-3 tracking-widest" style={{ color: "rgba(0,229,255,0.4)" }}>{date.toUpperCase()}</div>
                      <div className="space-y-2">
                        {dateChats.map(chat => (
                          <button
                            key={chat.id}
                            onClick={() => { setActiveChat(chat.id); setActiveTab("chat"); }}
                            className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:bg-white/5 flex items-start gap-3 group"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)", color: "rgba(0,229,255,0.6)" }}>
                              <Icon name="MessageSquare" size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-exo text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{chat.title}</div>
                              <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{chat.preview}</div>
                            </div>
                            <Icon name="ChevronRight" size={14} className="flex-shrink-0 mt-1" style={{ color: "rgba(255,255,255,0.2)" }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TEMPLATES */}
          {activeTab === "templates" && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <h2 className="font-rajdhani font-semibold text-lg tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>Quick Templates</h2>
                  <p className="text-sm font-exo" style={{ color: "rgba(255,255,255,0.35)" }}>Click to start a conversation with a preset prompt</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleTemplateClick(t)}
                      className="p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] animate-fade-in"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${t.color}22`,
                        animationDelay: `${i * 0.06}s`,
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                        style={{ background: `${t.color}15`, border: `1px solid ${t.color}30`, color: t.color }}>
                        <Icon name={t.icon} size={18} />
                      </div>
                      <div className="font-exo font-medium text-sm mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>{t.label}</div>
                      <div className="text-xs font-exo" style={{ color: "rgba(255,255,255,0.35)" }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-lg mx-auto space-y-5">
                <h2 className="font-rajdhani font-semibold text-lg tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>Preferences</h2>

                <div className="p-5 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.08)" }}>
                  <div>
                    <div className="font-exo font-medium text-sm mb-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>AI Model</div>
                    <div className="text-xs mb-3 font-exo" style={{ color: "rgba(255,255,255,0.35)" }}>Select the model for your conversations</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["orion-pro", "orion-lite"].map(m => (
                      <button key={m} onClick={() => setModel(m)}
                        className="p-3 rounded-lg text-left transition-all duration-200"
                        style={{
                          background: model === m ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${model === m ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.06)"}`,
                          color: model === m ? "#00e5ff" : "rgba(255,255,255,0.5)",
                        }}>
                        <div className="font-code text-sm">{m}</div>
                        <div className="text-xs mt-0.5 font-exo" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {m === "orion-pro" ? "Most capable" : "Faster & lighter"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.08)" }}>
                  <div className="font-exo font-medium text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>Interface</div>
                  {[
                    { label: "Streaming responses", desc: "See tokens appear in real-time", state: streamingEnabled, set: setStreamingEnabled },
                    { label: "Sound effects", desc: "Subtle audio feedback", state: soundEnabled, set: setSoundEnabled },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-exo" style={{ color: "rgba(255,255,255,0.75)" }}>{item.label}</div>
                        <div className="text-xs font-exo mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{item.desc}</div>
                      </div>
                      <button onClick={() => item.set(!item.state)}
                        className="w-11 h-6 rounded-full relative transition-all duration-300"
                        style={{ background: item.state ? "linear-gradient(90deg, #00e5ff, #7c3aed)" : "rgba(255,255,255,0.1)" }}>
                        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                          style={{ left: item.state ? "calc(100% - 22px)" : "2px" }} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.08)" }}>
                  <div className="font-exo font-medium text-sm mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>Color Theme</div>
                  <div className="flex gap-3">
                    {[
                      { id: "deep-space", colors: ["#00e5ff", "#7c3aed"] },
                      { id: "neon-green", colors: ["#00ff88", "#00cc44"] },
                      { id: "solar", colors: ["#ff9500", "#ff3b30"] },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTheme(t.id)}
                        className="w-10 h-10 rounded-xl relative transition-all duration-200 hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
                          boxShadow: theme === t.id ? `0 0 16px ${t.colors[0]}60` : "none",
                        }}>
                        {theme === t.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Icon name="Check" size={14} style={{ color: "#020b14" }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-lg mx-auto space-y-5">
                <h2 className="font-rajdhani font-semibold text-lg tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>Account</h2>

                <div className="p-6 rounded-xl flex items-center gap-5"
                  style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.05), rgba(124,58,237,0.05))", border: "1px solid rgba(0,229,255,0.12)" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-rajdhani font-bold text-2xl"
                    style={{ background: "linear-gradient(135deg, #00e5ff, #7c3aed)", color: "#020b14" }}>J</div>
                  <div>
                    <div className="font-rajdhani font-semibold text-lg" style={{ color: "rgba(255,255,255,0.9)" }}>John Developer</div>
                    <div className="font-code text-sm" style={{ color: "rgba(0,229,255,0.6)" }}>john@example.com</div>
                    <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-code w-fit"
                      style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.8)" }}>
                      ✦ Pro Plan
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[{ label: "Messages", value: "1,247" }, { label: "Chats", value: "84" }, { label: "Code gen", value: "312" }].map(stat => (
                    <div key={stat.label} className="p-4 rounded-xl text-center"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.08)" }}>
                      <div className="font-rajdhani font-bold text-xl orion-text-glow" style={{ color: "#00e5ff" }}>{stat.value}</div>
                      <div className="text-xs font-exo mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {["Edit Profile", "API Keys", "Billing & Usage", "Sign Out"].map((action, i) => (
                    <button key={action} className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-exo hover:bg-white/5 transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${i === 3 ? "rgba(255,60,60,0.15)" : "rgba(255,255,255,0.05)"}`,
                        color: i === 3 ? "rgba(255,100,100,0.8)" : "rgba(255,255,255,0.7)",
                      }}>
                      {action}
                      <Icon name={i === 3 ? "LogOut" : "ChevronRight"} size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
