"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BellIcon,
  LogInIcon,
  ReceiptTextIcon,
  Share2Icon,
  SparklesIcon,
  SprayCanIcon,
  WrenchIcon,
} from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { money } from "@/lib/format"
import { useMeta, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type Severity = "urgent" | "attention" | "info"

interface Recommendation {
  id: string
  severity: Severity
  title: string
  detail: string
  action: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

const severityTile: Record<Severity, string> = {
  urgent: "bg-destructive/10 text-destructive",
  attention: "bg-tile-orange text-tile-orange-fg",
  info: "bg-tile-blue text-tile-blue-fg",
}

const severityLabel: Record<Severity, string> = {
  urgent: "Do this now",
  attention: "Worth doing today",
  info: "When you have a minute",
}

/** The bell is an action queue, not a log: every row names the thing to do and
 *  links straight to the screen and record where it gets done. */
export function NotificationBell() {
  const router = useRouter()
  const { bookings, tickets, rooms } = useStore()
  const meta = useMeta()
  const [open, setOpen] = React.useState(false)

  const items = React.useMemo<Recommendation[]>(() => {
    const out: Recommendation[] = []
    const anchor = meta.anchor

    for (const c of meta.channels) {
      if (c.status === "error") {
        out.push({
          id: `ch-${c.id}`,
          severity: "urgent",
          title: `${c.name} stopped syncing`,
          detail: c.issue ?? "Rates and availability are not reaching this channel.",
          action: "Fix the mapping",
          href: `/channels?channel=${encodeURIComponent(c.id)}`,
          icon: Share2Icon,
        })
      }
    }

    for (const t of tickets) {
      if (t.status === "resolved") continue
      if (t.priority === "critical" || t.dueAt < anchor) {
        out.push({
          id: `mt-${t.id}`,
          severity: "urgent",
          title: t.priority === "critical" ? `Critical: ${t.title}` : `Overdue: ${t.title}`,
          detail: `${t.location} · assigned to ${t.assignedTo}${t.blocksRoom ? " · room is blocked" : ""}`,
          action: "Open the ticket",
          href: `/maintenance?ticket=${encodeURIComponent(t.id)}`,
          icon: WrenchIcon,
        })
      }
    }

    const arrivals = bookings.filter(
      (b) => b.checkIn === anchor && b.status !== "cancelled" && b.status !== "checked-in",
    )
    if (arrivals.length) {
      out.push({
        id: "arrivals",
        severity: "attention",
        title: `${arrivals.length} guest${arrivals.length > 1 ? "s" : ""} arriving today`,
        detail: arrivals
          .slice(0, 3)
          .map((b) => `${b.guestName} (${b.roomNumber})`)
          .join(", "),
        action: "Open the arrivals",
        href: `/calendar?booking=${encodeURIComponent(arrivals[0].id)}`,
        icon: LogInIcon,
      })
    }

    const unpaidLeaving = bookings.filter(
      (b) => b.checkOut === anchor && b.status !== "cancelled" && b.total - b.paid > 0,
    )
    if (unpaidLeaving.length) {
      const owed = unpaidLeaving.reduce((s, b) => s + (b.total - b.paid), 0)
      out.push({
        id: "unpaid",
        severity: "urgent",
        title: `${unpaidLeaving.length} departure${unpaidLeaving.length > 1 ? "s" : ""} with an unpaid balance`,
        detail: `${money(owed)} to collect before check-out`,
        action: "Settle the folio",
        href: `/calendar?booking=${encodeURIComponent(unpaidLeaving[0].id)}`,
        icon: ReceiptTextIcon,
      })
    }

    const dirty = rooms.filter((r) => r.housekeeping === "dirty")
    if (dirty.length) {
      out.push({
        id: "housekeeping",
        severity: "attention",
        title: `${dirty.length} room${dirty.length > 1 ? "s" : ""} waiting on housekeeping`,
        detail: dirty
          .slice(0, 5)
          .map((r) => r.number)
          .join(", "),
        action: "Open the room board",
        href: "/rooms?status=vacant-dirty",
        icon: SprayCanIcon,
      })
    }

    out.push({
      id: "pricing",
      severity: "info",
      title: "Rate recommendations are waiting",
      detail: "The pricing engine has changes queued for the next fourteen nights.",
      action: "Review the pricing",
      href: "/pricing",
      icon: SparklesIcon,
    })

    const order: Severity[] = ["urgent", "attention", "info"]
    return out.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)).slice(0, 8)
  }, [bookings, tickets, rooms, meta])

  const urgent = items.filter((i) => i.severity === "urgent").length
  const count = items.length

  function take(item: Recommendation) {
    setOpen(false)
    router.push(item.href)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={count > 0 ? `Recommended actions, ${count} waiting` : "Recommended actions"}
            className={cn(
              "ease-occuply relative flex size-11 items-center justify-center rounded-full text-muted-foreground",
              "transition-colors duration-150 hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-muted",
            )}
          />
        }
      >
        <BellIcon className="size-[1.15rem]" strokeWidth={1.9} />
        {count > 0 ? (
          <span
            className={cn(
              "num absolute right-1 top-1 flex size-[1.1rem] items-center justify-center rounded-full text-[0.625rem] font-bold ring-2 ring-background",
              urgent > 0 ? "bg-destructive text-white" : "bg-accent text-accent-foreground",
            )}
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="max-h-[28rem] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto p-0"
      >
        <div className="sticky top-0 border-b border-border bg-popover px-4 py-3">
          <p className="text-sm font-semibold">Recommended actions</p>
          <p className="text-xs text-muted-foreground">
            {urgent > 0 ? `${urgent} need attention right now` : "Nothing urgent, a few things worth doing"}
          </p>
        </div>

        <ul className="divide-y divide-border">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => take(item)}
                  className="ease-occuply group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      severityTile[item.severity],
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label-brand block text-[0.5625rem]">
                      {severityLabel[item.severity]}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent-brand">
                      {item.action}
                      <ArrowRightIcon
                        className="ease-occuply size-3 transition-transform duration-200 group-hover:translate-x-0.5"
                        strokeWidth={2.25}
                      />
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
