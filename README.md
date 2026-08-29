# Life Guardian AI

Adaptive AI life companion for the hackathon challenge **Reimagining Customer Engagement Through AI-Powered Digital Assistants**.

Life Guardian understands a customer's changing life situation, remembers what was already asked, and returns **one small useful action** that gives them a reason to come back tomorrow.

It is not a generic chatbot, insurance sales bot, or one-time risk calculator.

## Why AI is required

Traditional engagement uses generic notifications and static segments. Customers stop opening the app when it only has value at transaction time.

Life Guardian uses AI to:

- read unstructured English or Myanmar life stories
- extract only stated facts
- reason about relationships between those facts
- write a personalized 1–3 minute next action
- remember completed answers through passed `LifeContext`

A deterministic rule engine then scores Life Pulse categories. The number is a **prioritization signal**, not a claim that someone is “80% unsafe”.

## Customer loop

1. Customer shares a life story (`POST /api/analyze`)
2. Backend extracts context + Life Pulse + one daily action
3. Customer answers (`POST /api/complete-action`)
4. Backend updates memory and asks a **different** next question
5. n8n can schedule a follow-up so the customer has a reason to return

Potential KPIs (not claimed results): DAU/MAU, weekly active days, action completion rate, 7-day / 30-day retention.

## API

See [docs/API.md](docs/API.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Method | Route | Role |
|---|---|---|
| GET | `/api/health` | Health + config flags |
| POST | `/api/analyze` | Extract context + first action |
| POST | `/api/complete-action` | Remember answer + next action |
| POST | `/api/life-update` | Merge a new life update |
| POST | `/api/life-guardian` | Proxy to the LIFE GUARDIAN AI v2 n8n pipeline |
| POST | `/api/follow-up` | n8n follow-up webhook |

Frontend keeps `LifeContext` in client state and sends it back. No auth or database in this MVP.

## Using the app

`components/life-guardian/session-provider.tsx` holds the whole session — language, `LifeContext`, the current action and the thread — and every control reads from it.

Describe your situation in the prompt box, or pick a suggestion chip to seed one. Answer the daily action with the buttons or field it renders, and the next question arrives already knowing what you said. **Life Pulse** shows the risk map with the reasoning behind each score, **Actions** lists what you have answered, and **EN / MY** in the top bar switches language without recomputing the context. Each completed answer also posts to `/api/follow-up`; if n8n is down the sidebar says so and the answer is still kept.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

```bash
npm test
npm run build
```

## Environment variables

Create `.env.local` (never commit real values):

| Variable | Required for | Notes |
|---|---|---|
| `GEMINI_API_KEY` | Live analysis | Google AI Studio key. The client then targets Gemini's OpenAI-compatible endpoint automatically. |
| `GEMINI_MODEL` | Optional | Default `gemini-3.5-flash-lite` |
| `GEMINI_TEMPERATURE` | Optional | Default `0.2`. Keep it low — extraction must not invent facts. |
| `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` | Optional | Override to use another OpenAI-compatible provider or Netlify AI Gateway |
| `N8N_LIFE_GUARDIAN_WEBHOOK_URL` | v2 pipeline | Workflow stays optional |
| `N8N_WEBHOOK_URL` | Follow-up | Workflow stays optional |
| `MONGODB_URI` | Chat archive | Atlas `mongodb+srv://` string. When set, turns are written directly and the n8n chat-log webhook is skipped. |
| `MONGODB_DB` | Optional | Default `lifeguardian` |
| `N8N_CHAT_LOG_WEBHOOK_URL` | Chat archive | Fallback route used only when `MONGODB_URI` is unset |
| `DEMO_BACKUP_MODE` | Demo safety | `true` enables a labeled deterministic backup. Responses include `"source": "demo_backup"`. |

**Provide at minimum:** `GEMINI_API_KEY`.

For n8n: `N8N_LIFE_GUARDIAN_WEBHOOK_URL` and `N8N_WEBHOOK_URL`, both pointing at published workflows.

## Chat archive

Every turn is stored in the `chat_messages` collection with the risk snapshot and any score movement, which is what turns the KPIs below into real queries:

```js
db.chat_messages.aggregate([
  { $group: {
      _id: "$sessionId",
      turns: { $sum: 1 },
      actionsAnswered: { $sum: { $cond: [{ $eq: ["$kind", "answer"] }, 1, 0] } },
      lastSeen: { $max: "$createdAt" }
  } }
])
```

Indexes: `session_timeline` (`sessionId`, `createdAt`) to replay one conversation, `recent_first` (`createdAt` descending) for activity windows.

Archiving never affects the customer. The browser fires the call without awaiting it and every failure returns `stored: false`. Replay a full session against a running server with:

```bash
node scripts/verify-chat-log.mjs
```

## Netlify

```toml
[build]
  command = "npm run build"
  publish = ".next"
```

Set the same environment variables in the Netlify UI. Do not prefix secrets with `NEXT_PUBLIC_`.

## Tool disclosure

| Tool | Honest role |
|---|---|
| Cursor | Primary AI-assisted engineering environment for backend, prompts, tests, and docs |
| n8n | Follow-up / engagement orchestration after an action is completed |
| Wispr Flow | Voice-driven development (prompting, iteration, docs) and voice input during the demo, via OS-level dictation — **not** an API integration |
| Mobbin | UX inspiration for information hierarchy and daily engagement patterns (frontend teammate) |
| MongoDB Atlas | Stores every chat turn with its risk snapshot, making the engagement KPIs below measurable |
| Netlify | Public web deployment |
| Google Gemini (`gemini-3.5-flash-lite`) | Natural-language extraction and personalized wording |

### Voice

There is no speech code in this repository, and no audio ever reaches our servers.

Wispr Flow's [API is not public](https://docs.wisprflow.ai/articles/2194989923-looking-to-connect-to-wispr-through-api) — it is gated behind enterprise approval, and a Pro subscription does not include developer access. Rather than claim an integration we do not have, we use Wispr Flow the way it is actually built to work: as an OS-level dictation tool that types into whichever field has focus.

To speak instead of type, click the mic button in the composer (it moves the caret into the input) and hold your Wispr Flow hotkey. The transcript lands in the box like any other keystrokes; press Enter to send.

Spoken replies are deliberately out of scope. Browser speech synthesis has no Burmese voice, so an English-only voice loop would have quietly made the product worse in one of its two supported languages.

## Safety

No medical diagnosis, binding financial advice, invented figures, or product pushing. Copy uses “Based on what you shared…” and “one useful next step”.
