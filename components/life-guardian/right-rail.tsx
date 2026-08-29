"use client"

import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import type { RiskLevel } from "@/lib/types/life-context"
import { formatMoney } from "@/lib/i18n/money"
import { focusLabel, horizonLabel, unknownLabel } from "@/lib/i18n/context-labels"
import { useSession, type PanelKey } from "./session-provider"
import { CATEGORY_LABELS, t } from "./copy"

const LEVEL_BAR: Record<RiskLevel, string> = {
  LOW: "bg-[#c2c8ce]",
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

export function RightRail({ inline = false }: { inline?: boolean }) {
  const { context, language } = useSession()
  const copy = t(language)

  const risks = [...(context?.risks ?? [])].sort((a, b) => b.score - a.score)
  const completed = context?.completedActions ?? []
  const factCount =
    (context ? Object.keys(context.profile).length : 0) +
    (context?.lifeEvents.length ?? 0) +
    (context?.commitments.length ?? 0)

  return (
    <aside
      className={cn(
        "flex flex-col gap-2",
        // Below lg there is no room for a third column, so the same panels
        // ride along under the conversation instead of disappearing.
        inline
          ? "w-full border-t border-border/60 px-4 py-4 lg:hidden"
          : "hidden w-[268px] shrink-0 overflow-y-auto border-l border-border/60 px-3 py-4 lg:flex",
      )}
    >
      <Panel panelKey="pulse" title={copy.lifePulse} count={risks.length}>
        {risks.length === 0 ? (
          <Empty text={copy.lifePulseEmpty} />
        ) : (
          <div className="space-y-3">
            {risks.map((risk) => (
              <div key={risk.category}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-xs font-medium text-foreground">
                    {CATEGORY_LABELS[risk.category][language]}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-semibold tabular-nums",
                      LEVEL_TEXT[risk.level],
                    )}
                  >
                    {risk.score}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#eceef0]">
                  <div
                    className={cn("h-full rounded-full transition-all", LEVEL_BAR[risk.level])}
                    style={{ width: `${Math.max(risk.score, 2)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {risk.explanation}
                </p>
              </div>
            ))}
            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
              {copy.pulseNote}
            </p>
          </div>
        )}
      </Panel>

      <Panel panelKey="known" title={copy.knownAbout} count={factCount}>
        {!context || factCount === 0 ? (
          <Empty text={copy.knownEmpty} />
        ) : (
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1">
              {context.profile.age !== undefined && (
                <Chip label={copy.age} value={String(context.profile.age)} />
              )}
              {context.profile.dependents !== undefined && (
                <Chip label={copy.dependents} value={String(context.profile.dependents)} />
              )}
              {context.profile.incomeStructure && (
                <Chip
                  label={copy.income}
                  value={copy[context.profile.incomeStructure]}
                />
              )}
            </div>

            {context.lifeEvents.map((event) => (
              <p key={event.id} className="text-[11px] leading-relaxed text-foreground">
                {event.description}
                {event.timeHorizon ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {horizonLabel(event.timeHorizon, language)}
                  </span>
                ) : null}
              </p>
            ))}

            {context.commitments.map((item) => (
              <p key={item.id} className="text-[11px] leading-relaxed text-foreground">
                {item.description}
                {item.amount !== undefined ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatMoney(item.amount, item.currency, language)}
                  </span>
                ) : null}
              </p>
            ))}

            {context.unknownImportantInformation.length > 0 && (
              <div className="border-t border-border/60 pt-2">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.stillNeeded}
                </div>
                <div className="flex flex-wrap gap-1">
                  {context.unknownImportantInformation.map((item) => (
                    <span
                      key={item}
                      className="rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {unknownLabel(item, language)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel panelKey="actions" title={copy.completedActions} count={completed.length}>
        {completed.length === 0 ? (
          <Empty text={copy.completedEmpty} />
        ) : (
          <ol className="space-y-2.5">
            {[...completed].reverse().map((item, index) => (
              <li key={`${item.actionId}-${index}`}>
                <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-[#003da5]">
                  {focusLabel(item.focus, language)}
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {item.question}
                </p>
                <p className="text-[11px] font-medium text-foreground">
                  {copy.yourAnswer}: {String(item.answer)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </aside>
  )
}

function Panel({
  panelKey,
  title,
  count,
  children,
}: {
  panelKey: PanelKey
  title: string
  count: number
  children: React.ReactNode
}) {
  const { openPanels, togglePanel } = useSession()
  const open = openPanels[panelKey]

  return (
    <section className="rounded-xl border border-border/60 bg-white">
      <button
        type="button"
        onClick={() => togglePanel(panelKey)}
        aria-expanded={open}
        className="flex h-11 w-full items-center gap-2 px-3.5 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
          {title}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {count > 0 ? count : ""}
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={1.5}
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && <div className="border-t border-border/60 px-3.5 py-3">{children}</div>}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-[11px] leading-relaxed text-muted-foreground">{text}</p>
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded bg-[#f7f8f9] px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {label} <span className="font-medium text-foreground">{value}</span>
    </span>
  )
}
