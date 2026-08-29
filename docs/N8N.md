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

**Both are unpublished.** A webhook only answers on its production URL once the workflow is published, so `/api/life-guardian` returns `workflow_inactive` and `/api/follow-up` returns `unavailable` until then. Neither blocks the core demo.

v2 uses the `Google Gemini(PaLM) Api account` credential and the `gemini-3.5-flash-lite` model, matching the backend.

