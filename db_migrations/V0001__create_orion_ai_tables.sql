CREATE TABLE t_p98071808_skin_pricing_adjustm.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p98071808_skin_pricing_adjustm.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p98071808_skin_pricing_adjustm.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p98071808_skin_pricing_adjustm.chats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p98071808_skin_pricing_adjustm.users(id),
  title VARCHAR(255) DEFAULT 'New Conversation',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p98071808_skin_pricing_adjustm.messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES t_p98071808_skin_pricing_adjustm.chats(id),
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON t_p98071808_skin_pricing_adjustm.sessions(token);
CREATE INDEX idx_chats_user_id ON t_p98071808_skin_pricing_adjustm.chats(user_id);
CREATE INDEX idx_messages_chat_id ON t_p98071808_skin_pricing_adjustm.messages(chat_id);
