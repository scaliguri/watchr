// app/api/track/route.js
import { NextResponse } from "next/server";
import { loadTrackers, saveTrackers } from "@/lib/trackers";
import { runTracker } from "@/lib/agent";
import { sendSingleReport } from "@/lib/email";
import { randomUUID } from "crypto";

// GET /api/track — list all trackers
export async function GET() {
  const trackers = loadTrackers();
  return NextResponse.json(trackers);
}

// POST /api/track — add a new tracker
export async function POST(req) {
  const body = await req.json();
  const { name, type, query, email } = body;

  if (!name || !type || !query) {
    return NextResponse.json({ error: "name, type, and query are required" }, { status: 400 });
  }

  const trackers = loadTrackers();
  const newTracker = {
    id: randomUUID(),
    name,
    type,
    query,
    email: email || "",
    lastReport: null,
    lastChecked: null,
    createdAt: new Date().toISOString(),
  };

  trackers.push(newTracker);
  saveTrackers(trackers);

  return NextResponse.json(newTracker, { status: 201 });
}

// PATCH /api/track — run a specific tracker and optionally email results
export async function PATCH(req) {
  const body = await req.json();
  const { id, sendEmail, emailOverride } = body;

  const trackers = loadTrackers();
  const idx = trackers.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: "Tracker not found" }, { status: 404 });

  const tracker = trackers[idx];
  const report = await runTracker(tracker);
  const updated = { ...tracker, lastReport: report, lastChecked: new Date().toISOString() };

  trackers[idx] = updated;
  saveTrackers(trackers);

  // Send email if requested
  if (sendEmail) {
    const to = emailOverride || tracker.email || process.env.REPORT_EMAIL;
    if (to) {
      await sendSingleReport(updated, to);
    }
  }

  return NextResponse.json(updated);
}

// DELETE /api/track — remove a tracker
export async function DELETE(req) {
  const { id } = await req.json();
  let trackers = loadTrackers();
  trackers = trackers.filter((t) => t.id !== id);
  saveTrackers(trackers);
  return NextResponse.json({ success: true });
}
