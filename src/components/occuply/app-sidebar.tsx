"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BedDoubleIcon,
  CalendarRangeIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  PlugZapIcon,
  SlidersHorizontalIcon,
  TagsIcon,
  UsersRoundIcon,
  WrenchIcon,
} from "lucide-react"

import { LogoLockup, LogoMark } from "@/components/occuply/logo"
import { PropertySwitcher } from "@/components/occuply/property-switcher"
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import type { Property, StaffMember } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface SidebarCounts {
  arrivals: number
  outOfOrder: number
  channelErrors: number
  openTickets: number
  pricingSuggestions: number
}

/** Order mirrors the operational day: see the numbers, then the calendar,
 *  then the rooms, then what you can change about them. */
function navItems(counts: SidebarCounts) {
  return [
    { title: "Dashboard", url: "/", icon: LayoutDashboardIcon, badge: 0, tone: "neutral" as const },
    { title: "Calendar", url: "/calendar", icon: CalendarRangeIcon, badge: counts.arrivals, tone: "neutral" as const },
    { title: "Rooms", url: "/rooms", icon: BedDoubleIcon, badge: counts.outOfOrder, tone: "warn" as const },
    { title: "Rates", url: "/rates", icon: TagsIcon, badge: 0, tone: "neutral" as const },
    { title: "Channel setup", url: "/channels", icon: PlugZapIcon, badge: counts.channelErrors, tone: "risk" as const },
    { title: "Maintenance", url: "/maintenance", icon: WrenchIcon, badge: counts.openTickets, tone: "warn" as const },
    {
      title: "Dynamic pricing",
      url: "/pricing",
      icon: SlidersHorizontalIcon,
      badge: counts.pricingSuggestions,
      tone: "accent" as const,
    },
  ]
}

const badgeTone = {
  neutral: "bg-muted text-muted-foreground",
  warn: "bg-status-warn/15 text-status-warn",
  risk: "bg-destructive/12 text-destructive",
  accent: "bg-accent-soft text-accent-brand",
}

export function AppSidebar({
  properties,
  activePropertyId,
  user,
  counts,
  ...props
}: {
  properties: Property[]
  activePropertyId: string
  user: StaffMember
  counts: SidebarCounts
} & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const items = navItems(counts)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-3">
        <div className="flex h-8 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link href="/" aria-label="Occuply home" className="flex items-center">
            <LogoLockup priority className="group-data-[collapsible=icon]:hidden" />
            <LogoMark size={28} className="hidden group-data-[collapsible=icon]:block" />
          </Link>
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
          <PropertySwitcher properties={properties} activeId={activePropertyId} />
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent className="scroll-slim">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={active}
                      className={cn(
                        "ease-occuply transition-colors duration-200",
                        active &&
                          "bg-accent-soft font-semibold text-foreground data-[active=true]:bg-accent-soft",
                      )}
                      render={<Link href={item.url} />}
                    >
                      <Icon
                        strokeWidth={2}
                        className={cn(active ? "text-accent-brand" : "text-muted-foreground")}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge > 0 ? (
                      <SidebarMenuBadge
                        className={cn(
                          "pointer-events-none rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums",
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="User & settings"
                  isActive={pathname.startsWith("/settings")}
                  className={cn(
                    "ease-occuply transition-colors duration-200",
                    pathname.startsWith("/settings") &&
                      "bg-accent-soft font-semibold text-foreground data-[active=true]:bg-accent-soft",
                  )}
                  render={<Link href="/settings" />}
                >
                  <UsersRoundIcon
                    strokeWidth={2}
                    className={cn(
                      pathname.startsWith("/settings") ? "text-accent-brand" : "text-muted-foreground",
                    )}
                  />
                  <span>User &amp; settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Support"
                  className="text-muted-foreground"
                  render={<a href="mailto:support@occuply.app" />}
                >
                  <LifeBuoyIcon strokeWidth={2} />
                  <span>Support</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
