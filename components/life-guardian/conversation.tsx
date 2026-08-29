"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import type { RiskLevel } from "@/lib/types/life-context"
import { ActionCard } from "./action-card"
import { SummaryCard } from "./summary-card"
import { CATEGORY_LABELS, t } from "./copy"
import { TURN_STEPS, useSession, type RiskMove, type Turn } from "./session-provider"

const MOVE_TEXT: Record<RiskLevel, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-[#003da5]",
  HIGH: "text-amber-700",
  CRITICAL: "text-red-700",
}

export function Conversation() {
  const { turns, currentAction, summary, loading, error, source, language } = useSession()
  const copy = t(language)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [turns, currentAction])

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-6">
      {source === "demo_backup" && (
        <div className="mb-4 rounded-lg border border-dashed border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          {copy.demoBackup}
        </div>
      )}

      <div className="space-y-7">
        {turns.map((turn) => (
          <TurnBlock key={turn.id} turn={turn} />
        ))}

        {!loading && currentAction && <ActionCard />}
        {!loading && !currentAction && summary && <SummaryCard />}

        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div ref={endRef} />
    </div>
  )
}

function TurnBlock({ turn }: { turn: Turn }) {
  const { language } = useSession()
  const copy = t(language)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl bg-[#f0f1f3] px-4 py-2 text-[14px] leading-relaxed text-foreground">
          {turn.userText}
        </p>
      </div>

      <div className="space-y-1">
        {TURN_STEPS[turn.kind].map((step, index) => (
          <StepRow
            key={step}
            label={copy[step]}
            /* Only the first step spins; the rest are simply not done yet. */
            state={turn.pending ? (index === 0 ? "running" : "waiting") : "done"}
          />
        ))}
      </div>

      {turn.assistantText && (
        <p className="text-[15px] leading-[1.75] text-foreground">{turn.assistantText}</p>
      )}

      {turn.riskMoves.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {turn.riskMoves.map((move) => (
            <RiskMoveChip key={move.category} move={move} />
          ))}
        </div>
      )}

      {turn.changes.length > 0 && (
        <div className="rounded-xl bg-[#f7f8f9] px-4 py-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.whatChanged}
          </div>
          <ul className="space-y-0.5">
            {turn.changes.map((change) => (
              <li key={change} className="text-[13px] text-foreground">
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function StepRow({
  label,
  state,
}: {
  label: string
  state: "running" | "waiting" | "done"
}) {
  return (
    <div className="flex min-h-7 items-center gap-2">
      <HugeiconsIcon
        icon={
          state === "done"
            ? CheckmarkCircle02Icon
            : state === "running"
              ? Loading03Icon
              : SparklesIcon
        }
        strokeWidth={1.5}
        className={cn(
          "size-3.5 shrink-0",
          state === "done" ? "text-[#0084ff]" : "text-muted-foreground",
          state === "running" && "animate-spin",
        )}
      />
      <span
        className={cn(
          "min-w-0 truncate text-[13px]",
          state === "waiting" ? "text-muted-foreground/50" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  )
}

function RiskMoveChip({ move }: { move: RiskMove }) {
  const { language } = useSession()
  const rising = move.toScore > move.fromScore

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-[#f7f8f9] px-2.5 py-1 text-[11px] font-medium",
        MOVE_TEXT[move.toLevel],
      )}
    >
      <HugeiconsIcon icon={Analytics01Icon} strokeWidth={1.5} className="size-3" />
      {CATEGORY_LABELS[move.category][language]}
      <span className="tabular-nums text-muted-foreground">
        {move.fromScore} {rising ? "↑" : "↓"} {move.toScore}
      </span>
      {move.fromLevel !== move.toLevel && <span>{move.toLevel}</span>}
    </span>
  )
}
