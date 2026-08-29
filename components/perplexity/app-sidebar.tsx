"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Analytics01Icon,
  File01Icon,
  Settings01Icon,
  Clock01Icon,
  Notification01Icon,
  UserAdd01Icon,
  SidebarLeftIcon,
  ComputerIcon,
} from "@hugeicons/core-free-icons"
import { PerplexityMark } from "./perplexity-logo"

const navItems = [
  { label: "Today", icon: ComputerIcon, active: true },
  { label: "Life Pulse", icon: Analytics01Icon, active: false },
  { label: "Actions", icon: File01Icon, active: false },
  { label: "History", icon: Clock01Icon, active: false },
  { label: "Settings", icon: Settings01Icon, active: false },
]

export function AppSidebar() {
  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-border/60 bg-[#f7f8f9]">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <PerplexityMark className="size-6 text-foreground" />
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
          <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <Button
          variant="outline"
          className="h-9 w-full justify-start gap-2 rounded-lg border-border/80 bg-white px-3 text-sm font-normal shadow-none hover:bg-white"
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="size-4" />
          New
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 pt-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              item.active
                ? "bg-[#eceef0] font-medium text-foreground"
                : "text-muted-foreground hover:bg-[#eceef0]/60 hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={item.icon} strokeWidth={1.5} className="size-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="space-y-2 border-t border-border/60 p-3">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar size="sm">
            <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Alex" />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">Life Companion</span>
              <span className="rounded bg-[#0084ff]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#003da5]">
                AI
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground">
            <HugeiconsIcon icon={Notification01Icon} strokeWidth={1.5} />
          </Button>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-[#eceef0]/60 hover:text-foreground"
        >
          <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={1.5} className="size-4" />
          Invite family
        </button>
      </div>
    </aside>
  )
}
