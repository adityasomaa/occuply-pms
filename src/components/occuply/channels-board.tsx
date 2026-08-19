"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  CheckCircle2Icon,
  LinkIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { MapRoomTypeButton } from "@/components/occuply/action-buttons"
import { Meter, Panel, StatusDot } from "@/components/occuply/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { moneyShort, percent, timeOfDay } from "@/lib/format"
import type { Channel, RoomType } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusMeta = {
  connected: { label: "Connected", tone: "ok" as const, badge: "border-status-ok/30 bg-status-ok/10 text-status-ok" },
  syncing: { label: "Syncing", tone: "warn" as const, badge: "border-status-warn/30 bg-status-warn/12 text-status-warn" },
  error: { label: "Error", tone: "risk" as const, badge: "border-destructive/30 bg-destructive/10 text-destructive" },
  disabled: { label: "Disabled", tone: "idle" as const, badge: "border-border bg-muted text-muted-foreground" },
}

export function ChannelsBoard({
  channels,
  roomTypes,
  focusChannelId,
}: {
  channels: Channel[]
  roomTypes: RoomType[]
  focusChannelId?: string
}) {
  const [enabled, setEnabled] = React.useState(() =>
    Object.fromEntries(channels.map((c) => [c.id, c.status !== "disabled"])),
  )
  const [syncing, setSyncing] = React.useState<string | null>(null)
  const [repaired, setRepaired] = React.useState<Record<string, boolean>>({})
  const [selected, setSelected] = React.useState(
    channels.find((c) => c.status === "error")?.id ?? channels[0]?.id ?? "",
  )

  // Deep link from search and the alert centre.
  const requested = focusChannelId
  const [handled, setHandled] = React.useState<string | null>(null)
  if (requested && requested !== handled) {
    setHandled(requested)
    if (channels.some((c) => c.id === requested)) setSelected(requested)
  }

  const active = channels.find((c) => c.id === selected) ?? channels[0]
  const totalRevenue = channels.reduce((s, c) => s + (enabled[c.id] ? c.revenue30d : 0), 0)

  function resync(c: Channel) {
    setSyncing(c.id)
    // Simulated round trip so the button demonstrates its full state cycle.
    window.setTimeout(() => {
      setSyncing(null)
      toast.success(`${c.name} inventory pushed`, {
        description: `${c.totalRoomTypes} room types and 60 nights of availability sent.`,
      })
    }, 1400)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Panel
        title="Connected channels"
        description={`${channels.filter((c) => enabled[c.id]).length} live · ${moneyShort(totalRevenue)} in the last 30 days`}
        bodyClassName="divide-y divide-border"
      >
        {channels.map((c) => {
          const on = enabled[c.id]
          const status = !on ? "disabled" : repaired[c.id] ? "connected" : c.status
          const meta = statusMeta[status]
          const mappedCount = repaired[c.id] ? c.totalRoomTypes : c.mappedRoomTypes
          const mapped = (mappedCount / c.totalRoomTypes) * 100
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelected(c.id)
                }
              }}
              className={cn(
                "ease-occuply flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-150 lg:px-5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                "hover:bg-muted/50",
                selected === c.id && "bg-accent-soft/45",
                !on && "opacity-60",
              )}
            >
              <StatusDot tone={meta.tone} pulse={status === "syncing"} />

              <div className="min-w-[140px] flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.kind} · {percent(c.commission)} commission
                </p>
              </div>

              <div className="hidden w-28 sm:block">
                <div className="mb-1 flex items-center justify-between text-[0.6875rem] text-muted-foreground">
                  <span>Mapping</span>
                  <span className="num">
                    {mappedCount}/{c.totalRoomTypes}
                  </span>
                </div>
                <Meter value={mapped} tone={mapped === 100 ? "ok" : "warn"} />
              </div>

              <div className="hidden w-24 text-right lg:block">
                <p className="num text-sm font-medium">{moneyShort(c.revenue30d)}</p>
                <p className="num text-[0.6875rem] text-muted-foreground">{c.bookings30d} bookings</p>
              </div>

              <Badge variant="outline" className={cn("shrink-0", meta.badge)}>
                {meta.label}
              </Badge>

              <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={!on || syncing === c.id}
                  onClick={() => resync(c)}
                  aria-label={`Resync ${c.name}`}
                >
                  <RefreshCwIcon className={cn("size-3.5", syncing === c.id && "animate-spin")} />
                </Button>
                <Switch
                  checked={on}
                  onCheckedChange={(v) => {
                    setEnabled((s) => ({ ...s, [c.id]: v }))
                    toast[v ? "success" : "message"](
                      v ? `${c.name} enabled` : `${c.name} disabled`,
                      {
                        description: v
                          ? "Inventory and rates will push on the next cycle."
                          : "Availability is withdrawn. Existing reservations stay valid.",
                      },
                    )
                  }}
                  aria-label={`${on ? "Disable" : "Enable"} ${c.name}`}
                />
              </div>
            </div>
          )
        })}
      </Panel>

      <Panel
        title={active?.name ?? "Channel"}
        description="Connection detail and room type mapping"
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            disabled={!active || syncing === active.id}
            onClick={() => active && resync(active)}
          >
            <RefreshCwIcon className={cn("size-3", active && syncing === active.id && "animate-spin")} />
            Resync
          </Button>
        }
      >
        {active ? (
          <>
            {active.issue && !repaired[active.id] ? (
              <div className="flex items-start gap-2.5 border-b border-border bg-destructive/5 px-4 py-3 lg:px-5">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={2} />
                <p className="text-xs leading-relaxed">{active.issue}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 border-b border-border bg-status-ok/5 px-4 py-3 lg:px-5">
                <CheckCircle2Icon className="size-4 shrink-0 text-status-ok" strokeWidth={2} />
                <p className="text-xs">
                  Last successful push at {timeOfDay(active.lastSync)} local time.
                </p>
              </div>
            )}

            <dl className="divide-y divide-border">
              {[
                { k: "Connection type", v: active.kind },
                { k: "Commission", v: percent(active.commission) },
                { k: "Bookings · 30d", v: String(active.bookings30d) },
                { k: "Revenue · 30d", v: moneyShort(active.revenue30d) },
                {
                  k: "Rate parity",
                  v:
                    active.rateParity === "in-parity"
                      ? "Matched"
                      : active.rateParity === "undercut"
                        ? "Undercutting direct"
                        : "Above comp set",
                },
              ].map((row) => (
                <div key={row.k} className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
                  <dt className="flex-1 text-xs text-muted-foreground">{row.k}</dt>
                  <dd className="num text-sm font-medium">{row.v}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-2 border-t border-border px-4 py-3.5 lg:px-5">
              <span className="label-brand">Room type mapping</span>
              <ul className="space-y-1.5">
                {roomTypes.map((rt, i) => {
                  const unmapped =
                    active.status === "error" && !repaired[active.id] && i === roomTypes.length - 1
                  return (
                    <li key={rt.id} className="flex items-center gap-2 text-xs">
                      {unmapped ? (
                        <LinkIcon className="size-3.5 shrink-0 text-destructive" strokeWidth={2} />
                      ) : (
                        <CheckCircle2Icon className="size-3.5 shrink-0 text-status-ok" strokeWidth={2} />
                      )}
                      <span className={cn("min-w-0 flex-1 truncate", unmapped && "text-destructive")}>
                        {rt.name}
                      </span>
                      <span className="num shrink-0 text-muted-foreground">{rt.code}</span>
                    </li>
                  )
                })}
              </ul>
              {active.status === "error" && !repaired[active.id] ? (
                <MapRoomTypeButton
                  onMapped={() => {
                    setRepaired((r) => ({ ...r, [active.id]: true }))
                    toast.success(`${active.name} reconnected`, {
                      description: "All room types are mapped. Rates and availability will push tonight.",
                    })
                  }}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </Panel>
    </div>
  )
}
