import type { Metadata } from "next"
import {
  SettingsIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import { Meter, Panel, StatStrip } from "@/components/occuply/primitives"
import { PricingConsole } from "@/components/occuply/pricing-console"
import { SiteHeader } from "@/components/occuply/site-header"
import { Button } from "@/components/ui/button"
import { buildSuggestions } from "@/lib/suggestions"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { addDays, getSnapshot, today } from "@/lib/seed"
import { money, moneyShort, percent } from "@/lib/format"

export const metadata: Metadata = { title: "Dynamic pricing" }

export default async function PricingPage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())
  const { pricingRules, inventory, roomTypes, property, kpi } = snap

  const horizon = addDays(anchor, 14)
  const suggestions = buildSuggestions(inventory, roomTypes, anchor, horizon)

  const activeRules = pricingRules.filter((r) => r.active)
  const impact30d = pricingRules.reduce((s, r) => s + r.revenueImpact, 0)
  const fires30d = pricingRules.reduce((s, r) => s + r.appliedLast30d, 0)
  const upside = suggestions.reduce((s, x) => s + (x.suggested - x.current) * Math.max(1, x.sold), 0)

  // How far each room type currently sits from its guardrails.
  const guardrails = roomTypes.map((rt) => {
    const window14 = inventory.filter(
      (i) => i.roomTypeId === rt.id && i.date >= anchor && i.date < horizon,
    )
    const avg = window14.reduce((s, i) => s + i.rate, 0) / Math.max(1, window14.length)
    const span = rt.ceilingRate - rt.floorRate
    return { rt, avg, position: span === 0 ? 0 : ((avg - rt.floorRate) / span) * 100 }
  })

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Dynamic pricing"
        subtitle={`Rules, guardrails and recommendations · ${property.name}`}
        today={anchor}
        alerts={suggestions.length}
      >
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <SettingsIcon className="size-3.5" strokeWidth={2.25} />
          Engine settings
        </Button>
      </SiteHeader>
      <StatStrip
        stats={[
          { label: "Active rules", icon: SlidersHorizontalIcon, tone: "orange", value: `${activeRules.length}/${pricingRules.length}`, hint: `${fires30d} rate changes fired in 30 days` },
          {
            label: "Revenue impact · 30d", icon: WalletIcon, tone: "green",
            value: moneyShort(impact30d),
            hint: "Attributed to automatic repricing",
          },
          {
            label: "Open recommendations", icon: SparklesIcon, tone: "violet",
            value: String(suggestions.length),
            hint: suggestions.length ? `Worth roughly ${moneyShort(upside)}` : "Nothing to review",
          },
          { label: "RevPAR · 30d", icon: TrendingUpIcon, tone: "blue", value: moneyShort(kpi.revpar), delta: kpi.revparDelta, hint: "The number this engine moves" },
        ]}
      />

      <PricingConsole rules={pricingRules} suggestions={suggestions} />

      <Panel
        title="Rate guardrails"
        description="Where the average rate for the next fourteen nights sits between your floor and ceiling"
        bodyClassName="divide-y divide-border"
      >
        {guardrails.map(({ rt, avg, position }) => (
          <div key={rt.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-5">
            <div className="min-w-[160px] flex-1">
              <p className="truncate text-sm font-medium">{rt.name}</p>
              <p className="num truncate text-xs text-muted-foreground">
                avg {money(Math.round(avg))} · {percent(position, 0)} of the band
              </p>
            </div>

            <div className="flex min-w-[220px] flex-[2] items-center gap-2.5">
              <span className="num w-16 shrink-0 text-right text-xs text-muted-foreground">
                {moneyShort(rt.floorRate)}
              </span>
              <span className="relative flex-1">
                <Meter value={position} tone={position > 82 ? "warn" : position < 18 ? "risk" : "accent"} />
                <span
                  className="absolute -top-0.5 size-2.5 -translate-x-1/2 rounded-full border-2 border-card bg-foreground"
                  style={{ left: `${Math.max(2, Math.min(98, position))}%` }}
                  aria-hidden
                />
              </span>
              <span className="num w-16 shrink-0 text-xs text-muted-foreground">
                {moneyShort(rt.ceilingRate)}
              </span>
            </div>

            <span className="num w-20 shrink-0 text-right text-sm font-semibold">
              {moneyShort(avg)}
            </span>
          </div>
        ))}
      </Panel>
    </div>
  )
}
