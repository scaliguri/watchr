// lib/trackers.js
// Persistent storage using Upstash Redis

import { Redis } from "@upstash/redis";

const TRACKERS_KEY = "watchr:trackers";

const DEFAULT_TRACKERS = [
  {
    id: "demo-1",
    type: "event",
    name: "Example: Nobu San Diego",
    query: "Nobu restaurant new location opening in San Diego — opening date, reservation info, announcements",
    email: "",
    lastReport: null,
    lastChecked: null,
    createdAt: new Date().toISOString(),
  },
];

let memoryStore = null;

function isRedisAvailable() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function ensureArray(data) {
  if (!data) return DEFAULT_TRACKERS;
  // Handle double-stringified JSON
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { return DEFAULT_TRACKERS; }
  }
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { return DEFAULT_TRACKERS; }
  }
  return Array.isArray(data) ? data : DEFAULT_TRACKERS;
}

export async function loadTrackers() {
  if (!isRedisAvailable()) {
    if (!memoryStore) memoryStore = DEFAULT_TRACKERS;
    return memoryStore;
  }
  try {
    const redis = Redis.fromEnv();
    const raw = await redis.get(TRACKERS_KEY);
    if (!raw) {
      await redis.set(TRACKERS_KEY, DEFAULT_TRACKERS);
      return DEFAULT_TRACKERS;
    }
    return ensureArray(raw);
  } catch (e) {
    console.error("Redis load error:", e);
    return DEFAULT_TRACKERS;
  }
}

export async function saveTrackers(trackers) {
  if (!isRedisAvailable()) {
    memoryStore = trackers;
    return;
  }
  try {
    const redis = Redis.fromEnv();
    // Always save as a native array — Upstash handles serialization
    await redis.set(TRACKERS_KEY, trackers);
  } catch (e) {
    console.error("Redis save error:", e);
  }
}
