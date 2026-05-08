"""
Orion AI auth handler — register, login, logout, /me
Handles POST /register, POST /login, POST /logout, GET /me
"""
import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p98071808_skin_pricing_adjustm")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def json_resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/").rstrip("/")
    method = event.get("httpMethod", "GET")
    last_segment = path.split("/")[-1] if path and path != "/" else ""

    if method == "POST" and last_segment == "register":
        return register(event)
    if method == "POST" and last_segment == "login":
        return login(event)
    if method == "POST" and last_segment == "logout":
        return logout(event)
    if method == "GET" and last_segment == "me":
        return me(event)

    return json_resp(404, {"error": "Not found"})


def register(event: dict) -> dict:
    body = json.loads(event.get("body") or "{}")
    email = (body.get("email") or "").strip().lower()
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""

    if not email or not username or not password:
        return json_resp(400, {"error": "Email, username and password are required"})
    if len(password) < 6:
        return json_resp(400, {"error": "Password must be at least 6 characters"})
    if "@" not in email:
        return json_resp(400, {"error": "Invalid email address"})

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
    if cur.fetchone():
        cur.close(); conn.close()
        return json_resp(409, {"error": "Email already registered"})

    pw_hash = hash_password(password)
    cur.execute(
        f"INSERT INTO {SCHEMA}.users (email, username, password_hash) VALUES (%s, %s, %s) RETURNING id",
        (email, username, pw_hash)
    )
    user_id = cur.fetchone()[0]

    token = make_token()
    expires_at = datetime.utcnow() + timedelta(days=30)
    cur.execute(
        f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires_at)
    )
    conn.commit()
    cur.close(); conn.close()

    return json_resp(201, {
        "token": token,
        "user": {"id": user_id, "email": email, "username": username, "plan": "free"}
    })


def login(event: dict) -> dict:
    body = json.loads(event.get("body") or "{}")
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return json_resp(400, {"error": "Email and password are required"})

    conn = get_conn()
    cur = conn.cursor()

    pw_hash = hash_password(password)
    cur.execute(
        f"SELECT id, email, username, plan FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s",
        (email, pw_hash)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return json_resp(401, {"error": "Invalid email or password"})

    user_id, email, username, plan = row

    token = make_token()
    expires_at = datetime.utcnow() + timedelta(days=30)
    cur.execute(
        f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires_at)
    )
    conn.commit()
    cur.close(); conn.close()

    return json_resp(200, {
        "token": token,
        "user": {"id": user_id, "email": email, "username": username, "plan": plan}
    })


def logout(event: dict) -> dict:
    token = event.get("headers", {}).get("X-Auth-Token") or event.get("headers", {}).get("x-auth-token")
    if not token:
        return json_resp(400, {"error": "No token provided"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
    conn.commit()
    cur.close(); conn.close()

    return json_resp(200, {"success": True})


def me(event: dict) -> dict:
    token = event.get("headers", {}).get("X-Auth-Token") or event.get("headers", {}).get("x-auth-token")
    if not token:
        return json_resp(401, {"error": "Unauthorized"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""SELECT u.id, u.email, u.username, u.plan, u.created_at
            FROM {SCHEMA}.users u
            JOIN {SCHEMA}.sessions s ON s.user_id = u.id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        return json_resp(401, {"error": "Unauthorized"})

    user_id, email, username, plan, created_at = row
    return json_resp(200, {
        "user": {
            "id": user_id,
            "email": email,
            "username": username,
            "plan": plan,
            "created_at": created_at.isoformat()
        }
    })