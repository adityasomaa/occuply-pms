/** Domain model for Occuply. Kept framework-free so the seeded in-memory
 *  store can be swapped for a real database without touching the UI. */

export type PropertyId = string

export interface Property {
  id: PropertyId
  name: string
  shortName: string
  type: "Villa Resort" | "Boutique Hotel" | "Serviced Residence"
  city: string
  region: string
  country: string
  address: string
  timezone: string
  currency: "IDR"
  checkIn: string
  checkOut: string
  starRating: number
  totalUnits: number
  openedYear: number
  /** Only one property in the demo carries the full operational dataset. */
  featured: boolean
  accent: string
  description: string
  amenities: string[]
  contact: { phone: string; email: string; website: string }
}

export type RoomTypeId = string

export interface RoomType {
  id: RoomTypeId
  propertyId: PropertyId
  code: string
  name: string
  count: number
  maxOccupancy: number
  bedConfig: string
  sizeSqm: number
  baseRate: number
  /** Floor / ceiling used by the dynamic pricing engine. */
  floorRate: number
  ceilingRate: number
  view: string
  amenities: string[]
}

export type RoomStatus =
  | "occupied"
  | "vacant-clean"
  | "vacant-dirty"
  | "arriving"
  | "departing"
  | "out-of-order"

export interface Room {
  id: string
  propertyId: PropertyId
  roomTypeId: RoomTypeId
  number: string
  floor: number
  status: RoomStatus
  housekeeping: "clean" | "dirty" | "inspected" | "in-progress"
  guestName?: string
  nights?: number
  checkOutDate?: string
  notes?: string
}

export type ChannelStatus = "connected" | "syncing" | "error" | "disabled"

export interface Channel {
  id: string
  propertyId: PropertyId
  name: string
  kind: "OTA" | "Direct" | "GDS" | "Metasearch"
  status: ChannelStatus
  commission: number
  lastSync: string
  mappedRoomTypes: number
  totalRoomTypes: number
  bookings30d: number
  revenue30d: number
  rateParity: "in-parity" | "undercut" | "overpriced"
  issue?: string
}

export type BookingStatus =
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "pending"
  | "cancelled"

export interface Booking {
  id: string
  propertyId: PropertyId
  reference: string
  guestName: string
  guestCountry: string
  guestEmail: string
  roomTypeId: RoomTypeId
  roomNumber: string
  channel: string
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  status: BookingStatus
  total: number
  paid: number
  notes?: string
}

export type TicketPriority = "critical" | "high" | "medium" | "low"
export type TicketStatus = "open" | "in-progress" | "awaiting-parts" | "resolved"

export interface MaintenanceTicket {
  id: string
  propertyId: PropertyId
  reference: string
  title: string
  location: string
  category:
    | "HVAC"
    | "Plumbing"
    | "Electrical"
    | "Pool & Garden"
    | "Furniture"
    | "Appliance"
    | "Network"
  priority: TicketPriority
  status: TicketStatus
  reportedBy: string
  assignedTo: string
  reportedAt: string
  dueAt: string
  estimatedCost: number
  blocksRoom: boolean
  description: string
}

export interface StaffMember {
  id: string
  propertyId: PropertyId
  name: string
  role: string
  department: "Front Office" | "Housekeeping" | "Maintenance" | "Revenue" | "Management"
  email: string
  phone: string
  accessLevel: "Owner" | "Manager" | "Supervisor" | "Staff" | "Read only"
  active: boolean
  lastActive: string
  initials: string
}

export interface RatePlan {
  id: string
  propertyId: PropertyId
  name: string
  code: string
  type: "Base" | "Package" | "Promotional" | "Corporate" | "Long stay"
  adjustment: number
  adjustmentKind: "percent" | "fixed"
  minStay: number
  cancellation: string
  includesBreakfast: boolean
  active: boolean
  channels: string[]
}

export interface PricingRule {
  id: string
  propertyId: PropertyId
  name: string
  trigger: string
  condition: string
  adjustment: number
  priority: number
  active: boolean
  appliedLast30d: number
  revenueImpact: number
  kind: "occupancy" | "lead-time" | "day-of-week" | "season" | "competitor" | "length-of-stay"
}

/** One calendar cell: a room type on a date. */
export interface InventoryDay {
  date: string
  roomTypeId: RoomTypeId
  available: number
  sold: number
  rate: number
  /** Rate the engine would recommend, before the manager accepts it. */
  suggestedRate: number
  closed: boolean
  minStay: number
  event?: string
}

export interface DailyMetric {
  date: string
  occupancy: number
  adr: number
  revpar: number
  revenue: number
  bookings: number
  cancellations: number
}

export interface PropertySnapshot {
  property: Property
  roomTypes: RoomType[]
  rooms: Room[]
  channels: Channel[]
  bookings: Booking[]
  tickets: MaintenanceTicket[]
  staff: StaffMember[]
  ratePlans: RatePlan[]
  pricingRules: PricingRule[]
  inventory: InventoryDay[]
  metrics: DailyMetric[]
  kpi: {
    occupancy: number
    occupancyDelta: number
    adr: number
    adrDelta: number
    revpar: number
    revparDelta: number
    revenue30d: number
    revenueDelta: number
    arrivalsToday: number
    departuresToday: number
    inHouse: number
    outOfOrder: number
    openTickets: number
    alos: number
    directShare: number
    cancellationRate: number
  }
}
