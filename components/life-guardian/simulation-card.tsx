"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { formatMoney, moneyUnit, toMyanmarDigits, unitMultiplier } from "@/lib/i18n/money"
import { simulateGoal, type GoalScenario } from "@/lib/simulation/goal"
import { useSession } from "./session-provider"
import { t } from "./copy"

export function SimulationCard() {
  const { simulation, language } = useSession()
  const copy = t(language)
  const [draft, setDraft] = useState("")

  if (!simulation) return null

  const unit = moneyUnit(simulation.currency, language)
  const typed = Number(draft.replace(/,/g, ""))
  // Re-running is pure arithmetic, so the answer can land as they type. It is
  // a rehearsal, not a commitment: nothing here is written back to the context.
  const preview =
    draft.trim() !== "" && Number.isFinite(typed) && typed >= 0
      ? simulateGoal({ ...simulation, monthlyContribution: typed * unitMultiplier(unit) })
      : undefined
  const shown = preview ?? simulation

  const money = (value: number) => formatMoney(value, simulation.currency, language)
  const count = (value: number) =>
    language === "my" ? toMyanmarDigits(String(value)) : String(value)

  return (
    <div className="mt-4 rounded-2xl border border-border/70 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{copy.projection}</h3>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {count(shown.monthsRemaining)} {copy.months}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        <Figure label={copy.saved} value={money(shown.currentAmount)} />
        <Figure label={copy.target} value={money(shown.targetAmount)} />
        <Figure label={copy.projected} value={money(shown.projected)} />
      </dl>

      <div
        className={cn(
          "mt-4 rounded-xl px-4 py-3",
          shown.onTrack ? "bg-[#0084ff]/5" : "bg-[#fff4ed]",
        )}
      >
        {shown.onTrack ? (
          <p className="text-[13px] font-medium text-[#003da5]">{copy.onTrack}</p>
        ) : (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {copy.gap}
            </span>
            <span className="min-w-0 text-right text-[15px] font-medium text-[#b23c00]">
              {money(shown.gap)}
            </span>
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {shown.scenarios.map((item) => (
          <ScenarioRow
            key={item.kind}
            scenario={item}
            money={money}
            count={count}
            language={language}
          />
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        <span className="shrink-0 text-[12px] text-muted-foreground">{copy.whatIf}</span>
        <div className="flex h-9 min-w-0 flex-1 items-center rounded-full border border-border/70 bg-[#f7f8f9] pr-3 transition-colors focus-within:border-[#0084ff]/50 focus-within:bg-white">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            inputMode="decimal"
            placeholder={copy.enterNumber}
            className="h-full min-w-0 flex-1 rounded-full bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground/60 sm:text-sm"
          />
          <span className="shrink-0 whitespace-nowrap text-[12px] text-muted-foreground">
            {unit}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {preview ? copy.whatIfHint : copy.projectionNote}
      </p>
    </div>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-[15px] font-medium text-foreground">{value}</dd>
    </div>
  )
}

function ScenarioRow({
  scenario,
  money,
  count,
  language,
}: {
  scenario: GoalScenario
  money: (value: number) => string
  count: (value: number) => string
  language: "en" | "my"
}) {
  const copy = t(language)
  const label =
    scenario.kind === "current_pace"
      ? copy.scenarioCurrent
      : scenario.kind === "required_pace"
        ? copy.scenarioRequired
        : copy.scenarioMoreTime

  return (
    <li className="flex items-baseline justify-between gap-3 border-t border-border/50 pt-2 text-[12px] first:border-0 first:pt-0">
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}</span>
        <span className="ml-2 text-foreground">
          {money(scenario.monthlyContribution)} {copy.perMonth}
          {scenario.kind === "more_time"
            ? ` · ${count(scenario.monthsRemaining)} ${copy.months}`
            : ""}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap",
          scenario.reachesGoal ? "text-[#003da5]" : "text-muted-foreground",
        )}
      >
        {scenario.reachesGoal ? copy.onTrack : `${copy.gap} ${money(scenario.gap)}`}
      </span>
    </li>
  )
}
