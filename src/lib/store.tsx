"use client"

import * as React from "react"

import type {
  Booking,
  Channel,
  MaintenanceTicket,
  Property,
  RatePlan,
  Room,
  RoomStatus,
  RoomType,
  StaffMember,
} from "./types"

/* ---------------------------------------------------------------------------
   The app has no database. The server seeds a snapshot, this store takes
   ownership of the mutable slices, and every edit is written straight back to
   localStorage so the work survives a reload.

   It is a plain external store read through useSyncExternalStore rather than a
   reducer plus effects: the server snapshot is the SSR value, and the browser's
   saved edits are loaded on first subscribe, so there is no render-time state
   juggling and no hydration mismatch.
--------------------------------------------------------------------------- */

export interface Mutable {
  bookings: Booking[]
  tickets: MaintenanceTicket[]
  rooms: Room[]
}

export type Action =
  | { type: "booking:update"; id: string; patch: Partial<Booking> }
  | { type: "booking:move"; id: string; checkIn: string; roomNumber?: string }
  | { type: "booking:create"; booking: Booking }
  | { type: "booking:cancel"; id: string }
  | { type: "booking:delete"; id: string }
  | { type: "ticket:update"; id: string; patch: Partial<MaintenanceTicket> }
  | { type: "ticket:create"; ticket: MaintenanceTicket }
  | { type: "ticket:delete"; id: string }
  | { type: "room:update"; id: string; patch: Partial<Room> }

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)
}

export function shiftISO(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function reduce(state: Mutable, action: Action): Mutable {
  switch (action.type) {
    case "booking:update":
      return {
        ...state,
        bookings: state.bookings.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b)),
      }

    case "booking:move":
      return {
        ...state,
        bookings: state.bookings.map((b) => {
          if (b.id !== action.id) return b
          // Moving a stay keeps its length; only the anchor date changes.
          const nights = Math.max(1, daysBetween(b.checkIn, b.checkOut))
          return {
            ...b,
            checkIn: action.checkIn,
            checkOut: shiftISO(action.checkIn, nights),
            roomNumber: action.roomNumber ?? b.roomNumber,
          }
        }),
      }

    case "booking:create":
      return { ...state, bookings: [...state.bookings, action.booking] }

    case "booking:cancel":
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, status: "cancelled" as const } : b,
        ),
      }

    case "booking:delete":
      return { ...state, bookings: state.bookings.filter((b) => b.id !== action.id) }

    case "ticket:update":
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }

    case "ticket:create":
      return { ...state, tickets: [action.ticket, ...state.tickets] }

    case "ticket:delete":
      return { ...state, tickets: state.tickets.filter((t) => t.id !== action.id) }

    case "room:update":
      return {
        ...state,
        rooms: state.rooms.map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)),
      }
  }
}

function storageKey(propertyId: string) {
  return `occuply.state.${propertyId}`
}

class OccuplyStore {
  private state: Mutable
  private readonly seed: Mutable
  private readonly listeners = new Set<() => void>()
  private loaded = false

  constructor(
    readonly propertyId: string,
    seed: Mutable,
  ) {
    this.seed = seed
    this.state = seed
  }

  subscribe = (listener: () => void) => {
    // The first subscriber arrives after hydration, which is the right moment
    // to pull the browser's saved edits in.
    if (!this.loaded) {
      this.loaded = true
      const restored = this.read()
      if (restored) {
        this.state = restored
        queueMicrotask(() => this.emit())
      }
    }
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.state
  getServerSnapshot = () => this.seed

  dispatch = (action: Action) => {
    const next = reduce(this.state, action)
    if (next === this.state) return
    this.state = next
    this.write(next)
    this.emit()
  }

  reset = () => {
    try {
      window.localStorage.removeItem(storageKey(this.propertyId))
    } catch {
      /* ignore */
    }
    this.state = this.seed
    this.emit()
  }

  hasLocalEdits = () => {
    try {
      return window.localStorage.getItem(storageKey(this.propertyId)) !== null
    } catch {
      return false
    }
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }

  private read(): Mutable | null {
    try {
      const raw = window.localStorage.getItem(storageKey(this.propertyId))
      if (!raw) return null
      const parsed = JSON.parse(raw) as Mutable
      return parsed.bookings && parsed.tickets && parsed.rooms ? parsed : null
    } catch {
      return null
    }
  }

  private write(state: Mutable) {
    try {
      window.localStorage.setItem(storageKey(this.propertyId), JSON.stringify(state))
    } catch {
      // Quota or private mode: edits stay in memory for this session.
    }
  }
}

interface StoreValue extends Mutable {
  propertyId: string
  dispatch: (action: Action) => void
  resetToSeed: () => void
}

/** Read-only context the mutable store does not own: room plan, distribution,
 *  people. Search and the alert centre both need it. */
export interface AppMeta {
  property: Property
  roomTypes: RoomType[]
  channels: Channel[]
  staff: StaffMember[]
  ratePlans: RatePlan[]
  anchor: string
}

const StoreContext = React.createContext<OccuplyStore | null>(null)
const MetaContext = React.createContext<AppMeta | null>(null)

export function DataProvider({
  propertyId,
  seed,
  meta,
  children,
}: {
  propertyId: string
  seed: Mutable
  meta: AppMeta
  children: React.ReactNode
}) {
  // A fresh store per property, so switching properties never leaks edits.
  const [store, setStore] = React.useState(() => new OccuplyStore(propertyId, seed))
  if (store.propertyId !== propertyId) {
    setStore(new OccuplyStore(propertyId, seed))
  }

  return (
    <StoreContext.Provider value={store}>
      <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>
    </StoreContext.Provider>
  )
}

export function useMeta(): AppMeta {
  const meta = React.useContext(MetaContext)
  if (!meta) throw new Error("useMeta must be used inside <DataProvider>")
  return meta
}

export function useStore(): StoreValue {
  const store = React.useContext(StoreContext)
  if (!store) throw new Error("useStore must be used inside <DataProvider>")

  const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)

  return React.useMemo(
    () => ({
      ...state,
      propertyId: store.propertyId,
      dispatch: store.dispatch,
      resetToSeed: store.reset,
    }),
    [state, store],
  )
}

/* ------------------------------ derived helpers ---------------------------- */

/** Live room status: bookings win over the seeded status, and a maintenance
 *  block wins over everything. */
export function roomStatusFor(
  room: Room,
  bookings: Booking[],
  anchor: string,
): { status: RoomStatus; booking?: Booking } {
  if (room.status === "out-of-order") return { status: "out-of-order" }

  const active = bookings.filter((b) => b.roomNumber === room.number && b.status !== "cancelled")

  const staying = active.find((b) => b.checkIn <= anchor && b.checkOut > anchor)
  if (staying) {
    return { status: staying.checkOut === shiftISO(anchor, 1) ? "occupied" : "occupied", booking: staying }
  }

  const leaving = active.find((b) => b.checkOut === anchor)
  if (leaving) return { status: "departing", booking: leaving }

  const arriving = active.find((b) => b.checkIn === anchor)
  if (arriving) return { status: "arriving", booking: arriving }

  return { status: room.status }
}

/** Stable-enough id for records created in the browser. */
export function localId(prefix: string): string {
  return `${prefix}-local-${Math.random().toString(36).slice(2, 10)}`
}
