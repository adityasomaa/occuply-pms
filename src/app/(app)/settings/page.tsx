import type { Metadata } from "next"

import { SettingsTabs } from "@/components/occuply/settings-tabs"
import { SiteHeader } from "@/components/occuply/site-header"
import { activePropertyId } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"

export const metadata: Metadata = { title: "User & settings" }

const TABS = ["profile", "team", "property", "notifications"]

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor)

  const params = await searchParams
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab
  const tab = TABS.includes(raw ?? "") ? (raw as string) : "profile"

  return (
    <>
      <SiteHeader
        title="User & settings"
        subtitle={`Account, team and property configuration · ${snap.property.name}`}
        today={anchor}
      />

      <div className="flex flex-1 flex-col gap-4 p-3 lg:p-5">
        <SettingsTabs
          user={snap.staff[0]}
          staff={snap.staff}
          property={snap.property}
          initialTab={tab}
        />
      </div>
    </>
  )
}
