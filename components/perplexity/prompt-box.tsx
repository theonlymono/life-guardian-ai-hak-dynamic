"use client"

import { useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  SearchIcon,
  ComputerIcon,
  Mic01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import type { AnalyzeResponse, ApiErrorBody } from "@/lib/types/api"
import type { RiskLevel } from "@/lib/types/life-context"

const LEVEL_STYLES: Record<RiskLevel, string> = {
  LOW: "bg-[#f7f8f9] text-muted-foreground",
  MEDIUM: "bg-[#0084ff]/10 text-[#003da5]",
  HIGH: "bg-amber-500/15 text-amber-700",
  CRITICAL: "bg-red-500/15 text-red-700",
}

export function PromptBox() {
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)

  async function submit() {
    const input = value.trim()
    if (!input || loading) return

    setLoading(true)
    setError(null)

    try {
      // No language field: the backend detects Myanmar script and falls back to English.
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })
      const data = (await response.json()) as AnalyzeResponse | ApiErrorBody

      if (!data.success) {
        setError(data.error.message)
        return
      }
      setResult(data)
      setValue("")
    } catch {
      setError("We couldn't reach Life Guardian. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void submit()
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
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={3}
          className="w-full resize-none bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
          placeholder="Tell me what is changing in your life today..."
        />

        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-full text-muted-foreground"
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-full text-muted-foreground"
            >
              <HugeiconsIcon icon={SearchIcon} strokeWidth={1.5} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-full border-border/70 bg-[#f7f8f9] px-3 text-xs font-normal shadow-none"
            >
              <HugeiconsIcon icon={ComputerIcon} strokeWidth={1.5} className="size-3.5" />
              Companion
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={1.5} className="size-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-border/70 bg-[#f7f8f9] px-3 text-xs font-normal shadow-none"
            >
              Life Pulse
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={1.5} className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-full text-muted-foreground"
            >
              <HugeiconsIcon icon={Mic01Icon} strokeWidth={1.5} />
            </Button>
            <Button
              size="icon-sm"
              onClick={() => void submit()}
              disabled={loading || value.trim().length === 0}
              aria-label="Send"
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

      {error && (
        <div className="relative mt-4 rounded-2xl border border-red-500/25 bg-red-500/5 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="relative mt-4 max-h-[42vh] space-y-3 overflow-y-auto rounded-2xl border border-border/50 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
          <p className="text-[15px] leading-relaxed text-foreground">
            {result.assistantMessage}
          </p>

          <div className="rounded-xl bg-[#f7f8f9] p-4">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#003da5]">
              {result.dailyAction.focus} · {result.dailyAction.estimatedMinutes} min
            </div>
            <div className="text-sm font-medium text-foreground">
              {result.dailyAction.title}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.dailyAction.reason}
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              {result.dailyAction.question}
            </p>
            {result.dailyAction.options && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.dailyAction.options.map((option) => (
                  <span
                    key={option}
                    className="rounded-full border border-border/70 bg-white px-3 py-1 text-xs text-muted-foreground"
                  >
                    {option}
                  </span>
                ))}
              </div>
            )}
          </div>

          {result.context.risks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.context.risks.map((risk) => (
                <span
                  key={risk.category}
                  title={risk.explanation}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${LEVEL_STYLES[risk.level]}`}
                >
                  {risk.category} {risk.score}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
