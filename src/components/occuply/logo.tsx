import Image from "next/image"
import { cn } from "@/lib/utils"

const SIZES = {
  sm: "h-7",
  md: "h-9",
  // Large enough that the "Property Management System" line under the wordmark
  // is actually readable rather than a grey smudge.
  lg: "h-12",
} as const

/** The lockup is the supplied artwork: the icon and wordmark are never
 *  rearranged or redrawn, and Primary Orange is untouched in both themes. The
 *  only difference on dark is that the charcoal ink is carried to white so it
 *  stays legible against the dark surface. Exported at 610x192, which covers a
 *  3x display at the rendered size. */
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
        width={610}
        height={192}
        priority={priority}
        className="h-full w-auto dark:hidden"
      />
      <Image
        src="/logo-full-dark.png"
        alt=""
        aria-hidden
        width={610}
        height={192}
        priority={priority}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  )
}

/** The icon on its own, used when the sidebar is collapsed. Its inner shape is
 *  charcoal as well, so it gets the same treatment. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  // The caller controls visibility on the wrapper, so the theme swap inside
  // cannot fight it: a `dark:block` on the image itself would override a
  // `hidden` the caller applied.
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <Image
        src="/logo-mark.png"
        alt=""
        aria-hidden
        width={128}
        height={128}
        className="size-full object-contain dark:hidden"
      />
      <Image
        src="/logo-mark-dark.png"
        alt=""
        aria-hidden
        width={128}
        height={128}
        className="absolute inset-0 hidden size-full object-contain dark:block"
      />
    </span>
  )
}
