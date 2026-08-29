"use client"

import { PerplexityLogo } from "@/components/perplexity/perplexity-logo"
import { PromptBox } from "@/components/perplexity/prompt-box"
import { SuggestionChips } from "@/components/perplexity/suggestion-chips"
import { ActionCard } from "./action-card"
import {
  CompletedActions,
  KnownFacts,
  LifePulse,
  Thread,
} from "./life-pulse"
import { useSession } from "./session-provider"
import { t } from "./copy"

export function Workspace() {
  const { started, view, thread, error, loading, changesDetected, source, language } =
    useSession()
  const copy = t(language)

  if (!started) {
    return (
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-24">
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

        <div className="relative mb-10">
          <PerplexityLogo />
        </div>

        <div className="relative w-full max-w-[680px]">
          <PromptBox />
          {error && <ErrorBanner message={error} />}
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
    <main className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto w-full max-w-[680px] space-y-4">
          {source === "demo_backup" && (
            <div className="rounded-xl border border-dashed border-border px-4 py-2 text-xs text-muted-foreground">
              {copy.demoBackup}
            </div>
          )}

          {view === "today" && (
            <>
              <Thread />
              {changesDetected.length > 0 && (
                <div className="rounded-xl bg-[#f7f8f9] p-4">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {copy.whatChanged}
                  </div>
                  <ul className="space-y-1">
                    {changesDetected.map((change) => (
                      <li key={change} className="text-sm text-foreground">
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ActionCard />
            </>
          )}

          {view === "pulse" && (
            <Section title={copy.lifePulse}>
              <LifePulse />
              <div className="mt-5 border-t border-border/60 pt-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.knownAbout}
                </div>
                <KnownFacts />
              </div>
            </Section>
          )}

          {view === "actions" && (
            <Section title={copy.completedActions}>
              <CompletedActions />
            </Section>
          )}

          {view === "history" && (
            <Section title={copy.history}>
              <Thread />
            </Section>
          )}

          {error && <ErrorBanner message={error} />}
          {loading && (
            <p className="text-sm text-muted-foreground">{copy.thinking}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-white/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-[680px]">
          <PromptBox />
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/5 px-5 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}
