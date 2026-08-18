"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BedDoubleIcon,
  Building2Icon,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  Share2Icon,
  TagIcon,
  TrendingUpIcon,
  WrenchIcon,
} from "lucide-react"

import { LogoLockup, LogoMark } from "@/components/occuply/logo"
import { NavUser } from "@/components/occuply/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { StaffMember } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface SidebarCounts {
  arrivals: number
  outOfOrder: number
  channelErrors: number
  openTickets: number
  pricingSuggestions: number
}

/** Order follows the brief: pick the property first, then read the day, then
 *  act on it. `/properties` is the property-change screen. */
function navItems(counts: SidebarCounts) {
  return [
    { title: "Properties", url: "/properties", icon: Building2Icon, badge: 0, tone: "neutral" as const },
    { title: "Dashboard", url: "/", icon: LayoutDashboardIcon, badge: 0, tone: "neutral" as const },
    { title: "Calendar", url: "/calendar", icon: CalendarDaysIcon, badge: counts.arrivals, tone: "neutral" as const },
    { title: "Rooms", url: "/rooms", icon: BedDoubleIcon, badge: counts.outOfOrder, tone: "warn" as const },
    { title: "Rates", url: "/rates", icon: TagIcon, badge: 0, tone: "neutral" as const },
    { title: "Channel setup", url: "/channels", icon: Share2Icon, badge: counts.channelErrors, tone: "risk" as const },
    { title: "Maintenance", url: "/maintenance", icon: WrenchIcon, badge: counts.openTickets, tone: "warn" as const },
    {
      title: "Dynamic pricing",
      url: "/pricing",
      icon: TrendingUpIcon,
      badge: counts.pricingSuggestions,
      tone: "accent" as const,
    },
    { title: "User & settings", url: "/settings", icon: SettingsIcon, badge: 0, tone: "neutral" as const },
  ]
}

const badgeTone = {
  neutral: "bg-muted text-muted-foreground",
  warn: "bg-status-warn/15 text-status-warn",
  risk: "bg-destructive/12 text-destructive",
  accent: "bg-accent-soft text-tile-orange-fg",
}

export function AppSidebar({
  user,
  counts,
  ...props
}: {
  user: StaffMember
  counts: SidebarCounts
} & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const items = navItems(counts)

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border" {...props}>
      <SidebarHeader className="px-5 pb-2 pt-6 group-data-[collapsible=icon]:px-2">
        <Link href="/" aria-label="Occuply home" className="flex items-center">
          <LogoLockup priority className="h-9 group-data-[collapsible=icon]:hidden" size="lg" />
          <LogoMark size={32} className="hidden group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="scroll-slim px-3 pt-4 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={active}
                      className={cn(
                        "ease-occuply h-11 gap-3 rounded-xl px-3.5 text-[0.9375rem] transition-colors duration-200",
                        "hover:bg-sidebar-accent",
                        active
                          ? "bg-accent-soft font-semibold! text-foreground"
                          : "font-medium text-muted-foreground",
                      )}
                      render={<Link href={item.url} />}
                    >
                      <Icon
                        strokeWidth={1.9}
                        className={cn(
                          "size-[1.15rem]!",
                          active ? "text-accent-brand" : "text-muted-foreground",
                        )}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge > 0 ? (
                      <SidebarMenuBadge
                        className={cn(
                          "pointer-events-none top-1/2 -translate-y-1/2 rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums",
                          badgeTone[item.tone],
                        )}
                      >
                        {item.badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
