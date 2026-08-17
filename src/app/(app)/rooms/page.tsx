import type { Metadata } from "next"
import { PlusIcon, UsersRoundIcon } from "lucide-react"

import { Meter, Panel, StatStrip } from "@/components/occuply/primitives"
import { RoomsBoard } from "@/components/occuply/rooms-board"
import { SiteHeader } from "@/components/occuply/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { activePropertyId } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"
import { money, moneyShort, percent } from "@/lib/format"

export const metadata: Metadata = { title: "Rooms" }

export default async function RoomsPage() {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor)
  const { rooms, roomTypes, property, inventory } = snap

  const occupied = rooms.filter((r) => r.status === "occupied" || r.status === "departing").length
  const toClean = rooms.filter((r) => r.housekeeping === "dirty").length
  const ooo = rooms.filter((r) => r.status === "out-of-order").length
  const sellable = rooms.length - ooo

  const perType = roomTypes.map((rt) => {
    const own = rooms.filter((r) => r.roomTypeId === rt.id)
    const sold = own.filter((r) => r.status === "occupied" || r.status === "departing").length
    const todayInv = inventory.find((i) => i.roomTypeId === rt.id && i.date === anchor)
    return { rt, sold, occ: (sold / rt.count) * 100, rate: todayInv?.rate ?? rt.baseRate }
  })

  return (
    <>
      <SiteHeader
        title="Rooms"
        subtitle={`${rooms.length} units across ${roomTypes.length} room types · ${property.name}`}
        today={anchor}
        alerts={ooo}
      >
        <Button size="sm" className="h-8 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusIcon className="size-3.5" strokeWidth={2.25} />
          Add room type
        </Button>
      </SiteHeader>

      <div className="flex flex-1 flex-col gap-4 p-3 lg:p-5">
        <StatStrip
          stats={[
            {
              label: "Occupied now",
              value: `${occupied}/${sellable}`,
              hint: `${percent((occupied / Math.max(1, sellable)) * 100)} of sellable stock`,
              emphasis: true,
            },
            { label: "Awaiting housekeeping", value: String(toClean), hint: "Rooms flagged dirty on the board" },
            { label: "Out of order", value: String(ooo), hint: ooo > 0 ? "Blocked by maintenance" : "All units sellable" },
            {
              label: "Highest rate today",
              value: moneyShort(Math.max(...perType.map((p) => p.rate))),
              hint: perType.reduce((a, b) => (b.rate > a.rate ? b : a)).rt.name,
            },
          ]}
        />

        <RoomsBoard rooms={rooms} roomTypes={roomTypes} />

        <Panel
          title="Room types"
          description="Inventory, capacity and today's selling rate"
          bodyClassName="overflow-x-auto scroll-slim"
        >
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Room type", "Code", "Units", "Sleeps", "Beds", "Size", "Occupied", "Rate today", "Rate range"].map(
                  (h) => (
                    <th key={h} className="label-brand px-4 py-2 font-medium lg:px-5">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perType.map(({ rt, sold, occ, rate }) => (
                <tr key={rt.id} className="ease-occuply transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 lg:px-5">
                    <span className="block font-medium">{rt.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{rt.view}</span>
                  </td>
                  <td className="px-4 py-3 lg:px-5">
                    <Badge variant="outline" className="num text-[0.6875rem]">
                      {rt.code}
                    </Badge>
                  </td>
                  <td className="num px-4 py-3 lg:px-5">{rt.count}</td>
                  <td className="px-4 py-3 lg:px-5">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <UsersRoundIcon className="size-3.5" strokeWidth={2} />
                      <span className="num">{rt.maxOccupancy}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground lg:px-5">{rt.bedConfig}</td>
                  <td className="num px-4 py-3 text-muted-foreground lg:px-5">{rt.sizeSqm} m²</td>
                  <td className="w-32 px-4 py-3 lg:px-5">
                    <div className="flex items-center gap-2">
                      <span className="num w-10 text-xs font-medium">{sold}/{rt.count}</span>
                      <Meter value={occ} tone={occ > 85 ? "warn" : "accent"} className="w-14" />
                    </div>
                  </td>
                  <td className="num px-4 py-3 font-medium lg:px-5">{money(rate)}</td>
                  <td className="num px-4 py-3 text-xs text-muted-foreground lg:px-5">
                    {moneyShort(rt.floorRate)} – {moneyShort(rt.ceilingRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  )
}
