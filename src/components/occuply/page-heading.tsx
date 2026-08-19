import * as React from "react"

import { GlobalSearch } from "@/components/occuply/global-search"
import { NotificationBell } from "@/components/occuply/notification-bell"
import { ThemeToggle } from "@/components/occuply/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"

/** The page title block. It sits inside the content column rather than in a
 *  bar of its own, so the whole screen reads as one open surface. */
export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode
  subtitle?: string
  /** Accepted for call-site symmetry; the bell derives its own count. */
  alerts?: number
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <SidebarTrigger className="-ml-1 mt-0.5 size-9 shrink-0 md:hidden" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-tight tracking-tight sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:truncate sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {children}
        <GlobalSearch />
        <ThemeToggle />
        <NotificationBell />
      </div>
    </div>
  )
}
