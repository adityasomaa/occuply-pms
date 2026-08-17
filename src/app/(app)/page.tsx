import Link from "next/link"
import {
  ArrowUpRightIcon,
  CalendarPlusIcon,
  DoorOpenIcon,
  LogOutIcon,
  MoonIcon,
  TriangleAlertIcon,
  WrenchIcon,
} from "lucide-react"

import { SiteHeader } from "@/components/occuply/site-header"
import { PerformanceChart } from "@/components/occuply/performance-chart"
import { EmptyState, Meter, Panel, StatStrip, StatusDot } from "@/components/occuply/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { activePropertyId } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"
import { countryName, money, moneyShort, percent, relativeDays, shortDate } from "@/lib/format"

export default async function DashboardPage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor)
  const { kpi, property, rooms, channels, tickets, bookings, metrics } = snap

  const arrivals = bookings
    .filter((b) => b.checkIn === anchor && b.status !== "cancelled")
    .slice(0, 6)
  const departures = bookings
    .filter((b) => b.checkOut === anchor && b.status !== "cancelled")
    .slice(0, 6)

  const statusCounts = {
    occupied: rooms.filter((r) => r.status === "occupied").length,
    arriving: rooms.filter((r) => r.status === "arriving").length,
    departing: rooms.filter((r) => r.status === "departing").length,
    vacantClean: rooms.filter((r) => r.status === "vacant-clean").length,
    vacantDirty: rooms.filter((r) => r.status === "vacant-dirty").length,
    ooo: rooms.filter((r) => r.status === "out-of-order").length,
  }

  const channelMix = [...channels]
    .filter((c) => c.status !== "disabled")
    .sort((a, b) => b.revenue30d - a.revenue30d)
  const mixTotal = channelMix.reduce((s, c) => s + c.revenue30d, 0)

  const urgent = tickets
    .filter((t) => t.status !== "resolved" && (t.priority === "critical" || t.priority === "high"))
    .slice(0, 4)

  const brokenChannels = channels.filter((c) => c.status === "error")
  const alerts = brokenChannels.length + statusCounts.ooo + urgent.length

  return (
    <>
      <SiteHeader
        title="Dashboard"
        subtitle={`${property.name} · ${property.city}`}
        today={anchor}
        alerts={alerts}
      >
        <Button size="sm" className="h-8 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <CalendarPlusIcon className="size-3.5" strokeWidth={2.25} />
          New booking
        </Button>
      </SiteHeader>

      <div className="flex flex-1 flex-col gap-4 p-3 lg:p-5">
        <StatStrip
          stats={[
            {
              label: "Occupancy · 30d",
              value: percent(kpi.occupancy),
              delta: kpi.occupancyDelta,
              hint: `${kpi.inHouse} of ${property.totalUnits} units in house tonight`,
            },
            {
              label: "ADR · 30d",
              value: moneyShort(kpi.adr),
              delta: kpi.adrDelta,
              hint: `Average length of stay ${kpi.alos} nights`,
            },
            {
              label: "RevPAR · 30d",
              value: moneyShort(kpi.revpar),
              delta: kpi.revparDelta,
              hint: "Revenue per available room",
              emphasis: true,
            },
            {
              label: "Room revenue · 30d",
              value: moneyShort(kpi.revenue30d),
              delta: kpi.revenueDelta,
              hint: `${percent(kpi.directShare)} booked direct`,
            },
          ]}
        />

        {brokenChannels.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
            <TriangleAlertIcon className="size-4 shrink-0 text-destructive" strokeWidth={2} />
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">{brokenChannels[0].name} stopped syncing.</span>{" "}
              <span className="text-muted-foreground">{brokenChannels[0].issue}</span>
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              nativeButton={false}
              render={<Link href="/channels" />}
            >
              Fix mapping
            </Button>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <PerformanceChart metrics={metrics} />

          <Panel title="Tonight" description={`Check-in ${property.checkIn} · check-out ${property.checkOut}`}>
            <dl className="divide-y divide-border">
              {[
                { icon: DoorOpenIcon, label: "Arrivals", value: kpi.arrivalsToday, tone: "accent" as const },
                { icon: LogOutIcon, label: "Departures", value: kpi.departuresToday, tone: "info" as const },
                { icon: MoonIcon, label: "Stayovers", value: Math.max(0, kpi.inHouse - kpi.departuresToday), tone: "ok" as const },
                { icon: WrenchIcon, label: "Out of order", value: kpi.outOfOrder, tone: "risk" as const },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 px-4 py-3 lg:px-5">
                  <StatusDot tone={row.tone} pulse={row.label === "Arrivals" && row.value > 0} />
                  <row.icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <dt className="flex-1 text-sm">{row.label}</dt>
                  <dd className="num text-lg font-semibold">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-2.5 border-t border-border px-4 py-4 lg:px-5">
              <div className="flex items-center justify-between">
                <span className="label-brand">Housekeeping board</span>
                <span className="num text-xs text-muted-foreground">
                  {statusCounts.vacantDirty} to clean
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                {[
                  { n: statusCounts.occupied, c: "bg-accent" },
                  { n: statusCounts.departing, c: "bg-status-info" },
                  { n: statusCounts.arriving, c: "bg-chart-2" },
                  { n: statusCounts.vacantClean, c: "bg-status-ok" },
                  { n: statusCounts.vacantDirty, c: "bg-status-warn" },
                  { n: statusCounts.ooo, c: "bg-destructive" },
                ].map((seg, i) =>
                  seg.n > 0 ? (
                    <span
                      key={i}
                      className={seg.c}
                      style={{ width: `${(seg.n / rooms.length) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                {[
                  { label: "Occupied", n: statusCounts.occupied, tone: "accent" as const },
                  { label: "Departing", n: statusCounts.departing, tone: "info" as const },
                  { label: "Arriving", n: statusCounts.arriving, tone: "idle" as const },
                  { label: "Vacant clean", n: statusCounts.vacantClean, tone: "ok" as const },
                  { label: "To clean", n: statusCounts.vacantDirty, tone: "warn" as const },
                  { label: "Out of order", n: statusCounts.ooo, tone: "risk" as const },
                ].map((s) => (
                  <li key={s.label} className="flex items-center gap-1.5 text-xs">
                    <StatusDot tone={s.tone} className="size-1.5" />
                    <span className="truncate text-muted-foreground">{s.label}</span>
                    <span className="num ml-auto font-medium">{s.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            title="Arrivals and departures today"
            description={shortDate(anchor)}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                nativeButton={false}
                render={<Link href="/calendar" />}
              >
                Open calendar
                <ArrowUpRightIcon className="size-3" />
              </Button>
            }
          >
            {arrivals.length === 0 && departures.length === 0 ? (
              <EmptyState
                icon={DoorOpenIcon}
                title="Nothing moves today"
                description="No arrivals or departures are scheduled. Stayovers continue as normal and housekeeping runs the refresh list."
              />
            ) : (
              <div className="grid divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <MovementList
                  heading="Arriving"
                  tone="accent"
                  rows={arrivals.map((b) => ({
                    id: b.id,
                    name: b.guestName,
                    meta: `${b.roomNumber} · ${b.nights}n · ${b.channel}`,
                    country: b.guestCountry,
                    right: money(b.total),
                    note: b.notes,
                  }))}
                  emptyLabel="No arrivals scheduled"
                />
                <MovementList
                  heading="Departing"
                  tone="info"
                  rows={departures.map((b) => ({
                    id: b.id,
                    name: b.guestName,
                    meta: `${b.roomNumber} · balance ${money(b.total - b.paid)}`,
                    country: b.guestCountry,
                    right: b.total - b.paid > 0 ? "Unsettled" : "Settled",
                    note: undefined,
                  }))}
                  emptyLabel="No departures scheduled"
                />
              </div>
            )}
          </Panel>

          <Panel
            title="Where the revenue came from"
            description="Last 30 days by channel"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                nativeButton={false}
                render={<Link href="/channels" />}
              >
                Channels
                <ArrowUpRightIcon className="size-3" />
              </Button>
            }
            bodyClassName="divide-y divide-border"
          >
            {channelMix.slice(0, 6).map((c) => {
              const share = mixTotal === 0 ? 0 : (c.revenue30d / mixTotal) * 100
              return (
                <div key={c.id} className="space-y-1.5 px-4 py-2.5 lg:px-5">
                  <div className="flex items-center gap-2">
                    <StatusDot
                      tone={c.status === "connected" ? "ok" : c.status === "syncing" ? "warn" : "risk"}
                      className="size-1.5"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                    <span className="num text-xs text-muted-foreground">{share.toFixed(1)}%</span>
                    <span className="num w-16 text-right text-xs font-medium">
                      {moneyShort(c.revenue30d)}
                    </span>
                  </div>
                  <Meter value={share} tone={c.kind === "Direct" ? "ok" : "accent"} />
                </div>
              )
            })}
          </Panel>
        </div>

        <Panel
          title="Needs attention"
          description={`${kpi.openTickets} open maintenance tickets`}
          action={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              nativeButton={false}
              render={<Link href="/maintenance" />}
            >
              All tickets
              <ArrowUpRightIcon className="size-3" />
            </Button>
          }
          bodyClassName="divide-y divide-border"
        >
          {urgent.length === 0 ? (
            <EmptyState
              icon={WrenchIcon}
              title="Nothing urgent"
              description="No critical or high-priority tickets are open. Routine work continues on the maintenance board."
            />
          ) : (
            urgent.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-5">
                <Badge
                  variant="outline"
                  className={
                    t.priority === "critical"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-status-warn/30 bg-status-warn/12 text-status-warn"
                  }
                >
                  {t.priority}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.location} · {t.assignedTo} · due {relativeDays(anchor, t.dueAt)}
                  </p>
                </div>
                <span className="num shrink-0 text-xs text-muted-foreground">
                  {moneyShort(t.estimatedCost)}
                </span>
              </div>
            ))
          )}
        </Panel>
      </div>
    </>
  )
}

function MovementList({
  heading,
  tone,
  rows,
  emptyLabel,
}: {
  heading: string
  tone: "accent" | "info"
  rows: { id: string; name: string; meta: string; country: string; right: string; note?: string }[]
  emptyLabel: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 lg:px-5">
        <StatusDot tone={tone} className="size-1.5" />
        <span className="label-brand">{heading}</span>
        <span className="num ml-auto text-xs text-muted-foreground">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground lg:px-5">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[0.625rem] font-semibold text-muted-foreground">
                {r.country}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.meta}</p>
                {r.note ? (
                  <p className="truncate text-xs text-accent-brand">{r.note}</p>
                ) : null}
              </div>
              <span className="num shrink-0 text-xs font-medium" title={countryName(r.country)}>
                {r.right}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
