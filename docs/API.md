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
  "assistantMessage": "Based on what you shared, one useful next step today is..."
}
```

`source` is `"live_ai"` or `"demo_backup"`. Demo backup is never presented as live AI.

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

Stores the answer, updates context, and returns a **different** next action.

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
  "assistantMessage": "..."
}
```

### Error

Same standard error object. Action completion still succeeds in the product even if n8n later fails.

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

### Request

```json
{
  "sessionId": "session_9f2c...",
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
3. After `complete-action`, replace stored context with `updatedContext` and render `nextAction`.
4. Optional: after a completed action, call `/api/follow-up` in the background. Ignore `unavailable`.
5. Optional: after every turn, call `/api/log-turn` in the background. Never await it or surface `stored: false`.
