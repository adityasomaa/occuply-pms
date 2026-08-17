import { percent, weekday } from "./format"
import type { InventoryDay, RoomType } from "./types"

export interface Suggestion {
  key: string
  date: string
  roomTypeId: string
  roomTypeName: string
  current: number
  suggested: number
  sold: number
  available: number
  reason: string
  event?: string
}

/** Anything more than six percent away from the engine's recommendation is
 *  worth a human decision. Below that the churn costs more than the uplift. */
const THRESHOLD = 0.06

export function buildSuggestions(
  inventory: InventoryDay[],
  roomTypes: RoomType[],
  anchor: string,
  horizon: string,
): Suggestion[] {
  const byId = new Map(roomTypes.map((r) => [r.id, r]))

  return inventory
    .filter((i) => i.date >= anchor && i.date < horizon)
    .filter((i) => Math.abs(i.suggestedRate - i.rate) / i.rate > THRESHOLD)
    .flatMap((i) => {
      const rt = byId.get(i.roomTypeId)
      if (!rt) return []
      const pressure = i.sold / rt.count
      const up = i.suggestedRate > i.rate
      return [
        {
          key: `${i.roomTypeId}:${i.date}`,
          date: i.date,
          roomTypeId: i.roomTypeId,
          roomTypeName: rt.name,
          current: i.rate,
          suggested: i.suggestedRate,
          sold: i.sold,
          available: i.available,
          event: i.event,
          reason: i.event
            ? `${i.event} pushes demand well above a normal ${weekday(i.date)}`
            : up
              ? `${percent(pressure * 100, 0)} already sold with ${i.available} left`
              : `Only ${percent(pressure * 100, 0)} sold this far out`,
        },
      ]
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}
