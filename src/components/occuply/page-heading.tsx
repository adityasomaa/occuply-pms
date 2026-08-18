import * as React from "react"
import { BellIcon, SearchIcon } from "lucide-react"

import { ThemeToggle } from "@/components/occuply/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"

/** The page title block. It sits inside the content column rather than in a
 *  bar of its own, so the whole screen reads as one open surface. */
export function PageHeading({
  title,
  subtitle,
  alerts = 0,
  children,
}: {
  title: React.ReactNode
  subtitle?: string
  alerts?: number
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-2">
        <SidebarTrigger className="-ml-1 mt-1 size-8 md:hidden" />
        <div className="min-w-0">
          <h1 className="truncate text-[1.75rem] font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {children}

        <label className="relative hidden sm:block">
          <span className="sr-only">Search</span>
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.9}
          />
          <input
            type="search"
            placeholder="Search anything..."
            className="ease-occuply h-11 w-56 rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-accent/45 focus:ring-3 focus:ring-accent-ring lg:w-80"
          />
        </label>

        <ThemeToggle />

        <button
          type="button"
          aria-label={alerts > 0 ? `Notifications, ${alerts} unread` : "Notifications"}
          className="ease-occuply relative flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BellIcon className="size-[1.15rem]" strokeWidth={1.9} />
          {alerts > 0 ? (
            <span className="num absolute right-1 top-1 flex size-[1.1rem] items-center justify-center rounded-full bg-accent text-[0.625rem] font-bold text-accent-foreground ring-2 ring-background">
              {alerts > 9 ? "9+" : alerts}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  )
}
