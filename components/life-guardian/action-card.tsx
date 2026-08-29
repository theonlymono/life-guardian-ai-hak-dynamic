"use client"

import { useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { useSession } from "./session-provider"
import { t } from "./copy"

export function ActionCard() {
  const { currentAction, submitAnswer, loading, language, questionsAnswered, questionsTotal } =
    useSession()
  const [value, setValue] = useState("")
  const copy = t(language)

  if (!currentAction) return null

  const action = currentAction
  const canSend = value.trim().length > 0 && !loading

  function send(answer: string | number | boolean) {
    // Clear here rather than when the next question arrives: sending is the
    // only route to one, and the field should empty the moment they hit send.
    setValue("")
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
      <div className="mb-2 flex h-6 items-center gap-2">
        <span className="rounded-full bg-[#0084ff]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#003da5]">
          {action.focus}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.5} className="size-3" />
          {action.estimatedMinutes} {copy.minutes}
        </span>
        {/* The count is the promise that this ends. */}
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="whitespace-nowrap">
            {copy.questionProgress} {Math.min(questionsAnswered + 1, questionsTotal)} {copy.of}{" "}
            {questionsTotal}
          </span>
          <span className="flex gap-1">
            {Array.from({ length: questionsTotal }).map((_, index) => (
              <span
                key={index}
                className={
                  index < questionsAnswered
                    ? "size-1.5 rounded-full bg-[#0084ff]"
                    : index === questionsAnswered
                      ? "size-1.5 rounded-full bg-[#0084ff]/40"
                      : "size-1.5 rounded-full bg-border"
                }
              />
            ))}
          </span>
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
            <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-border/70 bg-[#f7f8f9] pr-4 transition-colors focus-within:border-[#0084ff]/50 focus-within:bg-white">
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                inputMode={action.actionType === "numeric_input" ? "decimal" : "text"}
                placeholder={
                  action.actionType === "numeric_input" ? copy.enterNumber : copy.typeAnswer
                }
                className="h-full min-w-0 flex-1 rounded-full bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
              />
              {/* Without the unit, "2" could be two months or two hundred thousand. */}
              {action.unitHint ? (
                <span className="shrink-0 whitespace-nowrap text-[13px] text-muted-foreground">
                  {action.unitHint}
                </span>
              ) : null}
            </div>
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
