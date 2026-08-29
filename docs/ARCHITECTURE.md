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
| n8n | `/api/complete-action` still succeeds; `/api/follow-up` reports `unavailable` |
| Localization | Explicit `language` wins; otherwise detect Myanmar script; else English |

## DEMO_BACKUP_MODE

If `DEMO_BACKUP_MODE=true`, a clearly labeled deterministic sample path may run when AI is missing or invalid. Responses include `"source": "demo_backup"`. This is never claimed as live AI.

## Netlify

Next.js App Router route handlers deploy as Netlify Functions via the Next runtime. Secrets stay in environment variables. Set `GEMINI_API_KEY` in the Netlify UI; never prefix it with `NEXT_PUBLIC_`.

## Output guards

Gemini occasionally leaks CJK or Thai glyphs into Burmese output. `isCleanForLanguage` rejects those drafts and falls back to curated Burmese copy, so a language switch never produces mixed-script text.

When extraction yields no usable facts, `hasEnoughContext` short-circuits to a single clarifying pressure question instead of letting the model guess a topic.

## Tool roles

- **Cursor** — backend engineering, prompts, tests, docs
- **Google Gemini** — `gemini-3.5-flash-lite` for extraction and wording
- **n8n** — LIFE GUARDIAN AI v2 pipeline plus follow-up orchestration
- **Wispr Flow** — development productivity (voice prompting / iteration) and demo voice input by dictating into the composer, not a production backend
- **Mobbin** — UX inspiration used by the frontend teammate
- **Netlify** — public web deployment
