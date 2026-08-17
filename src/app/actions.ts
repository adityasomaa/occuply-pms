"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { PROPERTY_COOKIE } from "@/lib/constants"
import { PROPERTIES } from "@/lib/seed"

/** Persist the active property server-side, then invalidate every route so the
 *  whole app re-renders against the new selection in one pass. */
export async function switchProperty(id: string): Promise<void> {
  if (!PROPERTIES.some((p) => p.id === id)) return

  const store = await cookies()
  store.set(PROPERTY_COOKIE, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
}
