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
      <LifeGuardianMark className="text-[#0084ff]" size={iconSize} />
      <span
        className={cn(
          "font-medium tracking-tight text-foreground",
          textSize
        )}
      >
        Life Guardian <span className="text-[#0084ff]">AI</span>
      </span>
    </div>
  )
}

export function LifeGuardianMark({
  className,
  size = 24,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M14 3.5c2.8 1.8 5.8 2.6 9 2.6v7.4c0 5.4-3.6 9.2-9 11.5-5.4-2.3-9-6.1-9-11.5V6.1c3.2 0 6.2-.8 9-2.6Z"
        fill="#0084ff"
      />
      <path
        d="M14 10.2c-1.8 1.7-4.4 1.4-4.4 3.7 0 1.3 1.1 2.3 2.3 3.1 1.2.8 2.1 1.3 2.1 1.3s.9-.5 2.1-1.3c1.2-.8 2.3-1.8 2.3-3.1 0-2.3-2.6-2-4.4-3.7Z"
        fill="#4dd0e1"
      />
    </svg>
  )
}
