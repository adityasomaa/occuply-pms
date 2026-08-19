import type { Metadata } from "next"

import { MaintenanceBoard } from "@/components/occuply/maintenance-board"
import { SiteHeader } from "@/components/occuply/site-header"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"

export const metadata: Metadata = { title: "Maintenance" }

export default async function MaintenancePage({ searchParams }: PageProps<"/maintenance">) {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())
  const params = await searchParams
  const focusTicketId = Array.isArray(params.ticket) ? params.ticket[0] : params.ticket

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Maintenance"
        subtitle={`Tickets, blocks and workload across ${snap.property.name}`}
        today={anchor}
      />
      <MaintenanceBoard
        anchor={anchor}
        rooms={snap.rooms}
        propertyId={propertyId}
        focusTicketId={focusTicketId}
        startNew={params.new !== undefined}
      />
    </div>
  )
}
