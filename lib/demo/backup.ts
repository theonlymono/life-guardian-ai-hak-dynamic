import type { AnswerInterpretation, ExtractionResult } from "@/lib/ai/schemas";
import { selectFallbackAction } from "@/lib/engagement/daily-action";
import { fallbackPressureQuestion, isRepeatedQuestion } from "@/lib/engagement/repetition";
import { parseMoney } from "@/lib/i18n/money";
import type {
  DailyAction,
  LifeContext,
  SupportedLanguage,
} from "@/lib/types/life-context";

const DEMO_EN =
  "I'm 42. My wife isn't working. We have two children. We still have a ¥35 million mortgage. My father is 78 and may need care soon. My oldest son starts university in two years.";

export function looksLikePrimaryDemo(input: string): boolean {
  const text = input.toLowerCase();
  return (
    (text.includes("42") || text.includes("၄၂")) &&
    (text.includes("mortgage") || text.includes("အိမ်ချေး") || text.includes("35")) &&
    (text.includes("university") || text.includes("တက္ကသိုလ်"))
  );
}

export function demoExtraction(input: string, language: SupportedLanguage): ExtractionResult {
  if (looksLikePrimaryDemo(input) || isDemoLabeled(input)) {
    return {
      profile: {
        age: 42,
        dependents: 2,
        incomeStructure: "single_income",
      },
      lifeEvents: [
        {
          type: "education",
          description: "Oldest child enters university",
          timeHorizon: "2 years",
          evidence:
            language === "my"
              ? "အကြီးဆုံးသားက နောက်နှစ်နှစ်အတွင်း တက္ကသိုလ်တက်တော့မှာပါ။"
              : "User explicitly stated the oldest son starts university in two years.",
        },
        {
          type: "elder_care",
          description: "Father is 78 and may need care soon",
          timeHorizon: "soon",
          evidence:
            language === "my"
              ? "အဖေက အသက် ၇၈ နှစ်ရှိပြီး မကြာခင် စောင့်ရှောက်မှုလိုလာနိုင်ပါတယ်။"
              : "User explicitly stated the father is 78 and may need care soon.",
        },
      ],
      commitments: [
        {
          type: "mortgage",
          // Read from what they actually typed, so a Burmese "သိန်း ၃၀၀၀"
          // stays kyat and a yen figure stays yen. Even in demo mode we do
          // not put a currency in the customer's mouth.
          ...parseMoney(input, language),
          description: "Existing mortgage",
        },
      ],
      unknownImportantInformation: ["emergency savings", "education savings", "care sharing"],
      insufficientInformation: false,
      summary: "DEMO_BACKUP_MODE sample extraction for the primary hackathon scenario.",
    };
  }

  if (/lost my job|အလုပ်ပြုတ်|အလုပ်လက်မဲ့/i.test(input)) {
    return {
      profile: { dependents: 2, incomeStructure: "single_income" },
      lifeEvents: [
        {
          type: "job_loss",
          description: "Recent job loss",
          timeHorizon: "yesterday",
          evidence: "User stated a job loss.",
        },
      ],
      commitments: [
        {
          type: "mortgage",
          description: "Existing mortgage",
        },
      ],
      unknownImportantInformation: ["emergency savings", "mortgage amount"],
      insufficientInformation: false,
      summary: "DEMO_BACKUP_MODE job-loss sample. Amounts were not invented.",
    };
  }

  if (/expecting|first baby|ကိုယ်ဝန်|ကလေးအသစ်/i.test(input)) {
    return {
      profile: {},
      lifeEvents: [
        {
          type: "pregnancy",
          description: "Expecting a first child",
          evidence: "User stated they are expecting a first baby.",
        },
      ],
      commitments: [],
      unknownImportantInformation: ["due date", "income structure"],
      insufficientInformation: false,
      summary: "DEMO_BACKUP_MODE family-expansion sample. Mortgage/salary were not invented.",
    };
  }

  if (/retire|အငြိမ်းစား/i.test(input)) {
    return {
      profile: { age: 55 },
      lifeEvents: [
        {
          type: "retirement",
          description: "Plans to retire at 60",
          timeHorizon: "5 years",
          evidence: "User stated age 55 and retirement at 60.",
        },
      ],
      commitments: [
        {
          type: "savings",
          ...parseMoney(input, language),
          description: "Stated savings",
        },
      ],
      unknownImportantInformation: ["retirement spending need"],
      insufficientInformation: false,
      summary: "DEMO_BACKUP_MODE retirement sample. A required target was not invented.",
    };
  }

  return {
    profile: {},
    lifeEvents: [],
    commitments: [],
    unknownImportantInformation: ["current pressure"],
    insufficientInformation: true,
    summary: "DEMO_BACKUP_MODE insufficient-information sample.",
  };
}

export function demoDailyAction(
  context: LifeContext,
  language: SupportedLanguage,
): { action: DailyAction; assistantMessage: string } {
  const action = selectFallbackAction(context, language);
  if (isRepeatedQuestion(action, context)) {
    const next = fallbackPressureQuestion(language);
    return { action: next, assistantMessage: messageFor(next, language) };
  }
  return { action, assistantMessage: messageFor(action, language) };
}

export function demoAnswerInterpretation(args: {
  language?: SupportedLanguage;
  question: string;
  answer: string | number | boolean;
  topicKey?: string;
}): AnswerInterpretation {
  const text = String(args.answer);
  if (args.topicKey === "education_savings" || /saved|စု/i.test(args.question)) {
    const money = parseMoney(text, args.language ?? "en");
    return {
      interpretedAnswer: args.answer,
      profileUpdates: {},
      newLifeEvents: [],
      // No figure in the answer means no commitment. Demo mode still may not
      // report savings the customer never mentioned.
      newCommitments: money
        ? [
            {
              type: "education_savings",
              amount: money.amount,
              currency: money.currency,
              description: "Education savings confirmed by customer",
            },
          ]
        : [],
      resolvedUnknowns: money ? ["education savings"] : [],
      newlyUnknown: [],
      notes: "DEMO_BACKUP_MODE interpretation of education savings.",
    };
  }
  return {
    interpretedAnswer: args.answer,
    profileUpdates: {},
    newLifeEvents: [],
    newCommitments: [],
    resolvedUnknowns: args.topicKey ? [args.topicKey.replaceAll("_", " ")] : [],
    newlyUnknown: [],
    notes: `DEMO_BACKUP_MODE passthrough for ${text}`,
  };
}

function isDemoLabeled(input: string): boolean {
  return input.includes("DEMO_BACKUP_MODE") || input === DEMO_EN;
}

function messageFor(action: DailyAction, language: SupportedLanguage): string {
  if (language === "my") {
    return `သင်ပြောပြထားတာတွေအပေါ် အခြေခံပြီး ဒီနေ့အတွက် အသုံးဝင်ဆုံး နောက်တစ်ဆင့်က ${action.title} ပါ။ ${action.question}`;
  }
  return `Based on what you shared, one useful next step today is: ${action.question}`;
}
