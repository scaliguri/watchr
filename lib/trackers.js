// lib/trackers.js
// Persistent storage using Upstash Redis
// Falls back to in-memory for local dev if Redis is not configured

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

// In-memory fallback for local dev without Redis
let memoryStore = null;

function isRedisAvailable() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis() {
  return Redis.fromEnv();
}

export async function loadTrackers() {
  if (!isRedisAvailable()) {
    if (!memoryStore) memoryStore = DEFAULT_TRACKERS;
    return memoryStore;
  }
  try {
    const redis = getRedis();
    const trackers = await redis.get(TRACKERS_KEY);
    if (!trackers) {
      await redis.set(TRACKERS_KEY, JSON.stringify(DEFAULT_TRACKERS));
      return DEFAULT_TRACKERS;
    }
    return typeof trackers === "string" ? JSON.parse(trackers) : trackers;
  } catch (e) {
    console.error("Redis load error:", e);
    return [];
  }
}

export async function saveTrackers(trackers) {
  if (!isRedisAvailable()) {
    memoryStore = trackers;
    return;
  }
  try {
    const redis = getRedis();
    await redis.set(TRACKERS_KEY, JSON.stringify(trackers));
  } catch (e) {
    console.error("Redis save error:", e);
  }
}
