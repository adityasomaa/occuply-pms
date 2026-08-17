import Image from "next/image"
import { cn } from "@/lib/utils"

/** The lockup ships as supplied artwork. Per the brand guidelines the icon and
 *  wordmark are never rearranged, recoloured or redrawn, so both variants are
 *  the original files and only visibility is swapped between themes. */
export function LogoLockup({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("relative block h-7 w-[92px]", className)}>
      <Image
        src="/logo-full.png"
        alt="Occuply"
        fill
        sizes="120px"
        priority={priority}
        className="object-contain object-left dark:hidden"
      />
      <Image
        src="/logo-full-white.png"
        alt=""
        aria-hidden
        fill
        sizes="120px"
        priority={priority}
        className="hidden object-contain object-left dark:block"
      />
    </span>
  )
}

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/icon.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  )
}
