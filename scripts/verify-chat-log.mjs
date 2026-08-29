/**
 * Replays what the browser does for a full session — analyze, then answer the
 * daily action — and archives each turn exactly as the UI would, so the stored
 * payload shape is verified against the real API responses rather than a guess.
 *
 * Usage: node scripts/verify-chat-log.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";
const sessionId = `verify_${Date.now()}`;

async function post(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

function riskSnapshot(context) {
  return context.risks.map((risk) => ({
    category: risk.category,
    score: risk.score,
    level: risk.level,
  }));
}

function diffRisks(before, after) {
  if (!before) return [];
  const moves = [];
  for (const risk of after.risks) {
    const previous = before.risks.find((item) => item.category === risk.category);
    if (!previous || previous.score === risk.score) continue;
    moves.push({
      category: risk.category,
      fromScore: previous.score,
      toScore: risk.score,
      fromLevel: previous.level,
      toLevel: risk.level,
    });
  }
  return moves;
}

async function archive(kind, userText, data, context, riskMoves) {
  const action = data.dailyAction ?? data.nextAction;
  const result = await post("/api/log-turn", {
    sessionId,
    language: "en",
    kind,
    userText,
    assistantText: data.assistantMessage,
    action: action
      ? { focus: action.focus, question: action.question, topicKey: action.topicKey }
      : undefined,
    risks: riskSnapshot(context),
    riskMoves,
  });
  console.log(`  archived ${kind}:`, JSON.stringify(result));
  if (!result.stored) throw new Error(`turn "${kind}" was not stored`);
}

const story =
  "I'm 42. My wife isn't working. We have two children. We still have a 35 million yen mortgage. My father is 78 and may need care soon. My oldest son starts university in two years.";

console.log(`session ${sessionId}`);

console.log("1. analyze");
const analyze = await post("/api/analyze", { language: "en", input: story });
if (!analyze.success) throw new Error(`analyze failed: ${JSON.stringify(analyze.error)}`);
console.log("  action:", analyze.dailyAction.focus, "|", analyze.dailyAction.question);
await archive("analyze", story, analyze, analyze.context, []);

console.log("2. answer the action");
const answer = "About one month";
const completed = await post("/api/complete-action", {
  language: "en",
  context: analyze.context,
  action: analyze.dailyAction,
  answer,
});
if (!completed.success) throw new Error(`complete-action failed: ${JSON.stringify(completed.error)}`);

const moves = diffRisks(analyze.context, completed.updatedContext);
console.log("  next action:", completed.nextAction.focus, "|", completed.nextAction.question);
console.log("  risk moves:", JSON.stringify(moves));
if (completed.nextAction.question === analyze.dailyAction.question) {
  throw new Error("the follow-up repeated the question that was just answered");
}
await archive("answer", answer, completed, completed.updatedContext, moves);

console.log(`\nOK — session ${sessionId} archived 2 turns`);
