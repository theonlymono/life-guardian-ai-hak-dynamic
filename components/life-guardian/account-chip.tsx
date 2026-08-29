"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { handleFor } from "@/lib/account/local-account"
import { AuthDialog } from "./auth-dialog"
import { useSession } from "./session-provider"
import { t } from "./copy"

/**
 * Shows who the work is being saved under.
 *
 * A guest is never pushed toward an account — the product's promise is that
 * you can start talking immediately — so the chip names the device-local
 * identity and offers sign-in beside it rather than in the way. Once signed
 * in, the same spot carries the username and the way back out.
 */
export function AccountChip() {
  const { account, user, language, signOut } = useSession()
  const copy = t(language)
  const [showAuth, setShowAuth] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Rendered only after the client has settled, which keeps the markup
  // identical on the server and avoids a hydration mismatch.
  if (!account) {
    return <div className="h-7 w-7 shrink-0" aria-hidden />
  }

  if (!user) {
    const handle = handleFor(account.id, language)
    return (
      <>
        <div className="flex min-w-0 items-center gap-1.5">
          <div
            className="flex h-7 min-w-0 items-center gap-1.5 rounded-full bg-[#eceef0] pl-0.5 pr-2.5"
            title={`${copy.accountKept} · ${account.id}`}
          >
            <Avatar size="sm" className="size-6 shrink-0">
              <AvatarFallback className="bg-[#0084ff] text-[10px] font-medium text-white">
                {handle.trim().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 truncate text-[11px] font-medium leading-none text-foreground">
              {handle}
            </span>
          </div>
          {/* A fixed width holds the row steady across languages, where the
              label is "Sign in" or "ဝင်ရန်". */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAuth(true)}
            className="h-7 w-[64px] shrink-0 rounded-full border-border/70 bg-white px-0 text-[11px] font-normal shadow-none"
          >
            <span className="truncate">{copy.signIn}</span>
          </Button>
        </div>
        {showAuth && <AuthDialog onClose={() => setShowAuth(false)} />}
      </>
    )
  }

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-full bg-[#eceef0] pl-0.5 pr-2.5"
      >
        <Avatar size="sm" className="size-6 shrink-0">
          <AvatarFallback className="bg-foreground text-[10px] font-medium text-background">
            {user.username.trim().charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-[11px] font-medium leading-none text-foreground">
          {user.username}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-9 z-50 w-40 rounded-xl border border-border/60 bg-white p-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.22)]">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              void signOut()
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-[12px] text-foreground hover:bg-[#f7f8f9]"
          >
            {copy.signOut}
          </button>
        </div>
      )}
    </div>
  )
}
