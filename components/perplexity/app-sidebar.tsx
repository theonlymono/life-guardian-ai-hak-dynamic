"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Analytics01Icon,
  File01Icon,
  Clock01Icon,
  UserAdd01Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons"
import { PerplexityMark } from "./perplexity-logo"
import { useSession, type SessionView } from "@/components/life-guardian/session-provider"
import { t } from "@/components/life-guardian/copy"
import type { SupportedLanguage } from "@/lib/types/life-context"

const navItems: {
  view: SessionView
  label: Record<SupportedLanguage, string>
  icon: typeof ComputerIcon
}[] = [
  { view: "today", label: { en: "Today", my: "ဒီနေ့" }, icon: ComputerIcon },
  {
    view: "pulse",
    label: { en: "Life Pulse", my: "ဘဝအခြေအနေ" },
    icon: Analytics01Icon,
  },
  {
    view: "actions",
    label: { en: "Actions", my: "လုပ်ဆောင်ချက်များ" },
    icon: File01Icon,
  },
  { view: "history", label: { en: "History", my: "မှတ်တမ်း" }, icon: Clock01Icon },
]

export function AppSidebar() {
  const { view, setView, reset, language, context, followUpStatus } = useSession()
  const copy = t(language)

  const counts: Partial<Record<SessionView, number>> = {
    pulse: context?.risks.length ?? 0,
    actions: context?.completedActions.length ?? 0,
  }

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-border/60 bg-[#f7f8f9]">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <PerplexityMark className="size-6 text-foreground" />
      </div>

      <div className="px-3 pb-2">
        <Button
          variant="outline"
          onClick={reset}
          className="h-9 w-full justify-start gap-2 rounded-lg border-border/80 bg-white px-3 text-sm font-normal shadow-none hover:bg-white"
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="size-4" />
          {copy.newSession}
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 pt-1">
        {navItems.map((item) => {
          const count = counts[item.view]
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                view === item.view
                  ? "bg-[#eceef0] font-medium text-foreground"
                  : "text-muted-foreground hover:bg-[#eceef0]/60 hover:text-foreground",
              )}
            >
              <HugeiconsIcon icon={item.icon} strokeWidth={1.5} className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">
                {item.label[language]}
              </span>
              {count ? (
                <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-border/60 p-3">
        {followUpStatus !== "idle" && (
          <div
            className={cn(
              "rounded-lg px-2.5 py-2 text-[11px] leading-relaxed",
              followUpStatus === "scheduled"
                ? "bg-[#0084ff]/10 text-[#003da5]"
                : "bg-[#eceef0] text-muted-foreground",
            )}
          >
            {followUpStatus === "scheduled"
              ? copy.followUpScheduled
              : followUpStatus === "unavailable"
                ? copy.followUpUnavailable
                : copy.thinking}
          </div>
        )}

        <div className="flex items-center gap-2.5 px-1">
          <Avatar size="sm">
            <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Alex" />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">Life Companion</span>
              <span className="rounded bg-[#0084ff]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#003da5]">
                AI
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground/50 transition-colors"
        >
          <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={1.5} className="size-4" />
          Invite family
        </button>
      </div>
    </aside>
  )
}
