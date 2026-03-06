"use client";
import { useState, useEffect, useCallback } from "react";

const CATEGORIES = {
  news:  { label: "NEWS",          icon: "📡", color: "#00d4aa", desc: "Topics, trends, industries" },
  price: { label: "PRICE WATCH",   icon: "💰", color: "#f5a623", desc: "Products, markets, assets" },
  event: { label: "EVENT TRACKER", icon: "📍", color: "#a78bfa", desc: "Store openings, launches, milestones" },
};

function StatusBadge({ status }) {
  const s = {
    idle:    { label: "IDLE",     bg: "#ffffff08", color: "#555" },
    running: { label: "SCANNING", bg: "#00d4aa15", color: "#00d4aa", pulse: true },
    done:    { label: "READY",    bg: "#7b68ee15", color: "#7b68ee" },
    error:   { label: "ERROR",    bg: "#ff4d4d15", color: "#ff4d4d" },
  }[status] || { label: status, bg: "#111", color: "#555" };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 3,
      background: s.bg, color: s.color,
      fontSize: 9, letterSpacing: "0.1em", fontWeight: 600,
      animation: s.pulse ? "pulse 1.5s ease-in-out infinite" : "none",
    }}>
      {s.pulse && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00d4aa", display: "inline-block" }} />}
      {s.label}
    </span>
  );
}

function ReportPanel({ tracker }) {
  const lines = (tracker.lastReport || "").split("\n");
  return (
    <div style={{ borderTop: "1px solid #161616", padding: "16px 20px", background: "#080a0c", animation: "fadeIn 0.3s ease" }}>
      <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.1em", marginBottom: 12 }}>
        AGENT REPORT — {tracker.lastChecked ? new Date(tracker.lastChecked).toLocaleString() : "—"}
      </div>
      <div style={{ lineHeight: 1.75, fontSize: 12 }}>
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
          const isHeader = /^[A-Z][A-Z\s]{3,}$/.test(line.trim());
          const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
          return (
            <div key={i} style={{
              color: isHeader ? "#666" : isBullet ? "#b0b0b0" : "#888",
              fontSize: isHeader ? 10 : 13,
              letterSpacing: isHeader ? "0.12em" : "normal",
              fontWeight: isHeader ? 600 : 400,
              marginTop: isHeader ? 12 : 0,
              paddingLeft: isBullet ? 12 : 0,
            }}>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [trackers, setTrackers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [globalEmail, setGlobalEmail] = useState("");
  const [digestSending, setDigestSending] = useState(false);
  const [toast, setToast]           = useState(null);
  const [newItem, setNewItem]       = useState({ type: "event", name: "", query: "", email: "" });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTrackers = useCallback(async () => {
    const res = await fetch("/api/track");
    const data = await res.json();
    setTrackers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrackers(); }, [fetchTrackers]);

  const addTracker = async () => {
    if (!newItem.name || !newItem.query) return;
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    const created = await res.json();
    setTrackers(prev => [...prev, created]);
    setNewItem({ type: "event", name: "", query: "", email: "" });
    setShowAdd(false);
    showToast("Tracker added");
  };

  const deleteTracker = async (id) => {
    await fetch("/api/track", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTrackers(prev => prev.filter(t => t.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const runTracker = async (id, sendEmail = false) => {
    setTrackers(prev => prev.map(t => t.id === id ? { ...t, status: "running" } : t));
    const tracker = trackers.find(t => t.id === id);
    const emailTo = tracker?.email || globalEmail;
    try {
      const res = await fetch("/api/track", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, sendEmail, emailOverride: emailTo || undefined }),
      });
      const updated = await res.json();
      setTrackers(prev => prev.map(t => t.id === id ? { ...updated, status: "done" } : t));
      setExpanded(id);
      if (sendEmail) showToast(`Report emailed to ${emailTo}`);
    } catch {
      setTrackers(prev => prev.map(t => t.id === id ? { ...t, status: "error" } : t));
    }
  };

  const sendDigest = async () => {
    const to = globalEmail || prompt("Enter email to send digest to:");
    if (!to) return;
    setDigestSending(true);
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: to }),
      });
      showToast(`Weekly digest sent to ${to}`);
    } catch {
      showToast("Failed to send digest", false);
    }
    setDigestSending(false);
  };

  const ready = trackers.filter(t => t.lastReport).length;
  const running = trackers.filter(t => t.status === "running").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c0f" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .card { transition: border-color 0.2s, box-shadow 0.2s; }
        .card:hover { border-color: #222 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
        .btn { cursor: pointer; border: none; transition: opacity 0.15s, transform 0.1s; font-family: 'DM Mono', monospace; }
        .btn:hover { opacity: 0.8; }
        .btn:active { transform: scale(0.97); }
        .btn:disabled { opacity: 0.3; cursor: default; }
        .overlay { position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;z-index:100; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 200,
          background: toast.ok ? "#00d4aa18" : "#ff4d4d18",
          border: `1px solid ${toast.ok ? "#00d4aa40" : "#ff4d4d40"}`,
          color: toast.ok ? "#00d4aa" : "#ff4d4d",
          padding: "10px 18px", borderRadius: 6, fontSize: 12,
          letterSpacing: "0.06em", animation: "fadeIn 0.2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid #121212", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0a0c0f", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: running > 0 ? "#00d4aa" : "#2a2a2a", boxShadow: running > 0 ? "0 0 10px #00d4aa" : "none", transition: "all 0.4s" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "0.06em", color: "#fff" }}>WATCHR</span>
          <span style={{ color: "#2a2a2a", fontSize: 11, letterSpacing: "0.08em" }}>/ AI MONITOR</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="default email for all reports"
            value={globalEmail}
            onChange={e => setGlobalEmail(e.target.value)}
            style={{ padding: "7px 12px", width: 230, fontSize: 12 }}
          />
          <button className="btn" onClick={sendDigest} disabled={digestSending}
            style={{ padding: "7px 14px", background: "#00d4aa18", color: "#00d4aa", fontSize: 11, borderRadius: 4, border: "1px solid #00d4aa30", letterSpacing: "0.06em" }}>
            {digestSending ? "SENDING…" : "✉ SEND DIGEST"}
          </button>
          <button className="btn" onClick={() => setShowAdd(true)}
            style={{ padding: "7px 14px", background: "#141414", color: "#e8e8e8", fontSize: 11, borderRadius: 4, border: "1px solid #202020" }}>
            + ADD
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: 28, marginBottom: 28, paddingBottom: 22, borderBottom: "1px solid #111" }}>
          {[
            { label: "TRACKED",   value: trackers.length, color: "#fff" },
            { label: "NEWS",      value: trackers.filter(t=>t.type==="news").length,  color: "#00d4aa" },
            { label: "PRICES",    value: trackers.filter(t=>t.type==="price").length, color: "#f5a623" },
            { label: "EVENTS",    value: trackers.filter(t=>t.type==="event").length, color: "#a78bfa" },
            { label: "READY",     value: ready,   color: "#7b68ee" },
            { label: "SCANNING",  value: running, color: running > 0 ? "#00d4aa" : "#2a2a2a" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "#3a3a3a", letterSpacing: "0.12em", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 10, color: "#2a2a2a", textAlign: "right", lineHeight: 1.8 }}>
              WEEKLY AUTO-DIGEST<br/>
              <span style={{ color: "#3a3a3a" }}>MON 8:00 AM UTC</span>
            </div>
          </div>
        </div>

        {/* Tracker list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#333", fontSize: 12, letterSpacing: "0.08em" }}>LOADING TRACKERS…</div>
        ) : trackers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#333", fontSize: 13 }}>
            No trackers yet. Click <strong style={{color:"#555"}}>+ ADD</strong> to get started.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trackers.map(tracker => {
              const cat = CATEGORIES[tracker.type] || CATEGORIES.news;
              const isExpanded = expanded === tracker.id;
              return (
                <div key={tracker.id} className="card" style={{ background: "#0d0f11", border: "1px solid #141414", borderRadius: 8, overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                  <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Icon */}
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: `${cat.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                      {cat.icon}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>{tracker.name}</span>
                        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: `${cat.color}15`, color: cat.color, letterSpacing: "0.1em", border: `1px solid ${cat.color}25` }}>{cat.label}</span>
                        <StatusBadge status={tracker.status || "idle"} />
                      </div>
                      <div style={{ fontSize: 11, color: "#3a3a3a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tracker.query}</div>
                    </div>

                    {/* Last checked */}
                    {tracker.lastChecked && (
                      <div style={{ fontSize: 9, color: "#2a2a2a", textAlign: "right", flexShrink: 0, lineHeight: 1.7 }}>
                        LAST RUN<br/><span style={{ color: "#3a3a3a" }}>{new Date(tracker.lastChecked).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button className="btn" onClick={() => runTracker(tracker.id)} disabled={tracker.status === "running"}
                        style={{ padding: "6px 12px", background: "#141414", color: tracker.status === "running" ? "#333" : "#ccc", fontSize: 10, borderRadius: 4, border: "1px solid #1e1e1e", letterSpacing: "0.06em" }}>
                        {tracker.status === "running" ? "···" : "▶ RUN"}
                      </button>
                      {tracker.lastReport && (
                        <>
                          <button className="btn" onClick={() => setExpanded(isExpanded ? null : tracker.id)}
                            style={{ padding: "6px 10px", background: "#141414", color: "#7b68ee", fontSize: 10, borderRadius: 4, border: "1px solid #7b68ee25" }}>
                            {isExpanded ? "▲" : "▼"}
                          </button>
                          <button className="btn" onClick={() => runTracker(tracker.id, true)}
                            style={{ padding: "6px 12px", background: "#00d4aa15", color: "#00d4aa", fontSize: 10, borderRadius: 4, border: "1px solid #00d4aa25", letterSpacing: "0.05em" }}>
                            ✉ SEND
                          </button>
                        </>
                      )}
                      <button className="btn" onClick={() => deleteTracker(tracker.id)}
                        style={{ padding: "6px 9px", background: "transparent", color: "#2a2a2a", fontSize: 13, borderRadius: 4, border: "1px solid transparent" }}>
                        ✕
                      </button>
                    </div>
                  </div>

                  {isExpanded && tracker.lastReport && <ReportPanel tracker={tracker} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add tracker modal */}
      {showAdd && (
        <div className="overlay" onClick={e => e.target.classList.contains("overlay") && setShowAdd(false)}>
          <div style={{ background: "#0d0f11", border: "1px solid #222", borderRadius: 10, padding: 28, width: 460, animation: "fadeIn 0.25s ease" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 20, color: "#fff", letterSpacing: "0.04em" }}>NEW TRACKER</div>

            {/* Type picker */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.12em", marginBottom: 8 }}>CATEGORY</div>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button key={key} className="btn" onClick={() => setNewItem(p => ({ ...p, type: key }))}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: 6, fontSize: 11,
                      border: `1px solid ${newItem.type === key ? cat.color + "60" : "#1e1e1e"}`,
                      background: newItem.type === key ? `${cat.color}12` : "#111",
                      color: newItem.type === key ? cat.color : "#555",
                      letterSpacing: "0.06em",
                    }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{cat.icon}</div>
                    <div style={{ fontSize: 9 }}>{cat.label}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#333", marginTop: 6, paddingLeft: 2 }}>{CATEGORIES[newItem.type]?.desc}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.12em", marginBottom: 6 }}>NAME</div>
                <input placeholder={newItem.type === "event" ? "e.g. Erewhon West Hollywood" : newItem.type === "price" ? "e.g. iPhone 16 Pro" : "e.g. AI Regulation News"}
                  value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  style={{ padding: "8px 12px", width: "100%" }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.12em", marginBottom: 6 }}>WHAT TO TRACK</div>
                <textarea
                  placeholder={
                    newItem.type === "event"
                      ? "e.g. New Erewhon grocery store opening in West Hollywood — opening date, location, any announcements"
                      : newItem.type === "price"
                      ? "e.g. Sony WH-1000XM5 headphones current retail price and best deals"
                      : "e.g. Latest EU and US AI regulation policy changes and compliance requirements"
                  }
                  value={newItem.query}
                  onChange={e => setNewItem(p => ({ ...p, query: e.target.value }))}
                  rows={3} style={{ padding: "8px 12px", width: "100%", resize: "vertical", lineHeight: 1.6 }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.12em", marginBottom: 6 }}>EMAIL (OPTIONAL — OVERRIDES DEFAULT)</div>
                <input placeholder="specific email for this tracker" value={newItem.email}
                  onChange={e => setNewItem(p => ({ ...p, email: e.target.value }))}
                  style={{ padding: "8px 12px", width: "100%" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn" onClick={addTracker} disabled={!newItem.name || !newItem.query}
                style={{ flex: 1, padding: "10px", background: newItem.name && newItem.query ? "#00d4aa" : "#111", color: newItem.name && newItem.query ? "#000" : "#333", fontSize: 12, borderRadius: 5, fontWeight: 500, letterSpacing: "0.05em" }}>
                ADD TRACKER
              </button>
              <button className="btn" onClick={() => setShowAdd(false)}
                style={{ padding: "10px 16px", background: "#111", color: "#555", fontSize: 12, borderRadius: 5, border: "1px solid #1e1e1e" }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
