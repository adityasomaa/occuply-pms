"use client"

import * as React from "react"
import { toast } from "sonner"
import { CircleCheckIcon, ClipboardListIcon, DoorClosedIcon, SearchIcon } from "lucide-react"

import { EmptyState, Panel, StatusDot } from "@/components/occuply/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initials, moneyShort, relativeDays, shortDate } from "@/lib/format"
import type { MaintenanceTicket, TicketStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUSES: { key: TicketStatus; label: string; tone: "risk" | "warn" | "info" | "ok" }[] = [
  { key: "open", label: "Open", tone: "risk" },
  { key: "in-progress", label: "In progress", tone: "warn" },
  { key: "awaiting-parts", label: "Awaiting parts", tone: "info" },
  { key: "resolved", label: "Resolved", tone: "ok" },
]

const priorityTone = {
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  high: "border-status-warn/30 bg-status-warn/12 text-status-warn",
  medium: "border-border bg-muted text-muted-foreground",
  low: "border-border bg-muted text-muted-foreground",
}

export function MaintenanceBoard({
  tickets,
  anchor,
}: {
  tickets: MaintenanceTicket[]
  anchor: string
}) {
  const [resolved, setResolved] = React.useState<Record<string, boolean>>({})
  const [filter, setFilter] = React.useState<TicketStatus | "all">("all")
  const [query, setQuery] = React.useState("")

  const withState = tickets.map((t) => ({
    ...t,
    status: resolved[t.id] ? ("resolved" as TicketStatus) : t.status,
  }))

  const counts = new Map<TicketStatus, number>()
  withState.forEach((t) => counts.set(t.status, (counts.get(t.status) ?? 0) + 1))

  const visible = withState.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false
    if (query) {
      const q = query.toLowerCase()
      return (
        t.title.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q)
      )
    }
    return true
  })

  function resolve(t: MaintenanceTicket) {
    setResolved((s) => ({ ...s, [t.id]: true }))
    toast.success(`${t.reference} resolved`, {
      description: t.blocksRoom
        ? `${t.location} released back to sellable inventory.`
        : `${t.assignedTo} signed the job off.`,
    })
  }

  return (
    <Panel
      title="Maintenance board"
      description={`${visible.length} of ${tickets.length} tickets shown`}
      action={
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ticket, room or tech"
            className="h-8 w-48 pl-8 text-xs"
            aria-label="Search tickets"
          />
        </div>
      }
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5 lg:px-5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
          className={chip(filter === "all")}
        >
          All
          <span className="num ml-1 text-muted-foreground">{tickets.length}</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFilter(s.key)}
            aria-pressed={filter === s.key}
            className={chip(filter === s.key)}
          >
            <StatusDot tone={s.tone} className="size-1.5" />
            {s.label}
            <span className="num ml-0.5 text-muted-foreground">{counts.get(s.key) ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title="No tickets here"
          description="Nothing matches this filter. Clear the search or switch back to all tickets to see the full board."
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                setFilter("all")
                setQuery("")
              }}
            >
              Show everything
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((t) => {
            const overdue = t.dueAt < anchor && t.status !== "resolved"
            return (
              <li
                key={t.id}
                className={cn(
                  "ease-occuply flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 lg:px-5",
                  "hover:bg-muted/50",
                  t.status === "resolved" && "opacity-55",
                )}
              >
                <span className="num w-16 shrink-0 pt-0.5 text-xs text-muted-foreground">
                  {t.reference}
                </span>

                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm font-medium", t.status === "resolved" && "line-through")}>
                      {t.title}
                    </p>
                    <Badge variant="outline" className={priorityTone[t.priority]}>
                      {t.priority}
                    </Badge>
                    {t.blocksRoom && t.status !== "resolved" ? (
                      <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
                        <DoorClosedIcon className="size-2.5" />
                        Room blocked
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 max-w-[72ch] text-xs leading-relaxed text-muted-foreground">
                    {t.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.location} · {t.category} · reported {shortDate(t.reportedAt)}
                  </p>
                </div>

                <div className="flex w-32 shrink-0 items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[0.625rem] font-semibold text-muted-foreground">
                    {initials(t.assignedTo)}
                  </span>
                  <span className="truncate text-xs">{t.assignedTo.split(" ")[0]}</span>
                </div>

                <div className="w-24 shrink-0 text-right">
                  <p className={cn("text-xs font-medium", overdue ? "text-destructive" : "text-muted-foreground")}>
                    {t.status === "resolved" ? "closed" : `due ${relativeDays(anchor, t.dueAt)}`}
                  </p>
                  <p className="num text-xs text-muted-foreground">{moneyShort(t.estimatedCost)}</p>
                </div>

                <div className="shrink-0">
                  {t.status === "resolved" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-status-ok">
                      <CircleCheckIcon className="size-3.5" strokeWidth={2} />
                      Done
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => resolve(t)}>
                      Resolve
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function chip(active: boolean) {
  return cn(
    "ease-occuply inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
    active
      ? "border-accent/40 bg-accent-soft font-medium text-foreground"
      : "border-border bg-card text-muted-foreground hover:bg-muted",
  )
}
