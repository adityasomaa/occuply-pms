import type { Metadata } from "next"

import { NewRatePlanButton } from "@/components/occuply/action-buttons"
import { RatePlansTable } from "@/components/occuply/rate-plans"
import { SiteHeader } from "@/components/occuply/site-header"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"

export const metadata: Metadata = { title: "Rates" }

export default async function RatesPage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Rates"
        subtitle={`Rate plans selling at ${snap.property.name}`}
        today={anchor}
      >
        <NewRatePlanButton />
      </SiteHeader>

      <RatePlansTable plans={snap.ratePlans} roomTypes={snap.roomTypes} />
    </div>
  )
}
