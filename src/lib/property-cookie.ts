import "server-only"
import { cookies } from "next/headers"

import { PROPERTY_COOKIE } from "./constants"
import { DEFAULT_PROPERTY_ID, PROPERTIES } from "./seed"

export { PROPERTY_COOKIE }

/** Reads the active property from the request cookie so every server page
 *  renders the same property the switcher last selected. */
export async function activePropertyId(): Promise<string> {
  const store = await cookies()
  const value = store.get(PROPERTY_COOKIE)?.value
  return PROPERTIES.some((p) => p.id === value) ? (value as string) : DEFAULT_PROPERTY_ID
}
