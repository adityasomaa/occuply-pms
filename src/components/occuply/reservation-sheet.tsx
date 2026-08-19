"use client"

import * as React from "react"
import { toast } from "sonner"
import { BanIcon, SaveIcon, Trash2Icon, UserRoundIcon } from "lucide-react"

import { DateField, SelectField, TextField } from "@/components/occuply/field"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { channelNames, channelStyle } from "@/lib/channels"
import { money } from "@/lib/format"
import { localId, shiftISO, useStore } from "@/lib/store"
import type { Booking, Room, RoomType } from "@/lib/types"

const STATUSES = [
  { value: "confirmed", label: "Confirmed" },
  { value: "checked-in", label: "Checked in" },
  { value: "checked-out", label: "Checked out" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
]

function nightsBetween(a: string, b: string) {
  return Math.max(1, Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000))
}

export interface ReservationDraft {
  booking?: Booking
  /** Prefill used when creating from an empty calendar cell. */
  prefill?: { checkIn: string; roomNumber: string; roomTypeId: string }
}

function buildInitial(
  draft: ReservationDraft | null,
  roomTypes: RoomType[],
  propertyId: string,
): Booking | null {
  if (!draft) return null
  if (draft.booking) return { ...draft.booking }
  const pre = draft.prefill
  if (!pre) return null
  const rt = roomTypes.find((r) => r.id === pre.roomTypeId) ?? roomTypes[0]
  return {
    id: localId("bk"),
    propertyId,
    reference: `OCC-${Math.floor(100000 + Math.random() * 900000)}`,
    guestName: "",
    guestCountry: "ID",
    guestEmail: "",
    roomTypeId: rt.id,
    roomNumber: pre.roomNumber,
    channel: "Direct Website",
    checkIn: pre.checkIn,
    checkOut: shiftISO(pre.checkIn, 2),
    nights: 2,
    adults: 2,
    children: 0,
    status: "confirmed",
    total: rt.baseRate * 2,
    paid: 0,
    notes: "",
  }
}

export function ReservationSheet({
  draft,
  onOpenChange,
  rooms,
  roomTypes,
  propertyId,
}: {
  draft: ReservationDraft | null
  onOpenChange: (open: boolean) => void
  rooms: Room[]
  roomTypes: RoomType[]
  propertyId: string
}) {
  const initial = React.useMemo(
    () => buildInitial(draft, roomTypes, propertyId),
    [draft, roomTypes, propertyId],
  )

  return (
    <Sheet open={!!draft} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {initial ? (
          <ReservationForm
            key={initial.id}
            initial={initial}
            editing={!!draft?.booking}
            rooms={rooms}
            roomTypes={roomTypes}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
            <UserRoundIcon className="mr-2 size-4" />
            No reservation selected
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ReservationForm({
  initial,
  editing,
  rooms,
  roomTypes,
  onDone,
}: {
  initial: Booking
  editing: boolean
  rooms: Room[]
  roomTypes: RoomType[]
  onDone: () => void
}) {
  const { dispatch } = useStore()
  const [form, setForm] = React.useState<Booking>(initial)

  function patch(p: Partial<Booking>) {
    setForm((f) => ({ ...f, ...p }))
  }

  function save() {
    if (!form.guestName.trim()) {
      toast.error("Guest name is required")
      return
    }
    const nights = nightsBetween(form.checkIn, form.checkOut)
    const next: Booking = { ...form, nights }

    if (editing) {
      dispatch({ type: "booking:update", id: next.id, patch: next })
      toast.success("Reservation updated", { description: `${next.guestName} · room ${next.roomNumber}` })
    } else {
      dispatch({ type: "booking:create", booking: next })
      toast.success("Reservation created", {
        description: `${next.guestName} · ${nights} night${nights > 1 ? "s" : ""} in ${next.roomNumber}`,
      })
    }
    onDone()
  }

  function cancelBooking() {
    dispatch({ type: "booking:cancel", id: form.id })
    toast.message("Reservation cancelled", { description: "The room is released back to inventory." })
    onDone()
  }

  function removeBooking() {
    dispatch({ type: "booking:delete", id: form.id })
    toast.message("Reservation deleted")
    onDone()
  }

  const roomOptions = React.useMemo(() => {
    const byType = new Map(roomTypes.map((t) => [t.id, t.name]))
    return rooms.map((r) => ({
      value: r.number,
      label: r.number,
      hint: byType.get(r.roomTypeId),
    }))
  }, [rooms, roomTypes])

  const nights = nightsBetween(form.checkIn, form.checkOut)
  const style = channelStyle(form.channel)

  return (
    <>
      <SheetHeader className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[0.625rem] font-bold"
                  style={{ backgroundColor: style.bg, color: style.fg }}
                >
                  {style.short}
                </span>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">
                    {editing ? form.guestName || "Reservation" : "New reservation"}
                  </SheetTitle>
                  <SheetDescription className="num truncate text-xs">
                    {form.reference} · {nights} night{nights > 1 ? "s" : ""} · {money(form.total)}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-5 py-5">
              <TextField
                label="Guest name"
                value={form.guestName}
                onChange={(v) => patch({ guestName: v })}
                placeholder="Full name as on the ID"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Email"
                  type="email"
                  value={form.guestEmail}
                  onChange={(v) => patch({ guestEmail: v })}
                  placeholder="guest@example.com"
                />
                <TextField
                  label="Country code"
                  value={form.guestCountry}
                  onChange={(v) => patch({ guestCountry: v.toUpperCase().slice(0, 2) })}
                  placeholder="ID"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DateField
                  label="Check in"
                  value={form.checkIn}
                  onChange={(iso) =>
                    patch({
                      checkIn: iso,
                      checkOut: iso >= form.checkOut ? shiftISO(iso, nights) : form.checkOut,
                    })
                  }
                />
                <DateField
                  label="Check out"
                  value={form.checkOut}
                  min={shiftISO(form.checkIn, 1)}
                  onChange={(iso) => patch({ checkOut: iso })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Room"
                  value={form.roomNumber}
                  onChange={(v) => {
                    const room = rooms.find((r) => r.number === v)
                    patch({ roomNumber: v, roomTypeId: room?.roomTypeId ?? form.roomTypeId })
                  }}
                  options={roomOptions}
                />
                <SelectField
                  label="Booking source"
                  value={form.channel}
                  onChange={(v) => patch({ channel: v })}
                  options={channelNames().map((n) => ({
                    value: n,
                    label: n,
                    swatch: channelStyle(n).bg,
                  }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  label="Adults"
                  type="number"
                  min={1}
                  value={form.adults}
                  onChange={(v) => patch({ adults: Math.max(1, Number(v) || 1) })}
                />
                <TextField
                  label="Children"
                  type="number"
                  min={0}
                  value={form.children}
                  onChange={(v) => patch({ children: Math.max(0, Number(v) || 0) })}
                />
                <SelectField
                  label="Status"
                  value={form.status}
                  onChange={(v) => patch({ status: v as Booking["status"] })}
                  options={STATUSES}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Total"
                  type="number"
                  value={form.total}
                  onChange={(v) => patch({ total: Math.max(0, Number(v) || 0) })}
                  help={money(form.total)}
                />
                <TextField
                  label="Paid"
                  type="number"
                  value={form.paid}
                  onChange={(v) => patch({ paid: Math.max(0, Number(v) || 0) })}
                  help={
                    form.total - form.paid > 0
                      ? `Balance ${money(form.total - form.paid)}`
                      : "Settled in full"
                  }
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="res-notes" className="text-xs font-medium">
                  Notes
                </label>
                <Textarea
                  id="res-notes"
                  rows={3}
                  value={form.notes ?? ""}
                  onChange={(e) => patch({ notes: e.target.value })}
                  placeholder="Arrival time, preferences, anything the front desk should know"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-2 border-t border-border bg-popover px-5 py-4">
              <Button
                onClick={save}
                className="h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <SaveIcon className="size-3.5" strokeWidth={2.25} />
                {editing ? "Save changes" : "Create reservation"}
              </Button>

              {editing ? (
                <>
                  <Button variant="outline" className="h-9 gap-1.5" onClick={cancelBooking}>
                    <BanIcon className="size-3.5" strokeWidth={2.25} />
                    Cancel stay
                  </Button>
                  <Button
                    variant="ghost"
                    className="ml-auto h-9 gap-1.5 text-destructive hover:text-destructive"
                    onClick={removeBooking}
                  >
                    <Trash2Icon className="size-3.5" strokeWidth={2.25} />
                    Delete
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="h-9" onClick={onDone}>
                  Discard
                </Button>
              )}
      </div>
    </>
  )
}
