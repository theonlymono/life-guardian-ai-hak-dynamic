"use client"

import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Presentation01Icon,
  Analytics01Icon,
  PaintBoardIcon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons"
import { useSession } from "@/components/life-guardian/session-provider"
import type { SupportedLanguage } from "@/lib/types/life-context"

interface Suggestion {
  label: Record<SupportedLanguage, string>
  /** Seeded into the prompt so a demo can start without typing a whole story. */
  prompt: Record<SupportedLanguage, string>
  icon: typeof Presentation01Icon
}

const suggestions: Suggestion[] = [
  {
    label: {
      en: "Share my family situation",
      my: "မိသားစုအခြေအနေ ပြောပြမည်",
    },
    prompt: {
      en: "I'm 42. My wife isn't working. We have two children. We still have a 35 million yen mortgage. My father is 78 and may need care soon. My oldest son starts university in two years.",
      my: "ကျွန်တော် အသက် ၄၂ နှစ်ရှိပါပြီ။ ဇနီးက အခုအလုပ်မလုပ်ပါဘူး။ ကလေးနှစ်ယောက်ရှိပါတယ်။ အိမ်ချေးငွေ ယန်း ၃၅ သန်းလောက်ကျန်သေးတယ်။ အဖေက အသက် ၇၈ နှစ်ရှိပြီး မကြာခင် စောင့်ရှောက်မှုလိုလာနိုင်ပါတယ်။ အကြီးဆုံးသားက နောက်နှစ်နှစ်အတွင်း တက္ကသိုလ်တက်တော့မှာပါ။",
    },
    icon: Presentation01Icon,
  },
  {
    label: {
      en: "Plan for education",
      my: "ပညာရေးအတွက် ပြင်ဆင်မည်",
    },
    prompt: {
      en: "My oldest child starts university in two years and I want to be ready for the cost.",
      my: "အကြီးဆုံးကလေးက နောက်နှစ်နှစ်အတွင်း တက္ကသိုလ်တက်မှာဖြစ်လို့ ကုန်ကျစရိတ်အတွက် ပြင်ဆင်ထားချင်ပါတယ်။",
    },
    icon: Analytics01Icon,
  },
  {
    label: {
      en: "I have a housing concern",
      my: "အိမ်ရာနှင့်ပတ်သက်၍ စိုးရိမ်နေသည်",
    },
    prompt: {
      en: "I still have a large mortgage and I am worried about keeping up with it.",
      my: "အိမ်ချေးငွေ အများကြီး ကျန်နေသေးလို့ ဆက်ပြီး ပေးဆပ်နိုင်ပါ့မလား စိုးရိမ်နေပါတယ်။",
    },
    icon: PaintBoardIcon,
  },
]

const VAGUE_PROMPT: Record<SupportedLanguage, string> = {
  en: "I'm worried about my future.",
  my: "ကျွန်တော် အနာဂတ်အတွက် စိုးရိမ်နေပါတယ်။",
}

export function SuggestionChips() {
  const { setDraft, submitInput, loading, language } = useSession()

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
      {suggestions.map((item) => (
        <Button
          key={item.label.en}
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => setDraft(item.prompt[language])}
          className="h-9 gap-2 rounded-full border-border/70 bg-white px-4 text-sm font-normal text-muted-foreground shadow-none hover:bg-[#f7f8f9] hover:text-foreground"
        >
          <HugeiconsIcon icon={item.icon} strokeWidth={1.5} className="size-4" />
          {item.label[language]}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={loading}
        onClick={() => void submitInput(VAGUE_PROMPT[language])}
        title={VAGUE_PROMPT[language]}
        aria-label={VAGUE_PROMPT[language]}
        className="size-9 rounded-full text-muted-foreground"
      >
        <HugeiconsIcon icon={ShuffleIcon} strokeWidth={1.5} />
      </Button>
    </div>
  )
}
