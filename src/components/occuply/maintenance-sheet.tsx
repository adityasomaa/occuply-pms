"use client"

import * as React from "react"
import { toast } from "sonner"
import { CircleCheckIcon, SaveIcon, Trash2Icon, WrenchIcon } from "lucide-react"

import { DateField, SelectField, TextField } from "@/components/occuply/field"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { money } from "@/lib/format"
import { localId, shiftISO, useStore } from "@/lib/store"
import type { MaintenanceTicket, Room, StaffMember } from "@/lib/types"

const CATEGORIES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Pool & Garden",
  "Furniture",
  "Appliance",
  "Network",
].map((c) => ({ value: c, label: c }))

const PRIORITIES = [
  { value: "critical", label: "Critical", swatch: "#DC2626" },
  { value: "high", label: "High", swatch: "#E8A33D" },
  { value: "medium", label: "Medium", swatch: "#8A8A8A" },
  { value: "low", label: "Low", swatch: "#B4B4B4" },
]

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "awaiting-parts", label: "Awaiting parts" },
  { value: "resolved", label: "Resolved" },
]

export interface TicketDraft {
  ticket?: MaintenanceTicket
  prefill?: { location: string; reportedAt: string }
}

function buildInitial(
  draft: TicketDraft | null,
  staff: StaffMember[],
  propertyId: string,
): MaintenanceTicket | null {
  if (!draft) return null
  if (draft.ticket) return { ...draft.ticket }
  const pre = draft.prefill
  if (!pre) return null
  return {
    id: localId("mt"),
    propertyId,
    reference: `MNT-${Math.floor(1000 + Math.random() * 9000)}`,
    title: "",
    location: pre.location,
    category: "Appliance",
    priority: "medium",
    status: "open",
    reportedBy: staff[0]?.name ?? "Front desk",
    assignedTo: staff.find((s) => s.department === "Maintenance")?.name ?? staff[0]?.name ?? "",
    reportedAt: pre.reportedAt,
    dueAt: shiftISO(pre.reportedAt, 3),
    estimatedCost: 500_000,
    blocksRoom: false,
    description: "",
  }
}

export function MaintenanceSheet({
  draft,
  onOpenChange,
  rooms,
  staff,
  propertyId,
}: {
  draft: TicketDraft | null
  onOpenChange: (open: boolean) => void
  rooms: Room[]
  staff: StaffMember[]
  propertyId: string
}) {
  const initial = React.useMemo(
    () => buildInitial(draft, staff, propertyId),
    [draft, staff, propertyId],
  )

  return (
    <Sheet open={!!draft} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {initial ? (
          <TicketForm
            key={initial.id}
            initial={initial}
            editing={!!draft?.ticket}
            rooms={rooms}
            staff={staff}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function TicketForm({
  initial,
  editing,
  rooms,
  staff,
  onDone,
}: {
  initial: MaintenanceTicket
  editing: boolean
  rooms: Room[]
  staff: StaffMember[]
  onDone: () => void
}) {
  const { dispatch } = useStore()
  const [form, setForm] = React.useState<MaintenanceTicket>(initial)

  function patch(p: Partial<MaintenanceTicket>) {
    setForm((f) => ({ ...f, ...p }))
  }

  function save() {
    if (!form.title.trim()) {
      toast.error("Give the ticket a title")
      return
    }
    if (editing) {
      dispatch({ type: "ticket:update", id: form.id, patch: form })
      toast.success("Ticket updated", { description: `${form.reference} · ${form.location}` })
    } else {
      dispatch({ type: "ticket:create", ticket: form })
      toast.success("Ticket logged", { description: `${form.reference} · ${form.location}` })
    }
    onDone()
  }

  function resolve() {
    dispatch({ type: "ticket:update", id: form.id, patch: { status: "resolved", blocksRoom: false } })
    toast.success(`${form.reference} resolved`, {
      description: form.blocksRoom ? `${form.location} is sellable again.` : "Signed off.",
    })
    onDone()
  }

  function remove() {
    dispatch({ type: "ticket:delete", id: form.id })
    toast.message("Ticket deleted")
    onDone()
  }

  const locationOptions = React.useMemo(
    () => [
      ...rooms.map((r) => ({ value: `Room ${r.number}`, label: `Room ${r.number}` })),
      { value: "Main pool deck", label: "Main pool deck" },
      { value: "Spa pavilion", label: "Spa pavilion" },
      { value: "Lobby", label: "Lobby" },
      { value: "Staff corridor", label: "Staff corridor" },
    ],
    [rooms],
  )

  return (
    <>
      <SheetHeader className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tile-blue text-tile-blue-fg">
                  <WrenchIcon className="size-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">
                    {editing ? form.title || "Ticket" : "Log a ticket"}
                  </SheetTitle>
                  <SheetDescription className="num truncate text-xs">
                    {form.reference} · {form.location}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-5 py-5">
              <TextField
                label="What is wrong"
                value={form.title}
                onChange={(v) => patch({ title: v })}
                placeholder="Split AC not holding temperature"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Location"
                  value={form.location}
                  onChange={(v) => patch({ location: v })}
                  options={locationOptions}
                />
                <SelectField
                  label="Category"
                  value={form.category}
                  onChange={(v) => patch({ category: v as MaintenanceTicket["category"] })}
                  options={CATEGORIES}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Priority"
                  value={form.priority}
                  onChange={(v) => patch({ priority: v as MaintenanceTicket["priority"] })}
                  options={PRIORITIES}
                />
                <SelectField
                  label="Status"
                  value={form.status}
                  onChange={(v) => patch({ status: v as MaintenanceTicket["status"] })}
                  options={STATUSES}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DateField label="Reported" value={form.reportedAt} onChange={(iso) => patch({ reportedAt: iso })} />
                <DateField
                  label="Due"
                  value={form.dueAt}
                  min={form.reportedAt}
                  onChange={(iso) => patch({ dueAt: iso })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Assigned to"
                  value={form.assignedTo}
                  onChange={(v) => patch({ assignedTo: v })}
                  options={staff.map((s) => ({ value: s.name, label: s.name, hint: s.role }))}
                />
                <TextField
                  label="Estimated cost"
                  type="number"
                  value={form.estimatedCost}
                  onChange={(v) => patch({ estimatedCost: Math.max(0, Number(v) || 0) })}
                  help={money(form.estimatedCost)}
                />
              </div>

              <div className="flex items-start gap-4 rounded-lg border border-border p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Block the room</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Removes the unit from sellable inventory and shows a block on the calendar until the
                    ticket is resolved.
                  </p>
                </div>
                <Switch
                  checked={form.blocksRoom}
                  onCheckedChange={(v) => patch({ blocksRoom: v })}
                  aria-label="Block the room"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="mt-desc" className="text-xs font-medium">
                  Details
                </label>
                <Textarea
                  id="mt-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="What was observed, what has been tried, what parts are needed"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-2 border-t border-border bg-popover px-5 py-4">
              <Button onClick={save} className="h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                <SaveIcon className="size-3.5" strokeWidth={2.25} />
                {editing ? "Save changes" : "Log ticket"}
              </Button>
              {editing && form.status !== "resolved" ? (
                <Button variant="outline" className="h-9 gap-1.5" onClick={resolve}>
                  <CircleCheckIcon className="size-3.5" strokeWidth={2.25} />
                  Resolve
                </Button>
              ) : null}
              {editing ? (
                <Button
                  variant="ghost"
                  className="ml-auto h-9 gap-1.5 text-destructive hover:text-destructive"
                  onClick={remove}
                >
                  <Trash2Icon className="size-3.5" strokeWidth={2.25} />
                  Delete
                </Button>
              ) : (
                <Button variant="ghost" className="h-9" onClick={onDone}>
                  Discard
                </Button>
              )}
      </div>
    </>
  )
}
