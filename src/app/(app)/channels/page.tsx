import type { Metadata } from "next"
import {
  CalendarCheckIcon,
  GlobeIcon,
  PlusIcon,
  Share2Icon,
  WalletIcon,
} from "lucide-react"

import { ChannelsBoard } from "@/components/occuply/channels-board"
import { Panel, StatStrip } from "@/components/occuply/primitives"
import { SiteHeader } from "@/components/occuply/site-header"
import { Button } from "@/components/ui/button"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"
import { money, moneyShort, percent } from "@/lib/format"

export const metadata: Metadata = { title: "Channel setup" }

const AVAILABLE = [
  { name: "Trip.com", kind: "OTA", note: "Strong in the Greater China source market" },
  { name: "Hostelworld", kind: "OTA", note: "Only worth it if you sell shared rooms" },
  { name: "Amadeus GDS", kind: "GDS", note: "Corporate and travel agent distribution" },
  { name: "TripAdvisor", kind: "Metasearch", note: "Feeds the direct booking engine" },
]

export default async function ChannelsPage({ searchParams }: PageProps<"/channels">) {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())
  const params = await searchParams
  const focusChannelId = Array.isArray(params.channel) ? params.channel[0] : params.channel
  const { channels, roomTypes, property } = snap

  const live = channels.filter((c) => c.status === "connected" || c.status === "syncing")
  const errors = channels.filter((c) => c.status === "error")
  const revenue = channels.reduce((s, c) => s + c.revenue30d, 0)
  const bookings = channels.reduce((s, c) => s + c.bookings30d, 0)
  const commissionPaid = channels.reduce((s, c) => s + (c.revenue30d * c.commission) / 100, 0)
  const direct = channels.find((c) => c.kind === "Direct")

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Channel setup"
        subtitle={`Distribution and mapping · ${property.name}`}
        today={anchor}
        alerts={errors.length}
      >
        <Button size="sm" className="h-8 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusIcon className="size-3.5" strokeWidth={2.25} />
          Connect channel
        </Button>
      </SiteHeader>
      <StatStrip
        stats={[
          {
            label: "Live channels", icon: Share2Icon, tone: "orange",
            value: `${live.length}/${channels.length}`,
            hint: errors.length ? `${errors.length} need attention` : "All connections healthy",
          },
          { label: "Bookings · 30d", icon: CalendarCheckIcon, tone: "blue", value: String(bookings), hint: "Across every connected channel" },
          {
            label: "Commission paid · 30d", icon: WalletIcon, tone: "green",
            value: moneyShort(commissionPaid),
            hint: `${percent((commissionPaid / Math.max(1, revenue)) * 100)} of channel revenue`,
          },
          {
            label: "Direct share", icon: GlobeIcon, tone: "violet",
            value: percent(((direct?.bookings30d ?? 0) / Math.max(1, bookings)) * 100),
            hint: `${money(direct?.revenue30d ?? 0)} booked commission-light`,
          },
        ]}
      />

      <ChannelsBoard channels={channels} roomTypes={roomTypes} focusChannelId={focusChannelId} />

      <Panel
        title="Available to connect"
        description="Channels Occuply supports that you have not enabled yet"
        bodyClassName="divide-y divide-border"
      >
        {AVAILABLE.map((a) => (
          <div key={a.name} className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-[0.625rem] font-semibold text-muted-foreground">
              {a.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {a.kind} · {a.note}
              </p>
            </div>
            <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs">
              Connect
            </Button>
          </div>
        ))}
      </Panel>
    </div>
  )
}
