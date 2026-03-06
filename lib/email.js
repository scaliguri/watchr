// lib/email.js
// Sends weekly digest emails via Resend

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const CATEGORY_META = {
  news: { label: "NEWS", color: "#00d4aa", icon: "📡" },
  price: { label: "PRICE WATCH", color: "#f5a623", icon: "💰" },
  event: { label: "EVENT TRACKER", color: "#a78bfa", icon: "📍" },
};

function formatReport(text) {
  // Convert plain text report sections to styled HTML
  return text
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<br/>";
      if (line.match(/^[A-Z ]{4,}$/)) {
        return `<div style="font-size:10px;letter-spacing:0.12em;color:#888;margin-top:16px;margin-bottom:6px;font-weight:600;">${line}</div>`;
      }
      if (line.startsWith("•") || line.startsWith("-")) {
        return `<div style="padding:4px 0 4px 16px;color:#ccc;font-size:13px;line-height:1.6;">${line}</div>`;
      }
      return `<div style="color:#bbb;font-size:13px;line-height:1.7;margin-bottom:4px;">${line}</div>`;
    })
    .join("");
}

export function buildEmailHTML(trackers, recipientEmail) {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const trackerBlocks = trackers
    .filter((t) => t.lastReport)
    .map((tracker) => {
      const meta = CATEGORY_META[tracker.type] || CATEGORY_META.news;
      return `
        <div style="background:#0e1012;border:1px solid #1e1e1e;border-radius:8px;padding:20px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="font-size:18px;">${meta.icon}</span>
            <div>
              <div style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#fff;">${tracker.name}</div>
              <div style="font-size:10px;letter-spacing:0.1em;color:${meta.color};margin-top:2px;">${meta.label}</div>
            </div>
          </div>
          <div style="border-top:1px solid #1a1a1a;padding-top:12px;">
            ${formatReport(tracker.lastReport)}
          </div>
          ${tracker.lastChecked ? `<div style="margin-top:12px;font-size:10px;color:#333;font-family:'Courier New',monospace;">SCANNED ${new Date(tracker.lastChecked).toLocaleTimeString()}</div>` : ""}
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#060708;font-family:'Courier New',monospace;">
      <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

        <!-- Header -->
        <div style="border-bottom:1px solid #1a1a1a;padding-bottom:20px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <div style="width:8px;height:8px;border-radius:50%;background:#00d4aa;"></div>
            <span style="font-size:20px;font-weight:800;letter-spacing:0.08em;color:#fff;">WATCHR</span>
          </div>
          <div style="font-size:11px;color:#444;letter-spacing:0.08em;">WEEKLY INTELLIGENCE DIGEST — ${date.toUpperCase()}</div>
          <div style="margin-top:8px;font-size:12px;color:#555;">
            ${trackers.filter(t => t.lastReport).length} tracker${trackers.filter(t => t.lastReport).length !== 1 ? "s" : ""} reporting
          </div>
        </div>

        <!-- Tracker reports -->
        ${trackerBlocks || '<div style="color:#444;text-align:center;padding:40px 0;font-size:13px;">No reports available this week.</div>'}

        <!-- Footer -->
        <div style="border-top:1px solid #141414;padding-top:20px;margin-top:8px;">
          <div style="font-size:10px;color:#333;letter-spacing:0.08em;line-height:1.8;">
            WATCHR AUTOMATED DIGEST<br/>
            Sent to ${recipientEmail}<br/>
            Powered by Claude AI + Resend
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
}

export async function sendWeeklyDigest(trackers, recipientEmail) {
  const from = process.env.FROM_EMAIL || "Watchr <onboarding@resend.dev>";
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const html = buildEmailHTML(trackers, recipientEmail);

  const { data, error } = await resend.emails.send({
    from,
    to: [recipientEmail],
    subject: `📡 Watchr Weekly Digest — ${date}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  return data;
}

export async function sendSingleReport(tracker, recipientEmail) {
  const from = process.env.FROM_EMAIL || "Watchr <onboarding@resend.dev>";
  const meta = CATEGORY_META[tracker.type] || CATEGORY_META.news;
  const html = buildEmailHTML([tracker], recipientEmail);

  const { data, error } = await resend.emails.send({
    from,
    to: [recipientEmail],
    subject: `${meta.icon} ${tracker.name} — Watchr Update`,
    html,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  return data;
}
