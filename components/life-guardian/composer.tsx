"use client"

import { type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowUp01Icon,
  ComputerIcon,
  Mic01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { useSession } from "./session-provider"
import { t } from "./copy"

export function Composer({ compact = false }: { compact?: boolean }) {
  const { draft, setDraft, submitInput, loading, started, language, reset } = useSession()
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
      {!compact && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-[#0084ff]/25 via-[#4dd0e1]/20 to-[#a8d8f0]/15 blur-2xl"
        />
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/60 bg-white",
          compact
            ? "shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            : "border-border/50 shadow-[0_8px_40px_-12px_rgba(0,132,255,0.18),0_2px_12px_-4px_rgba(0,0,0,0.06)]",
        )}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          /* Explicit heights, not rows: a row is taller in Burmese than Latin. */
          className={cn(
            "w-full resize-none bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-60",
            compact ? "h-[46px] px-4 pt-3 pb-1" : "h-[116px] px-5 pt-5 pb-2 text-[15px]",
          )}
          placeholder={
            started ? copy.promptPlaceholderOngoing : copy.promptPlaceholder
          }
        />

        <div className={cn("flex items-center justify-between", compact ? "px-2 pb-2" : "px-3 pb-3")}>
          <div className="flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={reset}
              title={copy.startOver}
              aria-label={copy.startOver}
              className="size-8 shrink-0 rounded-full text-muted-foreground"
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} />
            </Button>
            <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-[#f7f8f9] px-2.5 text-[11px] text-muted-foreground">
              <HugeiconsIcon icon={ComputerIcon} strokeWidth={1.5} className="size-3.5" />
              Companion
            </span>
            <span className="hidden h-7 shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-[#f7f8f9] px-2.5 text-[11px] text-muted-foreground sm:flex">
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.5} className="size-3.5" />
              Gemini
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
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
              className="size-8 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30"
            >
              <HugeiconsIcon
                icon={ArrowUp01Icon}
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
