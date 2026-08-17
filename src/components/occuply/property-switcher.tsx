"use client"

import * as React from "react"
import Link from "next/link"
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon, SettingsIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import type { Property } from "@/lib/types"
import { switchProperty } from "@/app/actions"
import { cn } from "@/lib/utils"

export function PropertySwitcher({
  properties,
  activeId,
}: {
  properties: Property[]
  activeId: string
}) {
  const { isMobile } = useSidebar()
  const [isPending, startTransition] = React.useTransition()
  const [target, setTarget] = React.useState<string | null>(null)
  const active = properties.find((p) => p.id === activeId) ?? properties[0]

  function switchTo(id: string) {
    if (id === activeId) return
    setTarget(id)
    startTransition(() => {
      void switchProperty(id)
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-auto gap-3 border border-border bg-card py-2.5 aria-expanded:border-accent/40 aria-expanded:bg-accent-soft"
              />
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-brand">
              <BuildingIcon className="size-[18px]" strokeWidth={2} />
            </span>
            <span className="grid flex-1 gap-0.5 text-left leading-tight">
              <span className="label-brand text-[0.625rem] text-accent-brand">Property</span>
              <span className="truncate text-sm font-semibold">{active.shortName}</span>
            </span>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-72"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={6}
          >
            <DropdownMenuLabel className="label-brand px-2 py-1.5">Switch property</DropdownMenuLabel>
            {properties.map((p) => {
              const selected = p.id === activeId
              return (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => switchTo(p.id)}
                  className={cn("gap-3 py-2", isPending && target === p.id && "opacity-60")}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md border text-[0.6875rem] font-semibold",
                      selected
                        ? "border-accent/40 bg-accent-soft text-accent-brand"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {p.totalUnits}
                  </span>
                  <span className="grid flex-1 gap-0.5 leading-tight">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {p.city} · {p.type}
                    </span>
                  </span>
                  {selected ? <CheckIcon className="size-4 shrink-0 text-accent-brand" /> : null}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/properties" />}>
              <SettingsIcon />
              Manage properties
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/properties?new=1" />}>
              <PlusIcon />
              Add a property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
