"use client"

import * as React from "react"
import { toast } from "sonner"
import { CheckIcon, CoffeeIcon, XIcon } from "lucide-react"

import { SelectField, TextField } from "@/components/occuply/field"
import { Panel } from "@/components/occuply/primitives"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { money, moneyShort } from "@/lib/format"
import type { RatePlan, RoomType } from "@/lib/types"
import { cn } from "@/lib/utils"

export function applyPlan(base: number, plan: RatePlan): number {
  const raw = plan.adjustmentKind === "percent" ? base * (1 + plan.adjustment / 100) : base + plan.adjustment
  return Math.round(raw / 5000) * 5000
}

const typeTone: Record<RatePlan["type"], string> = {
  Base: "border-accent/35 bg-accent-soft text-accent-brand",
  Package: "border-status-info/30 bg-status-info/10 text-status-info",
  Promotional: "border-status-warn/30 bg-status-warn/12 text-status-warn",
  Corporate: "border-border bg-muted text-muted-foreground",
  "Long stay": "border-status-ok/30 bg-status-ok/10 text-status-ok",
}

export function RatePlansTable({ plans, roomTypes }: { plans: RatePlan[]; roomTypes: RoomType[] }) {
  const [state, setState] = React.useState(() => Object.fromEntries(plans.map((p) => [p.id, p.active])))
  const [selected, setSelected] = React.useState(plans[0]?.id ?? "")
  // Local overrides so an edit shows up immediately without a backend.
  const [edits, setEdits] = React.useState<Record<string, Partial<RatePlan>>>({})
  const [editing, setEditing] = React.useState<RatePlan | null>(null)

  function toggle(plan: RatePlan, next: boolean) {
    setState((s) => ({ ...s, [plan.id]: next }))
    toast[next ? "success" : "message"](
      next ? `${plan.name} is now selling` : `${plan.name} paused`,
      {
        description: next
          ? `Pushed to ${plan.channels.length} connected channels.`
          : "Existing reservations are unaffected. New bookings on this plan are closed.",
      },
    )
  }

  const merged = React.useMemo(
    () => plans.map((p) => ({ ...p, ...(edits[p.id] ?? {}) })),
    [plans, edits],
  )
  const active = merged.find((p) => p.id === selected) ?? merged[0]
  const activeCount = Object.values(state).filter(Boolean).length

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Panel
        title="Rate plans"
        description={`${activeCount} of ${merged.length} selling`}
        bodyClassName="overflow-x-auto scroll-slim"
      >
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Plan", "Type", "Adjustment", "Min stay", "Cancellation", "Channels", "Selling"].map((h) => (
                <th key={h} className="label-brand px-4 py-2 font-medium lg:px-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {merged.map((p) => {
              const on = state[p.id]
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={cn(
                    "ease-occuply cursor-pointer transition-colors duration-150 hover:bg-muted/50",
                    selected === p.id && "bg-accent-soft/45",
                    !on && "opacity-60",
                  )}
                >
                  <td className="px-4 py-3 lg:px-5">
                    <span className="flex items-center gap-2 font-medium">
                      {p.name}
                      {p.includesBreakfast ? (
                        <CoffeeIcon className="size-3.5 text-muted-foreground" strokeWidth={2} />
                      ) : null}
                    </span>
                    <span className="num block text-xs text-muted-foreground">{p.code}</span>
                  </td>
                  <td className="px-4 py-3 lg:px-5">
                    <Badge variant="outline" className={typeTone[p.type]}>
                      {p.type}
                    </Badge>
                  </td>
                  <td
                    className={cn(
                      "num px-4 py-3 font-medium lg:px-5",
                      p.adjustment < 0 ? "text-status-ok" : p.adjustment > 0 ? "text-accent-brand" : "",
                    )}
                  >
                    {p.adjustment === 0
                      ? "Base"
                      : p.adjustmentKind === "percent"
                        ? `${p.adjustment > 0 ? "+" : ""}${p.adjustment}%`
                        : `+${moneyShort(p.adjustment)}`}
                  </td>
                  <td className="num px-4 py-3 lg:px-5">{p.minStay}n</td>
                  <td className="max-w-[210px] truncate px-4 py-3 text-xs text-muted-foreground lg:px-5">
                    {p.cancellation}
                  </td>
                  <td className="num px-4 py-3 text-muted-foreground lg:px-5">{p.channels.length}</td>
                  <td className="px-4 py-3 lg:px-5" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={on}
                      onCheckedChange={(v) => toggle(p, v)}
                      aria-label={`${on ? "Pause" : "Activate"} ${p.name}`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      <Panel
        title={active?.name ?? "Rate preview"}
        description="Derived nightly rate by room type"
        action={
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={!active}
            onClick={() => setEditing(active)}
          >
            Edit plan
          </Button>
        }
      >
        <ul className="divide-y divide-border">
          {roomTypes.map((rt) => {
            const derived = active ? applyPlan(rt.baseRate, active) : rt.baseRate
            const diff = derived - rt.baseRate
            return (
              <li key={rt.id} className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{rt.name}</p>
                  <p className="num truncate text-xs text-muted-foreground">
                    base {moneyShort(rt.baseRate)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-sm font-semibold">{money(derived)}</p>
                  {diff !== 0 ? (
                    <p
                      className={cn(
                        "num text-xs",
                        diff < 0 ? "text-status-ok" : "text-accent-brand",
                      )}
                    >
                      {diff > 0 ? "+" : ""}
                      {moneyShort(diff)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">no change</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {active ? (
          <div className="space-y-2 border-t border-border px-4 py-3.5 lg:px-5">
            <span className="label-brand">Distribution</span>
            <ul className="flex flex-wrap gap-1.5">
              {active.channels.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs"
                >
                  <CheckIcon className="size-3 text-status-ok" strokeWidth={2.5} />
                  {c}
                </li>
              ))}
              {active.channels.length === 0 ? (
                <li className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <XIcon className="size-3" />
                  Not distributed anywhere yet
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </Panel>

      <EditPlanDialog
        plan={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (!editing) return
          setEdits((e) => ({ ...e, [editing.id]: { ...(e[editing.id] ?? {}), ...patch } }))
          toast.success(`${patch.name ?? editing.name} saved`, {
            description: "Derived rates updated across every room type.",
          })
          setEditing(null)
        }}
      />
    </div>
  )
}

const PLAN_TYPES = ["Base", "Package", "Promotional", "Corporate", "Long stay"].map((t) => ({
  value: t,
  label: t,
}))

function EditPlanDialog({
  plan,
  onClose,
  onSave,
}: {
  plan: RatePlan | null
  onClose: () => void
  onSave: (patch: Partial<RatePlan>) => void
}) {
  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {plan ? <EditPlanForm key={plan.id} plan={plan} onSave={onSave} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function EditPlanForm({
  plan,
  onSave,
  onClose,
}: {
  plan: RatePlan
  onSave: (patch: Partial<RatePlan>) => void
  onClose: () => void
}) {
  const [name, setName] = React.useState(plan.name)
  const [type, setType] = React.useState<string>(plan.type)
  const [adjustment, setAdjustment] = React.useState(String(plan.adjustment))
  const [minStay, setMinStay] = React.useState(String(plan.minStay))
  const [cancellation, setCancellation] = React.useState(plan.cancellation)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit {plan.code}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-1">
        <TextField label="Plan name" value={name} onChange={setName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Type" value={type} onChange={setType} options={PLAN_TYPES} />
          <TextField
            label={plan.adjustmentKind === "percent" ? "Adjustment (%)" : "Adjustment (Rp)"}
            type="number"
            value={adjustment}
            onChange={setAdjustment}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Minimum stay (nights)" type="number" min={1} value={minStay} onChange={setMinStay} />
          <TextField label="Cancellation" value={cancellation} onChange={setCancellation} />
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() =>
            onSave({
              name: name.trim() || plan.name,
              type: type as RatePlan["type"],
              adjustment: Number(adjustment) || 0,
              minStay: Math.max(1, Number(minStay) || 1),
              cancellation,
            })
          }
        >
          Save plan
        </Button>
      </DialogFooter>
    </>
  )
}
