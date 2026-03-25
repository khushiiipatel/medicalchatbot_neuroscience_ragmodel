
import json
import asyncio
import hashlib
import uuid
from datetime import datetime, timedelta

import jwt
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr

from rag_logic import stream_answer   # our streaming RAG pipeline

# ── App setup ────────────────────────────────────────────────
app = FastAPI(title="NeuroBot — Qwen2.5 + WebSocket")

# Let the React dev server call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],   # allow all during development
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── JWT settings ─────────────────────────────────────────────
JWT_SECRET    = "change-this-to-a-long-random-string-in-production"
JWT_ALGORITHM = "HS256"
JWT_HOURS     = 24

# ── In-memory database ───────────────────────────────────────
# Good enough for development. Swap for PostgreSQL in production.
USERS_DB:    dict = {}    # email  →  { name, password_hash }
CHAT_HISTORY:dict = {}    # email  →  [ { role, text, time } ]

# ── Helpers ──────────────────────────────────────────────────
def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_HOURS),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> str:
    """Returns user email or raises 401."""
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return data["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token.")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def current_user(token: str = Depends(oauth2_scheme)) -> str:
    return decode_token(token)


# ── Pydantic schemas ─────────────────────────────────────────
class SignupBody(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class LoginBody(BaseModel):
    email:    EmailStr
    password: str

class AuthOut(BaseModel):
    token:   str
    name:    str
    message: str


# ════════════════════════════════════════════════════════════
#  REST Endpoints
# ════════════════════════════════════════════════════════════

@app.post("/signup", response_model=AuthOut, status_code=201)
def signup(body: SignupBody):
    """Register a new user. Returns a JWT token immediately."""
    if body.email in USERS_DB:
        raise HTTPException(400, "Email already registered.")
    USERS_DB[body.email] = {
        "name":          body.name,
        "password_hash": hash_pw(body.password),
    }
    CHAT_HISTORY[body.email] = []
    return AuthOut(token=make_token(body.email), name=body.name, message="Account created!")


@app.post("/login", response_model=AuthOut)
def login(body: LoginBody):
    """Verify credentials and return a JWT token."""
    user = USERS_DB.get(body.email)
    if not user or user["password_hash"] != hash_pw(body.password):
        raise HTTPException(401, "Wrong email or password.")
    return AuthOut(token=make_token(body.email), name=user["name"], message="Welcome back!")


@app.get("/history")
def history(user: str = Depends(current_user)):
    """Return the chat history for the logged-in user."""
    return {"history": CHAT_HISTORY.get(user, [])}


@app.get("/health")
def health():
    return {"status": "ok", "model": "qwen2.5", "streaming": True}


# ════════════════════════════════════════════════════════════
#  WebSocket  /ws/chat/{token}
#
#  HOW THE FLOW WORKS:
#
#  Browser                          FastAPI
#  ───────                          ───────
#  connect to ws://..../ws/chat/<jwt>
#                                   verify token
#                                   accept connection
#  send: "What is synaptic transmission?"
#                                   retrieve PDF chunks
#                                   call qwen2.5 with streaming=True
#                                   for each token:
#  receive: { type:"token", data:"Synaptic" }
#  receive: { type:"token", data:" transmission" }
#  receive: { type:"token", data:" is..." }
#     ... (hundreds of small tokens) ...
#  receive: { type:"sources", data:[{doc,page}] }
#  receive: { type:"done" }
#
#  This loop repeats — user can ask another question
#  on the same connection without reconnecting.
# ════════════════════════════════════════════════════════════

@app.websocket("/ws/chat/{token}")
async def ws_chat(websocket: WebSocket, token: str):

    # ── 1. Verify JWT before accepting ────────────────────
    try:
        user_email = decode_token(token)
    except HTTPException:
        # Reject bad/expired tokens at connection time
        await websocket.close(code=4001)
        return

    # ── 2. Accept the connection ──────────────────────────
    await websocket.accept()
    print(f"[WS] Connected  → {user_email}")

    try:
        # ── 3. Main loop — stay open for multiple questions
        while True:

            # Wait for user to send a question (plain text)
            question = await websocket.receive_text()
            question = question.strip()
            if not question:
                continue

            print(f"[WS] Question   → {question[:70]}")
            now = datetime.utcnow().strftime("%H:%M")

            # Save user message to history
            history = CHAT_HISTORY.setdefault(user_email, [])
            history.append({"role": "user", "text": question, "time": now})

            # ── 4. Stream the answer token by token ───────
            full_answer  = ""
            sources_data = []

            # stream_answer() is a synchronous generator.
            # We run it in a background thread so it does not
            # block the async event loop.
            loop   = asyncio.get_event_loop()
            tokens = await loop.run_in_executor(
                None,
                lambda: list(stream_answer(question))
            )

            for piece in tokens:
                # The last "token" is actually the sources marker
                if piece.startswith("\n__SOURCES__"):
                    raw = piece.replace("\n__SOURCES__", "")
                    try:
                        sources_data = json.loads(raw)
                    except Exception:
                        sources_data = []
                    continue   # don't send this raw marker to browser

                # Send each real token to the browser
                await websocket.send_json({
                    "type": "token",
                    "data": piece,
                })
                full_answer += piece

                # Tiny pause — lets the browser render each token
                await asyncio.sleep(0.008)

            # ── 5. Send sources after all tokens ──────────
            await websocket.send_json({
                "type": "sources",
                "data": sources_data,
            })

            # ── 6. Signal that streaming is complete ──────
            await websocket.send_json({"type": "done"})

            # ── 7. Save bot answer to history ─────────────
            history.append({"role": "bot", "text": full_answer.strip(), "time": now})
            print(f"[WS] Streamed   → {len(full_answer)} chars to {user_email}")

    except WebSocketDisconnect:
        # Normal disconnect — user closed the tab
        print(f"[WS] Disconnected → {user_email}")

    except Exception as e:
        print(f"[WS] Error        → {e}")
        try:
            await websocket.send_json({"type": "error", "data": str(e)})
        except Exception:
            pass
