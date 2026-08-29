/**
 * Runs a real analysis, then checks that the product suggestions derived from
 * it point at something the customer actually said. Guards the property that
 * matters most here: the app must never surface a product the person's own
 * situation does not justify.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const language = process.argv[2] === "en" ? "en" : "my";

const STORY = {
  my: "ကျွန်တော် အသက် ၄၂ နှစ်ပါ။ ဇနီးက အလုပ်မလုပ်ပါဘူး။ ကလေးနှစ်ယောက်ရှိတယ်။ အိမ်ချေးငွေ သိန်း ၃၀၀၀ ကျန်တယ်။ အဖေက အသက် ၇၈ နှစ်ရှိပြီး မကြာခင် စောင့်ရှောက်မှုလိုလာနိုင်တယ်။ အကြီးဆုံးသားက နောက်နှစ်နှစ်အတွင်း တက္ကသိုလ်တက်မယ်။",
  en: "I'm 42. My wife isn't working. We have two children. We still owe 3,000 lakh on the mortgage. My father is 78 and may need care soon. My oldest son starts university in two years.",
};

const res = await fetch(`${BASE}/api/analyze`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ language, input: STORY[language] }),
});
const body = await res.json();
if (!body.success) {
  console.error("analyze failed", body);
  process.exit(1);
}

const { matchProducts } = await import("../lib/products/match.ts");
const matches = matchProducts(body.context, language);

console.log(`\n=== Product match (${language}) ===\n`);
console.log("risks:", body.context.risks.map((r) => `${r.category} ${r.score} ${r.level}`).join(", "));
console.log("");

for (const match of matches) {
  console.log(`${match.product.name}  [${match.category} ${match.score}]`);
  console.log(`  why: ${match.reason}`);
  console.log(`  covers: ${match.product.covers[language]}`);
  if (match.outsideEntryAge) console.log("  ! outside published entry age");
  console.log("");
}

const problems = [];
if (matches.length === 0) problems.push("no suggestions produced from a rich story");

const burmese = /[\u1000-\u109F]/;
for (const match of matches) {
  const text = `${match.reason} ${match.product.covers[language]} ${match.product.facts[language].join(" ")}`;
  if (language === "my" && !burmese.test(match.reason)) {
    problems.push(`${match.product.name}: reason is not in Burmese`);
  }
  // Product names are English brand names in both languages, so only the
  // surrounding prose is checked for leaked source text.
  if (language === "my" && /\b(the|and|your|because|with)\b/i.test(text)) {
    problems.push(`${match.product.name}: English leaked into Burmese copy`);
  }
  const score = body.context.risks.find((r) => r.category === match.category)?.score;
  if (score !== match.score) {
    problems.push(`${match.product.name}: cited a score the risk engine did not produce`);
  }
}

const education = matches.find((m) => m.product.id === "edu_goal");
if (!education) problems.push("a university bill in two years did not surface the education product");

if (problems.length) {
  console.log("FAIL");
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}
console.log("PASS");
