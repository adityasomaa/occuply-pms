const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const idrCompactUnits: [number, string][] = [
  [1_000_000_000, "M"],
  [1_000_000, "jt"],
  [1_000, "rb"],
]

/** Full rupiah, e.g. Rp2.847.000 */
export function money(value: number): string {
  return idr.format(Math.round(value))
}

/** Short rupiah for tight cells and axis ticks, e.g. Rp2,8jt */
export function moneyShort(value: number): string {
  const abs = Math.abs(value)
  // The minus sign belongs outside the currency symbol, not inside it.
  const sign = value < 0 ? "-" : ""
  for (const [step, suffix] of idrCompactUnits) {
    if (abs >= step) {
      const scaled = abs / step
      const digits = scaled >= 100 ? 0 : 1
      return `${sign}Rp${scaled.toFixed(digits).replace(".", ",")}${suffix}`
    }
  }
  return `${sign}Rp${Math.round(abs)}`
}

/** Axis ticks want the shortest readable form: "30jt", "1,2M". */
export function moneyAxis(value: number): string {
  const abs = Math.abs(value)
  if (abs === 0) return "0"
  const sign = value < 0 ? "-" : ""
  for (const [step, suffix] of idrCompactUnits) {
    if (abs >= step) {
      const scaled = abs / step
      const digits = scaled >= 10 ? 0 : 1
      return `${sign}${scaled.toFixed(digits).replace(".", ",")}${suffix}`
    }
  }
  return `${sign}${Math.round(abs)}`
}

export function percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function signedPercent(value: number, digits = 1): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`
}

export function number(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value)
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const dayFullFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" })
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })

function asUTC(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function shortDate(iso: string): string {
  return dayFmt.format(asUTC(iso))
}

export function fullDate(iso: string): string {
  return dayFullFmt.format(asUTC(iso))
}

export function weekday(iso: string): string {
  return weekdayFmt.format(asUTC(iso))
}

export function monthLabel(iso: string): string {
  return monthFmt.format(asUTC(iso))
}

export function dayNumber(iso: string): string {
  return String(asUTC(iso).getUTCDate())
}

export function isWeekend(iso: string): boolean {
  const d = asUTC(iso).getUTCDay()
  return d === 0 || d === 6
}

/** "in 3 days" / "2 days ago" / "today" */
export function relativeDays(fromISO: string, toISOStr: string): string {
  const diff = Math.round((asUTC(toISOStr).getTime() - asUTC(fromISO).getTime()) / 86400000)
  if (diff === 0) return "today"
  if (diff === 1) return "tomorrow"
  if (diff === -1) return "yesterday"
  return diff > 0 ? `in ${diff} days` : `${Math.abs(diff)} days ago`
}

export function timeOfDay(isoStamp: string): string {
  const t = isoStamp.split("T")[1]
  return t ? t.slice(0, 5) : ""
}

/** Balinese names carry a leading birth-order or gender marker ("Ni", "I",
 *  "Ida"). Greeting someone as "Ni" would be wrong, so skip it and use the
 *  first real given name. */
const NAME_MARKERS = new Set(["ni", "i", "ida", "anak", "agung", "gusti"])

export function greetingName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts.find((p) => !NAME_MARKERS.has(p.toLowerCase()))
  return first ?? parts[0] ?? name
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

const FLAGS: Record<string, string> = {
  NL: "Netherlands", PT: "Portugal", JP: "Japan", IE: "Ireland", BR: "Brazil",
  DE: "Germany", TH: "Thailand", NO: "Norway", PL: "Poland", FR: "France",
  NG: "Nigeria", IN: "India", AT: "Austria", SG: "Singapore", ES: "Spain",
  AU: "Australia", ID: "Indonesia", AR: "Argentina", SE: "Sweden", FI: "Finland",
}

export function countryName(code: string): string {
  return FLAGS[code] ?? code
}
