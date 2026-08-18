"use client"

import Link from "next/link"
import { BellIcon, ChevronDownIcon, KeyRoundIcon, LogOutIcon, UserRoundIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import type { StaffMember } from "@/lib/types"

export function NavUser({ user }: { user: StaffMember }) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-auto gap-3 rounded-xl border border-sidebar-border bg-card p-3 hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:p-0"
              />
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tile-orange text-tile-orange-fg">
              <UserRoundIcon className="size-[1.05rem]" strokeWidth={1.9} />
            </span>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.role}</span>
            </div>
            <ChevronDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-60"
            side={isMobile ? "bottom" : "top"}
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-1 py-1.5 text-left">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tile-orange text-tile-orange-fg">
                  <UserRoundIcon className="size-[1.05rem]" strokeWidth={1.9} />
                </span>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <UserRoundIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings?tab=team" />}>
              <KeyRoundIcon />
              Roles &amp; access
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings?tab=notifications" />}>
              <BellIcon />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
