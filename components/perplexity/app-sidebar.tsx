"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Analytics01Icon,
  File01Icon,
  IdeaIcon,
  Clock01Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons"
import { LifeGuardianMark } from "./perplexity-logo"
import { useSession, type PanelKey } from "@/components/life-guardian/session-provider"
import { t } from "@/components/life-guardian/copy"

const panelItems: {
  key: PanelKey
  labelKey: "lifePulse" | "knownAbout" | "completedActions"
  icon: typeof Analytics01Icon
}[] = [
  { key: "pulse", labelKey: "lifePulse", icon: Analytics01Icon },
  { key: "known", labelKey: "knownAbout", icon: IdeaIcon },
  { key: "actions", labelKey: "completedActions", icon: File01Icon },
]

export function AppSidebar() {
  const {
    reset,
    language,
    context,
    title,
    started,
    openPanels,
    togglePanel,
    followUpStatus,
    conversations,
    conversationId,
    openConversation,
    deleteConversation,
    navOpen,
    setNavOpen,
  } = useSession()
  const copy = t(language)

  /** On a phone the drawer covers the conversation, so acting closes it. */
  function act(run: () => void) {
    run()
    setNavOpen(false)
  }

  // The conversation in progress has not been written to storage until its
  // first reply lands, so it is shown from live state to keep the list honest
  // about what is open right now.
  const entries = conversations.some((item) => item.id === conversationId)
    ? conversations
    : started
      ? [{ id: conversationId, title }, ...conversations]
      : conversations

  const counts: Record<PanelKey, number> = {
    pulse: context?.risks.length ?? 0,
    known:
      (context ? Object.keys(context.profile).length : 0) +
      (context?.lifeEvents.length ?? 0) +
      (context?.commitments.length ?? 0),
    actions: context?.completedActions.length ?? 0,
  }

  return (
    <>
      {/* Below md the sidebar slides over the content, so it needs something
          to dismiss it that is not the narrow strip beside it. */}
      {navOpen && (
        <button
          type="button"
          aria-label={copy.authClose}
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-[240px] shrink-0 flex-col border-r border-border/60 bg-[#f7f8f9] transition-transform duration-200 md:static md:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
      <div className="flex h-14 items-center gap-2 px-4">
        <LifeGuardianMark size={24} className="shrink-0" />
        {/* The product name stays Latin in both languages, so it never reflows. */}
        <span className="min-w-0 truncate text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground">
          Life Guardian <span className="text-[#0084ff]">AI</span>
        </span>
      </div>

      <div className="px-3 pb-2">
        <Button
          variant="outline"
          onClick={() => act(reset)}
          className="h-9 w-full justify-start gap-2 rounded-lg border-border/80 bg-white px-3 text-sm font-normal shadow-none hover:bg-white"
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="size-4 shrink-0" />
          <span className="min-w-0 truncate">{copy.newSession}</span>
        </Button>
      </div>

      <nav className="space-y-0.5 px-2 pt-1">
        {panelItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => act(() => togglePanel(item.key))}
            aria-pressed={openPanels[item.key]}
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
              openPanels[item.key]
                ? "bg-[#eceef0] font-medium text-foreground"
                : "text-muted-foreground hover:bg-[#eceef0]/60 hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={item.icon} strokeWidth={1.5} className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">
              {copy[item.labelKey]}
            </span>
            {counts[item.key] > 0 && (
              <span className="shrink-0 rounded bg-white px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {counts[item.key]}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2">
        <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.today}
        </div>
        {entries.length === 0 ? (
          <div className="px-3 text-[11px] leading-relaxed text-muted-foreground/70">
            {copy.lifePulseEmpty}
          </div>
        ) : (
          <div className="space-y-0.5">
            {entries.map((entry) => (
              <div key={entry.id} className="group relative">
                <button
                  type="button"
                  onClick={() =>
                    act(() => entry.id !== conversationId && openConversation(entry.id))
                  }
                  className={cn(
                    "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm transition-colors",
                    entry.id === conversationId
                      ? "bg-[#eceef0] text-foreground"
                      : "text-muted-foreground hover:bg-[#eceef0]/60 hover:text-foreground",
                  )}
                >
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.5} className="size-4 shrink-0" />
                  {/* Room reserved for the delete control so the label never
                      reflows when the row is hovered. */}
                  <span className="min-w-0 flex-1 truncate pr-5">
                    {entry.title ?? copy.untitled}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteConversation(entry.id)}
                  aria-label={copy.deleteChat}
                  title={copy.deleteChat}
                  className="absolute right-1.5 top-1/2 hidden size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:text-foreground group-hover:flex"
                >
                  <HugeiconsIcon icon={Delete01Icon} strokeWidth={1.5} className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border/60 p-3">
        {followUpStatus !== "idle" && (
          <div
            className={cn(
              "flex h-7 items-center truncate rounded-lg px-2.5 text-[11px]",
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
          <Avatar size="sm" className="shrink-0">
            <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Alex" />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            Life Companion
          </span>
          <span className="shrink-0 rounded bg-[#0084ff]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#003da5]">
            AI
          </span>
        </div>
      </div>
      </aside>
    </>
  )
}
