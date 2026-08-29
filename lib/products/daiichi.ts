import type { RiskCategory, SupportedLanguage } from "@/lib/types/life-context";

/**
 * Daiichi Life Myanmar's published range, transcribed from their own site.
 *
 * Every figure here is theirs. Nothing in this file is computed, estimated or
 * adjusted for a customer — premiums in particular are absent, because we
 * cannot quote one and a made-up number would be the most damaging thing on
 * the screen. This is a directory that helps someone ask the right question of
 * a licensed adviser, not a quotation engine.
 *
 * Source: https://www.daiichilife.com.mm/mm
 */

export type ProductId =
  | "life_care"
  | "life_pro"
  | "ci_plus"
  | "guard"
  | "health_care"
  | "active_care"
  | "edu_goal";

export interface AgeRange {
  min: number;
  max: number;
}

export interface Product {
  id: ProductId;
  name: string;
  /** What it protects against, in the customer's language. */
  covers: Record<SupportedLanguage, string>;
  /** Facts quoted from the brochure, shown as-is. */
  facts: Record<SupportedLanguage, string[]>;
  entryAge: AgeRange;
  /** Minimum sum assured in kyat, where the brochure states one. */
  minSumAssured?: number;
  brochure?: string;
  /** Categories this product is designed to address. */
  addresses: RiskCategory[];
  /** Life-event types that make it directly relevant. */
  triggers: RegExp;
}

const LAKH = 100_000;

export const PRODUCTS: Product[] = [
  {
    id: "edu_goal",
    name: "Htar-Wa-Ra Edu Goal",
    covers: {
      en: "Keeps a child's education funded even if the parent paying for it dies or is permanently disabled.",
      my: "ပညာရေးစရိတ် ပေးဆောင်နေသူ သေဆုံး သို့မဟုတ် ထာဝစဉ်မသန်စွမ်းဖြစ်သွားလျှင်လည်း ကလေး၏ ပညာရေးကို ဆက်လက်ရပ်တည်စေသည်။",
    },
    facts: {
      en: [
        "Entry age 18–56",
        "Policy term 9, 11 or 14 years",
        "Sum assured 50–1,000 lakh",
        "Premium waiver if the payer cannot continue",
      ],
      my: [
        "အာမခံထားနိုင်သည့်အသက် ၁၈ – ၅၆ နှစ်",
        "ပေါ်လစီသက်တမ်း ၉ / ၁၁ / ၁၄ နှစ်",
        "အာမခံထားငွေ ၅၀ သိန်း – ၁၀၀၀ သိန်း",
        "ပရီမီယံကင်းလွတ်ခွင့် ပါဝင်သည်",
      ],
    },
    entryAge: { min: 18, max: 56 },
    minSumAssured: 50 * LAKH,
    brochure:
      "https://daiichilife.com.mm/wp-content/uploads/2026/04/Digital-Brochure_Edu-Goal_MM.pdf",
    addresses: ["education", "family"],
    triggers: /education|university|school|ပညာရေး|တက္ကသိုလ်|ကျောင်း/i,
  },
  {
    id: "life_pro",
    name: "Daiichi Life Pro",
    covers: {
      en: "Replaces income for the household if the earner dies or is permanently disabled, and returns more than the premiums paid at maturity.",
      my: "ဝင်ငွေရှာသူ သေဆုံး သို့မဟုတ် ထာဝစဉ်မသန်စွမ်းဖြစ်လျှင် အိမ်ထောင်စု၏ ဝင်ငွေကို အစားထိုးပေးပြီး၊ သက်တမ်းစေ့လျှင် ပေးသွင်းခဲ့သည့် ပရီမီယံထက် ပိုမိုပြန်ရသည်။",
    },
    facts: {
      en: [
        "Entry age 18–59",
        "Policy term 6, 9, 12 or 15 years",
        "Sum assured from 50 lakh",
        "Death or permanent disability pays 100% of the sum assured",
        "Survival benefit of 3% every three years",
      ],
      my: [
        "အာမခံထားနိုင်သည့်အသက် ၁၈ – ၅၉ နှစ်",
        "ပေါ်လစီသက်တမ်း ၆ / ၉ / ၁၂ / ၁၅ နှစ်",
        "အာမခံထားငွေ ၅၀ သိန်းမှ စတင်သည်",
        "သေဆုံး သို့မဟုတ် ထာဝစဉ်မသန်စွမ်းလျှင် အာမခံထားငွေ၏ ၁၀၀%",
        "ရှင်သန်ခြင်းအကျိုးခံစားခွင့် ၃ နှစ်လျှင် တစ်ကြိမ် ၃%",
      ],
    },
    entryAge: { min: 18, max: 59 },
    minSumAssured: 50 * LAKH,
    brochure:
      "https://daiichilife.com.mm/wp-content/uploads/2026/04/Digital-Brochure_LifePro_MM.pdf",
    addresses: ["finance", "family", "housing"],
    triggers: /mortgage|job_loss|income|single|အိမ်ချေး|အလုပ်|ဝင်ငွေ/i,
  },
  {
    id: "life_care",
    name: "Daiichi LifeCARE",
    covers: {
      en: "Lifelong cover combined with a policy value that grows, and can be topped up or drawn on as circumstances change.",
      my: "ဘဝတစ်သက်တာ အကာအကွယ်နှင့်အတူ ပေါ်လစီငွေကြေးတန်ဖိုး တိုးပွားစေပြီး၊ အခြေအနေအရ ထပ်ဖြည့်ခြင်း သို့မဟုတ် ထုတ်ယူခြင်း ပြုနိုင်သည်။",
    },
    facts: {
      en: [
        "Entry age 1–65, cover to age 85",
        "Policy term 10–50 years",
        "Premiums compulsory for the first 4 years",
        "Non-smoker bonus 10%; medical check bonus up to 20%",
        "Riders available for critical illness, accident and hospitalisation",
      ],
      my: [
        "အာမခံထားနိုင်သည့်အသက် ၁ – ၆၅ နှစ်၊ အကာအကွယ် ၈၅ နှစ်အထိ",
        "ပေါ်လစီသက်တမ်း ၁၀ – ၅၀ နှစ်",
        "ပထမ ၄ နှစ် ပရီမီယံ မဖြစ်မနေ ပေးသွင်းရသည်",
        "ဆေးလိပ်မသောက်သူ အပိုဆု ၁၀%၊ ကျန်းမာရေးစစ်ဆေးမှု အပိုဆု ၂၀% အထိ",
        "ပြင်းထန်ရောဂါ၊ မတော်တဆမှု၊ ဆေးရုံတက်မှု ထပ်တိုးများ ရွေးနိုင်သည်",
      ],
    },
    entryAge: { min: 1, max: 65 },
    brochure:
      "https://daiichilife.com.mm/wp-content/uploads/2026/04/Digital-Brochure_LifeCARE_MM.pdf",
    addresses: ["finance", "family"],
    triggers: /retire|savings|long term|အငြိမ်းစား|စုဆောင်း/i,
  },
  {
    id: "health_care",
    name: "Daiichi Health CARE",
    covers: {
      en: "Hospital and outpatient treatment costs, renewable each year, with cashless treatment at listed hospitals.",
      my: "ဆေးရုံတက်ရောက်မှုနှင့် ပြင်ပလူနာကုသမှု စရိတ်များကို နှစ်စဉ်သက်တမ်းတိုး၍ ကာကွယ်ပေးပြီး၊ သတ်မှတ်ဆေးရုံများတွင် ငွေသားမလိုဘဲ ကုသနိုင်သည်။",
    },
    facts: {
      en: [
        "Entry age 5–60, renewable to 75",
        "Annual limit from 50 lakh",
        "Cashless in Myanmar, Thailand, Malaysia, Singapore and India",
        "Covers pre- and post-hospitalisation, day surgery, dialysis and chemotherapy",
      ],
      my: [
        "အာမခံထားနိုင်သည့်အသက် ၅ – ၆၀ နှစ်၊ ၇၅ နှစ်အထိ သက်တမ်းတိုးနိုင်သည်",
        "နှစ်စဉ်ကန့်သတ်ပမာဏ ၅၀ သိန်းမှ စတင်သည်",
        "မြန်မာ၊ ထိုင်း၊ မလေးရှား၊ စင်ကာပူ၊ အိန္ဒိယတွင် ငွေသားမလိုဘဲ ကုသနိုင်သည်",
        "ဆေးရုံမတက်မီ/ဆင်းပြီး ကုသမှု၊ နေ့ခွဲစိတ်မှု၊ ကျောက်ကပ်ဆေးခြင်း၊ ကင်ဆာဆေးသွင်းခြင်း ပါဝင်သည်",
      ],
    },
    entryAge: { min: 5, max: 60 },
    minSumAssured: 50 * LAKH,
    brochure: "https://daiichilife.com.mm/wp-content/uploads/2026/04/HEALTH-CARE_-BROCHURE_MM.pdf",
    addresses: ["healthCare", "family"],
    triggers: /health|hospital|care|elder|aging|ကျန်းမာရေး|ဆေးရုံ|စောင့်ရှောက်|သက်ကြီး/i,
  },
  {
    id: "ci_plus",
    name: "Daiichi CI Plus",
    covers: {
      en: "Pays out on eight critical illnesses, so treatment costs do not have to come out of household savings.",
      my: "ပြင်းထန်ရောဂါ (၈) မျိုးအတွက် ငွေထုတ်ပေးသဖြင့် ကုသစရိတ်ကို အိမ်ထောင်စုစုငွေမှ ထုတ်သုံးစရာ မလိုတော့ပါ။",
    },
    facts: {
      en: [
        "Entry age 18–59",
        "Policy term 5–15 years",
        "Sum assured from 50 lakh",
        "Early stage pays 25%; later stage pays 100% less what was already paid",
      ],
      my: [
        "အာမခံထားနိုင်သည့်အသက် ၁၈ – ၅၉ နှစ်",
        "ပေါ်လစီသက်တမ်း ၅ – ၁၅ နှစ်",
        "အာမခံထားငွေ ၅၀ သိန်းမှ စတင်သည်",
        "ကနဦးအဆင့် ၂၅%၊ နှောင်းပိုင်းအဆင့် ၁၀၀% (ရရှိပြီးသားကို နှုတ်၍)",
      ],
    },
    entryAge: { min: 18, max: 59 },
    minSumAssured: 50 * LAKH,
    addresses: ["healthCare", "finance"],
    triggers: /illness|cancer|health|ရောဂါ|ကင်ဆာ|ကျန်းမာရေး/i,
  },
  {
    id: "guard",
    name: "Daiichi Guard",
    covers: {
      en: "Straightforward cover for death or permanent disability, often taken alongside Life Pro to raise the amount protected.",
      my: "သေဆုံးခြင်း သို့မဟုတ် ထာဝစဉ်မသန်စွမ်းဖြစ်ခြင်းအတွက် ရိုးရှင်းသော အကာအကွယ်ဖြစ်ပြီး၊ ကာကွယ်မှုပမာဏ တိုးမြှင့်ရန် Life Pro နှင့် တွဲဖက်လေ့ရှိသည်။",
    },
    facts: {
      en: [
        "Entry age 18–59",
        "Policy term 5–15 years",
        "Sum assured from 50 lakh",
        "Death or permanent disability pays 100%",
      ],
      my: [
        "အာမခံထားနိုင်သည့်အသက် ၁၈ – ၅၉ နှစ်",
        "ပေါ်လစီသက်တမ်း ၅ – ၁၅ နှစ်",
        "အာမခံထားငွေ ၅၀ သိန်းမှ စတင်သည်",
        "သေဆုံး သို့မဟုတ် ထာဝစဉ်မသန်စွမ်းလျှင် ၁၀၀%",
      ],
    },
    entryAge: { min: 18, max: 59 },
    minSumAssured: 50 * LAKH,
    addresses: ["finance", "family", "housing"],
    triggers: /mortgage|debt|loan|dependents|အိမ်ချေး|ချေးငွေ|မှီခို/i,
  },
  {
    id: "active_care",
    name: "Daiichi Active Care",
    covers: {
      en: "Accident cover for death, permanent disability, injury and the hospital stay that follows.",
      my: "မတော်တဆမှုကြောင့် သေဆုံးခြင်း၊ ထာဝစဉ်မသန်စွမ်းဖြစ်ခြင်း၊ ဒဏ်ရာရခြင်းနှင့် ဆက်လက်ဆေးရုံတက်ရမှုအတွက် အကာအကွယ်။",
    },
    facts: {
      en: [
        "Entry age 18–64",
        "Policy term 1–15 years",
        "Sum assured from 50 lakh",
        "Accidental death on public transport pays an extra 100%",
      ],
      my: [
        "အာမခံထားနိုင်သည့်အသက် ၁၈ – ၆၄ နှစ်",
        "ပေါ်လစီသက်တမ်း ၁ – ၁၅ နှစ်",
        "အာမခံထားငွေ ၅၀ သိန်းမှ စတင်သည်",
        "အများပြည်သူသုံး ယာဉ်ဖြင့် သွားလာစဉ် မတော်တဆသေဆုံးလျှင် အပို ၁၀၀%",
      ],
    },
    entryAge: { min: 18, max: 64 },
    minSumAssured: 50 * LAKH,
    brochure:
      "https://daiichilife.com.mm/wp-content/uploads/2026/04/Digital-Brochure_Active-Care_MM.pdf",
    addresses: ["healthCare", "finance"],
    triggers: /accident|travel|commute|မတော်တဆ|ခရီး/i,
  },
];

export const DAIICHI = {
  name: "Daiichi Life Myanmar",
  site: "https://www.daiichilife.com.mm/mm",
  customerService: "+95 9 880 443 003",
  headOffice: "+95 9 880 443 001",
};

export function productById(id: ProductId): Product | undefined {
  return PRODUCTS.find((item) => item.id === id);
}
