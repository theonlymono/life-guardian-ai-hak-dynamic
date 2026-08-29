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
| [Life Guardian Chat Log](https://hponekhantnaing.app.n8n.cloud/workflow/LmFbd0PmFaBikBaU) | `LmFbd0PmFaBikBaU` | `/webhook/life-guardian/chat-log` | `POST /api/log-turn` |

The first two are published and answering on their production URLs. v2 uses the `Google Gemini(PaLM) Api account` credential and the `gemini-3.5-flash-lite` model, matching the backend.

## Chat archive → MongoDB Atlas

`Receive Chat Turn` → `Shape Chat Document` → `Store Chat Message` → `Respond Stored`

Every conversation turn is archived as one document in the `chat_messages` collection, which is what makes the engagement KPIs in the README measurable — repeat interaction rate, action completion rate, and which focus areas customers actually answer.

```json
{
  "sessionId": "session_9f2c...",
  "language": "en",
  "kind": "answer",
  "userText": "About one month",
  "assistantText": "Your financial risk level is critical because...",
  "focus": "Education Savings",
  "question": "How do you plan to fund university?",
  "topicKey": "education_savings",
  "risks": [{ "category": "finance", "score": 90, "level": "CRITICAL" }],
  "riskMoves": [
    { "category": "finance", "fromScore": 65, "toScore": 90, "fromLevel": "HIGH", "toLevel": "CRITICAL" }
  ],
  "createdAt": "2026-08-29T06:20:00.000Z"
}
```

`createdAt` is written as a Mongo `Date`, so range queries work without casting.

This path is logging only. `Store Chat Message` is set to `continueRegularOutput`, so a database failure still returns a webhook response, and `POST /api/log-turn` reports `stored: false` rather than failing. The browser calls it without awaiting: losing an audit record must never interrupt a customer.

### Two routes, one write

`logChatTurn` picks exactly one route, so a turn is never stored twice:

1. **`MONGODB_URI` set** — the app writes straight to Atlas with the official driver. This is the active path. It removes a network hop and needs no n8n credential.
2. **Otherwise, `N8N_CHAT_LOG_WEBHOOK_URL` set** — the workflow above does the write, keeping database credentials out of the app.
3. **Neither** — logging is skipped and `stored: false` is returned.

### Enabling the n8n route

The workflow is built but **not published**, because it carries an unfilled `mongoDb` credential placeholder named **MongoDB Atlas - LifeGuideDB** and credentials cannot be created through the API. Publishing is rejected with `Missing required credential: mongoDb` until it is filled. To finish it:

1. In n8n, open the workflow and select **Store Chat Message**.
2. Create the credential with **Configuration Type: Connection String**, the Atlas `mongodb+srv://` URI with the real username substituted for `<db_username>`, and **Database** `lifeguardian`.
3. Atlas **Network Access** already accepts the connection — verified with `mongosh` from outside the cluster — so no IP change is needed.
4. Publish the workflow, then unset `MONGODB_URI` so this route takes over.

Source of truth for v2 lives in `n8n/life-guardian-compact.js`.

## Fixes applied to v2 after first live test

The workflow was deployed from the compact script, whose extraction prompt only asked Gemini to "return JSON with intent, lifeEvents, userProfile". Two problems followed.

**Extracted events had no `type`.** Gemini also invented its own profile keys (`numberOfChildren`, `mortgageBalanceYen`). Every `has(...)` check in the pipeline therefore failed, and the demo scenario produced only two risk categories instead of six — education and caregiving were missing entirely. The node now sends the strict schema prompt with the full `type` enum and the exact `userProfile` key names.

**Simulations invented amounts.** `profile.educationSavings || 1500000` meant a user who never mentioned education savings still got a projection built on ¥1,500,000 and a ¥3,000,000 target. Simulations now run only on figures the user actually stated; anything missing goes to `missingInformation` so the frontend can ask for it.

Verified after the fix: the demo story yields `mortgage`, `aging_parent`, `child_university` with six risk categories and `simulation: null`. Supplying real figures in a follow-up turn produces a correct projection (¥1.5M + ¥50,000 × 24 = ¥2.7M, gap ¥300,000) and confirms per-user memory across turns.

