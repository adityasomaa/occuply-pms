import * as React from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
   Surface primitives. Everything sits on a white card with a hairline border
   and a generous inset, which is what gives the app its open feel.
--------------------------------------------------------------------------- */

export const tileTone = {
  orange: "bg-tile-orange text-tile-orange-fg",
  green: "bg-tile-green text-tile-green-fg",
  blue: "bg-tile-blue text-tile-blue-fg",
  violet: "bg-tile-violet text-tile-violet-fg",
} as const

export type TileTone = keyof typeof tileTone

export interface Stat {
  label: string
  value: string
  delta?: number
  hint?: string
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  tone?: TileTone
  /** Lower is better, so a fall reads as good news. */
  invertDelta?: boolean
}

export function StatCard({ label, value, delta, hint, icon: Icon, tone = "orange", invertDelta }: Stat) {
  const dir = delta === undefined ? null : delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat"
  const good = dir === (invertDelta ? "down" : "up")
  const Arrow = dir === "down" ? TrendingDownIcon : TrendingUpIcon

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
      {Icon ? (
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", tileTone[tone])}>
          <Icon className="size-[1.35rem]" strokeWidth={1.9} />
        </span>
      ) : null}

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-[0.8125rem] text-muted-foreground">{label}</p>
        <p className="num truncate text-2xl font-bold leading-tight tracking-tight">{value}</p>
        {dir ? (
          <p
            className={cn(
              "num flex items-center gap-1 text-xs font-medium",
              dir === "flat" ? "text-muted-foreground" : good ? "text-status-ok" : "text-destructive",
            )}
          >
            <Arrow className="size-3.5" strokeWidth={2.25} />
            {Math.abs(delta as number).toFixed(0)}% from last month
          </p>
        ) : hint ? (
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}

export function StatStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  )
}

/** A framed region. `flush` keeps the header rule and lets the body run edge to
 *  edge, which is what tables and divided lists need. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush = true,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  flush?: boolean
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {title ? (
        <header
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 px-5 py-4",
            flush && "border-b border-border",
          )}
        >
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight">{title}</h2>
            {description ? <p className="truncate text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(!flush && "px-5 pb-5", bodyClassName)}>{children}</div>
    </section>
  )
}

const dotTone = {
  ok: "bg-status-ok",
  warn: "bg-status-warn",
  risk: "bg-status-risk",
  info: "bg-status-info",
  idle: "bg-status-idle",
  accent: "bg-accent",
  track: "bg-track",
} as const

export function StatusDot({
  tone,
  pulse,
  className,
}: {
  tone: keyof typeof dotTone
  pulse?: boolean
  className?: string
}) {
  return (
    <span className={cn("relative flex size-2 shrink-0", className)}>
      {pulse ? (
        <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", dotTone[tone])} />
      ) : null}
      <span className={cn("relative inline-flex size-full rounded-full", dotTone[tone])} />
    </span>
  )
}

/** Inline horizontal meter, used where a chart would be overkill. */
export function Meter({
  value,
  max = 100,
  tone = "accent",
  className,
}: {
  value: number
  max?: number
  tone?: keyof typeof dotTone
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <span className={cn("block h-1.5 w-full overflow-hidden rounded-full bg-track", className)}>
      <span
        className={cn("ease-occuply block h-full rounded-full transition-[width] duration-500", dotTone[tone])}
        style={{ width: `${pct}%` }}
      />
    </span>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mx-auto max-w-[42ch] text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

/** SVG donut, rendered on the server. No chart runtime, exact control. */
export function Donut({
  segments,
  size = 170,
  thickness = 24,
  children,
}: {
  segments: { value: number; className: string }[]
  size?: number
  thickness?: number
  children?: React.ReactNode
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r

  // Offsets are derived up front so nothing mutates while the tree renders.
  const arcs = segments.reduce<{ len: number; offset: number; className: string }[]>((acc, seg) => {
    const len = (seg.value / total) * c
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].len
    acc.push({ len, offset, className: seg.className })
    return acc
  }, [])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-track" />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={thickness}
            strokeDasharray={`${arc.len} ${c - arc.len}`}
            strokeDashoffset={-arc.offset}
            className={arc.className}
          />
        ))}
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
      ) : null}
    </div>
  )
}
