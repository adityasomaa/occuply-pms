import Image from "next/image"
import { cn } from "@/lib/utils"

const SIZES = {
  sm: "h-6",
  md: "h-7",
  lg: "h-9",
} as const

/** The lockup ships as supplied artwork. Per the brand guidelines the icon and
 *  wordmark are never rearranged, recoloured or redrawn, so both variants are
 *  the original files and only visibility is swapped between themes.
 *  Both are exported at 305x96, which covers a 3x display at the rendered size. */
export function LogoLockup({
  className,
  priority,
  size = "md",
}: {
  className?: string
  priority?: boolean
  size?: keyof typeof SIZES
}) {
  return (
    <span className={cn("inline-flex items-center", SIZES[size], className)}>
      <Image
        src="/logo-full.png"
        alt="Occuply"
        width={305}
        height={96}
        priority={priority}
        className="h-full w-auto dark:hidden"
      />
      <Image
        src="/logo-full-white.png"
        alt=""
        aria-hidden
        width={305}
        height={96}
        priority={priority}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  )
}

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      aria-hidden
      width={128}
      height={128}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  )
}
