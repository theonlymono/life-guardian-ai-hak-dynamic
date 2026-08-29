import { cn } from "@/lib/utils"

export function PerplexityLogo({
  className,
  size = "lg",
}: {
  className?: string
  size?: "sm" | "lg"
}) {
  const iconSize = size === "lg" ? 28 : 20
  const textSize = size === "lg" ? "text-2xl" : "text-base"

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden
      >
        <rect
          x="2"
          y="2"
          width="24"
          height="24"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="10" cy="12" r="1.5" fill="currentColor" />
        <circle cx="18" cy="12" r="1.5" fill="currentColor" />
        <path
          d="M10 18c2 2 6 2 8 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "font-normal tracking-tight text-foreground lowercase",
          textSize
        )}
      >
        perplexity computer
      </span>
    </div>
  )
}

export function PerplexityMark({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
