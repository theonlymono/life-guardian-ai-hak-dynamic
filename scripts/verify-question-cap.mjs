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

/** Plausible answers so the loop advances on real interpretation, not blanks. */
function answerFor(action) {
  if (action.actionType === "numeric_input") return 2;
  if (action.actionType === "confirmation") return true;
  if (action.actionType === "multiple_choice" && action.options?.length) return action.options[0];
  return language === "my" ? "ဟုတ်ကဲ့၊ အဲဒါကို စဉ်းစားနေပါတယ်။" : "Yes, that is something I am working on.";
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
  s.priorities.forEach((p, i) => console.log(`  ${i + 1}. ${p.focus} — ${p.why}`));
  console.log(`\nnext step:  ${s.nextStep}`);

  const text = [s.headline, s.situation, s.nextStep, ...s.priorities.map((p) => p.why)].join(" ");
  if (text.includes("?") && language === "en") failures.push("summary still contains a question");
  const burmese = /[\u1000-\u109F]/.test(text);
  if (language === "my" && !burmese) failures.push("Burmese requested but summary is not Burmese");
  if (language === "en" && burmese) failures.push("English requested but summary contains Burmese");
}

console.log(`\ntotal questions asked: ${asked} (cap ${total})`);
if (failures.length) {
  console.log("\nFAIL");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log("PASS\n");
