"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, MapPinIcon, StarIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PROPERTY_COOKIE } from "@/lib/constants"
import { moneyShort, percent } from "@/lib/format"
import type { Property } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface PropertyRow {
  property: Property
  occupancy: number
  adr: number
  openTickets: number
  liveChannels: number
}

export function PropertyList({ rows, activeId }: { rows: PropertyRow[]; activeId: string }) {
  const router = useRouter()
  const [pending, setPending] = React.useState<string | null>(null)

  function switchTo(id: string) {
    if (id === activeId) return
    setPending(id)
    document.cookie = `${PROPERTY_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  React.useEffect(() => setPending(null), [activeId])

  return (
    <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {rows.map(({ property: p, occupancy, adr, openTickets, liveChannels }) => {
        const active = p.id === activeId
        return (
          <li
            key={p.id}
            className={cn(
              "ease-occuply flex flex-col gap-4 rounded-xl border p-4 transition-all duration-200 lg:p-5",
              active
                ? "border-accent/40 bg-accent-soft/45"
                : "border-border bg-card hover:-translate-y-px hover:shadow-[0_10px_28px_-20px_oklch(0.2046_0.008_50.5/0.55)]",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "num flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                  active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {p.totalUnits}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                  {active ? (
                    <Badge variant="outline" className="shrink-0 gap-1 border-accent/40 bg-card text-accent-brand">
                      <CheckIcon className="size-2.5" strokeWidth={3} />
                      Active
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPinIcon className="size-3 shrink-0" strokeWidth={2} />
                  <span className="truncate">
                    {p.city}, {p.region}
                  </span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <StarIcon className="size-3 fill-current text-accent" strokeWidth={0} />
                    <span className="num">{p.starRating}</span>
                  </span>
                </p>
              </div>
            </div>

            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{p.description}</p>

            <dl className="grid grid-cols-4 gap-2 border-t border-border/70 pt-3">
              {[
                { k: "Occupancy", v: percent(occupancy, 0) },
                { k: "ADR", v: moneyShort(adr) },
                { k: "Channels", v: String(liveChannels) },
                { k: "Tickets", v: String(openTickets) },
              ].map((s) => (
                <div key={s.k} className="min-w-0">
                  <dt className="label-brand truncate text-[0.5625rem]">{s.k}</dt>
                  <dd className="num truncate text-sm font-semibold">{s.v}</dd>
                </div>
              ))}
            </dl>

            <Button
              size="sm"
              variant={active ? "outline" : "default"}
              disabled={active || pending === p.id}
              onClick={() => switchTo(p.id)}
              className={cn("h-8 w-full", !active && "bg-accent text-accent-foreground hover:bg-accent/90")}
            >
              {active ? "Currently managing" : pending === p.id ? "Switching…" : "Switch to this property"}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
