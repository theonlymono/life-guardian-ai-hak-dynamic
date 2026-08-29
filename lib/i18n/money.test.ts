import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMoney, parseMoney, readTypedNumber } from "./money";

test("reads kyat written the way Myanmar customers write it", () => {
  const cases: [string, number][] = [
    ["သိန်း ၃၀၀၀", 300_000_000],
    ["၃၀၀၀ သိန်း", 300_000_000],
    ["ကျပ် သိန်း ၅၀၀", 50_000_000],
    ["၁၅ သိန်း", 1_500_000],
    ["၃.၅ သန်း", 3_500_000],
    ["၅ သောင်း", 50_000],
    ["၂ ကုဋေ", 20_000_000],
  ];

  for (const [text, expected] of cases) {
    const parsed = parseMoney(text, "my");
    assert.equal(parsed?.amount, expected, `misread "${text}"`);
    assert.equal(parsed?.currency, "MMK", `wrong currency for "${text}"`);
  }
});

test("an explicit currency always beats the language default", () => {
  assert.deepEqual(parseMoney("ယန်း ၃၅ သန်း", "my"), { amount: 35_000_000, currency: "JPY" });
  assert.deepEqual(parseMoney("¥35 million", "en"), { amount: 35_000_000, currency: "JPY" });
});

test("English scale words still parse", () => {
  assert.equal(parseMoney("1.5 million", "en")?.amount, 1_500_000);
  assert.equal(parseMoney("5 lakh kyat", "en")?.amount, 500_000);
  assert.equal(parseMoney("5 lakh kyat", "en")?.currency, "MMK");
});

test("English input without a currency marker never guesses one", () => {
  assert.equal(parseMoney("35000000", "en")?.currency, undefined);
});

test("text with no figure in it is not money", () => {
  assert.equal(parseMoney("I am still working on it", "en"), undefined);
  assert.equal(parseMoney("မရှိသေးပါဘူး", "my"), undefined);
});

test("kyat is shown in သိန်း, because that is how it is read", () => {
  assert.equal(formatMoney(300_000_000, "MMK", "my"), "၃,၀၀၀ သိန်း");
  assert.equal(formatMoney(1_500_000, "MMK", "my"), "၁၅ သိန်း");
  assert.equal(formatMoney(1_250_000, "MMK", "my"), "၁၂.၅ သိန်း");
});

test("small kyat amounts stay in kyat rather than becoming a fraction", () => {
  assert.equal(formatMoney(50_000, "MMK", "my"), "၅၀,၀၀၀ ကျပ်");
});

test("a foreign currency is never silently converted to kyat", () => {
  assert.equal(formatMoney(35_000_000, "JPY", "my"), "JPY ၃၅,၀၀၀,၀၀၀");
  assert.equal(formatMoney(35_000_000, "JPY", "en"), "35,000,000 JPY");
});

test("round trips what the customer wrote", () => {
  const parsed = parseMoney("သိန်း ၈၀၀", "my");
  assert.ok(parsed);
  assert.equal(formatMoney(parsed.amount, parsed.currency, "my"), "၈၀၀ သိန်း");
});

test("Burmese numerals typed into a numeric field are read as numbers", () => {
  assert.equal(readTypedNumber("၃"), 3);
  assert.equal(readTypedNumber("၁၅၀"), 150);
  assert.equal(readTypedNumber("၃၀၀,၀၀၀"), 300000);
});

test("Latin digits still work, with stray characters ignored", () => {
  assert.equal(readTypedNumber(" 300000 "), 300000);
  assert.equal(readTypedNumber("1,500"), 1500);
});

test("an answer with no digits is passed through, never turned into zero", () => {
  assert.equal(readTypedNumber("မသေချာဘူး"), "မသေချာဘူး");
  assert.equal(readTypedNumber("not sure"), "not sure");
});
