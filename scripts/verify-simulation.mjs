/**
 * Plays a customer through a dated goal and checks the projection that comes
 * back is arithmetic on their own answers — not a figure anyone invented.
 *
 *   node scripts/verify-simulation.mjs [en|my]
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const language = process.argv[2] === "my" ? "my" : "en";
const failures = [];

const STORY = {
  en: "I'm 42, single income, two children. My oldest starts university in two years and I'm worried about the fees.",
  my: "ကျွန်တော် အသက် ၄၂ နှစ်ပါ။ ဝင်ငွေက ကျွန်တော်တစ်ယောက်တည်းပါ။ ကလေးနှစ်ယောက်ရှိတယ်။ အကြီးဆုံးသားက နောက်နှစ်နှစ်အတွင်း တက္ကသိုလ်တက်တော့မှာမို့ ကျောင်းစရိတ်အတွက် စိတ်ပူနေတယ်။",
};

// What the customer types into each numeric field, in the unit shown to them.
// 150 lakh saved, 300 lakh needed, 5 lakh a month.
const ANSWERS = { education_savings: 150, education_target: 300, monthly_saving_capacity: 5 };

async function post(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success) throw new Error(`${path}: ${data.error?.message ?? "failed"}`);
  return data;
}

function line(label, value) {
  console.log(`${label.padEnd(16)} ${value}`);
}

console.log(`\n=== Projection check (${language}) ===\n`);

let data = await post("/api/analyze", { language, input: STORY[language] });
let context = data.context;
let action = data.dailyAction;
const sent = {};

for (let turn = 0; turn < 5 && action; turn += 1) {
  const topic = action.topicKey ?? "unknown";
  const answer = ANSWERS[topic];
  line(`Q${turn + 1} [${topic}]`, `${action.question}  [${action.unitHint ?? "no unit"}]`);
  if (answer === undefined) break;

  sent[topic] = answer;
  data = await post("/api/complete-action", { language, context, action, answer });
  context = data.updatedContext;
  action = data.nextAction;

  if (data.simulation) break;
}

const sim = data.simulation;
if (!sim) {
  failures.push("no projection was produced after the customer supplied every figure");
} else {
  console.log("\n=== Projection ===\n");
  line("currency", sim.currency);
  line("months", sim.monthsRemaining);
  line("saved", sim.currentAmount);
  line("target", sim.targetAmount);
  line("monthly", sim.monthlyContribution);
  line("projected", sim.projected);
  line("gap", sim.gap);
  line("required/mo", sim.requiredMonthly);

  console.log("\nScenarios:");
  for (const item of sim.scenarios) {
    console.log(
      `  ${item.kind.padEnd(14)} ${item.monthlyContribution}/mo x ${item.monthsRemaining}mo → ${item.projected} (gap ${item.gap})`,
    );
  }

  // Every figure must be the customer's answer scaled by the unit they saw.
  const expect = (label, actual, typed) => {
    const lakh = typed * 100_000;
    if (actual !== lakh) failures.push(`${label}: got ${actual}, expected ${lakh} from "${typed}"`);
  };
  expect("saved", sim.currentAmount, sent.education_savings);
  expect("target", sim.targetAmount, sent.education_target);
  expect("monthly", sim.monthlyContribution, sent.monthly_saving_capacity);

  if (sim.monthsRemaining !== 24) {
    failures.push(`months: got ${sim.monthsRemaining}, expected 24 from "two years"`);
  }

  const straight = sim.currentAmount + sim.monthlyContribution * sim.monthsRemaining;
  if (sim.projected !== straight) {
    failures.push(`projected ${sim.projected} is not ${straight} — a return was assumed`);
  }

  const required = sim.scenarios.find((item) => item.kind === "required_pace");
  if (sim.gap > 0 && !required?.reachesGoal) {
    failures.push("the required pace does not actually reach the goal");
  }
}

console.log(failures.length === 0 ? "\nPASS\n" : `\nFAIL\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
process.exit(failures.length === 0 ? 0 : 1);
