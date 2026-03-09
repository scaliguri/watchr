// app/api/cron/route.js
import { NextResponse } from "next/server";
import { loadTrackers, saveTrackers } from "@/lib/trackers";
import { runAllTrackers } from "@/lib/agent";
import { sendWeeklyDigest } from "@/lib/email";

function safeArray(data) {
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipientEmail = process.env.REPORT_EMAIL;
  if (!recipientEmail) {
    return NextResponse.json({ error: "REPORT_EMAIL not set" }, { status: 500 });
  }

  const all = safeArray(await loadTrackers());
  // Skip paused trackers
  const active = all.filter(t => !t.paused);

  if (active.length === 0) {
    return NextResponse.json({ message: "No active trackers" });
  }

  const updated = await runAllTrackers(active);

  // Merge updated results back with paused trackers unchanged
  const merged = all.map(t => {
    const u = updated.find(u => u.id === t.id);
    return u || t;
  });

  await saveTrackers(merged);
  await sendWeeklyDigest(updated, recipientEmail);

  return NextResponse.json({
    success: true,
    trackersRun: updated.length,
    trackersPaused: all.length - active.length,
    sentTo: recipientEmail,
    timestamp: new Date().toISOString(),
  });
}
