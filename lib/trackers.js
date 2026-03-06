// lib/trackers.js
// Simple in-memory store for trackers with JSON file persistence
// On Vercel, use Vercel KV (Redis) for production persistence.
// For local dev and demos, this uses a JSON file in /tmp.

import fs from "fs";
import path from "path";

const DATA_FILE = path.join("/tmp", "watchr-trackers.json");

export function loadTrackers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (e) {
    console.error("Error loading trackers:", e);
  }
  return getDefaultTrackers();
}

export function saveTrackers(trackers) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(trackers, null, 2));
  } catch (e) {
    console.error("Error saving trackers:", e);
  }
}

function getDefaultTrackers() {
  return [
    {
      id: "demo-1",
      type: "event",
      name: "Erewhon West Hollywood",
      query: "Erewhon grocery store West Hollywood opening date news",
      email: "",
      lastReport: null,
      lastChecked: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-2",
      type: "price",
      name: "MacBook Pro M4",
      query: "MacBook Pro M4 14 inch current price deals discounts",
      email: "",
      lastReport: null,
      lastChecked: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-3",
      type: "news",
      name: "AI Regulation Updates",
      query: "Latest AI regulation policy news US EU 2025",
      email: "",
      lastReport: null,
      lastChecked: null,
      createdAt: new Date().toISOString(),
    },
  ];
}
