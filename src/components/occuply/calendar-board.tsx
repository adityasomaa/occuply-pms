"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  CalendarPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  WrenchIcon,
} from "lucide-react"

import { DateField, SelectField } from "@/components/occuply/field"
import { MaintenanceSheet, type TicketDraft } from "@/components/occuply/maintenance-sheet"
import { ReservationSheet, type ReservationDraft } from "@/components/occuply/reservation-sheet"

import { Button } from "@/components/ui/button"
import { channelStyle } from "@/lib/channels"
import {
  dayNumber,
  isWeekend,
  monthLabel,
  weekday,
} from "@/lib/format"
import { shiftISO, useStore } from "@/lib/store"
import type { Room, RoomType } from "@/lib/types"
import { cn } from "@/lib/utils"

const WINDOWS = [
  { value: "14", label: "14 nights" },
  { value: "21", label: "21 nights" },
  { value: "31", label: "31 nights" },
]

const ROW_H = 44

interface DragState {
  bookingId: string
  startX: number
  startY: number
  colW: number
  moved: boolean
  el: HTMLElement
}

export function CalendarBoard({
  rooms: seedRooms,
  roomTypes,
  anchor,
  propertyId,
  focusBookingId,
}: {
  rooms: Room[]
  roomTypes: RoomType[]
  anchor: string
  propertyId: string
  /** Deep link from search or the alert centre. */
  focusBookingId?: string
}) {
  const { bookings, tickets, rooms, dispatch } = useStore()

  const [start, setStart] = React.useState(anchor)
  const [days, setDays] = React.useState(21)
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [resDraft, setResDraft] = React.useState<ReservationDraft | null>(null)
  const [ticketDraft, setTicketDraft] = React.useState<TicketDraft | null>(null)

  const gridRef = React.useRef<HTMLDivElement>(null)
  // The drag lives in a ref, not state: pointermove then writes the transform
  // straight to the node, so dragging never re-renders the board and a click
  // and its release are never separated by a pending render.
  const dragRef = React.useRef<DragState | null>(null)

  // Search results and alert-centre actions deep-link straight to a stay.
  const [openedFromUrl, setOpenedFromUrl] = React.useState<string | null>(null)
  if (focusBookingId && focusBookingId !== openedFromUrl) {
    const target = bookings.find((b) => b.id === focusBookingId)
    setOpenedFromUrl(focusBookingId)
    if (target) {
      setResDraft({ booking: target })
      setStart(shiftISO(target.checkIn, -2))
    }
  }

  const allRooms = rooms.length ? rooms : seedRooms
  const visibleRooms = React.useMemo(
    () => (typeFilter === "all" ? allRooms : allRooms.filter((r) => r.roomTypeId === typeFilter)),
    [allRooms, typeFilter],
  )

  // The board reads room type by room type: a heading row, then its numbers.
  const groups = React.useMemo(
    () =>
      roomTypes
        .map((type) => ({ type, rooms: visibleRooms.filter((r) => r.roomTypeId === type.id) }))
        .filter((g) => g.rooms.length > 0),
    [roomTypes, visibleRooms],
  )

  const dates = React.useMemo(
    () => Array.from({ length: days }, (_, i) => shiftISO(start, i)),
    [start, days],
  )
  const end = dates[dates.length - 1]

  /** Index of a date inside the window, or a clamped edge marker. */
  function idx(iso: string) {
    return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000)
  }

  function measureCol(): number {
    const cell = gridRef.current?.querySelector<HTMLElement>("[data-daycell]")
    return cell ? cell.getBoundingClientRect().width : 56
  }

  /* -------------------------------- dragging ------------------------------- */

  function onBarPointerDown(e: React.PointerEvent, bookingId: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    dragRef.current = {
      bookingId,
      startX: e.clientX,
      startY: e.clientY,
      colW: measureCol() || 56,
      moved: false,
      el,
    }
  }

  function onBarPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      d.moved = true
      // Above the other bars while it is being moved, but still under the
      // room column (20) and the date header (30).
      d.el.style.zIndex = "10"
      d.el.style.cursor = "grabbing"
      d.el.style.boxShadow = "0 10px 24px -12px oklch(0.2046 0.008 50.5 / 0.6)"
    }
    if (d.moved) {
      // Written to `translate`, not `transform`: React owns the transform that
      // centres the bar on its lane, and clearing that on drop would drop the
      // bar half its height onto the row line.
      d.el.style.translate = `${dx}px ${dy}px`
    }
  }

  function resetBar(el: HTMLElement) {
    el.style.translate = ""
    el.style.zIndex = ""
    el.style.cursor = ""
    el.style.boxShadow = ""
  }

  function onBarPointerUp(e: React.PointerEvent, bookingId: string) {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    resetBar(d.el)

    const booking = bookings.find((b) => b.id === bookingId)
    if (!booking) return

    if (!d.moved) {
      setResDraft({ booking })
      return
    }

    const dDays = Math.round((e.clientX - d.startX) / d.colW)

    // Resolve the destination from what is actually under the pointer: the
    // board has group headings between lanes, so a row offset would not do.
    // The bar itself is under the cursor, so it steps aside for the lookup.
    d.el.style.pointerEvents = "none"
    const under = document.elementFromPoint(e.clientX, e.clientY)
    d.el.style.pointerEvents = ""
    const lane = under?.closest<HTMLElement>("[data-roomrow]")

    const roomNumber = lane?.dataset.roomrow ?? booking.roomNumber
    const roomTypeId = lane?.dataset.roomtype ?? booking.roomTypeId
    const movedRoom = roomNumber !== booking.roomNumber

    if (dDays === 0 && !movedRoom) return

    const newCheckIn = shiftISO(booking.checkIn, dDays)
    dispatch({ type: "booking:move", id: booking.id, checkIn: newCheckIn, roomNumber, roomTypeId })

    const changedType = roomTypeId !== booking.roomTypeId
    toast.success("Reservation moved", {
      description:
        movedRoom
          ? `${booking.guestName} moved to room ${roomNumber} on ${newCheckIn}`
          : `${booking.guestName} moved to ${newCheckIn}`,
      action: {
        label: "Undo",
        onClick: () =>
          dispatch({
            type: "booking:move",
            id: booking.id,
            checkIn: booking.checkIn,
            roomNumber: booking.roomNumber,
            roomTypeId: booking.roomTypeId,
          }),
      },
    })

    if (changedType) {
      toast.message("Room type changed", {
        description: `The stay now sits in a different room type. Check the rate on the reservation.`,
      })
    }
  }

  /* --------------------------------- render -------------------------------- */

  const blocks = React.useMemo(
    () =>
      tickets
        .filter((t) => t.blocksRoom && t.status !== "resolved" && t.location.startsWith("Room "))
        .map((t) => ({ ticket: t, room: t.location.replace("Room ", "") })),
    [tickets],
  )

  const activeBookings = React.useMemo(
    () => bookings.filter((b) => b.status !== "cancelled" && b.checkOut > start && b.checkIn <= end),
    [bookings, start, end],
  )

  const channelsInView = React.useMemo(() => {
    const set = new Set(activeBookings.map((b) => b.channel))
    return [...set].sort()
  }, [activeBookings])

  return (
    <>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* ------------------------------ toolbar ------------------------------ */}
        <div className="flex flex-wrap items-end gap-3 border-b border-border p-4 lg:px-5">
          <DateField
            label="Start from"
            value={start}
            onChange={setStart}
            className="w-full sm:w-56"
            size="sm"
          />
          <SelectField
            label="Window"
            value={String(days)}
            onChange={(v) => setDays(Number(v))}
            options={WINDOWS}
            className="w-full sm:w-36"
            size="sm"
          />
          <SelectField
            label="Room type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All room types", hint: `${allRooms.length} rooms` },
              ...roomTypes.map((t) => ({ value: t.id, label: t.name, hint: `${t.count} rooms` })),
            ]}
            className="w-full sm:w-52"
            size="sm"
          />

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Previous week"
              onClick={() => setStart(shiftISO(start, -7))}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setStart(anchor)}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Next week"
              onClick={() => setStart(shiftISO(start, 7))}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>

          <Button
            size="sm"
            className="ml-auto h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() =>
              setResDraft({
                prefill: {
                  checkIn: start,
                  roomNumber: visibleRooms[0]?.number ?? "",
                  roomTypeId: visibleRooms[0]?.roomTypeId ?? roomTypes[0]?.id ?? "",
                },
              })
            }
          >
            <CalendarPlusIcon className="size-3.5" strokeWidth={2.25} />
            New booking
          </Button>
        </div>

        {/* -------------------------------- grid ------------------------------- */}
        <div
          ref={gridRef}
          className="scroll-slim overflow-x-auto [--col:2.75rem] sm:[--col:3.25rem] lg:[--col:3.5rem]"
        >
          <div className="min-w-max">
            {/* header */}
            <div className="sticky top-0 z-30 flex border-b border-border bg-card">
              <div className="sticky left-0 z-40 w-36 shrink-0 border-r border-border bg-card px-3 py-2 sm:w-44">
                <span className="label-brand">{monthLabel(start)}</span>
              </div>
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(${days}, var(--col))` }}
              >
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    data-daycell
                    onClick={() => setStart(d)}
                    title={`Start the board on ${d}`}
                    className={cn(
                      "ease-occuply flex flex-col items-center py-1.5 transition-colors duration-150 hover:bg-muted",
                      isWeekend(d) && "bg-muted/50",
                      d === anchor && "bg-accent-soft",
                    )}
                  >
                    <span className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                      {weekday(d)}
                    </span>
                    <span
                      className={cn("num text-sm font-semibold", d === anchor && "text-accent-brand")}
                    >
                      {dayNumber(d)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* rows, grouped by room type */}
            {groups.map(({ type, rooms: typeRooms }) => (
              <div key={type.id}>
                <div className="flex border-b border-border bg-muted/45">
                  <div className="sticky left-0 z-20 flex w-36 shrink-0 items-center gap-2 border-r border-border bg-muted/45 px-3 py-2 sm:w-44">
                    <span className="truncate text-xs font-semibold tracking-tight">{type.name}</span>
                    <span className="num shrink-0 rounded-full bg-card px-1.5 text-[0.625rem] font-semibold text-muted-foreground">
                      {typeRooms.length}
                    </span>
                  </div>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${days}, var(--col))` }}
                    aria-hidden
                  >
                    {dates.map((d) => (
                      <span
                        key={d}
                        className={cn(
                          "border-r border-border/50 last:border-r-0",
                          isWeekend(d) && "bg-muted/40",
                          d === anchor && "bg-accent-soft/50",
                        )}
                      />
                    ))}
                  </div>
                </div>

                {typeRooms.map((room) => {
                  const roomBookings = activeBookings.filter((b) => b.roomNumber === room.number)
                  const roomBlocks = blocks.filter((b) => b.room === room.number)

                  return (
                    <div key={room.id} className="flex border-b border-border last:border-b-0">
                      <div className="sticky left-0 z-20 flex w-36 shrink-0 flex-col justify-center border-r border-border bg-card px-3 sm:w-44">
                        <span className="num truncate text-xs font-semibold">{room.number}</span>
                        <span className="truncate text-[0.6875rem] text-muted-foreground">
                          Floor {room.floor}
                        </span>
                      </div>

                      <div
                        className="relative"
                        style={{ height: ROW_H }}
                        data-roomrow={room.number}
                        data-roomtype={room.roomTypeId}
                      >
                        {/* empty cells: click to start a booking on that day */}
                        <div
                          className="grid h-full"
                          style={{ gridTemplateColumns: `repeat(${days}, var(--col))` }}
                        >
                          {dates.map((d) => (
                            <button
                              key={d}
                              type="button"
                              aria-label={`New booking, room ${room.number}, ${d}`}
                              onClick={() =>
                                setResDraft({
                                  prefill: {
                                    checkIn: d,
                                    roomNumber: room.number,
                                    roomTypeId: room.roomTypeId,
                                  },
                                })
                              }
                              className={cn(
                                "ease-occuply border-r border-border/60 transition-colors duration-150 last:border-r-0 hover:bg-accent-soft/60",
                                isWeekend(d) && "bg-muted/40",
                                d === anchor && "bg-accent-soft/40",
                              )}
                            />
                          ))}
                        </div>

                        {/* maintenance blocks */}
                        {roomBlocks.map(({ ticket }) => {
                          const bs = Math.max(0, idx(ticket.reportedAt))
                          const be = Math.min(days, idx(ticket.dueAt) + 1)
                          if (be <= 0 || bs >= days) return null
                          return (
                            <button
                              key={ticket.id}
                              type="button"
                              onClick={() => setTicketDraft({ ticket })}
                              title={`${ticket.reference} · ${ticket.title}`}
                              className="absolute top-1/2 z-[1] flex h-6 -translate-y-1/2 items-center gap-1 overflow-hidden rounded-md border border-destructive/40 px-1.5 text-[0.6875rem] font-medium text-destructive"
                              style={{
                                left: `calc(${bs} * var(--col))`,
                                width: `calc(${be - bs} * var(--col))`,
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, color-mix(in oklch, var(--destructive) 16%, transparent) 0 6px, transparent 6px 12px)",
                              }}
                            >
                              <WrenchIcon className="size-3 shrink-0" strokeWidth={2.25} />
                              <span className="truncate">Blocked</span>
                            </button>
                          )
                        })}

                        {/* reservation bars */}
                        {roomBookings.map((b) => {
                          const rawIn = idx(b.checkIn)
                          const rawOut = idx(b.checkOut)
                          // Check-in starts mid-cell and check-out ends mid-cell, so a
                          // departure and an arrival can share the same day column.
                          const left = Math.max(0, rawIn + 0.5)
                          const right = Math.min(days, rawOut + 0.5)
                          if (right <= 0 || left >= days) return null

                          const style = channelStyle(b.channel)

                          return (
                            <button
                              key={b.id}
                              type="button"
                              onPointerDown={(e) => onBarPointerDown(e, b.id)}
                              onPointerMove={onBarPointerMove}
                              onPointerUp={(e) => onBarPointerUp(e, b.id)}
                              onPointerCancel={() => {
                                const d = dragRef.current
                                dragRef.current = null
                                if (d) resetBar(d.el)
                              }}
                              title={`${b.guestName} · ${b.channel} · ${b.checkIn} to ${b.checkOut}`}
                              className={cn(
                                "absolute top-1/2 z-[2] flex h-7 items-center gap-1.5 overflow-hidden rounded-md px-2 text-left text-[0.6875rem] font-semibold",
                                "ease-occuply touch-none select-none transition-shadow duration-150",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                "cursor-grab hover:shadow-md hover:brightness-105",
                                b.status === "pending" && "opacity-70 ring-1 ring-inset ring-white/40",
                              )}
                              style={{
                                left: `calc(${left} * var(--col))`,
                                width: `calc(${right - left} * var(--col))`,
                                backgroundColor: style.bg,
                                color: style.fg,
                                transform: "translateY(-50%)",
                              }}
                            >
                              <span className="truncate">{b.guestName}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {visibleRooms.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No rooms match this filter.
              </p>
            ) : null}
          </div>
        </div>

        {/* -------------------------------- legend ------------------------------ */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3 lg:px-5">
          <span className="label-brand">Booking source</span>
          {channelsInView.map((c) => {
            const s = channelStyle(c)
            return (
              <span key={c} className="flex items-center gap-1.5 text-xs">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: s.bg }} />
                {c}
              </span>
            )
          })}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <WrenchIcon className="size-3 text-destructive" strokeWidth={2.25} />
            Room blocked
          </span>
          <span className="ml-auto hidden text-xs text-muted-foreground lg:block">
            Click a bar to manage it, drag it to move dates or rooms, click any empty cell to book.
          </span>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() =>
            setTicketDraft({
              prefill: { location: `Room ${visibleRooms[0]?.number ?? ""}`, reportedAt: start },
            })
          }
        >
          <PlusIcon className="size-3.5" strokeWidth={2.25} />
          Block a room for maintenance
        </Button>
      </div>

      <ReservationSheet
        draft={resDraft}
        onOpenChange={(open) => !open && setResDraft(null)}
        rooms={allRooms}
        roomTypes={roomTypes}
        propertyId={propertyId}
      />
      <MaintenanceSheet
        draft={ticketDraft}
        onOpenChange={(open) => !open && setTicketDraft(null)}
        rooms={allRooms}
        propertyId={propertyId}
      />
    </>
  )
}
