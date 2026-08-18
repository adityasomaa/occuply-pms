import type { Metadata } from "next"
import {
  DoorClosedIcon,
  PlusIcon,
  TriangleAlertIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"

import { MaintenanceBoard } from "@/components/occuply/maintenance-board"
import { Meter, Panel, StatStrip } from "@/components/occuply/primitives"
import { SiteHeader } from "@/components/occuply/site-header"
import { Button } from "@/components/ui/button"
import { activePropertyId } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"
import { initials, moneyShort } from "@/lib/format"

export const metadata: Metadata = { title: "Maintenance" }

export default async function MaintenancePage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor)
  const { tickets, property, staff } = snap

  const open = tickets.filter((t) => t.status !== "resolved")
  const critical = open.filter((t) => t.priority === "critical")
  const blocking = open.filter((t) => t.blocksRoom)
  const overdue = open.filter((t) => t.dueAt < anchor)
  const spend = open.reduce((s, t) => s + t.estimatedCost, 0)

  const byCategory = Object.entries(
    open.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])

  const byTech = Object.entries(
    open.reduce<Record<string, number>>((acc, t) => {
      acc[t.assignedTo] = (acc[t.assignedTo] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
      <SiteHeader
        title="Maintenance"
        subtitle={`${open.length} open tickets · ${property.name}`}
        today={anchor}
        alerts={critical.length + overdue.length}
      >
        <Button size="sm" className="h-8 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusIcon className="size-3.5" strokeWidth={2.25} />
          Log ticket
        </Button>
      </SiteHeader>
      <StatStrip
        stats={[
          { label: "Open tickets", icon: WrenchIcon, tone: "orange", value: String(open.length), hint: `${tickets.length - open.length} resolved this period` },
          {
            label: "Critical", icon: TriangleAlertIcon, tone: "violet",
            value: String(critical.length),
            hint: critical.length ? critical[0].title : "Nothing critical outstanding",
          },
          {
            label: "Rooms blocked", icon: DoorClosedIcon, tone: "blue",
            value: String(blocking.length),
            hint: blocking.length ? "Removed from sellable inventory" : "No inventory held back",
          },
          { label: "Estimated spend", icon: WalletIcon, tone: "green", value: moneyShort(spend), hint: "Across all open tickets" },
        ]}
      />

      <MaintenanceBoard tickets={tickets} anchor={anchor} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Open work by category" description="Where the property keeps breaking">
          <ul className="divide-y divide-border">
            {byCategory.map(([cat, n]) => (
              <li key={cat} className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
                <span className="w-32 shrink-0 truncate text-sm">{cat}</span>
                <Meter
                  value={n}
                  max={Math.max(...byCategory.map((c) => c[1]))}
                  tone={n >= 3 ? "warn" : "accent"}
                  className="flex-1"
                />
                <span className="num w-6 shrink-0 text-right text-sm font-medium">{n}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Workload" description="Open tickets per team member">
          <ul className="divide-y divide-border">
            {byTech.map(([name, n]) => {
              const member = staff.find((s) => s.name === name)
              return (
                <li key={name} className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[0.625rem] font-semibold text-muted-foreground">
                    {initials(name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member?.role ?? "Contractor"}</p>
                  </div>
                  <span className="num shrink-0 text-sm font-medium">{n}</span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
