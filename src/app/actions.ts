"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { CUSTOM_PROPERTY_COOKIE, PROPERTY_COOKIE } from "@/lib/constants"
import { PROPERTIES } from "@/lib/seed"
import { allProperties, type CustomPropertyInput } from "@/lib/property-cookie"
import type { Property } from "@/lib/types"

const YEAR = 60 * 60 * 24 * 365

/** Persist the active property server-side, then invalidate every route so the
 *  whole app re-renders against the new selection in one pass. */
export async function switchProperty(id: string): Promise<void> {
  const pool = await allProperties()
  if (!pool.some((p) => p.id === id)) return

  const store = await cookies()
  store.set(PROPERTY_COOKIE, id, { path: "/", maxAge: YEAR, sameSite: "lax" })
  revalidatePath("/", "layout")
}

export interface AddPropertyResult {
  ok: boolean
  error?: string
  id?: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

/** Creates a property and switches to it. Stored in a cookie rather than a
 *  database, which is all this build needs, and keeps it per-browser. */
export async function addProperty(form: {
  name: string
  city: string
  type: Property["type"]
  totalUnits: number
  starRating: number
}): Promise<AddPropertyResult> {
  const name = form.name.trim()
  const city = form.city.trim()

  if (name.length < 3) return { ok: false, error: "Give the property a name of at least three characters." }
  if (!city) return { ok: false, error: "Which city is it in?" }
  if (!Number.isFinite(form.totalUnits) || form.totalUnits < 1 || form.totalUnits > 400) {
    return { ok: false, error: "Unit count must be between 1 and 400." }
  }

  const store = await cookies()
  const raw = store.get(CUSTOM_PROPERTY_COOKIE)?.value
  let existing: CustomPropertyInput[] = []
  try {
    existing = raw ? (JSON.parse(decodeURIComponent(raw)) as CustomPropertyInput[]) : []
  } catch {
    existing = []
  }

  let id = slugify(name)
  if (!id) return { ok: false, error: "That name cannot be turned into an address." }
  if (PROPERTIES.some((p) => p.id === id) || existing.some((p) => p.id === id)) {
    id = `${id}-${existing.length + 1}`
  }

  const next: CustomPropertyInput[] = [
    ...existing,
    {
      id,
      name,
      city,
      type: form.type,
      totalUnits: Math.round(form.totalUnits),
      starRating: Math.min(5, Math.max(1, Math.round(form.starRating))),
    },
  ]

  const encoded = encodeURIComponent(JSON.stringify(next))
  // Cookies cap out around 4KB; refuse rather than silently dropping entries.
  if (encoded.length > 3500) {
    return { ok: false, error: "No room left for more properties in this browser." }
  }

  store.set(CUSTOM_PROPERTY_COOKIE, encoded, { path: "/", maxAge: YEAR, sameSite: "lax" })
  store.set(PROPERTY_COOKIE, id, { path: "/", maxAge: YEAR, sameSite: "lax" })
  revalidatePath("/", "layout")
  return { ok: true, id }
}

export async function removeProperty(id: string): Promise<void> {
  const store = await cookies()
  const raw = store.get(CUSTOM_PROPERTY_COOKIE)?.value
  if (!raw) return
  try {
    const existing = JSON.parse(decodeURIComponent(raw)) as CustomPropertyInput[]
    const next = existing.filter((p) => p.id !== id)
    store.set(CUSTOM_PROPERTY_COOKIE, encodeURIComponent(JSON.stringify(next)), {
      path: "/",
      maxAge: YEAR,
      sameSite: "lax",
    })
    if (store.get(PROPERTY_COOKIE)?.value === id) {
      store.set(PROPERTY_COOKIE, PROPERTIES[0].id, { path: "/", maxAge: YEAR, sameSite: "lax" })
    }
    revalidatePath("/", "layout")
  } catch {
    /* nothing to remove */
  }
}
