import * as React from "react"
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
   Dense-dashboard primitives.
   At this data density a grid of identical cards costs more pixels than it
   earns, so metrics sit on a divided strip and sections are framed by a single
   hairline instead of stacked elevation.
--------------------------------------------------------------------------- */

export interface Stat {
  label: string
  value: string
  delta?: number
  hint?: string
  emphasis?: boolean
}

export function StatStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 divide-border rounded-xl border border-border bg-card",
        "sm:grid-cols-2 sm:divide-x lg:grid-cols-4 xl:divide-x",
        "[&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:sm:border-b lg:[&>*]:border-b-0",
        "[&>*:nth-child(odd)]:border-r sm:[&>*:nth-child(odd)]:border-r-0",
        className,
      )}
    >
      {stats.map((s) => (
        <StatCell key={s.label} {...s} />
      ))}
    </div>
  )
}

function StatCell({ label, value, delta, hint, emphasis }: Stat) {
  const dir = delta === undefined ? null : delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat"
  const Icon = dir === "up" ? ArrowUpRightIcon : dir === "down" ? ArrowDownRightIcon : ArrowRightIcon

  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3.5 lg:px-5">
      <span className="label-brand truncate">{label}</span>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={cn(
            "num text-xl font-semibold leading-tight tracking-tight lg:text-2xl",
            emphasis && "text-accent-brand",
          )}
        >
          {value}
        </span>
        {dir ? (
          <span
            className={cn(
              "num inline-flex items-center gap-0.5 text-xs font-medium",
              dir === "up" && "text-status-ok",
              dir === "down" && "text-destructive",
              dir === "flat" && "text-muted-foreground",
            )}
          >
            <Icon className="size-3" strokeWidth={2.5} />
            {delta! > 0 ? "+" : ""}
            {delta!.toFixed(1)}%
          </span>
        ) : null}
      </div>
      {hint ? <span className="truncate text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

/** A framed region with a hairline header. Deliberately not a Card: no
 *  elevation, no nesting, so panels can hold tables without doubling borders. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 lg:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(bodyClassName)}>{children}</div>
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
        <span
          className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", dotTone[tone])}
        />
      ) : null}
      <span className={cn("relative inline-flex size-2 rounded-full", dotTone[tone])} />
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
    <span className={cn("block h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
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
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
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
