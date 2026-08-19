import {
  BedDoubleIcon,
  CreditCardIcon,
  FileTextIcon,
  ReceiptTextIcon,
  UsersRoundIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"

import {
  MaintenanceCard,
  OccupancyCard,
  OutstandingPaymentsCard,
  RecentActivity,
  TipsFooter,
  type ActivityItem,
  type OutstandingRow,
} from "@/components/occuply/dashboard-panels"
import { PageHeading } from "@/components/occuply/page-heading"
import { RevenueOverview } from "@/components/occuply/performance-chart"
import { StatStrip } from "@/components/occuply/primitives"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"
import { greetingName, money, relativeDays } from "@/lib/format"

export default async function DashboardPage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())
  const { kpi, property, rooms, bookings, tickets, metrics, channels } = snap

  /* ------------------------------ headline KPIs ---------------------------- */

  const inHouseGuests = bookings
    .filter((b) => b.checkIn <= anchor && b.checkOut > anchor && b.status !== "cancelled")
    .reduce((s, b) => s + b.adults + b.children, 0)

  const unsettled = bookings.filter((b) => b.status !== "cancelled" && b.total - b.paid > 0)
  const outstandingTotal = unsettled.reduce((s, b) => s + (b.total - b.paid), 0)

  /* ------------------------------ recent activity -------------------------- */

  // One entry per guest, so the feed does not repeat the same name.
  const seenGuests = new Set<string>()
  const lastPaid = bookings
    .filter((b) => b.paid > 0 && b.checkIn <= anchor)
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    .filter((b) => !seenGuests.has(b.guestName) && seenGuests.add(b.guestName))
  const newestTicket = [...tickets].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))[0]
  const newestBooking = [...bookings]
    .filter((b) => b.status === "confirmed" && b.checkIn >= anchor && !seenGuests.has(b.guestName))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0]

  const activity: ActivityItem[] = [
    lastPaid[0] && {
      id: `pay-${lastPaid[0].id}`,
      icon: WalletIcon,
      tone: "green" as const,
      title: `Payment received from ${lastPaid[0].guestName}`,
      meta: `Room ${lastPaid[0].roomNumber} · ${lastPaid[0].channel}`,
      amount: money(lastPaid[0].paid),
      when: "2 hours ago",
    },
    newestTicket && {
      id: `mt-${newestTicket.id}`,
      icon: WrenchIcon,
      tone: "blue" as const,
      title: "Maintenance request submitted",
      meta: `${newestTicket.location} · ${newestTicket.category}`,
      badge: {
        label: newestTicket.status === "resolved" ? "Resolved" : "In Progress",
        className:
          newestTicket.status === "resolved"
            ? "bg-tile-green text-tile-green-fg"
            : "bg-tile-blue text-tile-blue-fg",
      },
      when: "5 hours ago",
    },
    newestBooking && {
      id: `bk-${newestBooking.id}`,
      icon: FileTextIcon,
      tone: "orange" as const,
      title: "New reservation confirmed",
      meta: `${newestBooking.guestName} · Room ${newestBooking.roomNumber}`,
      badge: { label: "Confirmed", className: "bg-tile-green text-tile-green-fg" },
      when: "1 day ago",
    },
    lastPaid[1] && {
      id: `pay-${lastPaid[1].id}`,
      icon: CreditCardIcon,
      tone: "violet" as const,
      title: `Payment received from ${lastPaid[1].guestName}`,
      meta: `Room ${lastPaid[1].roomNumber} · ${lastPaid[1].channel}`,
      amount: money(lastPaid[1].paid),
      when: "1 day ago",
    },
  ].filter(Boolean) as ActivityItem[]

  /* --------------------------- outstanding payments ------------------------ */

  const outstandingRows: OutstandingRow[] = unsettled
    .slice()
    .sort((a, b) => a.checkOut.localeCompare(b.checkOut))
    .slice(0, 3)
    .map((b) => ({
      id: b.id,
      name: b.guestName,
      meta: `Room ${b.roomNumber} · ${property.shortName}`,
      amount: money(b.total - b.paid),
      due: `Due ${relativeDays(anchor, b.checkOut)}`,
    }))

  /* --------------------------- maintenance rollup -------------------------- */

  const inProgress = tickets.filter((t) => t.status === "in-progress" || t.status === "awaiting-parts").length
  const pending = tickets.filter((t) => t.status === "open").length
  const completed = tickets.filter((t) => t.status === "resolved").length

  const occupiedRooms = rooms.filter((r) => r.status === "occupied" || r.status === "departing").length
  const vacantRooms = rooms.length - occupiedRooms

  const alerts = channels.filter((c) => c.status === "error").length + kpi.outOfOrder + pending

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <PageHeading
        title={
          <>
            Welcome back, {greetingName(snap.staff[0].name)}!{" "}
            <span aria-hidden>👋</span>
          </>
        }
        subtitle={`Here's what's happening at ${property.shortName} today.`}
        alerts={alerts}
      />

      <StatStrip
        stats={[
          {
            label: "Total Rooms",
            value: String(rooms.length),
            hint: `Across ${snap.roomTypes.length} room types`,
            icon: BedDoubleIcon,
            tone: "orange",
          },
          {
            label: "Guests In House",
            value: String(inHouseGuests),
            delta: kpi.occupancyDelta,
            icon: UsersRoundIcon,
            tone: "orange",
          },
          {
            label: "Monthly Revenue",
            value: money(kpi.revenue30d),
            delta: kpi.revenueDelta,
            icon: WalletIcon,
            tone: "green",
          },
          {
            label: "Outstanding Payments",
            value: money(outstandingTotal),
            delta: -kpi.cancellationRate,
            invertDelta: true,
            icon: ReceiptTextIcon,
            tone: "blue",
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <RevenueOverview metrics={metrics} />
        <RecentActivity items={activity} href="/calendar" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        <OccupancyCard
          occupiedPct={(occupiedRooms / Math.max(1, rooms.length)) * 100}
          occupied={occupiedRooms}
          vacant={vacantRooms}
          unitWord="Rooms"
        />
        <OutstandingPaymentsCard
          total={money(outstandingTotal)}
          count={unsettled.length}
          rows={outstandingRows}
          href="/calendar"
        />
        <MaintenanceCard
          total={tickets.length}
          inProgress={inProgress}
          pending={pending}
          completed={completed}
          href="/maintenance"
        />
      </div>

      <TipsFooter
        tip="Drag a reservation on the calendar to move it between dates or rooms."
        cta="Open calendar"
        href="/calendar"
      />
    </div>
  )
}
