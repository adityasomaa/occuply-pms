import type { Metadata } from "next"

import { ConnectChannelButton } from "@/components/occuply/action-buttons"
import { ChannelsBoard } from "@/components/occuply/channels-board"
import { Panel } from "@/components/occuply/primitives"
import { SiteHeader } from "@/components/occuply/site-header"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"

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

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Channel setup"
        subtitle={`Where ${snap.property.name} is distributed`}
        today={anchor}
      >
        <ConnectChannelButton />
      </SiteHeader>

      <ChannelsBoard
        channels={snap.channels}
        roomTypes={snap.roomTypes}
        focusChannelId={focusChannelId}
      />

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
            <ConnectChannelButton name={a.name} variant="outline" />
          </div>
        ))}
      </Panel>
    </div>
  )
}
