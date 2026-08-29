# Life Guardian AI — API Contract

Base URL: same origin. Frontend should call relative `/api/...` paths.

All endpoints return JSON. Human-readable strings follow `language: "en" | "my"`. Technical enums stay in English.

## Standard error

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request was incomplete or invalid."
  }
}
```

Codes: `INVALID_REQUEST`, `AI_NOT_CONFIGURED`, `AI_ANALYSIS_FAILED`, `INVALID_AI_RESPONSE`, `N8N_UNAVAILABLE`, `INTERNAL_ERROR`.

---

## GET `/api/health`

Liveness and configuration flags. Never returns secrets.

### Success

```json
{
  "status": "ok",
  "service": "Life Guardian AI",
  "timestamp": "2026-08-29T05:00:00.000Z",
  "aiConfigured": true,
  "n8nConfigured": false,
  "chatLogConfigured": false,
  "demoBackupMode": false
}
```

---

## POST `/api/analyze`

Initial life-story analysis.

### Request

```json
{
  "language": "en",
  "input": "I'm 42. My wife isn't working. We have two children. We still have a ¥35 million mortgage. My father is 78 and may need care soon. My oldest son starts university in two years.",
  "existingContext": null
}
```

### Success

```json
{
  "success": true,
  "language": "en",
  "source": "live_ai",
  "context": {
    "profile": { "age": 42, "dependents": 2, "incomeStructure": "single_income" },
    "lifeEvents": [],
    "commitments": [],
    "risks": [],
    "completedActions": [],
    "unknownImportantInformation": ["emergency savings"],
    "lastUpdatedAt": "2026-08-29T05:00:00.000Z"
  },
  "dailyAction": {
    "id": "action_...",
    "focus": "Education Planning",
    "title": "Check education savings",
    "reason": "Your oldest child starts university in two years.",
    "actionType": "numeric_input",
    "question": "How much have you already saved for education?",
    "estimatedMinutes": 1,
    "expectedImpact": "Shows whether education planning needs attention this week.",
    "topicKey": "education_savings"
  },
  "summary": null,
  "questionsAnswered": 0,
  "questionsTotal": 5,
  "assistantMessage": "Based on what you shared, one useful next step today is..."
}
```

`source` is `"live_ai"` or `"demo_backup"`. Demo backup is never presented as live AI.

See [The engagement loop ends](#the-engagement-loop-ends) for `summary`, `questionsAnswered`, and `questionsTotal`.

### Error

```json
{
  "success": false,
  "error": {
    "code": "AI_ANALYSIS_FAILED",
    "message": "We couldn't analyze your update right now."
  }
}
```

---

## POST `/api/complete-action`

Stores the answer, updates context, and returns a **different** next action — or, once the question limit is reached, `nextAction: null` and a `summary`.

### Request

```json
{
  "language": "en",
  "context": {},
  "action": {},
  "answer": "¥1.5 million"
}
```

`context` and `action` are the previous `/api/analyze` payload.

### Success

```json
{
  "success": true,
  "language": "en",
  "source": "live_ai",
  "updatedContext": {},
  "nextAction": {
    "id": "action_...",
    "focus": "Financial Resilience",
    "question": "Approximately how many months of essential expenses could your current savings cover?",
    "topicKey": "emergency_fund_months"
  },
  "summary": null,
  "questionsAnswered": 1,
  "questionsTotal": 5,
  "assistantMessage": "..."
}
```

### Error

Same standard error object. Action completion still succeeds in the product even if n8n later fails.

---

## The engagement loop ends

`/api/analyze`, `/api/complete-action` and `/api/life-update` all carry the same three fields. An assistant that answers every answer with another question never feels like it arrives anywhere, so the loop stops asking after `questionsTotal` (currently **5**) answers and reports back instead.

| Field | Meaning |
| --- | --- |
| `questionsAnswered` | Answers recorded so far, equal to `context.completedActions.length` |
| `questionsTotal` | The cap. Constant per deployment; read it rather than hardcoding 5 |
| `summary` | `null` while questions remain; the closing readout and plan once the cap is reached |

While `questionsAnswered < questionsTotal`: the action field is populated and `summary` is `null`.

At the cap: the action field is `null` and `summary` is populated. The two are never both present, so the client can branch on either one.

```json
{
  "success": true,
  "nextAction": null,
  "questionsAnswered": 5,
  "questionsTotal": 5,
  "assistantMessage": "That is everything I need to ask. Here is what your answers add up to.",
  "summary": {
    "headline": "Balancing single income stability with upcoming education and care milestones",
    "situation": "Your household relies on a single income while managing a remaining mortgage of 35,000,000 JPY...",
    "priorities": [
      {
        "focus": "Finance",
        "why": "Relying on a single income with emergency savings covering only one month..."
      }
    ],
    "plan": [
      {
        "title": "Calculate exact monthly essential expenses",
        "detail": "Review your bank statements from the past month to list every essential expense, then multiply that total by three to establish a clear emergency fund target.",
        "timeframe": "This week",
        "basedOn": "Your emergency savings currently cover only one month of essential expenses."
      }
    ],
    "caution": "This is based only on what you shared here. Any major decision is worth discussing with a qualified professional."
  }
}
```

`priorities` is the diagnosis — the ranked areas and why each is pressing. `plan` is what the customer does about it: **3 ordered steps**, most urgent first, each with a `timeframe` and a `basedOn` naming the answer that makes it necessary.

Every step is finishable alone in a sitting and produces a fact the customer did not have. Steps never recommend buying, switching or cancelling a financial product, and never contain a figure the customer did not state.

After the cap the customer can still send `/api/life-update`. New information regenerates the summary rather than reopening the questions.

If the model is unavailable or rate-limited, the whole summary — plan included — is built deterministically from the risk engine, so this response never fails to arrive. Localized like everything else: `focus` values are human-readable labels here, not the `RiskCategory` enum.

---

## POST `/api/life-update`

Merges a new natural-language update into existing context. Does not erase previous facts unless the user clearly corrects them.

### Request

```json
{
  "language": "my",
  "input": "အဖေ့မှာ နောက်အပတ် ဆေးရုံရက်ချိန်းရှိပါတယ်။",
  "context": {}
}
```

### Success

```json
{
  "success": true,
  "language": "my",
  "updatedContext": {},
  "changesDetected": ["lifeEvent:elder_care"],
  "dailyAction": {},
  "summary": null,
  "questionsAnswered": 2,
  "questionsTotal": 5,
  "assistantMessage": "..."
}
```

---

## POST `/api/life-guardian`

Proxies to the **LIFE GUARDIAN AI v2** n8n workflow, which runs its own conversational pipeline (AI extraction, risk map, simulations, action plan). Separate from `/api/analyze` — use whichever the frontend prefers.

### Request

```json
{
  "userId": "demo-user-001",
  "message": "I am 42 with two children and a mortgage.",
  "locale": "en-JP",
  "currency": "JPY",
  "inputMode": "text"
}
```

### Success

Returns the workflow's `LifeGuardianResponse` (see `lib/life-guardian/types.ts`): `conversation`, `lifeEvents`, `profile`, `riskMap`, `priorities`, `actionPlan`, `simulation`, `followUp`.

### Workflow inactive or unreachable

HTTP 503, but always in the same shape so the frontend never has to parse an n8n error:

```json
{
  "success": false,
  "error": "workflow_inactive",
  "conversation": {
    "message": "LIFE GUARDIAN is temporarily unavailable. Please try again shortly.",
    "tone": "supportive"
  },
  "lifeEvents": [],
  "riskMap": [],
  "priorities": [],
  "actionPlan": { "next7Days": [], "next30Days": [], "next3Years": [] }
}
```

Error values: `invalid_json`, `missing_userId`, `empty_message`, `workflow_unreachable`, `workflow_inactive`, `invalid_workflow_response`.

Requires `N8N_LIFE_GUARDIAN_WEBHOOK_URL` and a **published** v2 workflow.

---

## POST `/api/follow-up`

Forwards an engagement event to n8n. Core product must not depend on this succeeding.

### Request

```json
{
  "sessionId": "demo-user-001",
  "language": "en",
  "context": {},
  "completedAction": {},
  "nextAction": {}
}
```

### Success

```json
{
  "success": true,
  "workflowStatus": "scheduled"
}
```

### Unavailable

```json
{
  "success": false,
  "workflowStatus": "unavailable"
}
```

---

## POST `/api/log-turn`

Archives one conversation turn through n8n into MongoDB Atlas. Logging only — call it without awaiting and ignore the result.

`accountId` is optional and comes from the browser's local account. It groups a person's own turns and authorises nothing, so the server never trusts it as identity.

### Request

```json
{
  "sessionId": "session_9f2c...",
  "accountId": "acct_2f1c...",
  "language": "en",
  "kind": "answer",
  "userText": "About one month",
  "assistantText": "Your financial risk level is critical because...",
  "action": {
    "focus": "Education Savings",
    "question": "How do you plan to fund university?",
    "topicKey": "education_savings"
  },
  "risks": [{ "category": "finance", "score": 90, "level": "CRITICAL" }],
  "riskMoves": [
    { "category": "finance", "fromScore": 65, "toScore": 90, "fromLevel": "HIGH", "toLevel": "CRITICAL" }
  ]
}
```

`kind` is `analyze`, `answer`, or `update`. Only `sessionId` and `kind` are required.

### Success

```json
{ "success": true, "stored": true }
```

### Storage unavailable

Returns HTTP 200. A missing webhook URL, an unpublished workflow, or a failed Mongo insert all resolve here.

```json
{ "success": false, "stored": false }
```

---

## Frontend integration notes

1. Keep `LifeContext` in client state (or localStorage). Send it back on later calls.
2. Language switching does not change scores or category keys — only human-readable strings.
3. After `complete-action`, replace stored context with `updatedContext`, then render `nextAction` if it is present or `summary` if it is not. Show `questionsAnswered` / `questionsTotal` so the customer can see the loop is finite.
4. `simulation` appears once the customer has stated a starting amount, a target and a monthly pace for a dated goal, and stays present on later turns. Amounts are whole currency units; `scenarios` covers their pace, the pace that closes the gap in time, and the same pace over more months. To answer "what if I save less", call `simulateGoal` from `lib/simulation/goal.ts` in the browser with a different `monthlyContribution` — it is pure arithmetic and nothing needs saving.
5. Render `action.unitHint` beside a `numeric_input` field and send the bare number. `commitment.amount` is always whole currency units — format it with `formatMoney` from `lib/i18n/money.ts`, which writes kyat as သိန်း for Burmese readers. Never convert between currencies.
6. Optional: after a completed action, call `/api/follow-up` in the background. Ignore `unavailable`.
7. Optional: after every turn, call `/api/log-turn` in the background. Never await it or surface `stored: false`.

## Auth

Username and password only. No email is collected, so there is no password reset.

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/signup` | POST | `{ username, password }` → sets an httpOnly session cookie |
| `/api/auth/login` | POST | Same shape; identical response for unknown user and wrong password |
| `/api/auth/logout` | POST | Deletes the session server-side, not just the cookie |
| `/api/auth/me` | GET | `{ account: { username, createdAt } | null }` |
| `/api/account/history` | GET / PUT | The signed-in account's saved conversation |

Rules: username 3–30 characters of `a-z A-Z 0-9 . _ -`, password at least 8.
Failure reasons are `credentials`, `taken`, `invalid` or `unavailable`.

The account is always resolved from the session cookie, never from the request
body. Signing in is optional — the app is fully usable as a guest, and history
is kept in the browser either way.
