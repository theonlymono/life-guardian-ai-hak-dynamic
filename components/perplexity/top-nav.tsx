"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons"
import { useSession } from "@/components/life-guardian/session-provider"
import { t } from "@/components/life-guardian/copy"
import type { SupportedLanguage } from "@/lib/types/life-context"

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "my", label: "MY" },
]

export function TopNav() {
  const { language, setLanguage, title, started, reset, followUpStatus } = useSession()
  const copy = t(language)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
      {started ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={reset}
          aria-label={copy.startOver}
          className="size-8 shrink-0 text-muted-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.5} />
        </Button>
      ) : (
        <div className="size-8 shrink-0" aria-hidden />
      )}

      <h1 className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">
        {started ? (title ?? copy.untitled) : copy.today}
      </h1>

      <div className="flex shrink-0 items-center gap-2">
        {/* Fixed-width pills keep the header from reflowing when language changes. */}
        <div className="flex h-8 items-center rounded-full border border-border/80 bg-white p-0.5">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              aria-pressed={language === item.code}
              className={cn(
                "flex h-7 w-9 items-center justify-center rounded-full text-[11px] font-medium leading-none transition-colors",
                language === item.code
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span
          title={
            followUpStatus === "scheduled"
              ? copy.followUpScheduled
              : followUpStatus === "unavailable"
                ? copy.followUpUnavailable
                : undefined
          }
          className={cn(
            "size-2 rounded-full transition-colors",
            followUpStatus === "scheduled"
              ? "bg-[#0084ff]"
              : followUpStatus === "unavailable"
                ? "bg-amber-500"
                : "bg-transparent",
          )}
        />

        <Button
          variant="ghost"
          size="icon-sm"
          disabled
          className="size-8 text-muted-foreground disabled:opacity-40"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.5} />
        </Button>

        <Avatar size="sm" className="size-7">
          <AvatarFallback className="bg-[#eceef0] text-[11px]">U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
