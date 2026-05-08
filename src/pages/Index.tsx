import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, getToken } from "@/lib/api";
import type { User, Chat, Message } from "@/lib/api";

type Tab = "chat" | "history" | "templates" | "settings" | "profile";
type AuthView = "login" | "register";

const TEMPLATES = [
  { icon: "Code2", label: "Debug this code", desc: "Paste code + error message", color: "#00e5ff", prompt: "Please debug this code and explain the issue:\n\n" },
  { icon: "Zap", label: "Generate function", desc: "Describe what it should do", color: "#7c3aed", prompt: "Write a function that " },
  { icon: "GitBranch", label: "Code review", desc: "Get improvement suggestions", color: "#e040fb", prompt: "Please review this code and suggest improvements:\n\n" },
  { icon: "FileCode2", label: "Explain code", desc: "Break down complex logic", color: "#00e5ff", prompt: "Please explain this code step by step:\n\n" },
  { icon: "Repeat2", label: "Refactor code", desc: "Improve structure & readability", color: "#7c3aed", prompt: "Please refactor this code to improve readability:\n\n" },
  { icon: "Shield", label: "Security audit", desc: "Find vulnerabilities in code", color: "#e040fb", prompt: "Please audit this code for security vulnerabilities:\n\n" },
  { icon: "Layers", label: "Architecture plan", desc: "Design system structure", color: "#00e5ff", prompt: "Help me design the architecture for: " },
  { icon: "TestTube2", label: "Write tests", desc: "Unit, integration, e2e tests", color: "#7c3aed", prompt: "Write comprehensive tests for this code:\n\n" },
];

const AI_RESPONSES = [
  "I can help you with that! Here's what I'd suggest for your code — make sure to test it in your environment before using in production.",
  "Great question! Let me break this down for you. The key concept here is understanding the underlying pattern and applying it consistently.",
  "I've analyzed your request. Here's a clean, optimized approach that follows best practices.",
  "This is a common pattern. Let me show you the most idiomatic way to handle this.",
  "Excellent! Here's how I'd approach this problem step by step, keeping maintainability in mind.",
];

function parseMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00e5ff">$1</strong>')
    .replace(/`(.*?)`/g, '<code style="font-family:\'Fira Code\',monospace;background:rgba(0,229,255,0.1);padding:2px 6px;border-radius:4px;font-size:12px;color:#00e5ff">$1</code>')
    .replace(/\n/g, "<br/>");
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-1 py-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.15),rgba(124,58,237,0.15))", border: "1px solid rgba(0,229,255,0.25)" }}>
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

// ─── Auth Screen ────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (view === "register") {
        const res = await api.auth.register(email, username, password);
        localStorage.setItem("orion_token", res.token);
        onAuth(res.user);
      } else {
        const res = await api.auth.login(email, password);
        localStorage.setItem("orion_token", res.token);
        onAuth(res.user);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "hsl(220,30%,4%)" }}>
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(0,229,255,0.06) 0%,transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative z-10 w-full max-w-sm px-6 animate-slide-in-up">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full animate-orbit"
              style={{ border: "1.5px solid transparent", borderTopColor: "#00e5ff", borderRightColor: "#7c3aed" }} />
            <div className="absolute inset-1.5 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.2),rgba(124,58,237,0.2))" }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#00e5ff", boxShadow: "0 0 10px #00e5ff" }} />
            </div>
          </div>
          <div>
            <div className="font-rajdhani font-bold text-2xl orion-text-glow" style={{ color: "#00e5ff", letterSpacing: "0.08em" }}>ORION AI</div>
            <div className="text-xs font-code" style={{ color: "rgba(0,229,255,0.4)", letterSpacing: "0.15em" }}>NEXT-GEN CODE ASSISTANT</div>
          </div>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: "rgba(8,14,28,0.9)", border: "1px solid rgba(0,229,255,0.12)", backdropFilter: "blur(20px)" }}>
          <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.3)" }}>
            {(["login", "register"] as AuthView[]).map(v => (
              <button key={v} onClick={() => { setView(v); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-exo font-medium transition-all duration-200"
                style={{
                  background: view === v ? "linear-gradient(135deg,rgba(0,229,255,0.15),rgba(124,58,237,0.1))" : "transparent",
                  border: view === v ? "1px solid rgba(0,229,255,0.3)" : "1px solid transparent",
                  color: view === v ? "#00e5ff" : "rgba(255,255,255,0.4)",
                }}>
                {v === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "register" && (
              <div>
                <label className="block text-xs font-code mb-1.5" style={{ color: "rgba(0,229,255,0.6)" }}>USERNAME</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="yourname" required
                  className="w-full px-4 py-3 rounded-xl text-sm font-exo input-orion outline-none"
                  style={{ color: "rgba(255,255,255,0.9)" }} />
              </div>
            )}
            <div>
              <label className="block text-xs font-code mb-1.5" style={{ color: "rgba(0,229,255,0.6)" }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full px-4 py-3 rounded-xl text-sm font-exo input-orion outline-none"
                style={{ color: "rgba(255,255,255,0.9)" }} />
            </div>
            <div>
              <label className="block text-xs font-code mb-1.5" style={{ color: "rgba(0,229,255,0.6)" }}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full px-4 py-3 rounded-xl text-sm font-exo input-orion outline-none"
                style={{ color: "rgba(255,255,255,0.9)" }} />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-exo animate-fade-in"
                style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)", color: "rgba(255,120,120,0.9)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-exo font-semibold btn-orion-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-transparent animate-orbit" style={{ borderTopColor: "#020b14" }} />
                  Processing...
                </>
              ) : (
                view === "login" ? "Sign In to Orion" : "Create My Account"
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs font-code" style={{ color: "rgba(255,255,255,0.2)" }}>
          Orion AI © 2026 · All conversations are private
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function OrionAI() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [model, setModel] = useState("orion-pro");
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    api.auth.me().then(res => {
      setUser(res.user);
      setAuthChecked(true);
    }).catch(() => {
      localStorage.removeItem("orion_token");
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingChats(true);
    api.chats.list().then(res => {
      setChats(res.chats);
      if (res.chats.length > 0) setActiveChatId(res.chats[0].id);
    }).catch(() => {}).finally(() => setLoadingChats(false));
  }, [user]);

  useEffect(() => {
    if (!activeChatId) return;
    setLoadingMessages(true);
    api.chats.messages(activeChatId).then(res => {
      setMessages(res.messages);
    }).catch(() => {}).finally(() => setLoadingMessages(false));
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleLogout = async () => {
    await api.auth.logout().catch(() => {});
    localStorage.removeItem("orion_token");
    setUser(null); setChats([]); setMessages([]); setActiveChatId(null);
  };

  const handleNewChat = useCallback(async () => {
    try {
      const res = await api.chats.create("New Conversation");
      setChats(prev => [res.chat, ...prev]);
      setActiveChatId(res.chat.id);
      setMessages([]);
      setActiveTab("chat");
    } catch (e) { console.error(e); }
  }, []);

  const handleSelectChat = (chatId: number) => {
    setActiveChatId(chatId);
    setActiveTab("chat");
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeChatId) return;
    const content = inputValue.trim();
    setInputValue("");

    const userMsg: Message = { id: Date.now(), role: "user", content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    api.chats.addMessage(activeChatId, "user", content).catch(() => {});

    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1400 + Math.random() * 900));
    setIsTyping(false);

    const aiContent = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
    const aiMsg: Message = { id: Date.now() + 1, role: "ai", content: aiContent, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, aiMsg]);

    api.chats.addMessage(activeChatId, "ai", aiContent).then(() => {
      api.chats.list().then(res => setChats(res.chats)).catch(() => {});
    }).catch(() => {});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTemplateClick = async (template: typeof TEMPLATES[0]) => {
    setInputValue(template.prompt);
    setActiveTab("chat");
    if (!activeChatId) await handleNewChat();
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const navItems: { tab: Tab; icon: string; label: string }[] = [
    { tab: "chat", icon: "MessageSquare", label: "Chat" },
    { tab: "history", icon: "Clock", label: "History" },
    { tab: "templates", icon: "LayoutTemplate", label: "Templates" },
    { tab: "settings", icon: "Settings2", label: "Settings" },
    { tab: "profile", icon: "UserCircle2", label: "Profile" },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220,30%,4%)" }}>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-orbit" style={{ borderTopColor: "#00e5ff", borderRightColor: "#7c3aed" }} />
          <div className="absolute inset-2 rounded-full" style={{ background: "rgba(0,229,255,0.15)" }} />
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "hsl(220,30%,4%)" }}>
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(0,229,255,0.04) 0%,transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)", filter: "blur(40px)" }} />

      {/* Sidebar */}
      <aside className="relative z-10 flex flex-col transition-all duration-300 flex-shrink-0"
        style={{ width: sidebarOpen ? "260px" : "64px", background: "rgba(8,14,28,0.95)", borderRight: "1px solid rgba(0,229,255,0.08)", backdropFilter: "blur(20px)" }}>

        <div className="flex items-center px-4 py-4 gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,229,255,0.08)", height: 64 }}>
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className="absolute inset-0 rounded-full animate-orbit" style={{ border: "1.5px solid transparent", borderTopColor: "#00e5ff", borderRightColor: "#7c3aed" }} />
            <div className="absolute inset-1 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.2),rgba(124,58,237,0.2))" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "#00e5ff", boxShadow: "0 0 8px #00e5ff" }} />
            </div>
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <div className="font-rajdhani font-bold text-lg leading-none orion-text-glow" style={{ color: "#00e5ff", letterSpacing: "0.05em" }}>ORION</div>
              <div className="text-xs font-code" style={{ color: "rgba(0,229,255,0.4)", letterSpacing: "0.15em" }}>v2.1 · AI</div>
            </div>
          )}
        </div>

        <div className="px-3 py-3 flex-shrink-0">
          <button onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg btn-orion-primary text-sm font-exo"
            style={{ justifyContent: sidebarOpen ? "flex-start" : "center" }}>
            <Icon name="Plus" size={16} />
            {sidebarOpen && <span>New Chat</span>}
          </button>
        </div>

        <nav className="px-2 flex flex-col gap-0.5 flex-shrink-0">
          {navItems.map(item => (
            <button key={item.tab} onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 font-exo ${activeTab === item.tab ? "sidebar-item-active" : "hover:bg-white/5"}`}
              style={{ justifyContent: sidebarOpen ? "flex-start" : "center", color: activeTab === item.tab ? "#00e5ff" : "rgba(255,255,255,0.5)" }}>
              <Icon name={item.icon} size={17} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-2 pb-2 mt-3">
            <div className="text-xs px-3 py-2 font-rajdhani tracking-widest" style={{ color: "rgba(0,229,255,0.35)" }}>RECENT</div>
            {loadingChats ? (
              <div className="px-3 py-2 text-xs font-code" style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</div>
            ) : chats.length === 0 ? (
              <div className="px-3 py-2 text-xs font-code" style={{ color: "rgba(255,255,255,0.3)" }}>No chats yet</div>
            ) : (
              chats.map(chat => (
                <button key={chat.id} onClick={() => handleSelectChat(chat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 transition-all duration-200 ${activeChatId === chat.id ? "sidebar-item-active" : "hover:bg-white/5"}`}>
                  <div className="text-sm font-exo truncate" style={{ color: activeChatId === chat.id ? "#00e5ff" : "rgba(255,255,255,0.7)" }}>{chat.title}</div>
                  <div className="text-xs truncate mt-0.5 font-code" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center py-3 hover:bg-white/5 transition-colors flex-shrink-0"
          style={{ borderTop: "1px solid rgba(0,229,255,0.08)", color: "rgba(0,229,255,0.4)" }}>
          <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={16} />
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: 64, borderBottom: "1px solid rgba(0,229,255,0.08)", background: "rgba(8,14,28,0.8)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <span className="font-rajdhani text-lg font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>
              {activeTab === "chat" ? (activeChat?.title || "Orion AI") : activeTab === "history" ? "Chat History" : activeTab === "templates" ? "Templates" : activeTab === "settings" ? "Settings" : "Profile"}
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
            <span className="text-xs font-exo hidden sm:block" style={{ color: "rgba(255,255,255,0.4)" }}>{user.username}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-rajdhani font-bold text-sm cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setActiveTab("profile")}
              style={{ background: "linear-gradient(135deg,#00e5ff,#7c3aed)", color: "#020b14" }}>
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">

          {/* CHAT */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full">
              {!activeChatId ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full animate-orbit" style={{ border: "2px solid transparent", borderTopColor: "#00e5ff", borderRightColor: "#7c3aed" }} />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.15),rgba(124,58,237,0.15))" }}>
                      <div className="w-4 h-4 rounded-full" style={{ background: "#00e5ff", boxShadow: "0 0 16px #00e5ff" }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="font-rajdhani font-bold text-2xl mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>Welcome back, {user.username}!</h2>
                    <p className="text-sm font-exo" style={{ color: "rgba(255,255,255,0.4)" }}>Start a new conversation or pick one from the sidebar</p>
                  </div>
                  <button onClick={handleNewChat}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl btn-orion-primary font-exo font-semibold text-sm">
                    <Icon name="Plus" size={16} />
                    Start New Chat
                  </button>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-2">
                    {TEMPLATES.slice(0, 4).map((t, i) => (
                      <button key={i} onClick={() => handleTemplateClick(t)}
                        className="p-3 rounded-xl text-left transition-all duration-200 hover:scale-[1.02]"
                        style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${t.color}22` }}>
                        <div style={{ color: t.color }}><Icon name={t.icon} size={16} /></div>
                        <div className="text-xs font-exo mt-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="relative w-8 h-8">
                          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-orbit" style={{ borderTopColor: "#00e5ff" }} />
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <p className="text-sm font-exo" style={{ color: "rgba(255,255,255,0.3)" }}>No messages yet. Type below to start!</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {messages.map((msg, i) => (
                          <div key={msg.id} className="animate-slide-in-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.2)}s` }}>
                            {msg.role === "user" ? (
                              <div className="flex justify-end mb-4">
                                <div className="max-w-2xl">
                                  <div className="message-user rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-exo leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
                                    {msg.content}
                                  </div>
                                  <div className="text-right text-xs mt-1 font-code" style={{ color: "rgba(255,255,255,0.2)" }}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                  style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.15),rgba(124,58,237,0.15))", border: "1px solid rgba(0,229,255,0.25)" }}>
                                  <div className="relative w-4 h-4">
                                    <div className="absolute inset-0 rounded-full border border-transparent animate-orbit" style={{ borderTopColor: "#00e5ff" }} />
                                    <div className="absolute inset-1 rounded-full" style={{ background: "rgba(0,229,255,0.3)" }} />
                                  </div>
                                </div>
                                <div className="flex-1 max-w-2xl">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs font-rajdhani font-bold tracking-widest" style={{ color: "#00e5ff" }}>ORION</span>
                                    <span className="text-xs font-code" style={{ color: "rgba(255,255,255,0.2)" }}>
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <div className="message-ai rounded-2xl rounded-tl-sm px-4 py-3 text-sm font-exo leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {isTyping && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 px-6 pb-6">
                    <div className="input-orion rounded-2xl p-3 orion-glow">
                      <textarea ref={textareaRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder="Ask Orion anything about code..." rows={1}
                        className="w-full bg-transparent text-sm font-exo resize-none outline-none leading-relaxed placeholder:text-gray-600"
                        style={{ color: "rgba(255,255,255,0.9)", maxHeight: "120px", minHeight: "24px" }}
                        onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }} />
                      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid rgba(0,229,255,0.08)" }}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setInputValue(prev => prev + "\n```\n\n```"); textareaRef.current?.focus(); }}
                            className="px-2 py-1 rounded-md text-xs font-code flex items-center gap-1 hover:bg-white/5 transition-colors" style={{ color: "rgba(0,229,255,0.5)" }}>
                            <Icon name="Code2" size={12} /> Code block
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-code hidden sm:block" style={{ color: "rgba(255,255,255,0.2)" }}>⏎ Send</span>
                          <button onClick={handleSend} disabled={!inputValue.trim() || isTyping}
                            className="w-8 h-8 rounded-lg flex items-center justify-center btn-orion-primary disabled:opacity-30 disabled:cursor-not-allowed">
                            <Icon name="ArrowUp" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-2 text-xs font-code" style={{ color: "rgba(255,255,255,0.15)" }}>
                      Orion AI may produce errors. Verify important code.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* HISTORY */}
          {activeTab === "history" && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-rajdhani font-semibold text-lg tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>All Conversations</h2>
                  <span className="text-xs font-code px-3 py-1.5 rounded-lg orion-border" style={{ color: "rgba(0,229,255,0.5)" }}>{chats.length} chats</span>
                </div>
                {chats.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="font-exo text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No conversations yet. Start a new chat!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chats.map(chat => (
                      <button key={chat.id} onClick={() => handleSelectChat(chat.id)}
                        className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:bg-white/5 flex items-start gap-3 group"
                        style={{ background: activeChatId === chat.id ? "rgba(0,229,255,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${activeChatId === chat.id ? "rgba(0,229,255,0.25)" : "rgba(255,255,255,0.05)"}` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)", color: "rgba(0,229,255,0.6)" }}>
                          <Icon name="MessageSquare" size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-exo text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{chat.title}</div>
                          <div className="text-xs mt-0.5 font-code" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {new Date(chat.updated_at).toLocaleString()}
                          </div>
                        </div>
                        <Icon name="ChevronRight" size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
                      </button>
                    ))}
                  </div>
                )}
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
                    <button key={i} onClick={() => handleTemplateClick(t)}
                      className="p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] animate-fade-in"
                      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${t.color}22`, animationDelay: `${i * 0.06}s` }}>
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
                  <div className="font-exo font-medium text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>AI Model</div>
                  <div className="grid grid-cols-2 gap-2">
                    {["orion-pro", "orion-lite"].map(m => (
                      <button key={m} onClick={() => setModel(m)} className="p-3 rounded-lg text-left transition-all duration-200"
                        style={{ background: model === m ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${model === m ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.06)"}`, color: model === m ? "#00e5ff" : "rgba(255,255,255,0.5)" }}>
                        <div className="font-code text-sm">{m}</div>
                        <div className="text-xs mt-0.5 font-exo" style={{ color: "rgba(255,255,255,0.3)" }}>{m === "orion-pro" ? "Most capable" : "Faster & lighter"}</div>
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
                        style={{ background: item.state ? "linear-gradient(90deg,#00e5ff,#7c3aed)" : "rgba(255,255,255,0.1)" }}>
                        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                          style={{ left: item.state ? "calc(100% - 22px)" : "2px" }} />
                      </button>
                    </div>
                  ))}
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
                  style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.05),rgba(124,58,237,0.05))", border: "1px solid rgba(0,229,255,0.12)" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-rajdhani font-bold text-2xl"
                    style={{ background: "linear-gradient(135deg,#00e5ff,#7c3aed)", color: "#020b14" }}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-rajdhani font-semibold text-lg" style={{ color: "rgba(255,255,255,0.9)" }}>{user.username}</div>
                    <div className="font-code text-sm" style={{ color: "rgba(0,229,255,0.6)" }}>{user.email}</div>
                    <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-code w-fit"
                      style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.8)" }}>
                      ✦ {user.plan === "free" ? "Free Plan" : "Pro Plan"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Conversations", value: String(chats.length) },
                    { label: "Member since", value: user.created_at ? new Date(user.created_at).toLocaleDateString() : "Today" },
                  ].map(stat => (
                    <div key={stat.label} className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.08)" }}>
                      <div className="font-rajdhani font-bold text-xl orion-text-glow" style={{ color: "#00e5ff" }}>{stat.value}</div>
                      <div className="text-xs font-exo mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-exo hover:bg-white/5 transition-colors"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,60,60,0.15)", color: "rgba(255,100,100,0.8)" }}>
                  Sign Out
                  <Icon name="LogOut" size={14} />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}