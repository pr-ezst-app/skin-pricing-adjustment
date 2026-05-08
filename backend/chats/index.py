"""
Orion AI chats handler — list, create, delete chats + messages
GET /chats, POST /chats, GET /chats/{id}/messages, POST /chats/{id}/messages
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p98071808_skin_pricing_adjustm")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def get_user(token: str, cur):
    if not token:
        return None
    cur.execute(
        f"""SELECT u.id, u.username FROM {SCHEMA}.users u
            JOIN {SCHEMA}.sessions s ON s.user_id = u.id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/").rstrip("/")
    method = event.get("httpMethod", "GET")
    token = event.get("headers", {}).get("X-Auth-Token") or event.get("headers", {}).get("x-auth-token")

    conn = get_conn()
    cur = conn.cursor()
    user = get_user(token, cur)

    if not user:
        cur.close(); conn.close()
        return json_resp(401, {"error": "Unauthorized"})

    user_id = user[0]

    parts = path.split("/")

    # POST /chats/{id}/messages  or  GET /chats/{id}/messages
    if len(parts) >= 3 and parts[-1] == "messages":
        chat_id = parts[-2]
        if method == "GET":
            result = get_messages(chat_id, user_id, cur)
        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            result = add_message(chat_id, user_id, body, cur, conn)
        else:
            result = json_resp(405, {"error": "Method not allowed"})
        cur.close(); conn.close()
        return result

    # PUT /chats/{id}/title
    if len(parts) >= 3 and parts[-1] == "title" and method == "PUT":
        chat_id = parts[-2]
        body = json.loads(event.get("body") or "{}")
        result = update_title(chat_id, user_id, body, cur, conn)
        cur.close(); conn.close()
        return result

    # GET/POST /chats
    if method == "GET":
        result = list_chats(user_id, cur)
    elif method == "POST":
        body = json.loads(event.get("body") or "{}")
        result = create_chat(user_id, body, cur, conn)
    else:
        result = json_resp(405, {"error": "Method not allowed"})

    cur.close(); conn.close()
    return result


def list_chats(user_id: int, cur) -> dict:
    cur.execute(
        f"""SELECT id, title, created_at, updated_at
            FROM {SCHEMA}.chats
            WHERE user_id = %s
            ORDER BY updated_at DESC
            LIMIT 50""",
        (user_id,)
    )
    rows = cur.fetchall()
    chats = [{"id": r[0], "title": r[1], "created_at": r[2].isoformat(), "updated_at": r[3].isoformat()} for r in rows]
    return json_resp(200, {"chats": chats})


def create_chat(user_id: int, body: dict, cur, conn) -> dict:
    title = body.get("title", "New Conversation")
    cur.execute(
        f"INSERT INTO {SCHEMA}.chats (user_id, title) VALUES (%s, %s) RETURNING id, title, created_at, updated_at",
        (user_id, title)
    )
    row = cur.fetchone()
    conn.commit()
    return json_resp(201, {"chat": {"id": row[0], "title": row[1], "created_at": row[2].isoformat(), "updated_at": row[3].isoformat()}})


def get_messages(chat_id: str, user_id: int, cur) -> dict:
    cur.execute(f"SELECT user_id FROM {SCHEMA}.chats WHERE id = %s", (chat_id,))
    chat = cur.fetchone()
    if not chat or chat[0] != user_id:
        return json_resp(404, {"error": "Chat not found"})

    cur.execute(
        f"SELECT id, role, content, created_at FROM {SCHEMA}.messages WHERE chat_id = %s ORDER BY created_at ASC",
        (chat_id,)
    )
    rows = cur.fetchall()
    messages = [{"id": r[0], "role": r[1], "content": r[2], "created_at": r[3].isoformat()} for r in rows]
    return json_resp(200, {"messages": messages})


def add_message(chat_id: str, user_id: int, body: dict, cur, conn) -> dict:
    cur.execute(f"SELECT user_id FROM {SCHEMA}.chats WHERE id = %s", (chat_id,))
    chat = cur.fetchone()
    if not chat or chat[0] != user_id:
        return json_resp(404, {"error": "Chat not found"})

    role = body.get("role", "user")
    content = body.get("content", "").strip()
    if not content:
        return json_resp(400, {"error": "Content is required"})
    if role not in ("user", "ai"):
        return json_resp(400, {"error": "Role must be user or ai"})

    cur.execute(
        f"INSERT INTO {SCHEMA}.messages (chat_id, role, content) VALUES (%s, %s, %s) RETURNING id, role, content, created_at",
        (chat_id, role, content)
    )
    row = cur.fetchone()

    if role == "user" and len(content) > 3:
        title_words = content[:40].strip()
        cur.execute(
            f"UPDATE {SCHEMA}.chats SET updated_at = NOW(), title = %s WHERE id = %s AND title = 'New Conversation'",
            (title_words, chat_id)
        )
    else:
        cur.execute(f"UPDATE {SCHEMA}.chats SET updated_at = NOW() WHERE id = %s", (chat_id,))

    conn.commit()
    return json_resp(201, {"message": {"id": row[0], "role": row[1], "content": row[2], "created_at": row[3].isoformat()}})


def update_title(chat_id: str, user_id: int, body: dict, cur, conn) -> dict:
    title = body.get("title", "").strip()
    if not title:
        return json_resp(400, {"error": "Title is required"})
    cur.execute(
        f"UPDATE {SCHEMA}.chats SET title = %s, updated_at = NOW() WHERE id = %s AND user_id = %s",
        (title, chat_id, user_id)
    )
    conn.commit()
    return json_resp(200, {"success": True})
