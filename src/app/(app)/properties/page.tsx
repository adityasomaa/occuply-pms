import type { Metadata } from "next"
import {
  BedDoubleIcon,
  Building2Icon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PieChartIcon,
  PlusIcon,
  WalletIcon,
} from "lucide-react"

import { Panel, StatStrip } from "@/components/occuply/primitives"
import { PropertyList, type PropertyRow } from "@/components/occuply/property-list"
import { SiteHeader } from "@/components/occuply/site-header"
import { Button } from "@/components/ui/button"
import { activePropertyId } from "@/lib/property-cookie"
import { PROPERTIES, getSnapshot, today } from "@/lib/seed"
import { moneyShort, percent } from "@/lib/format"

export const metadata: Metadata = { title: "Properties" }

export default async function PropertiesPage() {
  const propertyId = await activePropertyId()
  const anchor = today()

  const rows: PropertyRow[] = PROPERTIES.map((p) => {
    const s = getSnapshot(p.id, anchor)
    return {
      property: p,
      occupancy: s.kpi.occupancy,
      adr: s.kpi.adr,
      openTickets: s.kpi.openTickets,
      liveChannels: s.channels.filter((c) => c.status === "connected" || c.status === "syncing").length,
    }
  })

  const active = rows.find((r) => r.property.id === propertyId)!
  const portfolioUnits = rows.reduce((s, r) => s + r.property.totalUnits, 0)
  const portfolioRevenue = PROPERTIES.reduce((s, p) => s + getSnapshot(p.id, anchor).kpi.revenue30d, 0)
  const weightedOcc =
    rows.reduce((s, r) => s + r.occupancy * r.property.totalUnits, 0) / Math.max(1, portfolioUnits)

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Properties"
        subtitle={`${PROPERTIES.length} properties in the portfolio`}
        today={anchor}
      >
        <Button size="sm" className="h-8 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusIcon className="size-3.5" strokeWidth={2.25} />
          Add property
        </Button>
      </SiteHeader>
      <StatStrip
        stats={[
          { label: "Properties", icon: Building2Icon, tone: "orange", value: String(PROPERTIES.length), hint: "All in Bali, Indonesia" },
          { label: "Total units", icon: BedDoubleIcon, tone: "violet", value: String(portfolioUnits), hint: "Across every property" },
          {
            label: "Portfolio occupancy · 30d", icon: PieChartIcon, tone: "blue",
            value: percent(weightedOcc),
            hint: "Weighted by unit count",
          },
          { label: "Portfolio revenue · 30d", icon: WalletIcon, tone: "green", value: moneyShort(portfolioRevenue), hint: "Room revenue only" },
        ]}
      />

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Switch property</h2>
          <p className="text-xs text-muted-foreground">
            Every screen in Occuply follows the property you select here.
          </p>
        </div>
        <PropertyList rows={rows} activeId={propertyId} />
      </div>

      <Panel
        title={active.property.name}
        description="Details for the property you are currently managing"
      >
        <div className="grid gap-0 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <dl className="divide-y divide-border">
            {[
              { icon: MapPinIcon, k: "Address", v: active.property.address },
              { icon: PhoneIcon, k: "Reservations", v: active.property.contact.phone },
              { icon: MailIcon, k: "Email", v: active.property.contact.email },
              { icon: GlobeIcon, k: "Website", v: active.property.contact.website },
              {
                icon: ClockIcon,
                k: "Check in / out",
                v: `${active.property.checkIn} · ${active.property.checkOut} (${active.property.timezone})`,
              },
            ].map((row) => (
              <div key={row.k} className="flex items-start gap-3 px-4 py-3 lg:px-5">
                <row.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                <dt className="w-28 shrink-0 text-xs text-muted-foreground">{row.k}</dt>
                <dd className="min-w-0 flex-1 text-sm">{row.v}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-3 px-4 py-4 lg:px-5">
            <div>
              <span className="label-brand">About</span>
              <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                {active.property.description}
              </p>
            </div>
            <div>
              <span className="label-brand">Amenities</span>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {active.property.amenities.map((a) => (
                  <li
                    key={a}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs"
                  >
                    <CheckIcon className="size-3 text-status-ok" strokeWidth={2.5} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Opened {active.property.openedYear} · {active.property.type}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  )
}
