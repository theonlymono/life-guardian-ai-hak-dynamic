import { AppSidebar } from "@/components/perplexity/app-sidebar"
import { TopNav } from "@/components/perplexity/top-nav"
import { PerplexityLogo } from "@/components/perplexity/perplexity-logo"
import { PromptBox } from "@/components/perplexity/prompt-box"
import { SuggestionChips } from "@/components/perplexity/suggestion-chips"

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="relative flex flex-1 flex-col items-center justify-center px-6 pb-24">
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
          </div>
          <SuggestionChips />
        </main>
      </div>
    </div>
  )
}
