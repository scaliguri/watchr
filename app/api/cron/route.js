// app/api/cron/route.js
// Called weekly by Vercel Cron — runs all trackers and sends digest email

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

  const raw = await loadTrackers();
  const trackers = safeArray(raw);

  if (trackers.length === 0) {
    return NextResponse.json({ message: "No trackers configured" });
  }

  const updatedTrackers = await runAllTrackers(trackers);
  await saveTrackers(updatedTrackers);
  await sendWeeklyDigest(updatedTrackers, recipientEmail);

  return NextResponse.json({
    success: true,
    trackersRun: updatedTrackers.length,
    sentTo: recipientEmail,
    timestamp: new Date().toISOString(),
  });
}
