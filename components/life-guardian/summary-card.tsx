"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, IdeaIcon } from "@hugeicons/core-free-icons"
import { useSession } from "./session-provider"
import { t } from "./copy"

/**
 * Replaces the action card once the question limit is reached. This is the
 * point of the loop arriving somewhere: no further question, just what the
 * answers added up to.
 */
export function SummaryCard() {
  const { summary, language, questionsTotal } = useSession()
  const copy = t(language)

  if (!summary) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-center gap-1.5">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          strokeWidth={1.5}
          className="size-3.5 shrink-0 text-[#0084ff]"
        />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#003da5]">
          {copy.summaryDone} · {questionsTotal}/{questionsTotal}
        </span>
      </div>

      <h2 className="text-base font-medium text-foreground">{summary.headline}</h2>
      <p className="mt-2 text-[15px] leading-[1.75] text-foreground">{summary.situation}</p>

      <div className="mt-5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.whatMattersMost}
        </div>
        <ol className="space-y-2.5">
          {summary.priorities.map((item, index) => (
            <li key={`${item.focus}-${index}`} className="flex gap-2.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0084ff]/10 text-[11px] font-semibold leading-none text-[#003da5]">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{item.focus}</div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{item.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 flex gap-2.5 rounded-xl bg-[#f7f8f9] px-4 py-3">
        <HugeiconsIcon
          icon={IdeaIcon}
          strokeWidth={1.5}
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0">
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.considerNext}
          </div>
          <p className="text-[13px] leading-relaxed text-foreground">{summary.nextStep}</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {copy.summaryFooter}
      </p>
    </div>
  )
}
