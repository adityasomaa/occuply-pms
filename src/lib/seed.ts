import type {
  Booking,
  Channel,
  DailyMetric,
  InventoryDay,
  MaintenanceTicket,
  PricingRule,
  Property,
  PropertySnapshot,
  RatePlan,
  Room,
  RoomStatus,
  RoomType,
  RoomTypeId,
  StaffMember,
} from "./types"

/* ---------------------------------------------------------------------------
   Deterministic pseudo-randomness.
   Every figure below is derived from a fixed seed so the demo renders the
   same numbers on the server and in the browser, and stays stable across
   redeploys. Nothing here is Math.random().
--------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/* --- date helpers (UTC-only, so no timezone drift between render passes) --- */

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return toISO(d)
}

export function dayOfWeek(iso: string): number {
  return parseISO(iso).getUTCDay()
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000)
}

/* ------------------------------- properties ------------------------------- */

export const PROPERTIES: Property[] = [
  {
    id: "amerta-ubud",
    name: "Amerta Ubud Villas & Suites",
    shortName: "Amerta Ubud",
    type: "Villa Resort",
    city: "Ubud",
    region: "Bali",
    country: "Indonesia",
    address: "Jalan Raya Sanggingan No. 88, Kedewatan, Ubud, Gianyar 80571",
    timezone: "Asia/Makassar",
    currency: "IDR",
    checkIn: "14:00",
    checkOut: "12:00",
    starRating: 5,
    totalUnits: 24,
    openedYear: 2017,
    featured: true,
    accent: "#FF7A00",
    description:
      "Twenty-four riverside villas and suites terraced into the Ayung gorge. Two restaurants, a spa pavilion and a 25-metre infinity pool.",
    amenities: [
      "Infinity pool",
      "Spa pavilion",
      "Two restaurants",
      "Yoga shala",
      "Airport transfer",
      "Fibre wifi",
      "Laundry",
      "Shuttle to Ubud centre",
    ],
    contact: {
      phone: "+62 361 4792 118",
      email: "reservations@amertaubud.co.id",
      website: "amertaubud.co.id",
    },
  },
  {
    id: "cendana-canggu",
    name: "Cendana Canggu Lofts",
    shortName: "Cendana Canggu",
    type: "Boutique Hotel",
    city: "Canggu",
    region: "Bali",
    country: "Indonesia",
    address: "Jalan Pantai Batu Bolong No. 47, Canggu, Badung 80361",
    timezone: "Asia/Makassar",
    currency: "IDR",
    checkIn: "15:00",
    checkOut: "11:00",
    starRating: 4,
    totalUnits: 14,
    openedYear: 2021,
    featured: false,
    accent: "#FF7A00",
    description:
      "Fourteen split-level lofts two minutes from Batu Bolong beach, built around a co-working deck and a lap pool.",
    amenities: ["Lap pool", "Co-working deck", "Surfboard store", "Cafe", "Fibre wifi", "Scooter rental"],
    contact: {
      phone: "+62 361 3308 274",
      email: "stay@cendanacanggu.com",
      website: "cendanacanggu.com",
    },
  },
  {
    id: "bhuvana-nusadua",
    name: "Bhuvana Nusa Dua Residence",
    shortName: "Bhuvana Nusa Dua",
    type: "Serviced Residence",
    city: "Nusa Dua",
    region: "Bali",
    country: "Indonesia",
    address: "Kawasan Pariwisata Nusa Dua Lot S-6, Benoa, Badung 80363",
    timezone: "Asia/Makassar",
    currency: "IDR",
    checkIn: "14:00",
    checkOut: "12:00",
    starRating: 4,
    totalUnits: 36,
    openedYear: 2019,
    featured: false,
    accent: "#FF7A00",
    description:
      "Thirty-six serviced apartments aimed at extended corporate stays, with weekly housekeeping and a business lounge.",
    amenities: ["Business lounge", "Gym", "Rooftop pool", "Weekly housekeeping", "Fibre wifi", "Covered parking"],
    contact: {
      phone: "+62 361 7745 902",
      email: "front.office@bhuvanaresidence.id",
      website: "bhuvanaresidence.id",
    },
  },
]

export const DEFAULT_PROPERTY_ID = "amerta-ubud"

export function getProperty(id: string): Property {
  return PROPERTIES.find((p) => p.id === id) ?? PROPERTIES[0]
}

/* ------------------------------- room types ------------------------------- */

interface RoomTypeSeed {
  code: string
  name: string
  count: number
  maxOccupancy: number
  bedConfig: string
  sizeSqm: number
  baseRate: number
  view: string
  amenities: string[]
  prefix: string
  floor: number
}

const ROOM_TYPE_SEEDS: Record<string, RoomTypeSeed[]> = {
  "amerta-ubud": [
    {
      code: "GDX",
      name: "Garden Deluxe",
      count: 8,
      maxOccupancy: 2,
      bedConfig: "1 king or 2 twin",
      sizeSqm: 42,
      baseRate: 1_450_000,
      view: "Tropical garden",
      amenities: ["Rain shower", "Private terrace", "Espresso machine", "Safe"],
      prefix: "GD",
      floor: 1,
    },
    {
      code: "RSU",
      name: "Riverside Suite",
      count: 6,
      maxOccupancy: 3,
      bedConfig: "1 king + daybed",
      sizeSqm: 68,
      baseRate: 2_380_000,
      view: "Ayung river gorge",
      amenities: ["Soaking tub", "Balcony", "Lounge area", "Espresso machine", "Safe"],
      prefix: "RS",
      floor: 2,
    },
    {
      code: "PV1",
      name: "Pool Villa One-Bedroom",
      count: 5,
      maxOccupancy: 3,
      bedConfig: "1 king",
      sizeSqm: 110,
      baseRate: 3_950_000,
      view: "Private garden",
      amenities: ["Private pool", "Outdoor shower", "Butler service", "Kitchenette", "Safe"],
      prefix: "PV",
      floor: 1,
    },
    {
      code: "FV2",
      name: "Family Pool Villa Two-Bedroom",
      count: 3,
      maxOccupancy: 5,
      bedConfig: "1 king + 2 twin",
      sizeSqm: 168,
      baseRate: 5_600_000,
      view: "Rice terrace",
      amenities: ["Private pool", "Full kitchen", "Butler service", "Child amenities", "Safe"],
      prefix: "FV",
      floor: 1,
    },
    {
      code: "SIG",
      name: "Amerta Signature Villa",
      count: 2,
      maxOccupancy: 4,
      bedConfig: "2 king",
      sizeSqm: 240,
      baseRate: 8_750_000,
      view: "Gorge panorama",
      amenities: ["Infinity plunge pool", "Private chef", "Spa room", "Butler service", "Wine fridge"],
      prefix: "SV",
      floor: 1,
    },
  ],
  "cendana-canggu": [
    {
      code: "SLF",
      name: "Studio Loft",
      count: 8,
      maxOccupancy: 2,
      bedConfig: "1 queen",
      sizeSqm: 34,
      baseRate: 985_000,
      view: "Courtyard",
      amenities: ["Rain shower", "Work desk", "Mini fridge"],
      prefix: "SL",
      floor: 1,
    },
    {
      code: "MLF",
      name: "Mezzanine Loft",
      count: 4,
      maxOccupancy: 3,
      bedConfig: "1 queen + sofa bed",
      sizeSqm: 52,
      baseRate: 1_420_000,
      view: "Pool",
      amenities: ["Rain shower", "Mezzanine lounge", "Kitchenette"],
      prefix: "ML",
      floor: 2,
    },
    {
      code: "PHL",
      name: "Penthouse Loft",
      count: 2,
      maxOccupancy: 4,
      bedConfig: "1 king + 1 queen",
      sizeSqm: 86,
      baseRate: 2_640_000,
      view: "Ocean strip",
      amenities: ["Roof terrace", "Kitchenette", "Outdoor tub"],
      prefix: "PH",
      floor: 3,
    },
  ],
  "bhuvana-nusadua": [
    {
      code: "1BR",
      name: "One-Bedroom Residence",
      count: 18,
      maxOccupancy: 2,
      bedConfig: "1 king",
      sizeSqm: 48,
      baseRate: 1_180_000,
      view: "Garden",
      amenities: ["Kitchenette", "Washer", "Work desk"],
      prefix: "A",
      floor: 2,
    },
    {
      code: "2BR",
      name: "Two-Bedroom Residence",
      count: 12,
      maxOccupancy: 4,
      bedConfig: "1 king + 2 twin",
      sizeSqm: 76,
      baseRate: 1_860_000,
      view: "Pool",
      amenities: ["Full kitchen", "Washer", "Dining area"],
      prefix: "B",
      floor: 3,
    },
    {
      code: "PRS",
      name: "Premier Suite",
      count: 6,
      maxOccupancy: 4,
      bedConfig: "1 king + sofa bed",
      sizeSqm: 98,
      baseRate: 2_950_000,
      view: "Rooftop",
      amenities: ["Full kitchen", "Lounge", "Business lounge access"],
      prefix: "P",
      floor: 4,
    },
  ],
}

/** A sensible three-tier room plan for a property added inside the app. */
function defaultRoomTypeSeeds(totalUnits: number): RoomTypeSeed[] {
  const standard = Math.max(1, Math.round(totalUnits * 0.55))
  const superior = Math.max(1, Math.round(totalUnits * 0.3))
  const suite = Math.max(1, totalUnits - standard - superior)
  return [
    {
      code: "STD", name: "Standard Room", count: standard, maxOccupancy: 2,
      bedConfig: "1 queen", sizeSqm: 28, baseRate: 850_000, view: "Garden",
      amenities: ["Rain shower", "Work desk", "Safe"], prefix: "ST", floor: 1,
    },
    {
      code: "SUP", name: "Superior Room", count: superior, maxOccupancy: 3,
      bedConfig: "1 king", sizeSqm: 38, baseRate: 1_250_000, view: "Pool",
      amenities: ["Rain shower", "Balcony", "Safe"], prefix: "SU", floor: 2,
    },
    {
      code: "STE", name: "Suite", count: suite, maxOccupancy: 4,
      bedConfig: "1 king + sofa bed", sizeSqm: 62, baseRate: 2_150_000, view: "Panorama",
      amenities: ["Lounge area", "Soaking tub", "Safe"], prefix: "SE", floor: 3,
    },
  ]
}

function seedsFor(property: Property): RoomTypeSeed[] {
  return ROOM_TYPE_SEEDS[property.id] ?? defaultRoomTypeSeeds(property.totalUnits)
}

function buildRoomTypes(property: Property): RoomType[] {
  const propertyId = property.id
  return seedsFor(property).map((s) => ({
    id: `${propertyId}-${s.code.toLowerCase()}`,
    propertyId,
    code: s.code,
    name: s.name,
    count: s.count,
    maxOccupancy: s.maxOccupancy,
    bedConfig: s.bedConfig,
    sizeSqm: s.sizeSqm,
    baseRate: s.baseRate,
    floorRate: Math.round(s.baseRate * 0.72),
    ceilingRate: Math.round(s.baseRate * 2.15),
    view: s.view,
    amenities: s.amenities,
  }))
}

/* ---------------------------------- people --------------------------------- */

const GUESTS: { name: string; country: string; email: string }[] = [
  { name: "Marijke van der Berg", country: "NL", email: "m.vandenberg@proton.me" },
  { name: "Tomás Ferreira", country: "PT", email: "tomas.ferreira@sapo.pt" },
  { name: "Hana Kobayashi", country: "JP", email: "h.kobayashi@mistral.jp" },
  { name: "Oliver Brennan", country: "IE", email: "obrennan@fastmail.com" },
  { name: "Sofia Almeida", country: "BR", email: "sofia.almeida@uol.com.br" },
  { name: "Lukas Brenner", country: "DE", email: "l.brenner@posteo.de" },
  { name: "Chayanit Rattanakul", country: "TH", email: "chayanit.r@ktmail.co.th" },
  { name: "Ingrid Solberg", country: "NO", email: "ingrid.solberg@online.no" },
  { name: "Mateusz Wójcik", country: "PL", email: "m.wojcik@interia.pl" },
  { name: "Élodie Marchand", country: "FR", email: "elodie.marchand@laposte.fr" },
  { name: "Daniel Okonkwo", country: "NG", email: "d.okonkwo@zohomail.com" },
  { name: "Priya Raghunathan", country: "IN", email: "priya.rag@rediffmail.com" },
  { name: "Anneliese Hofmann", country: "AT", email: "a.hofmann@gmx.at" },
  { name: "Ravi Sundaram", country: "SG", email: "ravi.sundaram@singnet.sg" },
  { name: "Beatriz Cardoso", country: "ES", email: "b.cardoso@telefonica.es" },
  { name: "Jasper Nieuwenhuis", country: "NL", email: "jasper.n@ziggo.nl" },
  { name: "Wanda Kusumawati", country: "ID", email: "wanda.kusuma@cbn.net.id" },
  { name: "Callum Fitzgerald", country: "AU", email: "c.fitzgerald@bigpond.com" },
  { name: "Yuki Nakamura", country: "JP", email: "yuki.nakamura@ocn.ne.jp" },
  { name: "Nadia Haryanto", country: "ID", email: "nadia.haryanto@indo.net.id" },
  { name: "Sebastián Duarte", country: "AR", email: "s.duarte@fibertel.ar" },
  { name: "Freja Lindqvist", country: "SE", email: "freja.lindqvist@telia.se" },
  { name: "Arjun Mehrotra", country: "IN", email: "arjun.mehrotra@vsnl.net" },
  { name: "Kirsten Aaltonen", country: "FI", email: "k.aaltonen@elisa.fi" },
]

const STAFF_SEEDS: Omit<StaffMember, "id" | "propertyId" | "lastActive">[] = [
  {
    name: "Ni Kadek Sriasih",
    role: "General Manager",
    department: "Management",
    email: "kadek.sriasih@amertaubud.co.id",
    phone: "+62 812 3947 5510",
    accessLevel: "Owner",
    active: true,
    initials: "KS",
  },
  {
    name: "Bagus Prayoga",
    role: "Front Office Manager",
    department: "Front Office",
    email: "bagus.prayoga@amertaubud.co.id",
    phone: "+62 813 5528 4471",
    accessLevel: "Manager",
    active: true,
    initials: "BP",
  },
  {
    name: "Rizky Ananda Putra",
    role: "Revenue Manager",
    department: "Revenue",
    email: "rizky.putra@amertaubud.co.id",
    phone: "+62 811 3902 7764",
    accessLevel: "Manager",
    active: true,
    initials: "RP",
  },
  {
    name: "Ayu Laksmi Dewi",
    role: "Housekeeping Supervisor",
    department: "Housekeeping",
    email: "ayu.laksmi@amertaubud.co.id",
    phone: "+62 878 4416 2038",
    accessLevel: "Supervisor",
    active: true,
    initials: "AD",
  },
  {
    name: "Gede Wisnu Mahendra",
    role: "Maintenance Lead",
    department: "Maintenance",
    email: "gede.wisnu@amertaubud.co.id",
    phone: "+62 819 6673 1145",
    accessLevel: "Supervisor",
    active: true,
    initials: "GM",
  },
  {
    name: "Putu Ardana Yasa",
    role: "Guest Relations Officer",
    department: "Front Office",
    email: "putu.ardana@amertaubud.co.id",
    phone: "+62 857 3820 9917",
    accessLevel: "Staff",
    active: true,
    initials: "PY",
  },
  {
    name: "Maria Yosefina Lado",
    role: "Reservations Agent",
    department: "Front Office",
    email: "maria.lado@amertaubud.co.id",
    phone: "+62 852 7714 3306",
    accessLevel: "Staff",
    active: true,
    initials: "ML",
  },
  {
    name: "Komang Trisna Wijaya",
    role: "Night Auditor",
    department: "Front Office",
    email: "komang.trisna@amertaubud.co.id",
    phone: "+62 838 2245 8890",
    accessLevel: "Staff",
    active: false,
    initials: "KW",
  },
  {
    name: "Wayan Agus Setiawan",
    role: "Maintenance Technician",
    department: "Maintenance",
    email: "wayan.agus@amertaubud.co.id",
    phone: "+62 823 4019 7752",
    accessLevel: "Staff",
    active: true,
    initials: "WS",
  },
  {
    name: "Dewa Nyoman Raka",
    role: "Pool and Grounds Technician",
    department: "Maintenance",
    email: "dewa.raka@amertaubud.co.id",
    phone: "+62 856 2298 6614",
    accessLevel: "Staff",
    active: true,
    initials: "DR",
  },
  {
    name: "Sari Wulandari",
    role: "Accountant",
    department: "Management",
    email: "sari.wulandari@amertaubud.co.id",
    phone: "+62 815 9038 4472",
    accessLevel: "Read only",
    active: true,
    initials: "SW",
  },
]

/* --------------------------------- channels -------------------------------- */

const CHANNEL_SEEDS = [
  { name: "Booking.com", kind: "OTA" as const, commission: 17.5 },
  { name: "Airbnb", kind: "OTA" as const, commission: 15 },
  { name: "Agoda", kind: "OTA" as const, commission: 18 },
  { name: "Expedia Group", kind: "OTA" as const, commission: 16.5 },
  { name: "Traveloka", kind: "OTA" as const, commission: 14 },
  { name: "Tiket.com", kind: "OTA" as const, commission: 13.5 },
  { name: "Direct Website", kind: "Direct" as const, commission: 2.4 },
  { name: "Google Hotel Ads", kind: "Metasearch" as const, commission: 9 },
]

/* ------------------------------ generators -------------------------------- */

const HOLIDAYS: Record<string, string> = {
  "03-11": "Nyepi eve",
  "03-12": "Nyepi",
  "04-16": "Galungan",
  "04-26": "Kuningan",
  "08-17": "Independence Day",
  "12-24": "Christmas eve",
  "12-25": "Christmas",
  "12-31": "New Year eve",
  "01-01": "New Year",
}

/** Seasonality multiplier for Bali: Jul-Aug and Dec peak, Feb-Mar trough. */
function seasonFactor(iso: string): number {
  const month = parseISO(iso).getUTCMonth()
  return [0.88, 0.82, 0.85, 0.94, 1.0, 1.08, 1.24, 1.26, 1.06, 1.0, 0.92, 1.18][month]
}

function weekdayFactor(iso: string): number {
  return [0.94, 0.9, 0.92, 0.96, 1.08, 1.18, 1.12][dayOfWeek(iso)]
}

function holidayFor(iso: string): string | undefined {
  return HOLIDAYS[iso.slice(5)]
}

function buildRooms(
  property: Property,
  roomTypes: RoomType[],
  anchor: string,
  soldByType: Map<RoomTypeId, number>,
): Room[] {
  const propertyId = property.id
  const rnd = mulberry32(hash(propertyId + "rooms" + anchor))
  const seeds = seedsFor(property)
  const rooms: Room[] = []
  const guestPool = [...GUESTS]

  // One unit across the whole property is held back for maintenance.
  let oooBudget = 1

  roomTypes.forEach((rt, ti) => {
    const seed = seeds[ti]
    const sold = Math.min(rt.count, soldByType.get(rt.id) ?? 0)
    // A fifth of tonight's occupied rooms check out in the morning.
    const departing = sold === 0 ? 0 : Math.max(1, Math.round(sold * 0.2))

    for (let i = 0; i < rt.count; i++) {
      const number = `${seed.prefix}-${seed.floor}${String(i + 1).padStart(2, "0")}`
      const roll = rnd()
      let status: RoomStatus
      if (i < sold - departing) status = "occupied"
      else if (i < sold) status = "departing"
      else if (oooBudget > 0 && roll > 0.86) {
        status = "out-of-order"
        oooBudget -= 1
      } else if (roll < 0.34) status = "arriving"
      else if (roll < 0.72) status = "vacant-clean"
      else status = "vacant-dirty"

      const occupied = status === "occupied" || status === "departing"
      const guest = occupied ? guestPool[Math.floor(rnd() * guestPool.length)] : undefined
      const nights = occupied ? 2 + Math.floor(rnd() * 7) : undefined

      rooms.push({
        id: `${propertyId}-${number}`,
        propertyId,
        roomTypeId: rt.id,
        number,
        floor: seed.floor,
        status,
        housekeeping:
          status === "vacant-dirty" || status === "departing"
            ? "dirty"
            : status === "arriving"
              ? "inspected"
              : status === "out-of-order"
                ? "in-progress"
                : "clean",
        guestName: guest?.name,
        nights,
        checkOutDate: occupied ? addDays(anchor, status === "departing" ? 0 : 1 + Math.floor(rnd() * 6)) : undefined,
        notes:
          status === "out-of-order"
            ? "Blocked for maintenance"
            : status === "arriving"
              ? "Ready for arrival"
              : undefined,
      })
    }
  })
  return rooms
}

function buildChannels(propertyId: string, roomTypes: RoomType[], anchor: string): Channel[] {
  const rnd = mulberry32(hash(propertyId + "channels"))
  const total = roomTypes.length
  return CHANNEL_SEEDS.map((c, i) => {
    const roll = rnd()
    const isDirect = c.kind === "Direct"
    let status: Channel["status"]
    if (isDirect) status = "connected"
    else if (i === 5) status = "error"
    else if (i === 4) status = "syncing"
    else if (roll < 0.06) status = "disabled"
    else status = "connected"

    const mapped = status === "error" ? total - 1 : total
    const bookings = Math.round(18 + rnd() * 64)
    return {
      id: `${propertyId}-ch-${i}`,
      propertyId,
      name: c.name,
      kind: c.kind,
      status,
      commission: c.commission,
      lastSync:
        status === "error"
          ? `${anchor}T02:14:00+08:00`
          : status === "syncing"
            ? `${anchor}T09:41:00+08:00`
            : `${anchor}T09:${String(10 + i * 6).padStart(2, "0")}:00+08:00`,
      mappedRoomTypes: mapped,
      totalRoomTypes: total,
      bookings30d: bookings,
      revenue30d: Math.round(bookings * (1_640_000 + rnd() * 1_900_000)),
      rateParity: roll < 0.14 ? "undercut" : roll > 0.93 ? "overpriced" : "in-parity",
      issue:
        status === "error"
          ? "Rate push rejected: room type SIG has no mapped rate plan on the channel side."
          : status === "syncing"
            ? "Initial inventory sync in progress, 2 of 5 room types pushed."
            : undefined,
    }
  })
}

function buildBookings(
  propertyId: string,
  roomTypes: RoomType[],
  rooms: Room[],
  channels: Channel[],
  anchor: string,
): Booking[] {
  const rnd = mulberry32(hash(propertyId + "bookings" + anchor))
  const bookings: Booking[] = []
  const active = channels.filter((c) => c.status !== "disabled")
  const count = 96
  const ARRIVALS_TODAY = 5
  const DEPARTURES_TODAY = 4

  for (let i = 0; i < count; i++) {
    // Cursor rather than a random pick, so the guests on today's arrival and
    // departure sheets are always distinct people.
    const guest = GUESTS[i % GUESTS.length]
    const rt = roomTypes[Math.floor(rnd() * roomTypes.length)]
    const channel = active[Math.floor(rnd() * active.length)]

    const nights = 1 + Math.floor(rnd() * 9)

    // The first few bookings are pinned to today so the operational screens
    // always have an arrival and departure sheet to show.
    let checkIn: string
    if (i < ARRIVALS_TODAY) {
      checkIn = anchor
    } else if (i < ARRIVALS_TODAY + DEPARTURES_TODAY) {
      checkIn = addDays(anchor, -nights)
    } else {
      // Everything else spreads from 40 days back to 55 days forward.
      checkIn = addDays(anchor, Math.floor(rnd() * 95) - 40)
    }
    const checkOut = addDays(checkIn, nights)

    let status: Booking["status"]
    const pinned = i < ARRIVALS_TODAY + DEPARTURES_TODAY
    const cancelRoll = rnd()
    if (!pinned && cancelRoll < 0.07) status = "cancelled"
    else if (diffDays(anchor, checkOut) <= 0) status = "checked-out"
    else if (diffDays(anchor, checkIn) < 0) status = "checked-in"
    else if (diffDays(anchor, checkIn) === 0) status = "confirmed"
    else if (cancelRoll > 0.93) status = "pending"
    else status = "confirmed"

    const nightly = Math.round(
      (rt.baseRate * seasonFactor(checkIn) * weekdayFactor(checkIn) * (0.92 + rnd() * 0.34)) / 1000,
    ) * 1000
    const total = nightly * nights
    const paid =
      status === "checked-out" ? total : status === "pending" ? 0 : Math.round(total * (rnd() < 0.5 ? 0.3 : 1))

    bookings.push({
      id: `${propertyId}-bk-${i}`,
      propertyId,
      reference: `OCC-${String(hash(propertyId + i) % 900000 + 100000)}`,
      guestName: guest.name,
      guestCountry: guest.country,
      guestEmail: guest.email,
      roomTypeId: rt.id,
      roomNumber: "",
      channel: channel.name,
      checkIn,
      checkOut,
      nights,
      adults: 1 + Math.floor(rnd() * Math.min(3, rt.maxOccupancy)),
      children: rnd() < 0.22 ? 1 + Math.floor(rnd() * 2) : 0,
      status,
      total,
      paid,
      notes:
        rnd() < 0.15
          ? [
              "Honeymoon, requests flower bath on arrival",
              "Late arrival, flight lands 23:40",
              "Allergic to feather pillows",
              "Airport pickup booked, sign under guest name",
              "Requests high floor away from the pool",
              "Celebrating a birthday on the second night",
            ][Math.floor(rnd() * 6)]
          : undefined,
    })
  }

  bookings.sort((a, b) => a.checkIn.localeCompare(b.checkIn))

  // Allocate a physical room per booking in arrival order, reusing a room only
  // once the previous stay has checked out. Without this pass two guests can
  // show up against the same room number on the same night.
  const freeFrom = new Map<string, string>()
  const roomsByType = new Map<RoomTypeId, Room[]>()
  rooms.forEach((r) => {
    const list = roomsByType.get(r.roomTypeId) ?? []
    list.push(r)
    roomsByType.set(r.roomTypeId, list)
  })

  bookings.forEach((b) => {
    if (b.status === "cancelled") {
      b.roomNumber = "—"
      return
    }
    const pool = roomsByType.get(b.roomTypeId) ?? []
    const free = pool.find((r) => (freeFrom.get(r.id) ?? "0000-00-00") <= b.checkIn)
    // If the type is genuinely full, fall back to whichever room frees up first.
    const chosen =
      free ??
      pool.reduce((best, r) =>
        (freeFrom.get(r.id) ?? "") < (freeFrom.get(best.id) ?? "") ? r : best,
      )
    if (!chosen) return
    b.roomNumber = chosen.number
    freeFrom.set(chosen.id, b.checkOut)
  })

  return bookings
}

function buildTickets(propertyId: string, rooms: Room[], staff: StaffMember[], anchor: string): MaintenanceTicket[] {
  const rnd = mulberry32(hash(propertyId + "tickets" + anchor))
  const specs: {
    title: string
    category: MaintenanceTicket["category"]
    priority: MaintenanceTicket["priority"]
    cost: number
    desc: string
    blocks: boolean
  }[] = [
    {
      title: "Split AC not holding temperature",
      category: "HVAC",
      priority: "high",
      cost: 1_850_000,
      desc: "Unit runs but the room sits at 27°C overnight. Compressor likely low on refrigerant, guest moved to a spare villa.",
      blocks: true,
    },
    {
      title: "Pool pump tripping the breaker",
      category: "Pool & Garden",
      priority: "critical",
      cost: 6_400_000,
      desc: "Main circulation pump trips within ten minutes of starting. Pool is unfiltered, chlorine reading already drifting.",
      blocks: false,
    },
    {
      title: "Water heater delivers lukewarm water",
      category: "Plumbing",
      priority: "high",
      cost: 2_150_000,
      desc: "Heating element replaced last year, thermostat suspected. Two consecutive guest complaints logged.",
      blocks: false,
    },
    {
      title: "Terrace decking boards lifting",
      category: "Furniture",
      priority: "medium",
      cost: 3_200_000,
      desc: "Four ironwood boards near the plunge pool have cupped after the rains. Trip hazard flagged by housekeeping.",
      blocks: false,
    },
    {
      title: "Wifi access point offline",
      category: "Network",
      priority: "high",
      cost: 1_100_000,
      desc: "AP in the east wing dropped off the controller. Guests in four villas fall back to a weak signal from the lobby unit.",
      blocks: false,
    },
    {
      title: "Bathroom drain backing up",
      category: "Plumbing",
      priority: "critical",
      cost: 900_000,
      desc: "Standing water in the outdoor shower. Root intrusion suspected in the lateral line.",
      blocks: true,
    },
    {
      title: "Minibar fridge iced over",
      category: "Appliance",
      priority: "low",
      cost: 450_000,
      desc: "Door seal perished, unit frosts within two days of defrosting.",
      blocks: false,
    },
    {
      title: "Bedside reading lights flickering",
      category: "Electrical",
      priority: "medium",
      cost: 320_000,
      desc: "Both bedside circuits flicker under load. Dimmer module to be swapped.",
      blocks: false,
    },
    {
      title: "Garden irrigation valve stuck open",
      category: "Pool & Garden",
      priority: "medium",
      cost: 780_000,
      desc: "Zone three runs continuously, waterlogging the frangipani bed near the entrance path.",
      blocks: false,
    },
    {
      title: "Safe keypad unresponsive",
      category: "Appliance",
      priority: "high",
      cost: 1_250_000,
      desc: "Guest locked out of their own safe, override key used. Battery contacts corroded.",
      blocks: false,
    },
    {
      title: "Ceiling fan wobbling at high speed",
      category: "Electrical",
      priority: "low",
      cost: 260_000,
      desc: "Blade balance kit required, noise reported at night.",
      blocks: false,
    },
    {
      title: "Spa pavilion roof leak",
      category: "Furniture",
      priority: "high",
      cost: 4_700_000,
      desc: "Alang-alang thatch has thinned above the treatment bed. Water ingress during afternoon storms.",
      blocks: false,
    },
  ]

  const reporters = staff.filter((s) => s.department === "Front Office" || s.department === "Housekeeping")

  return specs.map((spec, i) => {
    // Stride through the room list so no two tickets land on the same room.
    const room = rooms[(i * 5) % rooms.length]
    const reportedOffset = -Math.floor(rnd() * 18)
    const statusRoll = rnd()
    const status: MaintenanceTicket["status"] =
      spec.priority === "critical"
        ? statusRoll < 0.6
          ? "in-progress"
          : "open"
        : statusRoll < 0.3
          ? "open"
          : statusRoll < 0.58
            ? "in-progress"
            : statusRoll < 0.74
              ? "awaiting-parts"
              : "resolved"

    return {
      id: `${propertyId}-mt-${i}`,
      propertyId,
      reference: `MNT-${1200 + i * 7}`,
      title: spec.title,
      location: i % 4 === 3 ? ["Spa pavilion", "Main pool deck", "Lobby", "Staff corridor"][i % 4] : `Room ${room.number}`,
      category: spec.category,
      priority: spec.priority,
      status,
      reportedBy: reporters[i % reporters.length]?.name ?? "Bagus Prayoga",
      reportedAt: addDays(anchor, reportedOffset),
      dueAt: addDays(anchor, spec.priority === "critical" ? 0 : spec.priority === "high" ? 2 : 6),
      estimatedCost: spec.cost,
      blocksRoom: spec.blocks,
      description: spec.desc,
    }
  })
}

function buildRatePlans(propertyId: string): RatePlan[] {
  const base: Omit<RatePlan, "id" | "propertyId">[] = [
    {
      name: "Best Flexible Rate",
      code: "BFR",
      type: "Base",
      adjustment: 0,
      adjustmentKind: "percent",
      minStay: 1,
      cancellation: "Free until 48h before arrival",
      includesBreakfast: true,
      active: true,
      channels: ["Booking.com", "Agoda", "Expedia Group", "Direct Website", "Traveloka"],
    },
    {
      name: "Non-Refundable Saver",
      code: "NRF",
      type: "Promotional",
      adjustment: -12,
      adjustmentKind: "percent",
      minStay: 2,
      cancellation: "Non-refundable",
      includesBreakfast: true,
      active: true,
      channels: ["Booking.com", "Agoda", "Traveloka", "Tiket.com"],
    },
    {
      name: "Stay 4 Pay 3",
      code: "S4P3",
      type: "Long stay",
      adjustment: -25,
      adjustmentKind: "percent",
      minStay: 4,
      cancellation: "Free until 7 days before arrival",
      includesBreakfast: true,
      active: true,
      channels: ["Direct Website", "Booking.com"],
    },
    {
      name: "Romance Escape Package",
      code: "ROM",
      type: "Package",
      adjustment: 480_000,
      adjustmentKind: "fixed",
      minStay: 2,
      cancellation: "Free until 72h before arrival",
      includesBreakfast: true,
      active: true,
      channels: ["Direct Website"],
    },
    {
      name: "Corporate Negotiated",
      code: "COR",
      type: "Corporate",
      adjustment: -18,
      adjustmentKind: "percent",
      minStay: 1,
      cancellation: "Free until 24h before arrival",
      includesBreakfast: true,
      active: true,
      channels: ["Direct Website"],
    },
    {
      name: "Early Bird 60",
      code: "EB60",
      type: "Promotional",
      adjustment: -15,
      adjustmentKind: "percent",
      minStay: 3,
      cancellation: "Free until 30 days before arrival",
      includesBreakfast: false,
      active: false,
      channels: ["Direct Website", "Airbnb"],
    },
  ]
  return base.map((r, i) => ({ ...r, id: `${propertyId}-rp-${i}`, propertyId }))
}

function buildPricingRules(propertyId: string): PricingRule[] {
  const base: Omit<PricingRule, "id" | "propertyId">[] = [
    {
      name: "High demand uplift",
      trigger: "Occupancy above 85%",
      condition: "Pickup window 0-14 days",
      adjustment: 18,
      priority: 1,
      active: true,
      appliedLast30d: 214,
      revenueImpact: 47_820_000,
      kind: "occupancy",
    },
    {
      name: "Soft window recovery",
      trigger: "Occupancy below 45%",
      condition: "Pickup window 0-7 days",
      adjustment: -12,
      priority: 2,
      active: true,
      appliedLast30d: 96,
      revenueImpact: 12_640_000,
      kind: "occupancy",
    },
    {
      name: "Last minute premium",
      trigger: "Lead time under 3 days",
      condition: "Only when occupancy above 70%",
      adjustment: 9,
      priority: 3,
      active: true,
      appliedLast30d: 58,
      revenueImpact: 8_310_000,
      kind: "lead-time",
    },
    {
      name: "Weekend positioning",
      trigger: "Friday and Saturday arrivals",
      condition: "All room types",
      adjustment: 14,
      priority: 4,
      active: true,
      appliedLast30d: 176,
      revenueImpact: 31_450_000,
      kind: "day-of-week",
    },
    {
      name: "Peak season floor lift",
      trigger: "July, August and late December",
      condition: "Raises the rate floor, not the ceiling",
      adjustment: 22,
      priority: 5,
      active: true,
      appliedLast30d: 0,
      revenueImpact: 0,
      kind: "season",
    },
    {
      name: "Competitor parity guard",
      trigger: "Comp set median moves over 8%",
      condition: "Match within 4% of the median",
      adjustment: -6,
      priority: 6,
      active: true,
      appliedLast30d: 41,
      revenueImpact: -3_180_000,
      kind: "competitor",
    },
    {
      name: "Long stay discount",
      trigger: "Length of stay 7 nights or more",
      condition: "Excludes Signature Villa",
      adjustment: -10,
      priority: 7,
      active: false,
      appliedLast30d: 0,
      revenueImpact: 0,
      kind: "length-of-stay",
    },
  ]
  return base.map((r, i) => ({ ...r, id: `${propertyId}-pr-${i}`, propertyId }))
}

function buildInventory(propertyId: string, roomTypes: RoomType[], anchor: string, days = 60): InventoryDay[] {
  const out: InventoryDay[] = []
  roomTypes.forEach((rt) => {
    const rnd = mulberry32(hash(propertyId + rt.id + anchor))
    for (let d = 0; d < days; d++) {
      const date = addDays(anchor, d)
      const season = seasonFactor(date)
      const weekday = weekdayFactor(date)
      const holiday = holidayFor(date)
      const decay = 1 - Math.min(0.45, d * 0.008)
      const rawOcc = Math.min(1, 0.42 * season * weekday * (0.78 + rnd() * 0.5) + decay * 0.24)
      const sold = Math.min(rt.count, Math.round(rt.count * rawOcc))
      const rate =
        Math.round((rt.baseRate * season * weekday * (holiday ? 1.28 : 1) * (0.95 + rnd() * 0.2)) / 5000) * 5000
      const pressure = sold / rt.count
      const suggested =
        Math.round(
          (rate * (pressure > 0.85 ? 1.18 : pressure < 0.45 ? 0.88 : 1 + (pressure - 0.65) * 0.22)) / 5000,
        ) * 5000
      out.push({
        date,
        roomTypeId: rt.id,
        available: rt.count - sold,
        sold,
        rate,
        suggestedRate: Math.max(rt.floorRate, Math.min(rt.ceilingRate, suggested)),
        closed: rnd() < 0.02,
        minStay: holiday ? 3 : dayOfWeek(date) === 5 ? 2 : 1,
        event: holiday,
      })
    }
  })
  return out
}

function buildMetrics(propertyId: string, roomTypes: RoomType[], anchor: string, days = 90): DailyMetric[] {
  const rnd = mulberry32(hash(propertyId + "metrics" + anchor))
  const units = roomTypes.reduce((s, r) => s + r.count, 0)
  const weightedBase = roomTypes.reduce((s, r) => s + r.baseRate * r.count, 0) / units
  const out: DailyMetric[] = []

  for (let d = days - 1; d >= 0; d--) {
    const date = addDays(anchor, -d)
    const season = seasonFactor(date)
    const weekday = weekdayFactor(date)
    // Gentle upward trend over the window, plus noise.
    const trend = 1 + (days - d) / days * 0.11
    const occupancy = Math.min(0.98, 0.52 * season * weekday * trend * (0.9 + rnd() * 0.22))
    const adr = Math.round((weightedBase * season * weekday * (0.94 + rnd() * 0.18)) / 1000) * 1000
    const soldUnits = Math.round(units * occupancy)
    const revenue = soldUnits * adr
    out.push({
      date,
      occupancy: Number((occupancy * 100).toFixed(1)),
      adr,
      revpar: Math.round(revenue / units),
      revenue,
      bookings: Math.round(soldUnits * (0.42 + rnd() * 0.3)),
      cancellations: Math.round(rnd() * 4),
    })
  }
  return out
}

/* ------------------------------- assembly --------------------------------- */

const cache = new Map<string, PropertySnapshot>()

export function getSnapshot(
  propertyId: string,
  anchor: string,
  pool: Property[] = PROPERTIES,
): PropertySnapshot {
  const key = `${propertyId}:${anchor}`
  const hit = cache.get(key)
  if (hit) return hit

  const property = pool.find((p) => p.id === propertyId) ?? getProperty(propertyId)
  const roomTypes = buildRoomTypes(property)
  const inventory = buildInventory(property.id, roomTypes, anchor)
  const soldToday = new Map<RoomTypeId, number>(
    inventory.filter((i) => i.date === anchor).map((i) => [i.roomTypeId, i.sold]),
  )
  const rooms = buildRooms(property, roomTypes, anchor, soldToday)
  const channels = buildChannels(property.id, roomTypes, anchor)
  const bookings = buildBookings(property.id, roomTypes, rooms, channels, anchor)
  const staff = STAFF_SEEDS.map((s, i) => ({
    ...s,
    id: `${property.id}-st-${i}`,
    propertyId: property.id,
    email: s.email.replace("amertaubud.co.id", property.contact.website),
    lastActive: s.active ? `${addDays(anchor, -Math.floor(i / 3))}T${String(7 + i).padStart(2, "0")}:20:00+08:00` : `${addDays(anchor, -23)}T18:05:00+08:00`,
  }))
  const tickets = buildTickets(property.id, rooms, staff, anchor)
  const ratePlans = buildRatePlans(property.id)
  const pricingRules = buildPricingRules(property.id)
  const metrics = buildMetrics(property.id, roomTypes, anchor)

  const last30 = metrics.slice(-30)
  const prev30 = metrics.slice(-60, -30)
  const avg = (arr: DailyMetric[], pick: (m: DailyMetric) => number) =>
    arr.reduce((s, m) => s + pick(m), 0) / Math.max(1, arr.length)
  const sum = (arr: DailyMetric[], pick: (m: DailyMetric) => number) => arr.reduce((s, m) => s + pick(m), 0)
  const delta = (now: number, before: number) => (before === 0 ? 0 : Number((((now - before) / before) * 100).toFixed(1)))

  const occ = avg(last30, (m) => m.occupancy)
  const adr = avg(last30, (m) => m.adr)
  const revpar = avg(last30, (m) => m.revpar)
  const revenue = sum(last30, (m) => m.revenue)
  const directShare =
    (channels.find((c) => c.kind === "Direct")?.bookings30d ?? 0) /
    Math.max(1, channels.reduce((s, c) => s + c.bookings30d, 0))

  const snapshot: PropertySnapshot = {
    property,
    roomTypes,
    rooms,
    channels,
    bookings,
    tickets,
    staff,
    ratePlans,
    pricingRules,
    inventory,
    metrics,
    kpi: {
      occupancy: Number(occ.toFixed(1)),
      occupancyDelta: delta(occ, avg(prev30, (m) => m.occupancy)),
      adr: Math.round(adr),
      adrDelta: delta(adr, avg(prev30, (m) => m.adr)),
      revpar: Math.round(revpar),
      revparDelta: delta(revpar, avg(prev30, (m) => m.revpar)),
      revenue30d: revenue,
      revenueDelta: delta(revenue, sum(prev30, (m) => m.revenue)),
      arrivalsToday: bookings.filter((b) => b.checkIn === anchor && b.status !== "cancelled").length,
      departuresToday: bookings.filter((b) => b.checkOut === anchor && b.status !== "cancelled").length,
      inHouse: rooms.filter((r) => r.status === "occupied" || r.status === "departing").length,
      outOfOrder: rooms.filter((r) => r.status === "out-of-order").length,
      openTickets: tickets.filter((t) => t.status !== "resolved").length,
      alos: Number(
        (
          bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.nights, 0) /
          Math.max(1, bookings.filter((b) => b.status !== "cancelled").length)
        ).toFixed(1),
      ),
      directShare: Number((directShare * 100).toFixed(1)),
      cancellationRate: Number(
        ((bookings.filter((b) => b.status === "cancelled").length / bookings.length) * 100).toFixed(1),
      ),
    },
  }

  cache.set(key, snapshot)
  return snapshot
}

/** Anchor date for the whole demo. Server-computed so figures look live. */
export function today(): string {
  return toISO(new Date())
}
