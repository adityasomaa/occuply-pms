"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, DotIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Panel, StatusDot } from "@/components/occuply/primitives"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { dayNumber, isWeekend, monthLabel, moneyShort, weekday } from "@/lib/format"
import type { InventoryDay, RoomType } from "@/lib/types"
import { cn } from "@/lib/utils"

const WINDOW = 14

type Mode = "availability" | "rates"

export function CalendarGrid({
  roomTypes,
  inventory,
  anchor,
}: {
  roomTypes: RoomType[]
  inventory: InventoryDay[]
  anchor: string
}) {
  const [offset, setOffset] = React.useState(0)
  const [mode, setMode] = React.useState<Mode>("availability")

  const dates = React.useMemo(() => {
    const all = Array.from(new Set(inventory.map((i) => i.date))).sort()
    return all.slice(offset, offset + WINDOW)
  }, [inventory, offset])

  const totalDates = React.useMemo(() => new Set(inventory.map((i) => i.date)).size, [inventory])

  const byKey = React.useMemo(() => {
    const m = new Map<string, InventoryDay>()
    inventory.forEach((i) => m.set(`${i.roomTypeId}:${i.date}`, i))
    return m
  }, [inventory])

  const totalUnits = roomTypes.reduce((s, r) => s + r.count, 0)

  const dayTotals = dates.map((d) => {
    const sold = roomTypes.reduce((s, rt) => s + (byKey.get(`${rt.id}:${d}`)?.sold ?? 0), 0)
    return { date: d, sold, occupancy: totalUnits === 0 ? 0 : (sold / totalUnits) * 100 }
  })

  const canPrev = offset > 0
  const canNext = offset + WINDOW < totalDates

  return (
    <Panel
      title={monthLabel(dates[0] ?? anchor)}
      description={`${WINDOW}-night window · ${totalUnits} sellable units`}
      action={
        <div className="flex items-center gap-2">
          <ToggleGroup
            multiple={false}
            value={[mode]}
            onValueChange={(v) => setMode((v[0] as Mode) ?? "availability")}
            variant="outline"
            size="sm"
            className="*:data-[slot=toggle-group-item]:px-3!"
          >
            <ToggleGroupItem value="availability" className="text-xs">
              Availability
            </ToggleGroupItem>
            <ToggleGroupItem value="rates" className="text-xs">
              Rates
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={!canPrev}
              onClick={() => setOffset((o) => Math.max(0, o - 7))}
              aria-label="Previous week"
            >
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={!canNext}
              onClick={() => setOffset((o) => Math.min(totalDates - WINDOW, o + 7))}
              aria-label="Next week"
            >
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      }
      bodyClassName="overflow-x-auto scroll-slim"
    >
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[190px] bg-card px-4 py-2 text-left align-bottom lg:px-5"
            >
              <span className="label-brand">Room type</span>
            </th>
            {dates.map((d) => (
              <th
                key={d}
                scope="col"
                className={cn(
                  "min-w-[62px] px-1 py-2 text-center font-normal",
                  isWeekend(d) && "bg-muted/50",
                  d === anchor && "bg-accent-soft",
                )}
              >
                <span className="block text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                  {weekday(d)}
                </span>
                <span
                  className={cn(
                    "num block text-sm font-semibold",
                    d === anchor && "text-accent-brand",
                  )}
                >
                  {dayNumber(d)}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {roomTypes.map((rt) => (
            <tr key={rt.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-4 py-2 text-left align-middle font-normal lg:px-5"
              >
                <span className="block truncate text-sm font-medium">{rt.name}</span>
                <span className="num block text-xs text-muted-foreground">
                  {rt.count} units · from {moneyShort(rt.baseRate)}
                </span>
              </th>
              {dates.map((d) => {
                const cell = byKey.get(`${rt.id}:${d}`)
                if (!cell) return <td key={d} className="px-1 py-2" />
                const pressure = 1 - cell.available / rt.count
                return (
                  <td
                    key={d}
                    className={cn(
                      "px-1 py-1.5 text-center align-middle",
                      isWeekend(d) && "bg-muted/40",
                      d === anchor && "bg-accent-soft/60",
                    )}
                  >
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            className={cn(
                              "ease-occuply w-full rounded-md px-1 py-1 transition-colors duration-150",
                              "hover:ring-1 hover:ring-accent/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              cell.closed && "opacity-45",
                            )}
                          />
                        }
                      >
                        {mode === "availability" ? (
                          <span
                            className={cn(
                              "num block text-sm font-semibold leading-none",
                              cell.available === 0
                                ? "text-destructive"
                                : pressure > 0.8
                                  ? "text-status-warn"
                                  : "text-foreground",
                            )}
                          >
                            {cell.available}
                          </span>
                        ) : (
                          <span className="num block text-[0.6875rem] font-semibold leading-none">
                            {moneyShort(cell.rate)}
                          </span>
                        )}
                        <span
                          className="mt-1 block h-0.5 rounded-full bg-accent"
                          style={{ width: `${Math.max(6, pressure * 100)}%`, marginInline: "auto" }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="space-y-0.5">
                        <p className="font-medium">
                          {rt.name} · {weekday(d)} {dayNumber(d)}
                        </p>
                        <p className="num">
                          {cell.sold} sold · {cell.available} left · {moneyShort(cell.rate)}
                        </p>
                        {cell.minStay > 1 ? <p>Minimum stay {cell.minStay} nights</p> : null}
                        {cell.closed ? <p className="text-destructive">Closed to arrival</p> : null}
                        {cell.event ? <p className="text-accent-brand">{cell.event}</p> : null}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-border bg-muted/50">
            <th
              scope="row"
              className="sticky left-0 z-10 bg-muted/50 px-4 py-2 text-left lg:px-5"
            >
              <span className="label-brand">Occupancy</span>
            </th>
            {dayTotals.map((t) => (
              <td key={t.date} className="px-1 py-2 text-center">
                <span
                  className={cn(
                    "num text-xs font-semibold",
                    t.occupancy >= 90
                      ? "text-destructive"
                      : t.occupancy >= 70
                        ? "text-status-ok"
                        : "text-muted-foreground",
                  )}
                >
                  {Math.round(t.occupancy)}%
                </span>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2.5 text-xs text-muted-foreground lg:px-5">
        <span className="flex items-center gap-1.5">
          <StatusDot tone="risk" className="size-1.5" />
          Sold out
        </span>
        <span className="flex items-center gap-1.5">
          <StatusDot tone="warn" className="size-1.5" />
          Above 80% sold
        </span>
        <span className="flex items-center gap-1.5">
          <DotIcon className="size-3" />
          The bar under each cell shows how much of that room type is already sold.
        </span>
      </div>
    </Panel>
  )
}
