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
5. n8n can schedule a follow-up; ElevenLabs can speak the assistant message

Potential KPIs (not claimed results): DAU/MAU, weekly active days, action completion rate, 7-day / 30-day retention.

## API

See [docs/API.md](docs/API.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Method | Route | Role |
|---|---|---|
| GET | `/api/health` | Health + config flags |
| POST | `/api/analyze` | Extract context + first action |
| POST | `/api/complete-action` | Remember answer + next action |
| POST | `/api/life-update` | Merge a new life update |
| POST | `/api/speak` | ElevenLabs TTS |
| POST | `/api/follow-up` | n8n webhook |

Frontend keeps `LifeContext` in client state and sends it back. No auth or database in this MVP.

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
| `AI_API_KEY` | Live analysis | OpenAI-compatible key. On Netlify, AI Gateway can inject `OPENAI_API_KEY` instead. |
| `AI_MODEL` | Optional | Default `gpt-4o-mini` |
| `AI_BASE_URL` | Optional | Override for a gateway |
| `ELEVENLABS_API_KEY` | Voice | Server-side only |
| `ELEVENLABS_VOICE_ID_EN` | English TTS | |
| `ELEVENLABS_VOICE_ID_MY` | Myanmar TTS | Optional; falls back to English voice or text |
| `N8N_WEBHOOK_URL` | Follow-up | Workflow stays optional |
| `DEMO_BACKUP_MODE` | Demo safety | `true` enables a labeled deterministic backup. Responses include `"source": "demo_backup"`. |

**Provide at minimum:** `AI_API_KEY` (or deploy on Netlify with AI Gateway enabled after the first production deploy).

For voice: `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID_EN`.

For follow-up: `N8N_WEBHOOK_URL`.

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
| ElevenLabs | Text-to-speech for assistant responses |
| Wispr Flow | Voice-driven development, prompting, iteration, and documentation — not a production backend |
| Mobbin | UX inspiration for information hierarchy and daily engagement patterns (frontend teammate) |
| Netlify | Public web deployment |
| OpenAI-compatible model | Natural-language extraction and personalized wording |

## Safety

No medical diagnosis, binding financial advice, invented figures, or product pushing. Copy uses “Based on what you shared…” and “one useful next step”.
