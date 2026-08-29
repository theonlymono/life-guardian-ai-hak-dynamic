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

      <div className="mt-5">
        <div className="mb-2.5 flex items-center gap-1.5">
          <HugeiconsIcon
            icon={IdeaIcon}
            strokeWidth={1.5}
            className="size-3.5 shrink-0 text-[#0084ff]"
          />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.yourPlan}
          </span>
        </div>

        <ol className="space-y-2">
          {summary.plan.map((step, index) => (
            <li
              key={`${step.title}-${index}`}
              className="rounded-xl border border-border/50 bg-[#f7f8f9] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-semibold leading-none text-foreground">
                    {index + 1}
                  </span>
                  <h3 className="min-w-0 text-sm font-medium text-foreground">{step.title}</h3>
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {step.timeframe}
                </span>
              </div>

              <p className="mt-1.5 pl-[30px] text-[13px] leading-relaxed text-foreground">
                {step.detail}
              </p>
              <p className="mt-1.5 pl-[30px] text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium">{copy.basedOn}:</span> {step.basedOn}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{summary.caution}</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        {copy.summaryFooter}
      </p>
    </div>
  )
}
