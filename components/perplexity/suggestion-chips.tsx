"use client"

import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Presentation01Icon,
  Analytics01Icon,
  PaintBoardIcon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons"

const suggestions = [
  { label: "Create a slide deck", icon: Presentation01Icon },
  { label: "Research a market", icon: Analytics01Icon },
  { label: "Create an interactive mood board", icon: PaintBoardIcon },
]

export function SuggestionChips() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
      {suggestions.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-full border-border/70 bg-white px-4 text-sm font-normal text-muted-foreground shadow-none hover:bg-[#f7f8f9] hover:text-foreground"
        >
          <HugeiconsIcon icon={item.icon} strokeWidth={1.5} className="size-4" />
          {item.label}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-9 rounded-full text-muted-foreground"
      >
        <HugeiconsIcon icon={ShuffleIcon} strokeWidth={1.5} />
      </Button>
    </div>
  )
}
