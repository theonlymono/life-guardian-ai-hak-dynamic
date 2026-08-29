"use client"

import { useState } from "react"
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

export function PromptBox() {
  const [value, setValue] = useState("")

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
          rows={3}
          className="w-full resize-none bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
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
              className="size-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
