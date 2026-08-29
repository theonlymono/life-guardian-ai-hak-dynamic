# Life Guardian AI — Architecture

## Product loop

Understand → Prioritize → Act → Remember → Adapt → Follow up → Return

The backend exists to answer: **why would this customer open the app again tomorrow?**

## Hybrid AI design

```
User input
  → LLM fact extraction (Zod-validated)
  → Deterministic risk engine (no LLM scores)
  → LLM / fallback daily action
  → API response with updated LifeContext
```

The LLM never invents numerical Life Pulse scores. Scores come from explicit rules in `lib/risk/rules.ts`.

## State model

There is no customer database in the MVP. Frontend sends `LifeContext` with each request. Backend returns an updated context. n8n may optionally log follow-up records.

## Languages

`en` and `my`. Category keys, `level`, and `actionType` stay English. Assistant copy, questions, reasons, and risk explanations are localized.

## Failure modes

| Dependency | If it fails |
|---|---|
| AI provider | `AI_NOT_CONFIGURED` / `AI_ANALYSIS_FAILED`, or labeled `DEMO_BACKUP_MODE` |
| ElevenLabs | Text remains; `/api/speak` returns `fallback: "text"` |
| n8n | `/api/complete-action` still succeeds; `/api/follow-up` reports `unavailable` |
| Localization | Explicit `language` wins; otherwise detect Myanmar script; else English |

## DEMO_BACKUP_MODE

If `DEMO_BACKUP_MODE=true`, a clearly labeled deterministic sample path may run when AI is missing or invalid. Responses include `"source": "demo_backup"`. This is never claimed as live AI.

## Netlify

Next.js App Router route handlers deploy as Netlify Functions via the Next runtime. Secrets stay in environment variables. Use `AI_API_KEY` locally, or Netlify AI Gateway after a production deploy.

## Tool roles

- **Cursor** — backend engineering, prompts, tests, docs
- **n8n** — follow-up orchestration, not the reasoning brain
- **ElevenLabs** — TTS only
- **Wispr Flow** — development productivity (voice prompting / iteration), not a production backend
- **Mobbin** — UX inspiration used by the frontend teammate
- **Netlify** — public web deployment
