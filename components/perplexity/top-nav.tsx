"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Calendar01Icon,
  Megaphone01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

const categories = ["Finance", "Family", "Health", "Education", "Housing"]

export function TopNav() {
  return (
    <header className="relative flex h-14 shrink-0 items-center px-6">
      <nav className="absolute inset-x-0 flex items-center justify-center gap-6 pointer-events-none">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className="pointer-events-auto text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {category}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full border-border/80 bg-white px-3 text-xs font-normal shadow-none"
        >
          <HugeiconsIcon icon={Calendar01Icon} strokeWidth={1.5} className="size-3.5" />
          Scheduled
          <span className="flex size-4 items-center justify-center rounded-full bg-[#eceef0] text-[10px] font-medium">
            1
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={1.5} className="size-3" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-full border-border/80 bg-white px-2.5 text-xs font-normal shadow-none"
        >
          <HugeiconsIcon icon={ViewIcon} strokeWidth={1.5} className="size-3.5" />
          4K
        </Button>

        <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
          <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={1.5} />
        </Button>

        <Avatar size="sm" className="size-7">
          <AvatarFallback className="bg-[#eceef0] text-xs">U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
