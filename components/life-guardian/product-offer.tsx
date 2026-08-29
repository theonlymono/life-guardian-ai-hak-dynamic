"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon, ShieldKeyIcon } from "@hugeicons/core-free-icons"
import { matchProducts } from "@/lib/products/match"
import { DAIICHI } from "@/lib/products/daiichi"
import { useSession } from "./session-provider"
import { t } from "./copy"

/**
 * Shown only after the questions are done, and only if the customer asks.
 *
 * The engagement loop itself never mentions a product — an assistant that
 * steers toward a sale while still gathering facts is not worth trusting with
 * the facts. So the offer waits until the readout is complete, opens with a
 * question rather than a pitch, and takes "not now" for an answer.
 */
export function ProductOffer() {
  const { context, language, summary } = useSession()
  const copy = t(language)
  const [choice, setChoice] = useState<"unasked" | "shown" | "declined">("unasked")

  const matches = useMemo(
    () => (context ? matchProducts(context, language) : []),
    [context, language],
  )

  if (!summary || !context || choice === "declined") return null

  if (choice === "unasked") {
    return (
      <div className="mt-4 rounded-2xl border border-border/70 bg-[#f7f8f9] p-5">
        <div className="flex items-start gap-2.5">
          <HugeiconsIcon
            icon={ShieldKeyIcon}
            strokeWidth={1.5}
            className="mt-0.5 size-4 shrink-0 text-[#0084ff]"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{copy.offerQuestion}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {copy.offerNote}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setChoice("shown")}
            className="h-9 rounded-full bg-foreground px-5 text-sm font-normal text-background hover:bg-foreground/90"
          >
            {copy.offerYes}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChoice("declined")}
            className="h-9 rounded-full border-border/70 bg-white px-5 text-sm font-normal shadow-none"
          >
            {copy.offerNo}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/70 bg-white p-5">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={ShieldKeyIcon}
          strokeWidth={1.5}
          className="size-4 shrink-0 text-[#0084ff]"
        />
        <h3 className="min-w-0 text-sm font-medium text-foreground">{DAIICHI.name}</h3>
      </div>

      {matches.length === 0 ? (
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{copy.offerEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {matches.map((match) => (
            <li key={match.product.id} className="border-t border-border/50 pt-4 first:border-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="min-w-0 text-sm font-medium text-foreground">
                  {match.product.name}
                </h4>
                {match.product.brochure && (
                  <a
                    href={match.product.brochure}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] text-[#0084ff] hover:underline"
                  >
                    {copy.offerBrochure}
                    <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-3" />
                  </a>
                )}
              </div>

              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {match.reason}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground">
                {match.product.covers[language]}
              </p>

              <ul className="mt-2 space-y-0.5">
                {match.product.facts[language].map((fact) => (
                  <li key={fact} className="text-[11px] leading-relaxed text-muted-foreground">
                    · {fact}
                  </li>
                ))}
              </ul>

              {match.outsideEntryAge && (
                <p className="mt-2 rounded-lg bg-[#fff4ed] px-3 py-2 text-[11px] leading-relaxed text-[#b23c00]">
                  {copy.offerAgeNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-border/50 pt-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">{copy.offerDisclaimer}</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {copy.offerContact}:{" "}
          <a href={`tel:${DAIICHI.customerService}`} className="text-[#0084ff] hover:underline">
            {DAIICHI.customerService}
          </a>
        </p>
      </div>
    </div>
  )
}
