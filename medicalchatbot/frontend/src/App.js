

import React, { useState, useEffect, useRef, useCallback } from "react";


const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg:        #0d1117;
    --surface:   #161b22;
    --surface2:  #1c2330;
    --border:    #21262d;
    --accent:    #58a6ff;       /* blue — clinical, trustworthy */
    --accent-g:  #3fb950;       /* green — for sources badge   */
    --text:      #c9d1d9;
    --text-dim:  #8b949e;
    --user-bub:  #1f3a5f;
    --bot-bub:   #161b22;
    --danger:    #f85149;
    --font-h:    'Lora', Georgia, serif;
    --font-b:    'Inter', system-ui, sans-serif;
    --font-m:    'JetBrains Mono', monospace;
    --r:         10px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-b); font-size: 14px; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ── Auth screen ── */
  .auth-wrap {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 0; padding: 24px;
    background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(88,166,255,0.05), transparent 70%);
  }
  .auth-card {
    width: 100%; max-width: 380px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 36px 32px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  .auth-head { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .auth-icon {
    width: 38px; height: 38px; border-radius: var(--r);
    background: rgba(88,166,255,0.1); border: 1px solid rgba(88,166,255,0.25);
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .auth-head h1 { font-family: var(--font-h); font-size: 20px; font-weight: 600; }
  .auth-head span { font-size: 11px; color: var(--text-dim); display: block; }
  .tabs { display: flex; background: var(--bg); border-radius: 8px; padding: 3px; margin-bottom: 22px; }
  .tab {
    flex: 1; padding: 8px; border: none; border-radius: 6px; cursor: pointer;
    font-family: var(--font-b); font-size: 13px; font-weight: 500;
    background: transparent; color: var(--text-dim); transition: all 0.2s;
  }
  .tab.on { background: var(--surface); color: var(--accent); border: 1px solid var(--border); }
  .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .field label { font-size: 11px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .field input {
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 13px; color: var(--text); font-family: var(--font-b); font-size: 14px;
    outline: none; transition: border-color 0.2s;
  }
  .field input:focus { border-color: var(--accent); }
  .field input::placeholder { color: var(--text-dim); }
  .submit-btn {
    width: 100%; padding: 11px; border: none; border-radius: 8px;
    background: var(--accent); color: #0d1117;
    font-family: var(--font-b); font-size: 14px; font-weight: 600;
    cursor: pointer; margin-top: 4px; transition: opacity 0.2s, transform 0.1s;
  }
  .submit-btn:hover:not(:disabled) { opacity: 0.88; }
  .submit-btn:active:not(:disabled) { transform: scale(0.99); }
  .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .err-box {
    background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.3);
    border-radius: 8px; padding: 9px 13px; color: #ffa198;
    font-size: 13px; margin-bottom: 14px;
  }

  /* ── App shell ── */
  .shell { display: flex; height: 100vh; overflow: hidden; }

  /* ── Sidebar ── */
  .sidebar {
    width: 255px; flex-shrink: 0; display: flex; flex-direction: column;
    background: var(--surface); border-right: 1px solid var(--border); padding: 14px 10px;
  }
  .sb-logo { display: flex; align-items: center; gap: 8px; padding: 2px 8px 18px; }
  .sb-logo-icon {
    width: 26px; height: 26px; border-radius: 7px;
    background: rgba(88,166,255,0.1); border: 1px solid rgba(88,166,255,0.2);
    display: flex; align-items: center; justify-content: center; font-size: 13px;
  }
  .sb-logo-text { font-family: var(--font-h); font-size: 15px; }
  .new-btn {
    display: flex; align-items: center; gap: 7px; width: 100%;
    padding: 9px 12px; border-radius: 8px; margin-bottom: 18px;
    background: rgba(88,166,255,0.1); border: 1px solid rgba(88,166,255,0.2);
    color: var(--accent); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background 0.2s;
  }
  .new-btn:hover { background: rgba(88,166,255,0.18); }
  .sb-label { font-size: 10px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: var(--text-dim); padding: 0 8px 8px; }
  .hist-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; }
  .hist-item {
    padding: 8px 11px; border-radius: 7px; color: var(--text-dim);
    font-size: 13px; cursor: pointer; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; transition: all 0.15s;
    border: 1px solid transparent;
  }
  .hist-item:hover { background: rgba(255,255,255,0.04); color: var(--text); }
  .hist-item.active { background: rgba(88,166,255,0.08); border-color: rgba(88,166,255,0.15); color: var(--accent); }
  .hist-empty { font-size: 12px; color: var(--text-dim); padding: 6px 11px; }
  .sb-foot { border-top: 1px solid var(--border); padding-top: 12px; display: flex; align-items: center; justify-content: space-between; }
  .sb-user-name { font-size: 13px; font-weight: 500; }
  .sb-user-sub { font-size: 11px; color: var(--text-dim); }
  .logout-btn { background: none; border: none; cursor: pointer; font-size: 12px; color: var(--text-dim); padding: 5px 8px; border-radius: 6px; transition: color 0.2s; }
  .logout-btn:hover { color: var(--danger); }

  /* ── Main chat ── */
  .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .topbar {
    padding: 13px 22px; border-bottom: 1px solid var(--border);
    background: var(--surface); display: flex; align-items: center; gap: 10px;
  }
  .topbar h2 { font-family: var(--font-h); font-size: 16px; font-weight: 600; }
  .ws-badge {
    margin-left: auto; display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-family: var(--font-m);
    padding: 4px 10px; border-radius: 20px;
    background: rgba(63,185,80,0.1); border: 1px solid rgba(63,185,80,0.2);
    color: var(--accent-g);
  }
  .ws-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-g); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .ws-badge.off { background: rgba(248,81,73,0.1); border-color: rgba(248,81,73,0.2); color: var(--danger); }
  .ws-dot.off   { background: var(--danger); }

  /* ── Messages ── */
  .msgs { flex: 1; overflow-y: auto; padding: 22px; display: flex; flex-direction: column; gap: 14px; }

  /* Welcome / empty state */
  .welcome { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 40px; animation: fadeUp 0.5s ease forwards; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  .welcome-icon { font-size: 44px; width: 76px; height: 76px; border-radius: 20px; display: flex; align-items: center; justify-content: center; background: rgba(88,166,255,0.06); border: 1px solid rgba(88,166,255,0.12); margin-bottom: 16px; }
  .welcome h3 { font-family: var(--font-h); font-size: 20px; font-weight: 600; margin-bottom: 8px; }
  .welcome p { color: var(--text-dim); max-width: 360px; line-height: 1.65; }
  .chips { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-top: 20px; }
  .chip {
    padding: 7px 13px; border-radius: 100px; font-size: 12px;
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text-dim); cursor: pointer; transition: all 0.2s;
  }
  .chip:hover { border-color: var(--accent); color: var(--accent); }

  /* Message rows */
  .msg { display: flex; gap: 9px; animation: fadeUp 0.25s ease; }
  .msg.user { flex-direction: row-reverse; }
  .avatar {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; margin-top: 3px;
  }
  .avatar.bot  { background: rgba(88,166,255,0.1); border: 1px solid rgba(88,166,255,0.2); color: var(--accent); }
  .avatar.user { background: rgba(88,166,255,0.15); border: 1px solid rgba(88,166,255,0.25); color: var(--accent); }

  /* Bubbles */
  .bubble {
    max-width: 72%; padding: 11px 15px; border-radius: 14px;
    font-size: 14px; line-height: 1.7; white-space: pre-wrap; word-break: break-word;
  }
  .bubble.user { background: var(--user-bub); border: 1px solid rgba(88,166,255,0.2); border-radius: 14px 3px 14px 14px; }
  .bubble.bot  { background: var(--bot-bub);  border: 1px solid var(--border);        border-radius: 3px 14px 14px 14px; }

  /* The Reference block inside bot messages */
  .ref-block {
    margin-top: 10px; padding: 9px 12px; border-radius: 8px;
    background: rgba(63,185,80,0.06); border: 1px solid rgba(63,185,80,0.2);
    font-family: var(--font-m); font-size: 12px; color: #7ee787;
    white-space: pre-wrap;
  }

  /* Sources chips shown after streaming */
  .sources-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .src-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-family: var(--font-m);
    padding: 4px 9px; border-radius: 20px;
    background: rgba(63,185,80,0.08); border: 1px solid rgba(63,185,80,0.2);
    color: #7ee787;
  }

  /* ── Typewriter cursor shown while streaming ── */
  .cursor {
    display: inline-block; width: 2px; height: 14px;
    background: var(--accent); border-radius: 1px;
    margin-left: 2px; vertical-align: middle;
    animation: blink 0.7s step-end infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* Typing dots (shown before first token arrives) */
  .dots { display: flex; gap: 5px; align-items: center; padding: 4px 0; }
  .dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--text-dim); animation: bounce 1.2s ease-in-out infinite; }
  .dots span:nth-child(2) { animation-delay: 0.2s; }
  .dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

  /* ── Input bar ── */
  .input-wrap { padding: 14px 22px 6px; border-top: 1px solid var(--border); background: var(--surface); }
  .input-row {
    display: flex; gap: 9px; align-items: flex-end;
    background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
    padding: 9px 11px; transition: border-color 0.2s;
  }
  .input-row:focus-within { border-color: rgba(88,166,255,0.4); }
  textarea.chat-in {
    flex: 1; resize: none; background: none; border: none; outline: none;
    color: var(--text); font-family: var(--font-b); font-size: 14px;
    line-height: 1.5; max-height: 120px;
  }
  textarea.chat-in::placeholder { color: var(--text-dim); }
  .send-btn {
    width: 34px; height: 34px; border-radius: 8px; border: none; flex-shrink: 0;
    background: var(--accent); color: #0d1117; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: opacity 0.2s, transform 0.1s;
  }
  .send-btn:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .input-hint { font-size: 11px; color: var(--text-dim); text-align: center; margin-top: 5px; }

  /* ── Persistent disclaimer footer ── */
  .disclaimer {
    text-align: center; padding: 5px 12px;
    font-size: 11px; letter-spacing: 0.2px;
    color: rgba(248,81,73,0.65);
    background: rgba(248,81,73,0.04);
    border-top: 1px solid rgba(248,81,73,0.12);
  }
`;

// ─────────────────────────────────────────────────────────────
//  2. useWebSocket  — custom hook
//
//  Manages the WebSocket connection lifecycle:
//    connect()   — opens WS, sets up onmessage handler
//    send(text)  — sends a question to the server
//    disconnect()— closes the connection
//
//  Returns:
//    connected  — boolean, is WS open?
//    streaming  — boolean, is the bot currently typing?
//    send       — function to send a question
// ─────────────────────────────────────────────────────────────
function useWebSocket({ token, onToken, onSources, onDone, onError }) {
  const wsRef      = useRef(null);       // the WebSocket object
  const [connected, setConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);

  // Connect to the WebSocket server
  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;   // already open

    // Token is passed in the URL — WebSocket doesn't support headers
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");
      setConnected(false);
      setStreaming(false);
    };

    ws.onerror = (e) => {
      console.error("[WS] Error", e);
      setStreaming(false);
    };

    // ── Handle incoming messages from the server ──────────
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "token") {
        // A piece of the answer — show it immediately
        setStreaming(true);
        onToken(msg.data);
      }
      else if (msg.type === "sources") {
        // Source list — display below the answer
        onSources(msg.data);
      }
      else if (msg.type === "done") {
        // Streaming is complete
        setStreaming(false);
        onDone();
      }
      else if (msg.type === "error") {
        setStreaming(false);
        onError(msg.data);
      }
    };
  }, [token, onToken, onSources, onDone, onError]);

  // Send a question — server will start streaming tokens back
  const send = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
    } else {
      onError("Not connected. Please refresh the page.");
    }
  }, [onError]);

  // Connect as soon as we have a token
  useEffect(() => {
    if (token) connect();
    return () => wsRef.current?.close();
  }, [token, connect]);

  return { connected, streaming, send };
}

// ─────────────────────────────────────────────────────────────
//  Simple REST helper (for /signup and /login only)
// ─────────────────────────────────────────────────────────────
const API = "http://127.0.0.1:8000";

async function restPost(path, body) {
  const res  = await fetch(`${API}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed.");
  return data;
}

// ─────────────────────────────────────────────────────────────
//  3. AuthScreen
// ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]     = useState("login");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [err, setErr]       = useState("");
  const [busy, setBusy]     = useState(false);

  const switchMode = (m) => { setMode(m); setErr(""); };

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      let data;
      if (mode === "signup") {
        if (!name.trim()) { setErr("Name is required."); setBusy(false); return; }
        data = await restPost("/signup", { name, email, password: pw });
      } else {
        data = await restPost("/login", { email, password: pw });
      }
      onAuth(data.token, data.name);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-icon">🧠</div>
          <div>
            <h1>NeuroChat</h1>
            <span>Powered by Qwen2.5 · WebSocket</span>
          </div>
        </div>

        {/* Login / Signup tabs */}
        <div className="tabs">
          <button className={`tab ${mode === "login"  ? "on" : ""}`} onClick={() => switchMode("login")}>Log In</button>
          <button className={`tab ${mode === "signup" ? "on" : ""}`} onClick={() => switchMode("signup")}>Sign Up</button>
        </div>

        {err && <div className="err-box">{err}</div>}

        <form onSubmit={submit}>
          {mode === "signup" && (
            <div className="field">
              <label>Full Name</label>
              <input type="text" placeholder="Dr. Jane Smith" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} required />
          </div>
          <button className="submit-btn" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  4. Sidebar
// ─────────────────────────────────────────────────────────────
function Sidebar({ sessions, activeIdx, onSelect, onNew, onLogout, userName }) {
  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">🧠</div>
        <span className="sb-logo-text">NeuroChat</span>
      </div>

      {/* New Chat */}
      <button className="new-btn" onClick={onNew}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="6.5" y1="1" x2="6.5" y2="12"/><line x1="1" y1="6.5" x2="12" y2="6.5"/>
        </svg>
        New Chat
      </button>

      {/* History */}
      <div className="sb-label">History</div>
      <div className="hist-list">
        {sessions.length === 0
          ? <p className="hist-empty">No chats yet.</p>
          : sessions.map((s, i) => (
              <div
                key={i}
                className={`hist-item ${i === activeIdx ? "active" : ""}`}
                onClick={() => onSelect(i)}
                title={s.title}
              >
                {s.title}
              </div>
            ))
        }
      </div>

      {/* User + logout */}
      <div className="sb-foot">
        <div>
          <div className="sb-user-name">{userName}</div>
          <div className="sb-user-sub">Medical Student</div>
        </div>
        <button className="logout-btn" onClick={onLogout}>Exit</button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
//  5. ChatWindow
// ─────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What is synaptic transmission?",
  "Explain the action potential",
  "What does the hippocampus do?",
  "Describe the blood-brain barrier",
];

// BotBubble renders the answer split into text + Reference block
function BotBubble({ text, sources, isStreaming }) {
  // Split out the Reference section for special styling
  const refIdx = text.indexOf("---\nReference:");
  const main   = refIdx >= 0 ? text.slice(0, refIdx).trim() : text;
  const ref    = refIdx >= 0 ? text.slice(refIdx).trim()    : "";

  return (
    <div className="bubble bot">
      {/* Main answer text with blinking cursor while streaming */}
      <span>{main}{isStreaming && <span className="cursor" />}</span>

      {/* Reference block — styled in green monospace */}
      {ref && <div className="ref-block">{ref}</div>}

      {/* Source chips — shown after streaming completes */}
      {!isStreaming && sources?.length > 0 && (
        <div className="sources-row">
          {sources.map((s, i) => (
            <span key={i} className="src-chip">
              📄 {s.doc} · p.{s.page}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatWindow({ messages, streamingMsg, streaming, connected, onSend }) {
  const [input, setInput] = useState("");
  const bottomRef         = useRef(null);
  const textareaRef       = useRef(null);

  // Auto-scroll whenever messages update or streaming text grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMsg]);

  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); }
  };

  const doSend = () => {
    const q = input.trim();
    if (!q || streaming || !connected) return;
    onSend(q);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const isEmpty = messages.length === 0 && !streaming;

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <h2>Neuroscience Assistant</h2>
        <div className={`ws-badge ${connected ? "" : "off"}`}>
          <div className={`ws-dot ${connected ? "" : "off"}`} />
          {connected ? "WebSocket Live" : "Disconnected"}
        </div>
      </div>

      {/* Messages area */}
      <div className="msgs">
        {isEmpty && (
          <div className="welcome">
            <div className="welcome-icon">🧬</div>
            <h3>Ask about Neuroscience</h3>
            <p>
              Answers stream live from your PDF textbooks.
              Every response ends with a Reference section.
            </p>
            <div className="chips">
              {SUGGESTIONS.map(s => (
                <button key={s} className="chip" onClick={() => onSend(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* All saved messages */}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className={`avatar ${m.role}`}>{m.role === "bot" ? "🤖" : "U"}</div>
            {m.role === "user"
              ? <div className="bubble user">{m.text}</div>
              : <BotBubble text={m.text} sources={m.sources} isStreaming={false} />
            }
          </div>
        ))}

        {/* Live streaming bubble — shows while bot is typing */}
        {streaming && (
          <div className="msg bot">
            <div className="avatar bot">🤖</div>
            {streamingMsg
              ? <BotBubble text={streamingMsg} sources={[]} isStreaming={true} />
              : <div className="bubble bot"><div className="dots"><span/><span/><span/></div></div>
            }
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="input-wrap">
        <div className="input-row">
          <textarea
            ref={textareaRef}
            className="chat-in"
            rows={1}
            placeholder={connected ? "Ask a neuroscience question…" : "Connecting…"}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            disabled={streaming || !connected}
          />
          <button
            className="send-btn"
            onClick={doSend}
            disabled={!input.trim() || streaming || !connected}
            title="Send (Enter)"
          >↑</button>
        </div>
        <p className="input-hint">Enter to send · Shift+Enter for new line</p>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  6. App  — root component
// ─────────────────────────────────────────────────────────────
export default function App() {
  // Auth state — persisted in localStorage
  const [token,    setToken]    = useState(() => localStorage.getItem("nc_token") || "");
  const [userName, setUserName] = useState(() => localStorage.getItem("nc_name")  || "");

  // Session state
  // Each "session" = { title: str, messages: [{role, text, sources?}] }
  const [sessions,   setSessions]   = useState([]);
  const [activeIdx,  setActiveIdx]  = useState(null);   // which session is open

  // Streaming state
  const [streamingMsg, setStreamingMsg]    = useState("");   // text being streamed in
  const [pendingSources, setPendingSources] = useState([]);  // sources waiting for onDone

  // Inject CSS
  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = STYLES;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  // ── WebSocket callbacks ────────────────────────────────
  // These are memoized so they don't cause the hook to reconnect

  const handleToken = useCallback((tok) => {
    // Append each token to the streaming buffer
    setStreamingMsg(prev => prev + tok);
  }, []);

  const handleSources = useCallback((srcs) => {
    // Save sources — will be attached when onDone fires
    setPendingSources(srcs);
  }, []);

  const handleDone = useCallback(() => {
    // Streaming finished — save the complete message to the session
    setStreamingMsg(prev => {
      if (!prev) return prev;

      setSessions(sessions => {
        // Update the active session with the final bot message
        const updated = sessions.map((sess, i) => {
          if (i !== activeIdx) return sess;
          return {
            ...sess,
            messages: [
              ...sess.messages,
              { role: "bot", text: prev, sources: pendingSources },
            ],
          };
        });
        return updated;
      });

      setPendingSources([]);
      return "";   // clear the streaming buffer
    });
  }, [activeIdx, pendingSources]);

  const handleWsError = useCallback((msg) => {
    setStreamingMsg("");
    alert("Connection error: " + msg);
  }, []);

  // ── Connect WebSocket ──────────────────────────────────
  const { connected, streaming, send } = useWebSocket({
    token,
    onToken:   handleToken,
    onSources: handleSources,
    onDone:    handleDone,
    onError:   handleWsError,
  });

  // ── Auth handlers ──────────────────────────────────────
  const handleAuth = (tok, name) => {
    setToken(tok);
    setUserName(name);
    localStorage.setItem("nc_token", tok);
    localStorage.setItem("nc_name",  name);
  };

  const handleLogout = () => {
    setToken(""); setUserName("");
    setSessions([]); setActiveIdx(null); setStreamingMsg("");
    localStorage.removeItem("nc_token");
    localStorage.removeItem("nc_name");
  };

  // ── New chat ───────────────────────────────────────────
  const handleNewChat = () => {
    const newSession = { title: "New Chat", messages: [] };
    setSessions(prev => {
      const updated = [...prev, newSession];
      setActiveIdx(updated.length - 1);
      return updated;
    });
  };

  // ── Send a question ────────────────────────────────────
  const handleSend = (question) => {
    // If no session exists yet, create one
    let idx = activeIdx;
    if (idx === null) {
      const newSession = {
        title:    question.slice(0, 40) + (question.length > 40 ? "…" : ""),
        messages: [],
      };
      setSessions(prev => {
        const updated = [...prev, newSession];
        idx = updated.length - 1;
        setActiveIdx(idx);
        return updated;
      });
    } else {
      // Update session title from first question
      setSessions(prev => prev.map((s, i) => {
        if (i !== idx || s.messages.length > 0) return s;
        return { ...s, title: question.slice(0, 40) + (question.length > 40 ? "…" : "") };
      }));
    }

    // Add user message to the session
    setSessions(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      return { ...s, messages: [...s.messages, { role: "user", text: question }] };
    }));

    // Send to WebSocket — tokens will stream back
    send(question);
  };

  // ── Current session messages ───────────────────────────
  const currentMessages = activeIdx !== null
    ? (sessions[activeIdx]?.messages || [])
    : [];

  // ── Render ────────────────────────────────────────────
  if (!token) {
    return (
      <>
        <AuthScreen onAuth={handleAuth} />
        <footer className="disclaimer">⚕ Educational purpose only. Not for clinical use.</footer>
      </>
    );
  }

  return (
    <>
      <div className="shell">
        {/* Sidebar */}
        <Sidebar
          sessions={sessions}
          activeIdx={activeIdx}
          onSelect={setActiveIdx}
          onNew={handleNewChat}
          onLogout={handleLogout}
          userName={userName}
        />

        {/* Chat */}
        <main className="chat-main">
          <ChatWindow
            messages={currentMessages}
            streamingMsg={streamingMsg}
            streaming={streaming}
            connected={connected}
            onSend={handleSend}
          />
        </main>
      </div>

      {/* Persistent disclaimer — always visible, never hidden */}
      <footer className="disclaimer">
        ⚕ Educational purpose only. Not for clinical use.
      </footer>
    </>
  );
}