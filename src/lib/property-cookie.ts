import "server-only"
import { cookies } from "next/headers"

import { CUSTOM_PROPERTY_COOKIE, PROPERTY_COOKIE } from "./constants"
import { DEFAULT_PROPERTY_ID, PROPERTIES } from "./seed"
import type { Property } from "./types"

export { PROPERTY_COOKIE }

/** Only the fields a person actually types are persisted; everything else is
 *  filled in with sensible defaults so the cookie stays small. */
export interface CustomPropertyInput {
  id: string
  name: string
  city: string
  type: Property["type"]
  totalUnits: number
  starRating: number
}

export function expandProperty(input: CustomPropertyInput): Property {
  const slug = input.id
  return {
    id: slug,
    name: input.name,
    shortName: input.name.split(/\s+/).slice(0, 2).join(" "),
    type: input.type,
    city: input.city,
    region: "Bali",
    country: "Indonesia",
    address: `${input.city}, Indonesia`,
    timezone: "Asia/Makassar",
    currency: "IDR",
    checkIn: "14:00",
    checkOut: "12:00",
    starRating: input.starRating,
    totalUnits: input.totalUnits,
    openedYear: new Date().getUTCFullYear(),
    featured: false,
    accent: "#FF7A00",
    description: `${input.totalUnits} units in ${input.city}. Added from inside Occuply, with a starter room plan you can edit.`,
    amenities: ["Wifi", "Housekeeping", "Front desk"],
    contact: {
      phone: "+62 000 0000 000",
      email: `reservations@${slug}.id`,
      website: `${slug}.id`,
    },
  }
}

export async function customProperties(): Promise<Property[]> {
  const store = await cookies()
  const raw = store.get(CUSTOM_PROPERTY_COOKIE)?.value
  if (!raw) return []
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as CustomPropertyInput[]
    return Array.isArray(parsed) ? parsed.map(expandProperty) : []
  } catch {
    return []
  }
}

/** Seeded properties plus anything added from the app. */
export async function allProperties(): Promise<Property[]> {
  return [...PROPERTIES, ...(await customProperties())]
}

/** Reads the active property from the request cookie so every server page
 *  renders the same property the switcher last selected. */
export async function activePropertyId(): Promise<string> {
  const store = await cookies()
  const value = store.get(PROPERTY_COOKIE)?.value
  const pool = await allProperties()
  return pool.some((p) => p.id === value) ? (value as string) : DEFAULT_PROPERTY_ID
}
