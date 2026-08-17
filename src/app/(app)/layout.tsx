import { AppSidebar } from "@/components/occuply/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { activePropertyId } from "@/lib/property-cookie"
import { PROPERTIES, addDays, getSnapshot, today } from "@/lib/seed"
import { buildSuggestions } from "@/lib/suggestions"

/** Figures are anchored to the current date so the demo always looks live.
 *  That makes every page request-time dynamic by design. */
export const dynamic = "force-dynamic"

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor)

  const counts = {
    arrivals: snap.kpi.arrivalsToday,
    outOfOrder: snap.kpi.outOfOrder,
    channelErrors: snap.channels.filter((c) => c.status === "error").length,
    openTickets: snap.kpi.openTickets,
    pricingSuggestions: buildSuggestions(
      snap.inventory,
      snap.roomTypes,
      anchor,
      addDays(anchor, 14),
    ).length,
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3.25rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        properties={PROPERTIES}
        activePropertyId={propertyId}
        user={snap.staff[0]}
        counts={counts}
      />
      <SidebarInset className="min-w-0 overflow-x-clip bg-background">{children}</SidebarInset>
    </SidebarProvider>
  )
}
