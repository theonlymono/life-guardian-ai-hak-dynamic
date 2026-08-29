"use client"

import { PerplexityLogo } from "@/components/perplexity/perplexity-logo"
import { SuggestionChips } from "@/components/perplexity/suggestion-chips"
import { Composer } from "./composer"
import { Conversation } from "./conversation"
import { RightRail } from "./right-rail"
import { useSession } from "./session-provider"
import { t } from "./copy"

export function Workspace() {
  const { started, loading, error, language } = useSession()
  const copy = t(language)

  if (!started) {
    return (
      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-16 sm:px-6 sm:pb-24">
        {/* Subtle grainy orb glow — design.md §4.1 */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#0084ff]/8 to-[#4dd0e1]/6 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
          style={{ filter: "url(#grainy-noise)" }}
        />

        <div className="relative mb-8 sm:mb-10">
          <PerplexityLogo />
        </div>

        <div className="relative w-full max-w-[680px]">
          <Composer />
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          {loading && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {copy.thinking}
            </p>
          )}
        </div>
        <SuggestionChips />
      </main>
    )
  }

  return (
    <div className="flex min-h-0 flex-1">
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Conversation />
          <RightRail inline />
        </div>

        <div className="shrink-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-5">
          <div className="mx-auto w-full max-w-[720px]">
            <Composer compact />
          </div>
        </div>
      </main>

      <RightRail />
    </div>
  )
}
