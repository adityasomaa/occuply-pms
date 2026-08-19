import type { Metadata } from "next"
import {
  BedDoubleIcon,
  PlusIcon,
  SparklesIcon,
  UsersRoundIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"

import { Meter, Panel, StatStrip } from "@/components/occuply/primitives"
import { RoomsBoard } from "@/components/occuply/rooms-board"
import { SiteHeader } from "@/components/occuply/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { activePropertyId, allProperties } from "@/lib/property-cookie"
import { getSnapshot, today } from "@/lib/seed"
import { money, moneyShort, percent } from "@/lib/format"

export const metadata: Metadata = { title: "Rooms" }

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  const propertyId = await activePropertyId()
  const anchor = today()
  const snap = getSnapshot(propertyId, anchor, await allProperties())
  const params = await searchParams
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
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
    <div className="flex flex-1 flex-col gap-5 p-5 lg:p-7">
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
      <StatStrip
        stats={[
          {
            label: "Occupied now", icon: BedDoubleIcon, tone: "orange",
            value: `${occupied}/${sellable}`,
            hint: `${percent((occupied / Math.max(1, sellable)) * 100)} of sellable stock`,
          },
          { label: "Awaiting housekeeping", icon: SparklesIcon, tone: "violet", value: String(toClean), hint: "Rooms flagged dirty on the board" },
          { label: "Out of order", icon: WrenchIcon, tone: "blue", value: String(ooo), hint: ooo > 0 ? "Blocked by maintenance" : "All units sellable" },
          {
            label: "Highest rate today", icon: WalletIcon, tone: "green",
            value: moneyShort(Math.max(...perType.map((p) => p.rate))),
            hint: perType.reduce((a, b) => (b.rate > a.rate ? b : a)).rt.name,
          },
        ]}
      />

      <RoomsBoard
        roomTypes={roomTypes}
        anchor={anchor}
        staff={snap.staff}
        propertyId={propertyId}
        focusStatus={pick(params.status)}
        focusTypeId={pick(params.type)}
        focusRoom={pick(params.room)}
      />

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
  )
}
