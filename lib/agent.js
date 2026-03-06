// lib/agent.js
// Core AI agent logic — runs a tracker query through Claude and returns a structured report

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS = {
  news: `You are an intelligent news monitoring agent. The user is tracking a topic for weekly updates.
Provide a concise, well-structured briefing with exactly these sections:

SUMMARY
2-3 sentences describing the current state and most important recent developments.

KEY POINTS
• Three specific, factual bullet points about the most important recent facts or trends.
• Each bullet should be a complete sentence with a concrete detail.
• Avoid vague generalities — be specific.

WHAT TO WATCH
One sentence on the most important thing to look out for next.

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,

  price: `You are a smart price tracking agent. The user is monitoring a product's price for weekly updates.
Provide a concise, well-structured briefing with exactly these sections:

CURRENT MARKET
2-3 sentences about the current pricing landscape for this product.

PRICE INSIGHTS
• Typical price range (low to high across major retailers)
• Best current deal or platform to check
• Price trend: going up, stable, or dropping?

RECOMMENDATION
One clear sentence: buy now, wait for a deal, or avoid and why.

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,

  event: `You are an event and business opening monitoring agent. The user wants to track whether a specific business, store, restaurant, or venue has opened or announced an opening date.
Provide a concise, well-structured briefing with exactly these sections:

CURRENT STATUS
2-3 sentences on the latest known status — is it open, announced, under construction, delayed?

LATEST UPDATES
• Most recent news or announcement about this location
• Any confirmed or rumored opening date or timeline
• Any relevant details (address, soft open vs grand open, reservations, etc.)

NEXT MILESTONE
One sentence on the next expected update or event to watch for.

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
};

export async function runTracker(tracker) {
  const systemPrompt = SYSTEM_PROMPTS[tracker.type] || SYSTEM_PROMPTS.news;

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 600,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Please research and report on the following: "${tracker.query}"`,
      },
    ],
  });

  const report = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return report;
}

export async function runAllTrackers(trackers) {
  const results = [];
  for (const tracker of trackers) {
    try {
      const report = await runTracker(tracker);
      results.push({ ...tracker, lastReport: report, lastChecked: new Date().toISOString(), status: "done" });
    } catch (err) {
      console.error(`Error running tracker ${tracker.id}:`, err);
      results.push({ ...tracker, status: "error", lastChecked: new Date().toISOString() });
    }
  }
  return results;
}
