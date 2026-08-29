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

## Created workflow

Draft: [Life Guardian Follow-up](https://hponekhantnaing.app.n8n.cloud/workflow/AhSwon9XpWLumpvg)

Publish it in n8n, then set `N8N_WEBHOOK_URL` to the production webhook URL (`/webhook/life-guardian-follow-up`).
Do not publish unless you confirm — the core app still works without it.

