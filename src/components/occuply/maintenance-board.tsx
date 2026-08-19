"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  CircleCheckIcon,
  ClipboardListIcon,
  DoorClosedIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import { MaintenanceSheet, type TicketDraft } from "@/components/occuply/maintenance-sheet"
import { EmptyState, Panel, StatusDot } from "@/components/occuply/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { moneyShort, relativeDays, shortDate } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { Room, TicketStatus } from "@/lib/types"
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
  anchor,
  rooms,
  propertyId,
  focusTicketId,
  startNew,
}: {
  anchor: string
  rooms: Room[]
  propertyId: string
  focusTicketId?: string
  startNew?: boolean
}) {
  const { tickets, dispatch } = useStore()
  const [filter, setFilter] = React.useState<TicketStatus | "all">("all")
  const [query, setQuery] = React.useState("")
  const [draft, setDraft] = React.useState<TicketDraft | null>(null)

  const [handledUrl, setHandledUrl] = React.useState<string | null>(null)
  const urlKey = `${focusTicketId ?? ""}|${startNew ? "1" : ""}`
  if (urlKey !== "|" && urlKey !== handledUrl) {
    setHandledUrl(urlKey)
    if (focusTicketId) {
      const target = tickets.find((t) => t.id === focusTicketId)
      if (target) setDraft({ ticket: target })
    } else if (startNew) {
      setDraft({ prefill: { location: `Room ${rooms[0]?.number ?? ""}`, reportedAt: anchor } })
    }
  }

  const counts = new Map<TicketStatus, number>()
  tickets.forEach((t) => counts.set(t.status, (counts.get(t.status) ?? 0) + 1))

  const visible = tickets.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false
    if (query) {
      const q = query.toLowerCase()
      return (
        t.title.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q)
      )
    }
    return true
  })

  function resolve(id: string, reference: string) {
    dispatch({ type: "ticket:update", id, patch: { status: "resolved", blocksRoom: false } })
    toast.success(`${reference} resolved`)
  }

  return (
    <>

      <Panel
        title="Maintenance board"
        description={`${visible.length} of ${tickets.length} tickets shown`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ticket or room"
                className="h-9 w-40 pl-8 text-xs sm:w-48"
                aria-label="Search tickets"
              />
            </div>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() =>
                setDraft({ prefill: { location: `Room ${rooms[0]?.number ?? ""}`, reportedAt: anchor } })
              }
            >
              <PlusIcon className="size-3.5" strokeWidth={2.25} />
              <span className="hidden sm:inline">Log ticket</span>
            </Button>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5 lg:px-5">
          <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={chip(filter === "all")}>
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
                <li key={t.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setDraft({ ticket: t })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setDraft({ ticket: t })
                      }
                    }}
                    className={cn(
                      "ease-occuply flex cursor-pointer flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 lg:px-5",
                      "hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted",
                      t.status === "resolved" && "opacity-55",
                    )}
                  >
                    <span className="num w-16 shrink-0 pt-0.5 text-xs text-muted-foreground">{t.reference}</span>

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

                    <div className="w-24 shrink-0 text-right">
                      <p className={cn("text-xs font-medium", overdue ? "text-destructive" : "text-muted-foreground")}>
                        {t.status === "resolved" ? "closed" : `due ${relativeDays(anchor, t.dueAt)}`}
                      </p>
                      <p className="num text-xs text-muted-foreground">{moneyShort(t.estimatedCost)}</p>
                    </div>

                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      {t.status === "resolved" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-status-ok">
                          <CircleCheckIcon className="size-3.5" strokeWidth={2} />
                          Done
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => resolve(t.id, t.reference)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <MaintenanceSheet
        draft={draft}
        onOpenChange={(open) => !open && setDraft(null)}
        rooms={rooms}
        propertyId={propertyId}
      />
    </>
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
