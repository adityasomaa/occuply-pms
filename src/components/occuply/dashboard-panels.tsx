import * as React from "react"
import Link from "next/link"
import { LightbulbIcon, PlusIcon } from "lucide-react"

import { Donut } from "@/components/occuply/primitives"
import { cn } from "@/lib/utils"

/* ------------------------------- shared bits ------------------------------- */

export function CardShell({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col rounded-2xl border border-border bg-card p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="truncate text-base font-semibold tracking-tight">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

export function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="ease-occuply inline-flex h-8 shrink-0 items-center rounded-lg border border-accent/35 px-3 text-xs font-medium text-accent-brand transition-colors duration-150 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      View All
    </Link>
  )
}

function LegendRow({
  dotClass,
  label,
  value,
  sub,
}: {
  dotClass: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", dotClass)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.8125rem] text-muted-foreground">{label}</p>
        {sub ? <p className="num truncate text-sm font-semibold">{sub}</p> : null}
      </div>
      {!sub ? <span className="num shrink-0 text-sm font-semibold">{value}</span> : null}
    </li>
  )
}

/* ------------------------------ recent activity ---------------------------- */

export interface ActivityItem {
  id: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  tone: "green" | "blue" | "orange" | "violet"
  title: string
  meta: string
  amount?: string
  badge?: { label: string; className: string }
  when: string
}

const activityTone = {
  green: "bg-tile-green text-tile-green-fg",
  blue: "bg-tile-blue text-tile-blue-fg",
  orange: "bg-tile-orange text-tile-orange-fg",
  violet: "bg-tile-violet text-tile-violet-fg",
}

export function RecentActivity({ items, href }: { items: ActivityItem[]; href: string }) {
  return (
    <CardShell title="Recent Activity" action={<ViewAll href={href} />}>
      <ul className="flex flex-col gap-4">
        {items.map((a) => {
          const Icon = a.icon
          return (
            <li key={a.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  activityTone[a.tone],
                )}
              >
                <Icon className="size-[1.05rem]" strokeWidth={1.9} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">{a.meta}</p>
              </div>

              <div className="shrink-0 text-right">
                {a.amount ? <p className="num text-sm font-semibold">{a.amount}</p> : null}
                {a.badge ? (
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-medium",
                      a.badge.className,
                    )}
                  >
                    {a.badge.label}
                  </span>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground">{a.when}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </CardShell>
  )
}

/* ------------------------------ occupancy rate ----------------------------- */

export function OccupancyCard({
  occupiedPct,
  occupied,
  vacant,
  unitWord,
}: {
  occupiedPct: number
  occupied: number
  vacant: number
  unitWord: string
}) {
  return (
    <CardShell title="Occupancy Rate">
      <div className="flex flex-1 flex-wrap items-center justify-center gap-6">
        <Donut
          size={170}
          thickness={26}
          segments={[{ value: occupiedPct, className: "stroke-accent" }]}
        >
          <span className="num text-3xl font-bold leading-none">{Math.round(occupiedPct)}%</span>
          <span className="mt-1 text-xs text-muted-foreground">Occupied</span>
        </Donut>

        <div className="flex min-w-[9rem] flex-col gap-4">
          <ul className="flex flex-col gap-3.5">
            <LegendRow
              dotClass="bg-accent"
              label={`Occupied ${unitWord}`}
              value=""
              sub={`${occupied} ${unitWord}`}
            />
            <LegendRow
              dotClass="bg-track"
              label={`Vacant ${unitWord}`}
              value=""
              sub={`${vacant} ${unitWord}`}
            />
          </ul>
          <Link
            href="/rooms"
            className="ease-occuply inline-flex h-9 items-center justify-center rounded-lg bg-accent-soft px-3.5 text-xs font-semibold text-tile-orange-fg transition-colors duration-150 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View All {unitWord}
          </Link>
        </div>
      </div>
    </CardShell>
  )
}

/* --------------------------- outstanding payments -------------------------- */

export interface OutstandingRow {
  id: string
  name: string
  meta: string
  amount: string
  due: string
}

export function OutstandingPaymentsCard({
  total,
  count,
  rows,
  href,
}: {
  total: string
  count: number
  rows: OutstandingRow[]
  href: string
}) {
  return (
    <CardShell title="Outstanding Payments" action={<ViewAll href={href} />}>
      <p className="num text-2xl font-bold leading-tight text-accent-brand">{total}</p>
      <p className="mb-4 text-xs text-muted-foreground">Total {count} invoices</p>

      <ul className="flex flex-col gap-3.5">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.name}</p>
              <p className="truncate text-xs text-muted-foreground">{r.meta}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="num text-sm font-semibold">{r.amount}</p>
              <p className="text-xs text-accent-brand">{r.due}</p>
            </div>
          </li>
        ))}
      </ul>
    </CardShell>
  )
}

/* --------------------------- maintenance requests -------------------------- */

export function MaintenanceCard({
  total,
  inProgress,
  pending,
  completed,
  href,
}: {
  total: number
  inProgress: number
  pending: number
  completed: number
  href: string
}) {
  return (
    <CardShell title="Maintenance Requests" action={<ViewAll href={href} />}>
      <p className="num text-2xl font-bold leading-tight">{total}</p>
      <p className="mb-2 text-xs text-muted-foreground">Total requests</p>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-6">
        <Donut
          size={150}
          thickness={24}
          segments={[
            { value: inProgress, className: "stroke-accent" },
            { value: pending, className: "stroke-status-warn" },
            { value: completed, className: "stroke-track" },
          ]}
        />

        <ul className="flex min-w-[8.5rem] flex-col gap-3.5">
          <LegendRow dotClass="bg-accent" label="In Progress" value={String(inProgress)} />
          <LegendRow dotClass="bg-status-warn" label="Pending" value={String(pending)} />
          <LegendRow dotClass="bg-track" label="Completed" value={String(completed)} />
        </ul>
      </div>

      <Link
        href={`${href}?new=1`}
        className="ease-occuply mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent-soft px-3.5 text-xs font-semibold text-tile-orange-fg transition-colors duration-150 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Create New Request
        <PlusIcon className="size-3.5" strokeWidth={2.5} />
      </Link>
    </CardShell>
  )
}

/* --------------------------------- footer ---------------------------------- */

export function TipsFooter({ tip, cta, href }: { tip: string; cta: string; href: string }) {
  return (
    <div className="relative flex flex-wrap items-center gap-4 overflow-hidden pt-2">
      <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent-soft px-3 text-xs font-semibold text-tile-orange-fg">
        <LightbulbIcon className="size-3.5" strokeWidth={2} />
        Tips
      </span>
      <p className="min-w-0 text-sm text-muted-foreground">{tip}</p>
      <Link
        href={href}
        className="ease-occuply inline-flex h-9 shrink-0 items-center rounded-lg border border-accent/35 px-3.5 text-xs font-semibold text-accent-brand transition-colors duration-150 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {cta}
      </Link>
      <Skyline className="ml-auto hidden h-16 w-[22rem] shrink-0 lg:block" />
    </div>
  )
}

/** Line-art skyline echoing the brand's building motif. Decorative only. */
function Skyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 64"
      fill="none"
      aria-hidden
      className={className}
      preserveAspectRatio="xMaxYMax meet"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.1"
        className="text-border"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 63V38h26v25M10 44h4M20 44h4M10 52h4M20 52h4" />
        <path d="M34 63V26h30v37M40 33h5M53 33h5M40 42h5M53 42h5M40 51h5M53 51h5" />
        <path d="M68 63V45h22v18M74 51h4M82 51h4" />
        <path d="M112 63V20h28v43M118 27h5M130 27h5M118 36h5M130 36h5M118 45h5M130 45h5M118 54h5M130 54h5" />
        <path d="M144 63V34h24v29M150 41h4M159 41h4M150 50h4M159 50h4" />
        <path d="M196 63V30h26v33M202 37h5M213 37h5M202 46h5M213 46h5M202 55h5M213 55h5" />
        <path d="M226 63V42h20v21M232 49h4M239 49h4" />
        <path d="M272 63V24h28v39M278 31h5M290 31h5M278 40h5M290 40h5M278 49h5M290 49h5" />
        <path d="M304 63V40h22v23M310 47h4M318 47h4M310 55h4M318 55h4" />
        <path d="M0 63h360" />
      </g>
      <g className="text-accent/45" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none">
        <path d="M92 63V36l10-8 10 8v27" />
        <path d="M168 63V40l9-7 9 7v23" />
        <path d="M246 63V34l13-10 13 10v29" />
        <path d="M326 63V44l9-7 9 7v19" />
      </g>
    </svg>
  )
}
