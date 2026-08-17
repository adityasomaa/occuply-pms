import * as React from "react"
import { BellIcon, SearchIcon } from "lucide-react"

import { ThemeToggle } from "@/components/occuply/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { fullDate } from "@/lib/format"

export function SiteHeader({
  title,
  subtitle,
  today,
  alerts = 0,
  children,
}: {
  title: string
  subtitle?: string
  today: string
  alerts?: number
  children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 flex shrink-0 flex-col border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-2 px-3 lg:px-5">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1.5 h-4 data-vertical:self-auto" />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="mr-1 hidden text-xs text-muted-foreground xl:inline">{fullDate(today)}</span>

          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-2 px-2.5 text-muted-foreground md:flex"
          >
            <SearchIcon className="size-3.5" />
            <span className="text-xs">Search</span>
            <kbd className="ml-1 rounded border border-border bg-muted px-1 py-px text-[0.625rem] font-medium">
              ⌘K
            </kbd>
          </Button>

          <Button variant="ghost" size="icon" className="relative size-8" aria-label={`Alerts, ${alerts} unread`}>
            <BellIcon className="size-4" />
            {alerts > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent ring-2 ring-background" />
            ) : null}
          </Button>

          <ThemeToggle />

          {children ? (
            <>
              <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto" />
              {children}
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
