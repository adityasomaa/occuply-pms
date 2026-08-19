import type { Metadata } from "next"
import {
  PlusIcon,
  ScaleIcon,
  TagIcon,
  TrendingDownIcon,
  WalletIcon,
} from "lucide-react"

import { Panel, StatStrip, StatusDot } from "@/components/occuply/primitives"
import { RatePlansTable } from "@/components/occuply/rate-plans"
import { SiteHeader } from "@/components/occuply/site-header"
import { Button } from "@/components/ui/button"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { addDays, getSnapshot, today } from "@/lib/seed"
import { money, moneyShort, percent, shortDate, weekday } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Rates" }

export default async function RatesPage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())
  const { ratePlans, roomTypes, inventory, channels, property, kpi } = snap

  const activePlans = ratePlans.filter((p) => p.active)
  const week = Array.from({ length: 7 }, (_, i) => addDays(anchor, i))
  const byKey = new Map(inventory.map((i) => [`${i.roomTypeId}:${i.date}`, i]))

  const weekRates = week.map((d) => {
    const rows = roomTypes.map((rt) => byKey.get(`${rt.id}:${d}`)?.rate ?? rt.baseRate)
    return { date: d, min: Math.min(...rows), max: Math.max(...rows) }
  })

  const outOfParity = channels.filter((c) => c.rateParity !== "in-parity" && c.status !== "disabled")

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Rates"
        subtitle={`Rate plans and the seven-night grid · ${property.name}`}
        today={anchor}
        alerts={outOfParity.length}
      >
        <Button size="sm" className="h-8 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusIcon className="size-3.5" strokeWidth={2.25} />
          New rate plan
        </Button>
      </SiteHeader>
      <StatStrip
        stats={[
          { label: "Active rate plans", icon: TagIcon, tone: "orange", value: String(activePlans.length), hint: `${ratePlans.length} configured in total` },
          { label: "ADR · 30d", icon: WalletIcon, tone: "green", value: moneyShort(kpi.adr), delta: kpi.adrDelta, hint: "Achieved, net of discounts" },
          {
            label: "Lowest sellable rate", icon: TrendingDownIcon, tone: "blue",
            value: moneyShort(Math.min(...roomTypes.map((r) => r.floorRate))),
            hint: "Rate floor across all room types",
          },
          {
            label: "Channels out of parity", icon: ScaleIcon, tone: "violet",
            value: String(outOfParity.length),
            hint: outOfParity.length ? outOfParity.map((c) => c.name).join(", ") : "All channels match",
          },
        ]}
      />

      <RatePlansTable plans={ratePlans} roomTypes={roomTypes} />

      <Panel
        title="Seven-night rate grid"
        description="Selling rate per room type, before plan adjustments"
        bodyClassName="overflow-x-auto scroll-slim"
      >
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="label-brand sticky left-0 z-10 min-w-[190px] bg-card px-4 py-2 text-left font-medium lg:px-5">
                Room type
              </th>
              {week.map((d) => (
                <th key={d} className="min-w-[92px] px-2 py-2 text-center font-normal">
                  <span className="block text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                    {weekday(d)}
                  </span>
                  <span className={cn("block text-xs font-medium", d === anchor && "text-accent-brand")}>
                    {shortDate(d)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roomTypes.map((rt) => (
              <tr key={rt.id} className="ease-occuply transition-colors hover:bg-muted/50">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left font-normal lg:px-5"
                >
                  <span className="block truncate text-sm font-medium">{rt.name}</span>
                  <span className="num block text-xs text-muted-foreground">
                    base {moneyShort(rt.baseRate)}
                  </span>
                </th>
                {week.map((d) => {
                  const cell = byKey.get(`${rt.id}:${d}`)
                  const rate = cell?.rate ?? rt.baseRate
                  const vsBase = (rate - rt.baseRate) / rt.baseRate
                  return (
                    <td key={d} className="px-2 py-2.5 text-center">
                      <span className="num block text-sm font-medium">{money(rate)}</span>
                      <span
                        className={cn(
                          "num block text-[0.6875rem]",
                          vsBase > 0.03
                            ? "text-accent-brand"
                            : vsBase < -0.03
                              ? "text-status-ok"
                              : "text-muted-foreground",
                        )}
                      >
                        {vsBase > 0 ? "+" : ""}
                        {percent(vsBase * 100, 0)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/50">
              <th className="label-brand sticky left-0 z-10 bg-muted/50 px-4 py-2 text-left font-medium lg:px-5">
                Range
              </th>
              {weekRates.map((w) => (
                <td key={w.date} className="num px-2 py-2 text-center text-xs text-muted-foreground">
                  {moneyShort(w.min)} – {moneyShort(w.max)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </Panel>

      {outOfParity.length > 0 ? (
        <Panel title="Rate parity" description="Where your public rate differs from the channel's">
          <ul className="divide-y divide-border">
            {outOfParity.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-5">
                <StatusDot tone={c.rateParity === "undercut" ? "risk" : "warn"} />
                <ScaleIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.rateParity === "undercut"
                      ? "Selling below your direct rate, which pushes guests away from the website."
                      : "Priced above the comp set median, which suppresses conversion on this channel."}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs">
                  Resync rates
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  )
}
