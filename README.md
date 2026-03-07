# WATCHR — AI Tracking Agent

Monitor news topics, product prices, and custom events (store openings, restaurant launches, etc.) with AI-powered weekly email digests.

---

## What it does

- Track **news/topics**, **product prices**, and **custom events** (store openings, etc.)
- AI agent (Claude) researches and writes a structured report for each tracker
- Run trackers manually from the dashboard, or let Vercel run them automatically every Monday
- Emails you a beautiful weekly digest via **Resend**

---

## Setup (15 minutes)

### 1. Get your API keys

**Anthropic (Claude AI)**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Click **API Keys** → **Create Key**
3. Copy the key

**Resend (email)**
1. Go to [resend.com](https://resend.com) and create a free account
2. Go to **API Keys** → **Create API Key**
3. Copy the key
4. For the FROM address: you can use `onboarding@resend.dev` for testing.
   For production, go to **Domains** in Resend and add your own domain.

---

### 2. Run locally

```bash
# Clone or copy this project folder
cd watchr

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and fill in your keys

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### 3. Deploy to Vercel (for automatic weekly emails)

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Deploy
vercel

# Add your environment variables in the Vercel dashboard:
# Project → Settings → Environment Variables
# Add: ANTHROPIC_API_KEY, RESEND_API_KEY, REPORT_EMAIL, FROM_EMAIL, CRON_SECRET
```

Or deploy via the Vercel website:
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Add environment variables in project settings
4. Deploy

**The `vercel.json` file automatically sets up a cron job** that runs every Monday at 8am UTC, scanning all your trackers and emailing the digest to `REPORT_EMAIL`.

---

### 4. Trigger the weekly digest manually

From the dashboard: enter your email in the top bar and click **✉ SEND DIGEST**

Or via API:
```bash
curl -X POST https://your-app.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com"}'
```

---

## Environment Variables

| Variable         | Description |
|-----------------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `RESEND_API_KEY`    | Your Resend API key |
| `REPORT_EMAIL`      | Email address to receive weekly digests |
| `FROM_EMAIL`        | Sender email (e.g. `Watchr <you@yourdomain.com>`) |
| `CRON_SECRET`       | Random secret string to protect the cron endpoint |

---

## Tracker types

| Type | Icon | Good for |
|------|------|----------|
| **News** | 📡 | Topics, industries, trends, competitors |
| **Price Watch** | 💰 | Products, markets, currencies |
| **Event Tracker** | 📍 | Store openings, restaurant launches, construction projects, product launches |

**Tips for Event Tracker queries:**
- Be specific: `"New Erewhon grocery store opening in West Hollywood — opening date, announcements, location"`
- Include the city/neighborhood
- Mention what you want to know (date, reservation info, soft open vs grand open)

---

## Persistence note

Trackers are saved to `/tmp/watchr-trackers.json` by default. This works for local dev and basic Vercel deployments, but `/tmp` resets on cold starts.

**For production**, swap the storage to [Vercel KV](https://vercel.com/docs/storage/vercel-kv):
1. Add a KV store to your Vercel project
2. Replace the `loadTrackers`/`saveTrackers` functions in `lib/trackers.js` with KV calls

---

## Cron schedule

The default schedule in `vercel.json` is:
```
"0 8 * * 1"  →  Every Monday at 8:00 AM UTC
```

Change it to suit your needs:
- Daily at 9am UTC: `"0 9 * * *"`
- Every Sunday at 7am UTC: `"0 7 * * 0"`
