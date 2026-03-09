// app/api/send-email/route.js
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

export async function POST(req) {
  const body = await req.json();
  const recipientEmail = body.email || process.env.REPORT_EMAIL;

  if (!recipientEmail) {
    return NextResponse.json({ error: "No email address provided" }, { status: 400 });
  }

  const raw = await loadTrackers();
  const trackers = safeArray(raw);
  const updatedTrackers = await runAllTrackers(trackers);
  await saveTrackers(updatedTrackers);
  await sendWeeklyDigest(updatedTrackers, recipientEmail);

  return NextResponse.json({ success: true, sentTo: recipientEmail });
}
