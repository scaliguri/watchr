// lib/agent.js
// Core AI agent logic — runs a tracker query through Claude with web search enabled

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS = {
  news: `You are an intelligent news monitoring agent with web search capability. 
Search the web for the latest information on the topic and provide a concise briefing with exactly these sections:

SUMMARY
2-3 sentences describing the current state and most important recent developments.

KEY POINTS
• Three specific, factual bullet points about the most important recent facts or trends.
• Each bullet should be a complete sentence with a concrete detail.
• Avoid vague generalities — be specific with names, dates, and facts.

WHAT TO WATCH
One sentence on the most important thing to look out for next.

Always search for current information before responding. Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,

  price: `You are a smart price tracking agent with web search capability.
Search the web for current pricing information and provide a concise briefing with exactly these sections:

CURRENT MARKET
2-3 sentences about the current pricing landscape for this product.

PRICE INSIGHTS
• Typical price range (low to high across major retailers)
• Best current deal or platform to check
• Price trend: going up, stable, or dropping?

RECOMMENDATION
One clear sentence: buy now, wait for a deal, or avoid and why.

Always search for current prices before responding. Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,

  event: `You are an event and business opening monitoring agent with web search capability.
Search the web for the latest information and provide a concise briefing with exactly these sections:

CURRENT STATUS
2-3 sentences on the latest known status — is it open, announced, under construction, delayed?

LATEST UPDATES
• Most recent news or announcement about this location
• Any confirmed or rumored opening date or timeline
• Any relevant details (address, soft open vs grand open, reservations, etc.)

NEXT MILESTONE
One sentence on the next expected update or event to watch for.

Always search for current information before responding. Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
};

export async function runTracker(tracker) {
  const systemPrompt = SYSTEM_PROMPTS[tracker.type] || SYSTEM_PROMPTS.news;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: systemPrompt,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
      }
    ],
    messages: [
      {
        role: "user",
        content: `Search for current information and report on: "${tracker.query}"`,
      },
    ],
  });

  // Extract all text blocks from the response (including after tool use)
  const report = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return report || "No report generated.";
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
