"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BedDoubleIcon,
  Building2Icon,
  CalendarDaysIcon,
  ChartColumnIcon,
  CornerDownLeftIcon,
  LayoutDashboardIcon,
  SearchIcon,
  Share2Icon,
  SlidersHorizontalIcon,
  TagIcon,
  UserRoundIcon,
  UsersRoundIcon,
  WrenchIcon,
} from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { channelStyle } from "@/lib/channels"
import { money, shortDate } from "@/lib/format"
import { useMeta, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface Hit {
  id: string
  group: string
  title: string
  meta: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  swatch?: string
}

const PAGES: { title: string; meta: string; href: string; icon: Hit["icon"] }[] = [
  { title: "Dashboard", meta: "Occupancy, revenue, today's movements", href: "/", icon: LayoutDashboardIcon },
  { title: "Calendar", meta: "Stays, blocks and drag-to-move", href: "/calendar", icon: CalendarDaysIcon },
  { title: "Rooms", meta: "Status board and room types", href: "/rooms", icon: BedDoubleIcon },
  { title: "Rates", meta: "Rate plans and the nightly grid", href: "/rates", icon: TagIcon },
  { title: "Channel setup", meta: "Distribution and mapping", href: "/channels", icon: Share2Icon },
  { title: "Maintenance", meta: "Tickets and workload", href: "/maintenance", icon: WrenchIcon },
  { title: "Dynamic pricing", meta: "Rules and recommendations", href: "/pricing", icon: SlidersHorizontalIcon },
  { title: "Reports", meta: "Performance, distribution and cost", href: "/reports", icon: ChartColumnIcon },
  { title: "Properties", meta: "Switch or add a property", href: "/properties", icon: Building2Icon },
  { title: "User & settings", meta: "Profile, team, notifications", href: "/settings", icon: UsersRoundIcon },
]

const SUGGESTIONS = [
  "a guest name",
  "a room number like GD-101",
  "a booking reference",
  "a ticket, e.g. pool pump",
  "a channel like Booking.com",
]

export function GlobalSearch() {
  const router = useRouter()
  const { bookings, tickets, rooms } = useStore()
  const meta = useMeta()

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [cursor, setCursor] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl-K from anywhere.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(true)
        requestAnimationFrame(() => inputRef.current?.focus())
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const hits = React.useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Hit[] = []
    const has = (...vals: (string | number | undefined)[]) =>
      vals.some((v) => String(v ?? "").toLowerCase().includes(q))

    for (const p of PAGES) {
      if (has(p.title, p.meta)) {
        out.push({ id: `page-${p.href}`, group: "Go to", title: p.title, meta: p.meta, href: p.href, icon: p.icon })
      }
    }

    for (const b of bookings) {
      if (has(b.guestName, b.reference, b.roomNumber, b.channel, b.guestEmail, b.guestCountry)) {
        out.push({
          id: b.id,
          group: "Reservations",
          title: b.guestName || b.reference,
          meta: `${b.reference} · room ${b.roomNumber} · ${shortDate(b.checkIn)} to ${shortDate(b.checkOut)} · ${money(b.total)}`,
          href: `/calendar?booking=${encodeURIComponent(b.id)}`,
          icon: UserRoundIcon,
          swatch: channelStyle(b.channel).bg,
        })
      }
    }

    for (const r of rooms) {
      if (has(r.number, r.guestName, r.status, r.housekeeping)) {
        const type = meta.roomTypes.find((t) => t.id === r.roomTypeId)
        out.push({
          id: r.id,
          group: "Rooms",
          title: r.number,
          meta: `${type?.name ?? "Room"} · ${r.status.replace("-", " ")}`,
          href: `/rooms?room=${encodeURIComponent(r.number)}`,
          icon: BedDoubleIcon,
        })
      }
    }

    for (const t of tickets) {
      if (has(t.title, t.reference, t.location, t.category, t.status)) {
        out.push({
          id: t.id,
          group: "Maintenance",
          title: t.title || t.reference,
          meta: `${t.reference} · ${t.location} · ${t.status.replace("-", " ")}`,
          href: `/maintenance?ticket=${encodeURIComponent(t.id)}`,
          icon: WrenchIcon,
        })
      }
    }

    for (const rt of meta.roomTypes) {
      if (has(rt.name, rt.code, rt.view, rt.bedConfig)) {
        out.push({
          id: rt.id,
          group: "Room types",
          title: rt.name,
          meta: `${rt.code} · ${rt.count} rooms · from ${money(rt.baseRate)}`,
          href: `/rooms?type=${encodeURIComponent(rt.id)}`,
          icon: BedDoubleIcon,
        })
      }
    }

    for (const c of meta.channels) {
      if (has(c.name, c.kind, c.status)) {
        out.push({
          id: c.id,
          group: "Channels",
          title: c.name,
          meta: `${c.kind} · ${c.status} · ${c.bookings30d} bookings in 30 days`,
          href: `/channels?channel=${encodeURIComponent(c.id)}`,
          icon: Share2Icon,
          swatch: channelStyle(c.name).bg,
        })
      }
    }

    for (const p of meta.ratePlans) {
      if (has(p.name, p.code, p.type)) {
        out.push({
          id: p.id,
          group: "Rate plans",
          title: p.name,
          meta: `${p.code} · ${p.type} · min ${p.minStay} nights`,
          href: `/rates?plan=${encodeURIComponent(p.id)}`,
          icon: TagIcon,
        })
      }
    }

    return out.slice(0, 40)
  }, [query, bookings, tickets, rooms, meta])

  const grouped = React.useMemo(() => {
    const map = new Map<string, Hit[]>()
    hits.forEach((h) => {
      const list = map.get(h.group) ?? []
      list.push(h)
      map.set(h.group, list)
    })
    return [...map.entries()]
  }, [hits])

  const flat = React.useMemo(() => grouped.flatMap(([, list]) => list), [grouped])
  const activeIndex = Math.min(cursor, Math.max(0, flat.length - 1))

  function go(hit: Hit) {
    setOpen(false)
    setQuery("")
    setCursor(0)
    router.push(hit.href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setCursor((c) => Math.min(flat.length - 1, c + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === "Enter" && flat[activeIndex]) {
      e.preventDefault()
      go(flat[activeIndex])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        nativeButton={false}
        render={
          <div
            role="search"
            className="relative"
            onClick={() => {
              setOpen(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
          />
        }
      >
        <button
          type="button"
          aria-label="Search"
          className="ease-occuply flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground sm:hidden"
        >
          <SearchIcon className="size-[1.15rem]" strokeWidth={1.9} />
        </button>
        <SearchIcon
          className="pointer-events-none absolute left-4 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground sm:block"
          strokeWidth={1.9}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search anything..."
          aria-label="Search everything in Occuply"
          onChange={(e) => {
            setQuery(e.target.value)
            setCursor(0)
            if (!open) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          // Deliberately no heavy focus ring: the popup below is the feedback.
          className="hidden h-11 w-56 rounded-full border border-border bg-card pl-11 pr-14 text-sm outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-border/70 focus:bg-muted/40 sm:block lg:w-80"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground sm:block">
          ⌘K
        </kbd>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        // Keep the caret in the field while arrowing through results.
        initialFocus={false}
        className="max-h-[26rem] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto p-2"
      >
        <div className="relative mb-1 sm:hidden">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.9}
          />
          <input
            type="text"
            autoFocus
            value={query}
            placeholder="Search anything..."
            aria-label="Search everything in Occuply"
            onChange={(e) => {
              setQuery(e.target.value)
              setCursor(0)
            }}
            onKeyDown={onKeyDown}
            className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-border/70"
          />
        </div>

        {!query.trim() ? (
          <div className="px-2 py-3">
            <p className="text-sm font-medium">Try searching…</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <li key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <SearchIcon className="size-3 shrink-0" strokeWidth={2} />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
              Searches reservations, rooms, room types, tickets, channels, rate plans, people and every
              screen. One character is enough.
            </p>
          </div>
        ) : flat.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <p className="text-sm font-medium">Nothing matches “{query}”</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a guest name, a room number, or part of a booking reference.
            </p>
          </div>
        ) : (
          <>
            <p className="px-2 pb-1.5 pt-1 text-xs text-muted-foreground">
              {flat.length} result{flat.length > 1 ? "s" : ""} for “{query}”
            </p>
            {grouped.map(([group, list]) => (
              <div key={group} className="mb-1.5">
                <p className="label-brand px-2 py-1">{group}</p>
                <ul className="flex flex-col gap-0.5">
                  {list.map((h) => {
                    const idx = flat.indexOf(h)
                    const Icon = h.icon
                    return (
                      <li key={h.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setCursor(idx)}
                          onClick={() => go(h)}
                          className={cn(
                            "ease-occuply flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-100",
                            idx === activeIndex ? "bg-accent-soft" : "hover:bg-muted",
                          )}
                        >
                          <span
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                            style={
                              h.swatch
                                ? { backgroundColor: h.swatch, color: "#fff" }
                                : undefined
                            }
                          >
                            <Icon
                              className={cn("size-3.5", !h.swatch && "text-muted-foreground")}
                              strokeWidth={1.9}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{h.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">{h.meta}</span>
                          </span>
                          {idx === activeIndex ? (
                            <CornerDownLeftIcon className="size-3.5 shrink-0 text-muted-foreground" />
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
