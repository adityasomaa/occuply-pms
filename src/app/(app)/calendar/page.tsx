import type { Metadata } from "next"
import { CalendarPlusIcon, CalendarX2Icon, DownloadIcon } from "lucide-react"

import { CalendarGrid } from "@/components/occuply/calendar-grid"
import { EmptyState, Panel, StatStrip, StatusDot } from "@/components/occuply/primitives"
import { SiteHeader } from "@/components/occuply/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { activePropertyId } from "@/lib/property-cookie"
import { addDays, getSnapshot, today } from "@/lib/seed"
import { fullDate, money, moneyShort, percent, relativeDays, shortDate } from "@/lib/format"

export const metadata: Metadata = { title: "Calendar" }

const statusTone = {
  confirmed: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  "checked-in": "border-accent/30 bg-accent-soft text-accent-brand",
  "checked-out": "border-border bg-muted text-muted-foreground",
  pending: "border-status-warn/30 bg-status-warn/12 text-status-warn",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
} as const

export default async function CalendarPage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor)
  const { roomTypes, inventory, bookings, property } = snap

  const horizon = addDays(anchor, 14)
  const window14 = inventory.filter((i) => i.date >= anchor && i.date < horizon)
  const units = roomTypes.reduce((s, r) => s + r.count, 0)
  const soldNext14 = window14.reduce((s, i) => s + i.sold, 0)
  const occNext14 = (soldNext14 / (units * 14)) * 100
  const revenueOnBooks = window14.reduce((s, i) => s + i.sold * i.rate, 0)
  const events = window14.filter((i) => i.event)
  const uniqueEvents = Array.from(new Map(events.map((e) => [e.date, e])).values())

  const upcoming = bookings
    .filter((b) => b.checkIn >= anchor && b.checkIn < horizon && b.status !== "cancelled")
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 12)

  const pending = bookings.filter((b) => b.status === "pending" && b.checkIn >= anchor)

  return (
    <>
      <SiteHeader
        title="Calendar"
        subtitle={`Availability and rates · ${property.name}`}
        today={anchor}
        alerts={pending.length}
      >
        <Button variant="outline" size="sm" className="hidden h-8 gap-1.5 sm:flex">
          <DownloadIcon className="size-3.5" strokeWidth={2.25} />
          Export
        </Button>
        <Button size="sm" className="h-8 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <CalendarPlusIcon className="size-3.5" strokeWidth={2.25} />
          New booking
        </Button>
      </SiteHeader>

      <div className="flex flex-1 flex-col gap-4 p-3 lg:p-5">
        <StatStrip
          stats={[
            {
              label: "Occupancy · next 14 nights",
              value: percent(occNext14),
              hint: `${soldNext14} of ${units * 14} room nights sold`,
              emphasis: true,
            },
            {
              label: "Revenue on the books",
              value: moneyShort(revenueOnBooks),
              hint: "Confirmed room revenue for the window",
            },
            {
              label: "Arrivals in window",
              value: String(upcoming.length),
              hint: `${pending.length} still awaiting confirmation`,
            },
            {
              label: "Rate events",
              value: String(uniqueEvents.length),
              hint: uniqueEvents[0]?.event ?? "No holidays in this window",
            },
          ]}
        />

        <CalendarGrid roomTypes={roomTypes} inventory={inventory} anchor={anchor} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            title="Upcoming arrivals"
            description={`${shortDate(anchor)} to ${shortDate(addDays(horizon, -1))}`}
            bodyClassName="overflow-x-auto scroll-slim"
          >
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarX2Icon}
                title="No arrivals in this window"
                description="Nothing is booked for the next fourteen nights. Check the channel connections and consider opening a promotional rate."
              />
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Guest", "Room", "Arrival", "Nights", "Channel", "Value", "Status"].map((h) => (
                      <th key={h} className="label-brand px-4 py-2 font-medium first:pl-4 lg:px-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {upcoming.map((b) => (
                    <tr key={b.id} className="ease-occuply transition-colors hover:bg-muted/50">
                      <td className="px-4 py-2.5 lg:px-5">
                        <span className="block truncate font-medium">{b.guestName}</span>
                        <span className="num block text-xs text-muted-foreground">{b.reference}</span>
                      </td>
                      <td className="num px-4 py-2.5 lg:px-5">{b.roomNumber}</td>
                      <td className="px-4 py-2.5 lg:px-5">
                        <span className="block">{shortDate(b.checkIn)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {relativeDays(anchor, b.checkIn)}
                        </span>
                      </td>
                      <td className="num px-4 py-2.5 lg:px-5">{b.nights}</td>
                      <td className="px-4 py-2.5 text-muted-foreground lg:px-5">{b.channel}</td>
                      <td className="num px-4 py-2.5 font-medium lg:px-5">{money(b.total)}</td>
                      <td className="px-4 py-2.5 lg:px-5">
                        <Badge variant="outline" className={statusTone[b.status]}>
                          {b.status.replace("-", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Dates that need a decision" description="Holidays, minimum stays and closures">
            {uniqueEvents.length === 0 && window14.every((i) => !i.closed && i.minStay < 3) ? (
              <EmptyState
                icon={CalendarX2Icon}
                title="Nothing flagged"
                description="No holidays, closures or stay restrictions fall inside the next fourteen nights."
              />
            ) : (
              <ul className="divide-y divide-border">
                {uniqueEvents.map((e) => (
                  <li key={e.date} className="flex items-start gap-3 px-4 py-3 lg:px-5">
                    <StatusDot tone="accent" className="mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.event}</p>
                      <p className="text-xs text-muted-foreground">{fullDate(e.date)}</p>
                    </div>
                    <span className="num shrink-0 text-xs text-muted-foreground">
                      min {e.minStay}n
                    </span>
                  </li>
                ))}
                {window14
                  .filter((i) => i.closed)
                  .slice(0, 4)
                  .map((i) => (
                    <li key={`${i.roomTypeId}-${i.date}`} className="flex items-start gap-3 px-4 py-3 lg:px-5">
                      <StatusDot tone="risk" className="mt-1.5" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">Closed to arrival</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {roomTypes.find((r) => r.id === i.roomTypeId)?.name} · {shortDate(i.date)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 shrink-0 px-2 text-xs">
                        Reopen
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
