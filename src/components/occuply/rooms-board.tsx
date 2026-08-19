"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  BedDoubleIcon,
  BrushCleaningIcon,
  CircleCheckIcon,
  DoorOpenIcon,
  SearchIcon,
  SparklesIcon,
  UserRoundIcon,
  WrenchIcon,
} from "lucide-react"

import { MaintenanceSheet, type TicketDraft } from "@/components/occuply/maintenance-sheet"
import { ReservationSheet, type ReservationDraft } from "@/components/occuply/reservation-sheet"
import { EmptyState, Panel, StatusDot } from "@/components/occuply/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { moneyShort, shortDate } from "@/lib/format"
import { roomStatusFor, useStore } from "@/lib/store"
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

export function RoomsBoard({
  roomTypes,
  anchor,
  propertyId,
  focusStatus,
  focusTypeId,
  focusRoom,
}: {
  roomTypes: RoomType[]
  anchor: string
  propertyId: string
  focusStatus?: string
  focusTypeId?: string
  focusRoom?: string
}) {
  const { rooms, bookings, dispatch } = useStore()

  const [status, setStatus] = React.useState<RoomStatus | "all">("all")
  const [typeId, setTypeId] = React.useState<string | "all">("all")
  const [query, setQuery] = React.useState("")
  const [resDraft, setResDraft] = React.useState<ReservationDraft | null>(null)
  const [ticketDraft, setTicketDraft] = React.useState<TicketDraft | null>(null)

  // Deep links from search and the alert centre.
  const urlStatus = focusStatus
  const urlType = focusTypeId
  const urlRoom = focusRoom
  const urlKey = `${urlStatus ?? ""}|${urlType ?? ""}|${urlRoom ?? ""}`
  const [handled, setHandled] = React.useState<string | null>(null)
  if (urlKey !== "||" && urlKey !== handled) {
    setHandled(urlKey)
    if (urlStatus && ORDER.includes(urlStatus as RoomStatus)) setStatus(urlStatus as RoomStatus)
    if (urlType) setTypeId(urlType)
    if (urlRoom) setQuery(urlRoom)
  }

  const typeById = React.useMemo(() => new Map(roomTypes.map((t) => [t.id, t])), [roomTypes])

  // Status is derived from live bookings, so edits on the calendar show here.
  const live = React.useMemo(
    () => rooms.map((r) => ({ room: r, ...roomStatusFor(r, bookings, anchor) })),
    [rooms, bookings, anchor],
  )

  const counts = React.useMemo(() => {
    const c = new Map<RoomStatus, number>()
    live.forEach(({ status: s }) => c.set(s, (c.get(s) ?? 0) + 1))
    return c
  }, [live])

  const filtered = live.filter(({ room, status: s }) => {
    if (status !== "all" && s !== status) return false
    if (typeId !== "all" && room.roomTypeId !== typeId) return false
    if (query) {
      const q = query.toLowerCase()
      return (
        room.number.toLowerCase().includes(q) ||
        (typeById.get(room.roomTypeId)?.name ?? "").toLowerCase().includes(q)
      )
    }
    return true
  })

  function setHousekeeping(room: Room, hk: Room["housekeeping"]) {
    dispatch({
      type: "room:update",
      id: room.id,
      patch: { housekeeping: hk, status: hk === "clean" ? "vacant-clean" : room.status },
    })
    toast.success(`${room.number} marked ${hk}`)
  }

  function toggleOutOfOrder(room: Room) {
    const next = room.status === "out-of-order" ? "vacant-dirty" : "out-of-order"
    dispatch({ type: "room:update", id: room.id, patch: { status: next } })
    toast[next === "out-of-order" ? "message" : "success"](
      next === "out-of-order" ? `${room.number} taken out of order` : `${room.number} back in service`,
    )
  }

  return (
    <>
      <Panel
        title="Room status board"
        description={`${filtered.length} of ${rooms.length} rooms shown`}
        action={
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Room or type"
              className="h-9 w-40 pl-8 text-xs sm:w-48"
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
            {filtered.map(({ room, status: s, booking }) => {
              const meta = STATUS_META[s]
              const type = typeById.get(room.roomTypeId)
              return (
                <li key={room.id}>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className={cn(
                            "ease-occuply flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-all duration-200",
                            "hover:-translate-y-px hover:shadow-[0_6px_18px_-12px_oklch(0.2046_0.008_50.5/0.5)]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            meta.ring,
                          )}
                        />
                      }
                    >
                      <span className="flex w-full items-center gap-2">
                        <span className="num text-sm font-semibold tracking-tight">{room.number}</span>
                        <StatusDot tone={meta.tone} className="ml-auto" pulse={s === "arriving"} />
                      </span>

                      <span className="block min-h-8 w-full">
                        {booking ? (
                          <>
                            <span className="block truncate text-xs font-medium">{booking.guestName}</span>
                            <span className="num block truncate text-[0.6875rem] text-muted-foreground">
                              out {shortDate(booking.checkOut)}
                            </span>
                          </>
                        ) : (
                          <span className="block text-xs text-muted-foreground">{meta.label}</span>
                        )}
                      </span>

                      <span className="flex w-full items-center justify-between gap-1 border-t border-border/70 pt-2">
                        <span className="truncate text-[0.6875rem] text-muted-foreground">{type?.code}</span>
                        <span className="num text-[0.6875rem] text-muted-foreground">
                          {type ? moneyShort(type.baseRate) : ""}
                        </span>
                      </span>

                      {room.housekeeping === "dirty" ? (
                        <Badge
                          variant="outline"
                          className="w-fit gap-1 border-status-warn/30 bg-status-warn/12 text-[0.625rem] text-status-warn"
                        >
                          <SparklesIcon className="size-2.5" />
                          Needs cleaning
                        </Badge>
                      ) : null}
                    </PopoverTrigger>

                    <PopoverContent align="start" sideOffset={6} className="w-64 p-1.5">
                      <div className="px-2 py-1.5">
                        <p className="num text-sm font-semibold">{room.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {type?.name} · {meta.label}
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-border pt-1">
                        {booking ? (
                          <RowButton icon={UserRoundIcon} onClick={() => setResDraft({ booking })}>
                            Manage {booking.guestName.split(" ")[0]}&apos;s stay
                          </RowButton>
                        ) : (
                          <RowButton
                            icon={DoorOpenIcon}
                            onClick={() =>
                              setResDraft({
                                prefill: {
                                  checkIn: anchor,
                                  roomNumber: room.number,
                                  roomTypeId: room.roomTypeId,
                                },
                              })
                            }
                          >
                            Book this room
                          </RowButton>
                        )}
                        {room.housekeeping !== "clean" ? (
                          <RowButton icon={CircleCheckIcon} onClick={() => setHousekeeping(room, "clean")}>
                            Mark clean
                          </RowButton>
                        ) : (
                          <RowButton icon={BrushCleaningIcon} onClick={() => setHousekeeping(room, "dirty")}>
                            Flag for cleaning
                          </RowButton>
                        )}
                        <RowButton
                          icon={WrenchIcon}
                          onClick={() =>
                            setTicketDraft({
                              prefill: { location: `Room ${room.number}`, reportedAt: anchor },
                            })
                          }
                        >
                          Log a maintenance ticket
                        </RowButton>
                        <RowButton
                          icon={DoorOpenIcon}
                          destructive={room.status !== "out-of-order"}
                          onClick={() => toggleOutOfOrder(room)}
                        >
                          {room.status === "out-of-order" ? "Return to service" : "Take out of order"}
                        </RowButton>
                      </div>
                    </PopoverContent>
                  </Popover>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <ReservationSheet
        draft={resDraft}
        onOpenChange={(open) => !open && setResDraft(null)}
        rooms={rooms}
        roomTypes={roomTypes}
        propertyId={propertyId}
      />
      <MaintenanceSheet
        draft={ticketDraft}
        onOpenChange={(open) => !open && setTicketDraft(null)}
        rooms={rooms}
        propertyId={propertyId}
      />
    </>
  )
}

function RowButton({
  icon: Icon,
  children,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  children: React.ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ease-occuply flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-150",
        "hover:bg-muted focus-visible:outline-none focus-visible:bg-muted",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.9} />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
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
