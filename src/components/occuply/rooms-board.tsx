"use client"

import * as React from "react"
import { BedDoubleIcon, SearchIcon, SparklesIcon } from "lucide-react"

import { EmptyState, Panel, StatusDot } from "@/components/occuply/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { moneyShort, shortDate } from "@/lib/format"
import type { Room, RoomStatus, RoomType } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_META: Record<
  RoomStatus,
  { label: string; tone: "accent" | "info" | "ok" | "warn" | "risk" | "idle"; ring: string }
> = {
  occupied: { label: "Occupied", tone: "accent", ring: "border-accent/35 bg-accent-soft/50" },
  departing: { label: "Departing", tone: "info", ring: "border-status-info/30 bg-status-info/8" },
  arriving: { label: "Arriving", tone: "idle", ring: "border-border bg-card" },
  "vacant-clean": { label: "Vacant clean", tone: "ok", ring: "border-status-ok/25 bg-status-ok/8" },
  "vacant-dirty": { label: "To clean", tone: "warn", ring: "border-status-warn/30 bg-status-warn/10" },
  "out-of-order": { label: "Out of order", tone: "risk", ring: "border-destructive/30 bg-destructive/8" },
}

const ORDER: RoomStatus[] = [
  "occupied",
  "departing",
  "arriving",
  "vacant-clean",
  "vacant-dirty",
  "out-of-order",
]

export function RoomsBoard({ rooms, roomTypes }: { rooms: Room[]; roomTypes: RoomType[] }) {
  const [status, setStatus] = React.useState<RoomStatus | "all">("all")
  const [typeId, setTypeId] = React.useState<string | "all">("all")
  const [query, setQuery] = React.useState("")

  const typeById = React.useMemo(
    () => new Map(roomTypes.map((t) => [t.id, t])),
    [roomTypes],
  )

  const counts = React.useMemo(() => {
    const c = new Map<RoomStatus, number>()
    rooms.forEach((r) => c.set(r.status, (c.get(r.status) ?? 0) + 1))
    return c
  }, [rooms])

  const filtered = rooms.filter((r) => {
    if (status !== "all" && r.status !== status) return false
    if (typeId !== "all" && r.roomTypeId !== typeId) return false
    if (query) {
      const q = query.toLowerCase()
      const hit =
        r.number.toLowerCase().includes(q) ||
        (r.guestName ?? "").toLowerCase().includes(q) ||
        (typeById.get(r.roomTypeId)?.name ?? "").toLowerCase().includes(q)
      if (!hit) return false
    }
    return true
  })

  return (
    <Panel
      title="Room status board"
      description={`${filtered.length} of ${rooms.length} units shown`}
      action={
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Room or guest"
            className="h-8 w-44 pl-8 text-xs"
            aria-label="Search rooms"
          />
        </div>
      }
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5 lg:px-5">
        <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
          All
          <span className="num ml-1 text-muted-foreground">{rooms.length}</span>
        </FilterChip>
        {ORDER.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
            <StatusDot tone={STATUS_META[s].tone} className="size-1.5" />
            {STATUS_META[s].label}
            <span className="num ml-0.5 text-muted-foreground">{counts.get(s) ?? 0}</span>
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2 lg:px-5">
        <span className="label-brand mr-1">Room type</span>
        <FilterChip active={typeId === "all"} onClick={() => setTypeId("all")}>
          All types
        </FilterChip>
        {roomTypes.map((t) => (
          <FilterChip key={t.id} active={typeId === t.id} onClick={() => setTypeId(t.id)}>
            {t.name}
            <span className="num ml-0.5 text-muted-foreground">{t.count}</span>
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BedDoubleIcon}
          title="No rooms match this view"
          description="Loosen the status or room-type filter, or clear the search box to see the full board again."
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                setStatus("all")
                setTypeId("all")
                setQuery("")
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 lg:grid-cols-4 lg:p-5 2xl:grid-cols-6">
          {filtered.map((room) => {
            const meta = STATUS_META[room.status]
            const type = typeById.get(room.roomTypeId)
            return (
              <li
                key={room.id}
                className={cn(
                  "ease-occuply flex flex-col gap-2 rounded-lg border p-3 transition-all duration-200",
                  "hover:-translate-y-px hover:shadow-[0_6px_18px_-12px_oklch(0.2046_0.008_50.5/0.5)]",
                  meta.ring,
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="num text-sm font-semibold tracking-tight">{room.number}</span>
                  <StatusDot tone={meta.tone} className="ml-auto" pulse={room.status === "arriving"} />
                </div>

                <div className="min-h-8">
                  {room.guestName ? (
                    <>
                      <p className="truncate text-xs font-medium">{room.guestName}</p>
                      <p className="num truncate text-[0.6875rem] text-muted-foreground">
                        {room.nights}n · out {room.checkOutDate ? shortDate(room.checkOutDate) : "—"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">{room.notes ?? meta.label}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 border-t border-border/70 pt-2">
                  <span className="truncate text-[0.6875rem] text-muted-foreground">{type?.code}</span>
                  <span className="num text-[0.6875rem] text-muted-foreground">
                    {type ? moneyShort(type.baseRate) : ""}
                  </span>
                </div>

                {room.housekeeping === "dirty" ? (
                  <Badge
                    variant="outline"
                    className="w-fit gap-1 border-status-warn/30 bg-status-warn/12 text-[0.625rem] text-status-warn"
                  >
                    <SparklesIcon className="size-2.5" />
                    Needs cleaning
                  </Badge>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "ease-occuply inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
        active
          ? "border-accent/40 bg-accent-soft font-medium text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
