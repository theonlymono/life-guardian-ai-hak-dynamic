"use client"

import type { RiskLevel } from "@/lib/types/life-context"
import { useSession } from "./session-provider"
import { CATEGORY_LABELS, t } from "./copy"

const LEVEL_BAR: Record<RiskLevel, string> = {
  LOW: "bg-[#9aa4ae]",
  MEDIUM: "bg-[#0084ff]",
  HIGH: "bg-amber-500",
  CRITICAL: "bg-red-500",
}

const LEVEL_TEXT: Record<RiskLevel, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-[#003da5]",
  HIGH: "text-amber-700",
  CRITICAL: "text-red-700",
}

export function LifePulse() {
  const { context, language } = useSession()
  const copy = t(language)

  if (!context || context.risks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{copy.lifePulseEmpty}</p>
    )
  }

  const risks = [...context.risks].sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {risks.map((risk) => (
          <div key={risk.category}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                {CATEGORY_LABELS[risk.category][language]}
              </span>
              <span className={`text-xs font-semibold ${LEVEL_TEXT[risk.level]}`}>
                {risk.level} · {risk.score}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#eceef0]">
              <div
                className={`h-full rounded-full transition-all ${LEVEL_BAR[risk.level]}`}
                style={{ width: `${Math.max(risk.score, 2)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {risk.explanation}
            </p>
          </div>
        ))}
      </div>

      <p className="rounded-xl bg-[#f7f8f9] p-3 text-xs leading-relaxed text-muted-foreground">
        {copy.pulseNote}
      </p>
    </div>
  )
}

export function KnownFacts() {
  const { context, language } = useSession()
  const copy = t(language)

  if (!context) return null

  const { profile, lifeEvents, commitments, unknownImportantInformation } = context
  const hasProfile =
    profile.age !== undefined ||
    profile.dependents !== undefined ||
    profile.incomeStructure !== undefined

  if (!hasProfile && lifeEvents.length === 0 && commitments.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {hasProfile && (
        <div className="flex flex-wrap gap-1.5">
          {profile.age !== undefined && (
            <Fact label={copy.age} value={String(profile.age)} />
          )}
          {profile.dependents !== undefined && (
            <Fact label={copy.dependents} value={String(profile.dependents)} />
          )}
          {profile.incomeStructure && (
            <Fact label={copy.income} value={copy[profile.incomeStructure]} />
          )}
        </div>
      )}

      {lifeEvents.length > 0 && (
        <ul className="space-y-1.5">
          {lifeEvents.map((event) => (
            <li key={event.id} className="text-sm text-muted-foreground">
              <span className="text-foreground">{event.description}</span>
              {event.timeHorizon ? ` · ${event.timeHorizon}` : ""}
            </li>
          ))}
        </ul>
      )}

      {commitments.length > 0 && (
        <ul className="space-y-1.5">
          {commitments.map((commitment) => (
            <li key={commitment.id} className="text-sm text-muted-foreground">
              <span className="text-foreground">{commitment.description}</span>
              {commitment.amount !== undefined
                ? ` · ${commitment.amount.toLocaleString()} ${commitment.currency ?? ""}`.trimEnd()
                : ""}
            </li>
          ))}
        </ul>
      )}

      {unknownImportantInformation.length > 0 && (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.stillNeeded}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unknownImportantInformation.map((item) => (
              <span
                key={item}
                className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-[#f7f8f9] px-3 py-1 text-xs text-muted-foreground">
      {label}: <span className="font-medium text-foreground">{value}</span>
    </span>
  )
}

export function CompletedActions() {
  const { context, language } = useSession()
  const copy = t(language)
  const completed = context?.completedActions ?? []

  if (completed.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.completedEmpty}</p>
  }

  return (
    <ol className="space-y-3">
      {[...completed].reverse().map((item, index) => (
        <li
          key={`${item.actionId}-${index}`}
          className="rounded-xl border border-border/50 bg-white p-4"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#003da5]">
            {item.focus}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.question}</p>
          <p className="mt-1.5 text-sm font-medium text-foreground">
            {copy.yourAnswer}: {String(item.answer)}
          </p>
        </li>
      ))}
    </ol>
  )
}

export function Thread() {
  const { thread, language } = useSession()
  const copy = t(language)

  if (thread.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.historyEmpty}</p>
  }

  return (
    <div className="space-y-3">
      {thread.map((item) => (
        <div
          key={item.id}
          className={
            item.role === "user"
              ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#0084ff]/10 px-4 py-2.5 text-sm text-foreground"
              : "max-w-[92%] rounded-2xl rounded-bl-md bg-[#f7f8f9] px-4 py-2.5 text-sm leading-relaxed text-foreground"
          }
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}
