"use client"

import { type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  SearchIcon,
  ComputerIcon,
  Mic01Icon,
  ArrowRight01Icon,
  Analytics01Icon,
} from "@hugeicons/core-free-icons"
import { useSession } from "@/components/life-guardian/session-provider"
import { t } from "@/components/life-guardian/copy"

export function PromptBox() {
  const {
    draft,
    setDraft,
    submitInput,
    loading,
    started,
    language,
    setView,
    reset,
  } = useSession()
  const copy = t(language)
  const canSend = draft.trim().length > 0 && !loading

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void submitInput(draft)
    }
  }

  return (
    <div className="relative w-full">
      {/* Cyan glow behind input — design.md grainy gradient technique */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-[#0084ff]/25 via-[#4dd0e1]/20 to-[#a8d8f0]/15 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-white shadow-[0_8px_40px_-12px_rgba(0,132,255,0.18),0_2px_12px_-4px_rgba(0,0,0,0.06)]">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={started ? 2 : 3}
          className="w-full resize-none bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
          placeholder={
            started ? copy.promptPlaceholderOngoing : copy.promptPlaceholder
          }
        />

        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={reset}
              title={copy.startOver}
              aria-label={copy.startOver}
              className="size-8 rounded-full text-muted-foreground"
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setView("history")}
              title={copy.history}
              aria-label={copy.history}
              className="size-8 rounded-full text-muted-foreground"
            >
              <HugeiconsIcon icon={SearchIcon} strokeWidth={1.5} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("today")}
              className="h-8 gap-1.5 rounded-full border-border/70 bg-[#f7f8f9] px-3 text-xs font-normal shadow-none"
            >
              <HugeiconsIcon icon={ComputerIcon} strokeWidth={1.5} className="size-3.5" />
              Companion
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("pulse")}
              className="h-8 gap-1.5 rounded-full border-border/70 bg-[#f7f8f9] px-3 text-xs font-normal shadow-none"
            >
              <HugeiconsIcon icon={Analytics01Icon} strokeWidth={1.5} className="size-3.5" />
              {copy.lifePulse}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled
              title="Voice input is not part of this build"
              className="size-8 rounded-full text-muted-foreground disabled:opacity-30"
            >
              <HugeiconsIcon icon={Mic01Icon} strokeWidth={1.5} />
            </Button>
            <Button
              size="icon-sm"
              onClick={() => void submitInput(draft)}
              disabled={!canSend}
              aria-label={copy.send}
              className="size-8 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className={loading ? "animate-pulse" : undefined}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
