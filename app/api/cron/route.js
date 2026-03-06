// app/api/cron/route.js
// This endpoint is called weekly by Vercel Cron (every Monday at 8am UTC)
// It runs all trackers and sends a digest email

import { NextResponse } from "next/server";
import { loadTrackers, saveTrackers } from "@/lib/trackers";
import { runAllTrackers } from "@/lib/agent";
import { sendWeeklyDigest } from "@/lib/email";

export async function GET(req) {
  // Verify the request is from Vercel Cron or an authorized caller
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipientEmail = process.env.REPORT_EMAIL;
  if (!recipientEmail) {
    return NextResponse.json({ error: "REPORT_EMAIL not set" }, { status: 500 });
  }

  const trackers = loadTrackers();
  if (trackers.length === 0) {
    return NextResponse.json({ message: "No trackers configured" });
  }

  // Run all trackers through the AI agent
  const updatedTrackers = await runAllTrackers(trackers);
  saveTrackers(updatedTrackers);

  // Send the weekly digest
  await sendWeeklyDigest(updatedTrackers, recipientEmail);

  return NextResponse.json({
    success: true,
    trackersRun: updatedTrackers.length,
    sentTo: recipientEmail,
    timestamp: new Date().toISOString(),
  });
}
