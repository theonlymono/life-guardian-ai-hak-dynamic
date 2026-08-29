import type { LifeContext, RiskCategory, SupportedLanguage } from "@/lib/types/life-context";
import { categoryLabel } from "@/lib/risk/engine";
import { levelLabel } from "@/lib/i18n/context-labels";
import { PRODUCTS, type Product } from "./daiichi";

/**
 * Matches published products to what the customer actually told us.
 *
 * Rules only — no model writes any part of this. A recommendation the customer
 * cannot trace back to their own words is a sales pitch, so every match must
 * carry the specific fact that produced it and the risk level it speaks to.
 * Ranking never invents urgency either: it follows the deterministic risk
 * scores the engine already computed.
 */

export interface ProductMatch {
  product: Product;
  /** The customer's own situation, quoted back as the reason. */
  reason: string;
  category: RiskCategory;
  score: number;
  /** True when their stated age falls outside the published entry range. */
  outsideEntryAge: boolean;
}

const MATCH_LIMIT = 3;

export function matchProducts(
  context: LifeContext,
  language: SupportedLanguage,
): ProductMatch[] {
  const risks = [...(context.risks ?? [])].sort((a, b) => b.score - a.score);
  if (risks.length === 0) return [];

  const evidence = evidenceText(context);
  const age = context.profile.age;
  const matches: ProductMatch[] = [];
  const taken = new Set<string>();

  for (const risk of risks) {
    // A category nobody is exposed to should not produce a suggestion.
    if (risk.score < 30) continue;

    const candidates = PRODUCTS.filter(
      (product) => product.addresses.includes(risk.category) && !taken.has(product.id),
    ).sort((a, b) => Number(b.triggers.test(evidence)) - Number(a.triggers.test(evidence)));

    const product = candidates[0];
    if (!product) continue;

    taken.add(product.id);
    matches.push({
      product,
      reason: reasonFor(risk.category, risk.level, language),
      category: risk.category,
      score: risk.score,
      outsideEntryAge:
        age !== undefined && (age < product.entryAge.min || age > product.entryAge.max),
    });

    if (matches.length === MATCH_LIMIT) break;
  }

  return matches;
}

function evidenceText(context: LifeContext): string {
  return [
    ...context.lifeEvents.map((item) => `${item.type} ${item.description}`),
    ...context.commitments.map((item) => `${item.type} ${item.description}`),
    context.profile.incomeStructure ?? "",
  ].join(" ");
}

function reasonFor(
  category: RiskCategory,
  level: string,
  language: SupportedLanguage,
): string {
  const label = categoryLabel(category, language);
  return language === "my"
    ? `သင့်အခြေအနေတွင် ${label} အန္တရာယ် ${levelLabel(level, language)} နေသောကြောင့်`
    : `Because ${label.toLowerCase()} is currently at ${level} in your situation`;
}
