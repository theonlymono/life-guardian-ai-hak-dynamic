import type { ApiErrorCode } from "@/lib/types/api";
import type { SupportedLanguage } from "@/lib/types/life-context";

const MYANMAR_SCRIPT = /[\u1000-\u109F]/;

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === "en" || value === "my";
}

export function detectLanguage(input?: string): SupportedLanguage | undefined {
  if (!input) return undefined;
  if (MYANMAR_SCRIPT.test(input)) return "my";
  return undefined;
}

export function resolveLanguage(
  explicit?: string | null,
  input?: string,
): SupportedLanguage {
  if (isSupportedLanguage(explicit)) return explicit;
  return detectLanguage(input) ?? "en";
}

const ERROR_MESSAGES: Record<ApiErrorCode, Record<SupportedLanguage, string>> = {
  INVALID_REQUEST: {
    en: "The request was incomplete or invalid.",
    my: "ပို့လိုက်တဲ့ အချက်အလက်က မပြည့်စုံသေးပါဘူး။",
  },
  AI_NOT_CONFIGURED: {
    en: "Life Guardian AI is not configured yet. Please try again shortly.",
    my: "Life Guardian AI ကို အခု မပြင်ဆင်ရသေးပါဘူး။ ခဏနေပြီး ထပ်ကြိုးစားပေးပါ။",
  },
  AI_ANALYSIS_FAILED: {
    en: "We couldn't analyze your update right now.",
    my: "အခု အချက်အလက်ကို ဆန်းစစ်လို့ မရသေးပါဘူး။ ခဏနေပြီး ထပ်ကြိုးစားပေးပါ။",
  },
  INVALID_AI_RESPONSE: {
    en: "We couldn't turn that update into a reliable next step yet.",
    my: "အခု အချက်အလက်ကနေ ယုံကြည်ရတဲ့ နောက်တစ်ဆင့်ကို မဖန်တီးနိုင်သေးပါဘူး။",
  },
  ELEVENLABS_FAILED: {
    en: "Voice is unavailable, but text output is ready.",
    my: "အသံဖွင့်လို့ မရသေးပေမယ့် စာသားအဖြေက အဆင်သင့်ရှိပါတယ်။",
  },
  N8N_UNAVAILABLE: {
    en: "Follow-up automation is unavailable right now.",
    my: "နောက်ဆက်တွဲ အသိပေးချက်ကို အခု မပို့နိုင်သေးပါဘူး။",
  },
  INTERNAL_ERROR: {
    en: "Something went wrong. Please try again.",
    my: "တစ်ခုခု မှားသွားပါတယ်။ ထပ်ကြိုးစားပေးပါ။",
  },
};

export function errorMessage(
  code: ApiErrorCode,
  language: SupportedLanguage = "en",
): string {
  return ERROR_MESSAGES[code][language];
}

export const SAFETY_DISCLAIMER: Record<SupportedLanguage, string> = {
  en: "Based on what you shared, this is a useful next step — not medical or financial advice. Consider discussing major decisions with a qualified professional.",
  my: "သင်ပြောပြထားတာတွေအပေါ် အခြေခံပြီး ဒီနေ့အတွက် အသုံးဝင်တဲ့ နောက်တစ်ဆင့်ပါ။ ဆေးဘက်ဆိုင်ရာ သို့မဟုတ် ငွေကြေးအကြံပေးချက် မဟုတ်ပါဘူး။ အရေးကြီးတဲ့ ဆုံးဖြတ်ချက်တွေကို ကျွမ်းကျင်သူနဲ့ တိုင်ပင်သင့်ပါတယ်။",
};
