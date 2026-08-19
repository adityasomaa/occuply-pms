/** Booking-source colours. Each OTA keeps its own brand colour so a glance at
 *  the calendar tells you where the business came from. Direct bookings use
 *  Occuply orange, because those are the ones the property owns. */
export interface ChannelStyle {
  bg: string
  fg: string
  short: string
}

const STYLES: Record<string, ChannelStyle> = {
  "Booking.com": { bg: "#003580", fg: "#FFFFFF", short: "BDC" },
  Airbnb: { bg: "#FF5A5F", fg: "#FFFFFF", short: "ABB" },
  Agoda: { bg: "#5B2C87", fg: "#FFFFFF", short: "AGD" },
  "Expedia Group": { bg: "#FDB714", fg: "#1B1B1B", short: "EXP" },
  Traveloka: { bg: "#1BA0E2", fg: "#FFFFFF", short: "TVL" },
  "Tiket.com": { bg: "#0064D2", fg: "#FFFFFF", short: "TKT" },
  "Google Hotel Ads": { bg: "#4285F4", fg: "#FFFFFF", short: "GHA" },
  "Direct Website": { bg: "#FF7A00", fg: "#1B1B1B", short: "DIR" },
}

const FALLBACK: ChannelStyle = { bg: "#686868", fg: "#FFFFFF", short: "OTH" }

export function channelStyle(name: string): ChannelStyle {
  return STYLES[name] ?? FALLBACK
}

export function channelNames(): string[] {
  return Object.keys(STYLES)
}
