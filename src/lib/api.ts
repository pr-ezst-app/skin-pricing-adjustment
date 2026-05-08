const AUTH_URL = "https://functions.poehali.dev/8c94e339-1608-4c41-8616-8e2803702005";
const CHATS_URL = "https://functions.poehali.dev/ff7641cb-3696-4d9e-98ef-319363ca5e2c";

function getToken(): string | null {
  return localStorage.getItem("orion_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-Auth-Token": token } : {}),
  };
}

async function req<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export type User = { id: number; email: string; username: string; plan: string; created_at?: string };
export type Chat = { id: number; title: string; created_at: string; updated_at: string };
export type Message = { id: number; role: "user" | "ai"; content: string; created_at: string };

export const api = {
  auth: {
    register: (email: string, username: string, password: string) =>
      req<{ token: string; user: User }>(`${AUTH_URL}/register`, {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      }),
    login: (email: string, password: string) =>
      req<{ token: string; user: User }>(`${AUTH_URL}/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      req<{ success: boolean }>(`${AUTH_URL}/logout`, { method: "POST" }),
    me: () =>
      req<{ user: User }>(`${AUTH_URL}/me`),
  },
  chats: {
    list: () =>
      req<{ chats: Chat[] }>(CHATS_URL),
    create: (title?: string) =>
      req<{ chat: Chat }>(CHATS_URL, {
        method: "POST",
        body: JSON.stringify({ title: title || "New Conversation" }),
      }),
    messages: (chatId: number) =>
      req<{ messages: Message[] }>(`${CHATS_URL}/${chatId}/messages`),
    addMessage: (chatId: number, role: "user" | "ai", content: string) =>
      req<{ message: Message }>(`${CHATS_URL}/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ role, content }),
      }),
    updateTitle: (chatId: number, title: string) =>
      req<{ success: boolean }>(`${CHATS_URL}/${chatId}/title`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
  },
};

export { getToken };
