"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { PerplexityLogo } from "@/components/perplexity/perplexity-logo"
import { useSession } from "./session-provider"
import { t } from "./copy"

type Mode = "login" | "signup"

/**
 * Sign-in laid out after Relume's: a centred card, labelled fields, one
 * full-width dark button, and the opposite mode offered underneath.
 *
 * Username and password only. No email is collected, which means no reset
 * link — the card says so rather than letting someone discover it the hard way.
 */
export function AuthDialog({ onClose }: { onClose: () => void }) {
  const { language, signIn, signUp } = useSession()
  const copy = t(language)

  const [mode, setMode] = useState<Mode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === "signup"

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError(null)
    const reason = isSignup
      ? await signUp(username.trim(), password)
      : await signIn(username.trim(), password)
    setBusy(false)

    if (!reason) {
      onClose()
      return
    }

    setError(
      reason === "taken"
        ? copy.authTaken
        : reason === "invalid"
          ? copy.authInvalid
          : reason === "unavailable"
            ? copy.authUnavailable
            : copy.authBadCredentials,
    )
  }

  function switchMode() {
    setMode(isSignup ? "login" : "signup")
    setError(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[380px] rounded-2xl border border-border/60 bg-white p-7 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)]">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={copy.authClose}
          className="absolute right-3 top-3 size-8 text-muted-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} />
        </Button>

        <div className="mb-6 flex justify-center">
          <PerplexityLogo />
        </div>

        <h2 className="text-[19px] font-semibold text-foreground">
          {isSignup ? copy.authTitleUp : copy.authTitleIn}
        </h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          {copy.authGuestNote}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <Field
            label={copy.username}
            value={username}
            onChange={setUsername}
            autoComplete="username"
            autoFocus
          />
          <Field
            label={copy.password}
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
          />

          {error && (
            <p className="rounded-lg bg-[#fff4ed] px-3 py-2 text-[12px] leading-relaxed text-[#b23c00]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={busy || username.trim() === "" || password === ""}
            className="h-10 w-full rounded-lg bg-foreground text-sm font-normal text-background hover:bg-foreground/90 disabled:opacity-40"
          >
            {busy ? copy.authWorking : isSignup ? copy.signUp : copy.logIn}
          </Button>
        </form>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {isSignup ? `${copy.authRules} ${copy.authNoReset}` : copy.authNoReset}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
          <span className="text-[12px] text-muted-foreground">
            {isSignup ? copy.haveAccount : copy.noAccount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={switchMode}
            className="h-8 rounded-lg border-border/70 bg-white px-3.5 text-[12px] font-normal shadow-none"
          >
            {isSignup ? copy.logIn : copy.signUp}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  autoFocus?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="h-10 w-full rounded-lg border border-border/70 bg-[#f7f8f9] px-3 text-base text-foreground outline-none transition-colors focus:border-[#0084ff]/50 focus:bg-white sm:text-sm"
      />
    </label>
  )
}
