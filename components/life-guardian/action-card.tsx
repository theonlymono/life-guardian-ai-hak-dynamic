"use client"

import { useEffect, useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { useSession } from "./session-provider"
import { t } from "./copy"

export function ActionCard() {
  const { currentAction, submitAnswer, loading, language } = useSession()
  const [value, setValue] = useState("")
  const copy = t(language)

  // A new question deserves an empty field, not the previous answer.
  useEffect(() => {
    setValue("")
  }, [currentAction?.id])

  if (!currentAction) return null

  const action = currentAction
  const canSend = value.trim().length > 0 && !loading

  function send(answer: string | number | boolean) {
    void submitAnswer(answer)
  }

  function sendTyped() {
    if (!canSend) return
    const trimmed = value.trim()
    if (action.actionType === "numeric_input") {
      const numeric = Number(trimmed.replace(/[^0-9.-]/g, ""))
      send(Number.isFinite(numeric) && trimmed !== "" ? numeric : trimmed)
      return
    }
    send(trimmed)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      sendTyped()
    }
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-[#0084ff]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#003da5]">
          {action.focus}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.5} className="size-3" />
          {action.estimatedMinutes} {copy.minutes}
        </span>
      </div>

      <h2 className="text-base font-medium text-foreground">{action.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {action.reason}
      </p>

      <p className="mt-4 text-[15px] font-medium leading-relaxed text-foreground">
        {action.question}
      </p>

      <div className="mt-4">
        {action.actionType === "multiple_choice" && action.options?.length ? (
          <div className="flex flex-wrap gap-2">
            {action.options.map((option) => (
              <Button
                key={option}
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => send(option)}
                className="h-9 rounded-full border-border/70 bg-white px-4 text-sm font-normal shadow-none hover:border-[#0084ff]/40 hover:bg-[#0084ff]/5 hover:text-foreground"
              >
                {option}
              </Button>
            ))}
          </div>
        ) : action.actionType === "confirmation" ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => send(true)}
              className="h-9 rounded-full border-border/70 bg-white px-5 text-sm font-normal shadow-none hover:border-[#0084ff]/40 hover:bg-[#0084ff]/5"
            >
              {copy.yes}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => send(false)}
              className="h-9 rounded-full border-border/70 bg-white px-5 text-sm font-normal shadow-none hover:border-[#0084ff]/40 hover:bg-[#0084ff]/5"
            >
              {copy.no}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              inputMode={action.actionType === "numeric_input" ? "decimal" : "text"}
              placeholder={
                action.actionType === "numeric_input"
                  ? copy.enterNumber
                  : copy.typeAnswer
              }
              className="h-10 min-w-0 flex-1 rounded-full border border-border/70 bg-[#f7f8f9] px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[#0084ff]/50 focus:bg-white disabled:opacity-60"
            />
            <Button
              size="icon-sm"
              disabled={!canSend}
              onClick={sendTyped}
              aria-label={copy.send}
              className="size-9 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className={loading ? "animate-pulse" : undefined}
              />
            </Button>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{action.expectedImpact}</p>
    </div>
  )
}
