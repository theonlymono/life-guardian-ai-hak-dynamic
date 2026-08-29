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

## Frontend integration notes

1. Keep `LifeContext` in client state (or localStorage). Send it back on later calls.
2. Language switching does not change scores or category keys — only human-readable strings.
3. After `complete-action`, replace stored context with `updatedContext` and render `nextAction`.
4. Optional: after a completed action, call `/api/follow-up` in the background. Ignore `unavailable`.
