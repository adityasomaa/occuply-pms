import type { Metadata } from "next"
import {
  BedDoubleIcon,
  PercentIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"

import { RevenueOverview } from "@/components/occuply/performance-chart"
import { Meter, Panel, StatStrip, StatusDot } from "@/components/occuply/primitives"
import { SiteHeader } from "@/components/occuply/site-header"
import { channelStyle } from "@/lib/channels"
import { money, moneyShort, percent } from "@/lib/format"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { addDays, getSnapshot, today } from "@/lib/seed"
import { buildSuggestions } from "@/lib/suggestions"

export const metadata: Metadata = { title: "Reports" }

export default async function ReportsPage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())
  const { kpi, property, metrics, channels, roomTypes, inventory, rooms, tickets, pricingRules } = snap

  /* ------------------------------- distribution ----------------------------- */

  const live = channels.filter((c) => c.status !== "disabled")
  const totalRevenue = live.reduce((s, c) => s + c.revenue30d, 0)
  const totalBookings = live.reduce((s, c) => s + c.bookings30d, 0)
  const commissionPaid = live.reduce((s, c) => s + (c.revenue30d * c.commission) / 100, 0)
  const direct = channels.find((c) => c.kind === "Direct")
  const byRevenue = [...live].sort((a, b) => b.revenue30d - a.revenue30d)

  /* ------------------------------- room types ------------------------------- */

  const horizon = addDays(anchor, 14)
  const perType = roomTypes.map((rt) => {
    const window14 = inventory.filter(
      (i) => i.roomTypeId === rt.id && i.date >= anchor && i.date < horizon,
    )
    const sold = window14.reduce((s, i) => s + i.sold, 0)
    const capacity = rt.count * Math.max(1, window14.length)
    const revenue = window14.reduce((s, i) => s + i.sold * i.rate, 0)
    return {
      rt,
      occupancy: (sold / capacity) * 100,
      adr: sold === 0 ? rt.baseRate : revenue / sold,
      revenue,
    }
  })
  const bestType = perType.reduce((a, b) => (b.revenue > a.revenue ? b : a), perType[0])

  /* ------------------------------- maintenance ------------------------------ */

  const openTickets = tickets.filter((t) => t.status !== "resolved")
  const spend = openTickets.reduce((s, t) => s + t.estimatedCost, 0)
  const byCategory = Object.entries(
    openTickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])

  /* --------------------------------- pricing -------------------------------- */

  const impact30d = pricingRules.reduce((s, r) => s + r.revenueImpact, 0)
  const fires30d = pricingRules.reduce((s, r) => s + r.appliedLast30d, 0)
  const suggestions = buildSuggestions(inventory, roomTypes, anchor, horizon)
  const firedRules = [...pricingRules]
    .filter((r) => r.appliedLast30d > 0)
    .sort((a, b) => b.revenueImpact - a.revenueImpact)

  const occupiedNow = rooms.filter((r) => r.status === "occupied" || r.status === "departing").length

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Reports"
        subtitle={`Performance, distribution and cost across ${property.name}`}
        today={anchor}
      />

      <StatStrip
        stats={[
          {
            label: "Occupancy · 30d",
            value: percent(kpi.occupancy),
            delta: kpi.occupancyDelta,
            icon: PercentIcon,
            tone: "orange",
          },
          { label: "ADR · 30d", value: money(kpi.adr), delta: kpi.adrDelta, icon: WalletIcon, tone: "green" },
          {
            label: "RevPAR · 30d",
            value: money(kpi.revpar),
            delta: kpi.revparDelta,
            icon: TrendingUpIcon,
            tone: "blue",
          },
          {
            label: "Room revenue · 30d",
            value: money(kpi.revenue30d),
            delta: kpi.revenueDelta,
            icon: ReceiptTextIcon,
            tone: "violet",
          },
        ]}
      />

      <RevenueOverview metrics={metrics} />

      {/* ------------------------------ distribution ---------------------------- */}
      <Panel
        title="Channel performance"
        description={`${totalBookings} bookings and ${moneyShort(commissionPaid)} of commission in the last 30 days`}
        bodyClassName="overflow-x-auto scroll-slim"
      >
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Channel", "Bookings", "Revenue", "Share", "Commission", "Net"].map((h) => (
                <th key={h} className="label-brand px-4 py-2 font-medium lg:px-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {byRevenue.map((c) => {
              const share = totalRevenue === 0 ? 0 : (c.revenue30d / totalRevenue) * 100
              const fee = (c.revenue30d * c.commission) / 100
              return (
                <tr key={c.id} className="ease-occuply transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 lg:px-5">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: channelStyle(c.name).bg }}
                      />
                      {c.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">{c.kind}</span>
                  </td>
                  <td className="num px-4 py-3 lg:px-5">{c.bookings30d}</td>
                  <td className="num px-4 py-3 font-medium lg:px-5">{money(c.revenue30d)}</td>
                  <td className="w-32 px-4 py-3 lg:px-5">
                    <div className="flex items-center gap-2">
                      <span className="num w-10 text-xs">{percent(share, 0)}</span>
                      <Meter value={share} tone={c.kind === "Direct" ? "ok" : "accent"} className="w-14" />
                    </div>
                  </td>
                  <td className="num px-4 py-3 text-muted-foreground lg:px-5">
                    {percent(c.commission)} · {moneyShort(fee)}
                  </td>
                  <td className="num px-4 py-3 font-medium lg:px-5">{money(c.revenue30d - fee)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/50">
              <th className="label-brand px-4 py-2.5 text-left font-medium lg:px-5">
                Direct share {percent(((direct?.bookings30d ?? 0) / Math.max(1, totalBookings)) * 100)}
              </th>
              <td className="num px-4 py-2.5 font-semibold lg:px-5">{totalBookings}</td>
              <td className="num px-4 py-2.5 font-semibold lg:px-5">{money(totalRevenue)}</td>
              <td />
              <td className="num px-4 py-2.5 font-semibold lg:px-5">{moneyShort(commissionPaid)}</td>
              <td className="num px-4 py-2.5 font-semibold lg:px-5">
                {money(totalRevenue - commissionPaid)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* ----------------------------- room types ----------------------------- */}
        <Panel
          title="Room type performance"
          description={`Next 14 nights · ${bestType?.rt.name} earns the most`}
          bodyClassName="divide-y divide-border"
        >
          {perType.map(({ rt, occupancy, adr, revenue }) => (
            <div key={rt.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-5">
              <div className="min-w-[150px] flex-1">
                <p className="truncate text-sm font-medium">{rt.name}</p>
                <p className="num truncate text-xs text-muted-foreground">
                  {rt.count} rooms · ADR {moneyShort(adr)}
                </p>
              </div>
              <div className="flex w-28 items-center gap-2">
                <span className="num w-10 text-xs">{percent(occupancy, 0)}</span>
                <Meter value={occupancy} tone={occupancy > 85 ? "warn" : "accent"} className="w-14" />
              </div>
              <span className="num w-24 shrink-0 text-right text-sm font-semibold">
                {moneyShort(revenue)}
              </span>
            </div>
          ))}
        </Panel>

        {/* ----------------------------- maintenance ---------------------------- */}
        <Panel
          title="Maintenance cost"
          description={`${openTickets.length} open tickets · ${moneyShort(spend)} estimated`}
          bodyClassName="divide-y divide-border"
        >
          {byCategory.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nothing open. Every ticket is signed off.
            </p>
          ) : (
            byCategory.map(([cat, n]) => {
              const cost = openTickets
                .filter((t) => t.category === cat)
                .reduce((s, t) => s + t.estimatedCost, 0)
              return (
                <div key={cat} className="flex items-center gap-3 px-4 py-3 lg:px-5">
                  <WrenchIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.9} />
                  <span className="w-32 shrink-0 truncate text-sm">{cat}</span>
                  <Meter
                    value={n}
                    max={Math.max(...byCategory.map((c) => c[1]))}
                    tone={n >= 3 ? "warn" : "accent"}
                    className="flex-1"
                  />
                  <span className="num w-6 shrink-0 text-right text-sm font-medium">{n}</span>
                  <span className="num w-20 shrink-0 text-right text-xs text-muted-foreground">
                    {moneyShort(cost)}
                  </span>
                </div>
              )
            })
          )}
        </Panel>
      </div>

      {/* -------------------------------- pricing -------------------------------- */}
      <Panel
        title="Pricing engine impact"
        description={`${fires30d} rate changes fired in 30 days · ${suggestions.length} recommendations open`}
        bodyClassName="divide-y divide-border"
      >
        {firedRules.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No rule has fired in the last thirty days.
          </p>
        ) : (
          firedRules.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-5">
              <StatusDot tone={r.revenueImpact >= 0 ? "ok" : "warn"} />
              <div className="min-w-[180px] flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.trigger}</p>
              </div>
              <span className="num w-24 shrink-0 text-right text-xs text-muted-foreground">
                {r.appliedLast30d} fires
              </span>
              <span
                className={`num w-28 shrink-0 text-right text-sm font-semibold ${
                  r.revenueImpact >= 0 ? "text-status-ok" : "text-destructive"
                }`}
              >
                {moneyShort(r.revenueImpact)}
              </span>
            </div>
          ))
        )}
        <div className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-3 lg:px-5">
          <span className="label-brand">Attributed to automatic repricing</span>
          <span className="num text-sm font-semibold text-accent-brand">{money(impact30d)}</span>
        </div>
      </Panel>

      <Panel title="Right now" description="A snapshot of the property as it stands">
        <dl className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
          {[
            { icon: BedDoubleIcon, k: "Rooms occupied", v: `${occupiedNow}/${rooms.length}` },
            { icon: PercentIcon, k: "Average length of stay", v: `${kpi.alos} nights` },
            { icon: ReceiptTextIcon, k: "Cancellation rate", v: percent(kpi.cancellationRate) },
            { icon: WrenchIcon, k: "Rooms out of order", v: String(kpi.outOfOrder) },
          ].map((s) => (
            <div key={s.k} className="flex items-center gap-3 px-4 py-4 lg:px-5">
              <s.icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.9} />
              <div className="min-w-0">
                <dt className="truncate text-xs text-muted-foreground">{s.k}</dt>
                <dd className="num truncate text-lg font-semibold">{s.v}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  )
}
