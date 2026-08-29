import type { SupportedLanguage } from "@/lib/types/life-context";

/**
 * Myanmar money is spoken in သိန်း (100,000), not in millions. A family
 * describes a home loan as "သိန်း ၃၀၀၀", and reading that back to them as
 * "300,000,000 MMK" is technically correct and practically unreadable.
 */
const MYANMAR_SCALES: [string, number][] = [
  ["ဘီလျံ", 1_000_000_000],
  ["ကုဋေ", 10_000_000],
  ["သန်း", 1_000_000],
  ["သိန်း", 100_000],
  ["သောင်း", 10_000],
  ["ထောင်", 1_000],
];

const LATIN_SCALES: [string, number][] = [
  ["billion", 1_000_000_000],
  ["crore", 10_000_000],
  ["million", 1_000_000],
  ["lakhs", 100_000],
  ["lakh", 100_000],
  ["thousand", 1_000],
];

const CURRENCY_MARKERS: [RegExp, string][] = [
  [/¥|\byen\b|\bjpy\b|ယန်း/i, "JPY"],
  [/\$|\busd\b|\bdollars?\b|ဒေါ်လာ/i, "USD"],
  [/\bmmk\b|\bkyats?\b|\bks\b|ကျပ်/i, "MMK"],
];

const MYANMAR_DIGITS = "၀၁၂၃၄၅၆၇၈၉";

export function myanmarDigitsToLatin(text: string): string {
  return text.replace(/[၀-၉]/g, (digit) => String(MYANMAR_DIGITS.indexOf(digit)));
}

export function toMyanmarDigits(text: string): string {
  return text.replace(/\d/g, (digit) => MYANMAR_DIGITS[Number(digit)]);
}

/**
 * Reads what someone typed into a numeric field.
 *
 * Burmese numerals count as digits. Anything holding no digit at all comes
 * back unchanged, because the alternative — an empty string parsing as 0 —
 * answers "none" on the customer's behalf and then scores them on it.
 */
export function readTypedNumber(raw: string): number | string {
  const trimmed = raw.trim();
  const digits = myanmarDigitsToLatin(trimmed).replace(/[^0-9.-]/g, "");
  if (digits === "") return trimmed;

  const numeric = Number(digits);
  return Number.isFinite(numeric) ? numeric : trimmed;
}

const UNIT_MULTIPLIERS: Record<string, number> = {
  သိန်း: 100_000,
  သန်း: 1_000_000,
  ကုဋေ: 10_000_000,
  သောင်း: 10_000,
  lakh: 100_000,
  lakhs: 100_000,
  million: 1_000_000,
};

/**
 * What a bare number means once the unit shown beside the field is applied.
 * A customer answering "3" under a သိန်း label means 300,000.
 */
export function unitMultiplier(unitHint: string | undefined): number {
  if (!unitHint) return 1;
  return UNIT_MULTIPLIERS[unitHint.trim().toLowerCase()] ?? 1;
}

export function isMoneyUnit(unitHint: string | undefined): boolean {
  if (!unitHint) return false;
  const unit = unitHint.trim();
  if (unit in UNIT_MULTIPLIERS || unit.toLowerCase() in UNIT_MULTIPLIERS) return true;
  return /^(mmk|jpy|usd|ကျပ်)$/i.test(unit);
}

/** The currency a unit label implies, when it implies one at all. */
export function currencyForUnit(unitHint: string | undefined, fallback = "MMK"): string | undefined {
  if (!isMoneyUnit(unitHint)) return undefined;
  const unit = (unitHint ?? "").trim();
  if (/^(mmk|jpy|usd)$/i.test(unit)) return unit.toUpperCase();
  return fallback;
}

/**
 * The unit a customer should type an amount in.
 *
 * Kyat is counted in သိန်း here and in lakh in Myanmar English — the same
 * hundred thousand either way. Asking anyone to type 15000000 invites a lost
 * zero. Other currencies are entered in full, having no such convention.
 */
export function moneyUnit(currency: string, language: SupportedLanguage): string {
  if (currency !== "MMK") return currency;
  return language === "my" ? "သိန်း" : "lakh";
}

export interface ParsedMoney {
  amount: number;
  currency?: string;
}

/**
 * Reads an amount out of free text in either language.
 *
 * `language` only decides the fallback currency when the customer named none:
 * a Burmese speaker writing "၃၀၀၀ သိန်း" means kyat, and demanding they spell
 * out the currency would be pedantic. An explicit marker always wins.
 */
export function parseMoney(
  text: string,
  language: SupportedLanguage = "en",
): ParsedMoney | undefined {
  const normalized = myanmarDigitsToLatin(text).replace(/,/g, "");

  let currency: string | undefined;
  for (const [pattern, code] of CURRENCY_MARKERS) {
    if (pattern.test(normalized)) {
      currency = code;
      break;
    }
  }

  const scaled = matchScaledAmount(normalized);
  if (scaled === undefined) {
    const bare = normalized.match(/(\d+(?:\.\d+)?)/);
    if (!bare) return undefined;
    return { amount: Number(bare[1]), currency: currency ?? defaultCurrency(language) };
  }

  return { amount: scaled, currency: currency ?? defaultCurrency(language) };
}

function defaultCurrency(language: SupportedLanguage): string | undefined {
  return language === "my" ? "MMK" : undefined;
}

/** Myanmar writes the unit on either side of the number: "သိန်း ၅၀၀" and "၅၀၀ သိန်း". */
function matchScaledAmount(normalized: string): number | undefined {
  for (const [unit, multiplier] of MYANMAR_SCALES) {
    const after = normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}`));
    if (after) return Number(after[1]) * multiplier;
    const before = normalized.match(new RegExp(`${unit}\\s*(\\d+(?:\\.\\d+)?)`));
    if (before) return Number(before[1]) * multiplier;
  }

  for (const [unit, multiplier] of LATIN_SCALES) {
    const match = normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}`, "i"));
    if (match) return Number(match[1]) * multiplier;
  }

  return undefined;
}

function trimZeros(value: number): string {
  return Number(value.toFixed(2)).toLocaleString("en-US");
}

/**
 * Renders an amount the way a reader of that language would say it.
 * Kyat becomes သိန်း in Burmese; everything else keeps plain grouping so we
 * never imply a conversion we did not perform.
 */
export function formatMoney(
  amount: number,
  currency: string | undefined,
  language: SupportedLanguage,
): string {
  if (language !== "my") {
    return currency ? `${trimZeros(amount)} ${currency}` : trimZeros(amount);
  }

  const isKyat = currency === undefined || currency === "MMK";
  if (isKyat) {
    if (amount >= 100_000) {
      return `${toMyanmarDigits(trimZeros(amount / 100_000))} သိန်း`;
    }
    return `${toMyanmarDigits(trimZeros(amount))} ကျပ်`;
  }

  return `${currency} ${toMyanmarDigits(trimZeros(amount))}`;
}
