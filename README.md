<p align="center">
  <img src="public/logo-mark.png" alt="Occuply" width="88" height="88">
</p>

<h1 align="center">Occuply</h1>
<p align="center"><strong>Property Management System</strong><br>Manage Better. Grow Faster.</p>

<p align="center">
  <a href="https://occuply-pms.vercel.app">Live app</a>
</p>

---

Occuply is an all-in-one property management system for villas, boutique hotels and
serviced residences. It covers the operational day end to end: what happened, what
arrives tonight, which rooms are sellable, what they cost, where they are distributed,
what is broken, and what the pricing engine wants to change.

## Screens

| Screen | Route | What it does |
| --- | --- | --- |
| Property change | `/properties` | Portfolio overview and the switcher every other screen follows |
| Dashboard | `/` | Occupancy, ADR, RevPAR, revenue, tonight's movements, channel mix, urgent tickets |
| Calendar | `/calendar` | Fourteen-night availability and rate grid, arrivals list, stay restrictions |
| Rooms | `/rooms` | Live room status board, housekeeping state, room type inventory |
| Rates | `/rates` | Rate plans with derived pricing, seven-night rate grid, parity checks |
| Channel setup | `/channels` | Connection health, room type mapping, commission and revenue per channel |
| Maintenance | `/maintenance` | Ticket board by status, workload per technician, category breakdown |
| Dynamic pricing | `/pricing` | Rule engine, recommended rate changes, floor and ceiling guardrails |
| User & settings | `/settings` | Profile, team and access, property configuration, notifications |

The active property is stored in a cookie, so every server-rendered page reads the
same selection. Switching properties in the sidebar refreshes the whole app.

## Stack

- **Next.js 16** (App Router, React Server Components, Turbopack)
- **React 19** and **TypeScript** in strict mode
- **Tailwind CSS v4** with OKLCH design tokens
- **shadcn/ui** on Base UI primitives, starting from the `dashboard-01` block
- **Recharts** for the revenue and occupancy chart
- **lucide-react** for iconography, at the 2px rounded stroke the brand specifies
- **next-themes** for the light and dark palettes

## Design

The interface follows the Occuply brand guidelines:

| Token | Value |
| --- | --- |
| Primary Orange | `#FF7A00` |
| Deep Charcoal | `#171717` |
| White | `#FFFFFF` |
| Soft Gray | `#F5F5F3` |
| Slate | `#686868` |

Typography is Montserrat for the interface and Poppins for figures. Orange is held
to roughly a tenth of the surface, matching the ratio in the guidelines, so it still
reads as a signal when it appears on a status or a recommendation. Neutrals are
tinted toward the brand hue rather than left pure grey, and no colour is pure black
or pure white.

The layout is deliberately dense: metrics sit on a divided strip rather than in a
grid of identical cards, and sections are framed with a single hairline instead of
stacked elevation.

## Data

The app ships with a complete, ready-to-use sample property:

**Amerta Ubud Villas & Suites** — 24 units across five room types, 96 reservations
spanning forty days back and fifty-five forward, eight distribution channels, eleven
staff accounts, six rate plans, seven pricing rules, twelve maintenance tickets, and
sixty nights of inventory and ninety days of performance history.

Two further properties (Cendana Canggu Lofts, Bhuvana Nusa Dua Residence) make the
property switcher meaningful.

Everything is generated deterministically from a fixed seed in
[`src/lib/seed.ts`](src/lib/seed.ts), anchored to the current date, so the figures
look live but never differ between the server render and the browser. There is no
database and no environment variable to set. The data layer is framework-free and
typed in [`src/lib/types.ts`](src/lib/types.ts), so swapping the seed for a real
database is a single-module change.

## Running locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Project layout

```
src/
  app/
    (app)/            sidebar shell and every page
    layout.tsx        fonts, metadata, theme provider
    globals.css       design tokens
  components/
    occuply/          app-specific components
    ui/               shadcn/ui primitives
  lib/
    seed.ts           deterministic sample data
    types.ts          domain model
    format.ts         rupiah, dates, percentages
    suggestions.ts    pricing recommendation logic
```
