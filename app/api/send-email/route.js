// app/api/send-email/route.js
// Manually trigger a full digest email

import { NextResponse } from "next/server";
import { loadTrackers, saveTrackers } from "@/lib/trackers";
import { runAllTrackers } from "@/lib/agent";
import { sendWeeklyDigest } from "@/lib/email";

export async function POST(req) {
  const body = await req.json();
  const recipientEmail = body.email || process.env.REPORT_EMAIL;

  if (!recipientEmail) {
    return NextResponse.json({ error: "No email address provided" }, { status: 400 });
  }

  const trackers = loadTrackers();
  const updatedTrackers = await runAllTrackers(trackers);
  saveTrackers(updatedTrackers);

  await sendWeeklyDigest(updatedTrackers, recipientEmail);

  return NextResponse.json({ success: true, sentTo: recipientEmail });
}
