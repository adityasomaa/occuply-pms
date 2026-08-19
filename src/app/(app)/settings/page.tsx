import type { Metadata } from "next"

import { SettingsTabs } from "@/components/occuply/settings-tabs"
import { SiteHeader } from "@/components/occuply/site-header"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"

export const metadata: Metadata = { title: "User & settings" }

const TABS = ["profile", "team", "property", "notifications"]

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())

  const params = await searchParams
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab
  const tab = TABS.includes(raw ?? "") ? (raw as string) : "profile"

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="User & settings"
        subtitle={`Account, team and property configuration · ${snap.property.name}`}
        today={anchor}
      />
      <SettingsTabs
        user={snap.staff[0]}
        staff={snap.staff}
        property={snap.property}
        initialTab={tab}
      />
    </div>
  )
}
