# n8n follow-up workflow (MVP)

n8n is orchestration, not the reasoning brain. Life Guardian remains usable if this workflow is offline.

## Recommended graph

Webhook → Edit Fields → Respond to Webhook

Optional if time remains: save a record, wait 24h, reminder.

## Webhook payload from `POST /api/follow-up`

```json
{
  "sessionId": "demo-user-001",
  "language": "en",
  "focus": "Education Planning",
  "completedAction": "How much have you already saved for education?",
  "nextAction": "Check your emergency buffer",
  "followUpAt": "2026-08-30T05:00:00.000Z"
}
```

## Environment

Set `N8N_WEBHOOK_URL` to the production webhook URL of this workflow.

## Workflows

| Workflow | ID | Webhook path | Consumed by |
|---|---|---|---|
| [LIFE GUARDIAN AI v2](https://hponekhantnaing.app.n8n.cloud/workflow/dkc73a5miL0yoHTM) | `dkc73a5miL0yoHTM` | `/webhook/life-guardian` | `POST /api/life-guardian` |
| [Life Guardian Follow-up](https://hponekhantnaing.app.n8n.cloud/workflow/AhSwon9XpWLumpvg) | `AhSwon9XpWLumpvg` | `/webhook/life-guardian-follow-up` | `POST /api/follow-up` |

Both are published and answering on their production URLs. v2 uses the `Google Gemini(PaLM) Api account` credential and the `gemini-3.5-flash-lite` model, matching the backend.

Source of truth for v2 lives in `n8n/life-guardian-compact.js`.

## Fixes applied to v2 after first live test

The workflow was deployed from the compact script, whose extraction prompt only asked Gemini to "return JSON with intent, lifeEvents, userProfile". Two problems followed.

**Extracted events had no `type`.** Gemini also invented its own profile keys (`numberOfChildren`, `mortgageBalanceYen`). Every `has(...)` check in the pipeline therefore failed, and the demo scenario produced only two risk categories instead of six — education and caregiving were missing entirely. The node now sends the strict schema prompt with the full `type` enum and the exact `userProfile` key names.

**Simulations invented amounts.** `profile.educationSavings || 1500000` meant a user who never mentioned education savings still got a projection built on ¥1,500,000 and a ¥3,000,000 target. Simulations now run only on figures the user actually stated; anything missing goes to `missingInformation` so the frontend can ask for it.

Verified after the fix: the demo story yields `mortgage`, `aging_parent`, `child_university` with six risk categories and `simulation: null`. Supplying real figures in a follow-up turn produces a correct projection (¥1.5M + ¥50,000 × 24 = ¥2.7M, gap ¥300,000) and confirms per-user memory across turns.

