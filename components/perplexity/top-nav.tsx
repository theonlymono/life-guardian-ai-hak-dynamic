"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, Analytics01Icon } from "@hugeicons/core-free-icons"
import { useSession } from "@/components/life-guardian/session-provider"
import { CATEGORY_LABELS, t } from "@/components/life-guardian/copy"
import type { RiskCategory, SupportedLanguage } from "@/lib/types/life-context"

const categories: RiskCategory[] = [
  "finance",
  "family",
  "healthCare",
  "education",
  "housing",
]

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "my", label: "MY" },
]

export function TopNav() {
  const { context, language, setLanguage, setView, followUpStatus } = useSession()
  const copy = t(language)
  const risks = context?.risks ?? []
  const scheduledCount = context?.completedActions.length ?? 0

  return (
    <header className="relative flex h-14 shrink-0 items-center px-6">
      <nav className="absolute inset-x-0 flex items-center justify-center gap-6 pointer-events-none">
        {categories.map((category) => {
          const risk = risks.find((item) => item.category === category)
          return (
            <button
              key={category}
              type="button"
              onClick={() => setView("pulse")}
              title={risk?.explanation}
              className={cn(
                "pointer-events-auto flex items-center gap-1.5 text-sm transition-colors hover:text-foreground",
                risk ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {CATEGORY_LABELS[category][language]}
              {risk && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    risk.level === "CRITICAL"
                      ? "bg-red-500/15 text-red-700"
                      : risk.level === "HIGH"
                        ? "bg-amber-500/15 text-amber-700"
                        : risk.level === "MEDIUM"
                          ? "bg-[#0084ff]/10 text-[#003da5]"
                          : "bg-[#eceef0] text-muted-foreground",
                  )}
                >
                  {risk.score}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="flex items-center rounded-full border border-border/80 bg-white p-0.5">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              aria-pressed={language === item.code}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                language === item.code
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setView("actions")}
          title={
            followUpStatus === "scheduled"
              ? copy.followUpScheduled
              : followUpStatus === "unavailable"
                ? copy.followUpUnavailable
                : undefined
          }
          className="h-8 gap-1.5 rounded-full border-border/80 bg-white px-3 text-xs font-normal shadow-none"
        >
          <HugeiconsIcon icon={Calendar01Icon} strokeWidth={1.5} className="size-3.5" />
          {copy.completedActions}
          <span className="flex size-4 items-center justify-center rounded-full bg-[#eceef0] text-[10px] font-medium">
            {scheduledCount}
          </span>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setView("pulse")}
          title={copy.lifePulse}
          aria-label={copy.lifePulse}
          className="text-muted-foreground"
        >
          <HugeiconsIcon icon={Analytics01Icon} strokeWidth={1.5} />
        </Button>

        <Avatar size="sm" className="size-7">
          <AvatarFallback className="bg-[#eceef0] text-xs">U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
