import type { Metadata } from "next"

import { CalendarBoard } from "@/components/occuply/calendar-board"
import { SiteHeader } from "@/components/occuply/site-header"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"

export const metadata: Metadata = { title: "Calendar" }

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())
  const params = await searchParams
  const focusBookingId = Array.isArray(params.booking) ? params.booking[0] : params.booking

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Calendar"
        subtitle={`Every stay, block and movement across ${snap.property.name}`}
        today={anchor}
      />
      <CalendarBoard
        rooms={snap.rooms}
        roomTypes={snap.roomTypes}
        anchor={anchor}
        propertyId={propertyId}
        staff={snap.staff}
        focusBookingId={focusBookingId}
      />
    </div>
  )
}
