/**
 * Walks the engagement loop to its end: one life story, then answer every
 * question the backend asks. Confirms the loop stops at the cap and returns a
 * summary instead of a sixth question.
 *
 *   node scripts/verify-question-cap.mjs [en|my]
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const language = process.argv[2] === "my" ? "my" : "en";

const STORY = {
  en: "I'm 42. My wife isn't working. We have two children. We still have a ¥35 million mortgage. My father is 78 and may need care soon. My oldest son starts university in two years.",
  my: "ကျွန်တော် အသက် ၄၂ နှစ်ရှိပါပြီ။ ဇနီးက အခုအလုပ်မလုပ်ပါဘူး။ ကလေးနှစ်ယောက်ရှိပါတယ်။ အိမ်ချေးငွေ ယန်း ၃၅ သန်းလောက်ကျန်သေးတယ်။ အဖေက အသက် ၇၈ နှစ်ရှိပြီး မကြာခင် စောင့်ရှောက်မှုလိုလာနိုင်ပါတယ်။ အကြီးဆုံးသားက နောက်နှစ်နှစ်အတွင်း တက္ကသိုလ်တက်တော့မှာပါ။",
};

/**
 * Plausible answers so the loop advances on real interpretation, not blanks.
 * The free-text reply deliberately carries no figure: a vague answer must not
 * come back as a number the customer never gave.
 */
const VAGUE_ANSWER = {
  en: "Yes, that is something I am working on.",
  my: "ဟုတ်ကဲ့၊ အဲဒါကို စဉ်းစားနေပါတယ်။",
};

function answerFor(action) {
  if (action.actionType === "numeric_input") return 2;
  if (action.actionType === "confirmation") return true;
  if (action.actionType === "multiple_choice" && action.options?.length) return action.options[0];
  return VAGUE_ANSWER[language];
}

async function post(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!json.success) throw new Error(`${path} failed: ${JSON.stringify(json.error)}`);
  return json;
}

function line(label, value) {
  console.log(`${label.padEnd(14)} ${value}`);
}

const failures = [];
/** What we sent, in order, so each recorded answer can be checked against it. */
const answersSent = [];

const LATIN_NUMBER_WORDS =
  /\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|zero|none|nothing|no)\b/i;
const MYANMAR_NUMBER_WORDS = /[၀-၉]|တစ်|နှစ်|သုံး|လေး|ငါး|ခြောက်|ခုနစ်|ရှစ်|ကိုး|ဆယ်|မရှိ/;

/** Mirrors the backend guard: does this text actually contain a quantity? */
function statesAQuantity(text) {
  return /\d/.test(text) || LATIN_NUMBER_WORDS.test(text) || MYANMAR_NUMBER_WORDS.test(text);
}

console.log(`\n=== Engagement cap check (${language}) ===\n`);

let result = await post("/api/analyze", { language, input: STORY[language] });
const total = result.questionsTotal;
line("cap", total);
line("Q1", result.dailyAction?.question ?? "(none)");

let asked = 1;
let context = result.context;
let action = result.dailyAction;

while (action && asked <= total + 2) {
  const answer = answerFor(action);
  answersSent.push(answer);
  result = await post("/api/complete-action", { language, context, action, answer });
  context = result.updatedContext;
  action = result.nextAction;

  console.log(
    `\n-- after answer ${result.questionsAnswered}/${result.questionsTotal} ` +
      `${action ? "→ asked again" : "→ stopped asking"}`,
  );

  if (action) {
    asked += 1;
    line(`Q${asked}`, action.question);
    if (result.summary) failures.push(`turn ${asked}: returned both a question and a summary`);
  } else {
    if (!result.summary) failures.push("stopped asking but returned no summary");
    if (result.questionsAnswered !== total) {
      failures.push(`stopped after ${result.questionsAnswered} answers, expected ${total}`);
    }
  }
}

if (action) failures.push(`still asking after ${asked} questions — cap not enforced`);

if (result.summary) {
  const s = result.summary;
  console.log("\n=== Summary returned ===\n");
  line("headline", s.headline);
  console.log(`\n${s.situation}\n`);
  console.log("What matters most:");
  s.priorities.forEach((p, i) => console.log(`  ${i + 1}. ${p.focus} — ${p.why}`));

  console.log("\nThe plan:");
  s.plan.forEach((step, i) => {
    console.log(`\n  ${i + 1}. [${step.timeframe}] ${step.title}`);
    console.log(`     ${step.detail}`);
    console.log(`     because: ${step.basedOn}`);
  });
  console.log(`\ncaution: ${s.caution}`);

  const planText = s.plan.map((p) => `${p.title} ${p.detail}`).join(" ");
  const text = [s.headline, s.situation, s.caution, planText, ...s.priorities.map((p) => p.why)].join(" ");

  if (s.plan.length < 2) failures.push("a plan of one step is not a plan");
  for (const step of s.plan) {
    if (!step.timeframe?.trim()) failures.push(`step "${step.title}" has no deadline`);
    if (!step.basedOn?.trim()) failures.push(`step "${step.title}" traces back to nothing`);
  }
  if (new Set(s.plan.map((p) => p.title)).size !== s.plan.length) {
    failures.push("the plan repeats a step");
  }
  // The whole point of the readout is that it stops asking.
  if (text.includes("?") && language === "en") failures.push("summary still contains a question");
  // Safe wording: we suggest, we never sell.
  if (/\b(buy|purchase|sign up for|invest in|switch to) (a |an |your )?(policy|insurance|plan|fund)\b/i.test(planText)) {
    failures.push("the plan recommends a financial product");
  }
  const burmese = /[\u1000-\u109F]/.test(text);
  if (language === "my" && !burmese) failures.push("Burmese requested but summary is not Burmese");
  if (language === "en" && burmese) failures.push("English requested but summary contains Burmese");
}

console.log("\n=== What the backend recorded ===");
context.completedActions.forEach((done, index) => {
  const sent = answersSent[index];
  console.log(`  sent ${JSON.stringify(sent)} → stored ${JSON.stringify(done.answer)}`);
  // A figure stored against an answer that named no figure was invented.
  if (typeof done.answer === "number" && typeof sent === "string" && !statesAQuantity(sent)) {
    failures.push(
      `stored ${done.answer} for "${done.question.slice(0, 40)}" from an answer with no figure in it`,
    );
  }
});
for (const commitment of context.commitments) {
  console.log(`  commitment: ${commitment.type} = ${commitment.amount ?? "(none)"} ${commitment.currency ?? ""}`);
}

console.log(`\ntotal questions asked: ${asked} (cap ${total})`);
if (failures.length) {
  console.log("\nFAIL");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log("PASS\n");
