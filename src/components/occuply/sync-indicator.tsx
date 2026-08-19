"use client"

import Link from "next/link"
import { CheckIcon, RefreshCwIcon } from "lucide-react"

import { useSyncStatus } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Occuply pushes every change to the connected channels as it is made, so
 *  this reports state rather than offering a button. Distribution itself is
 *  managed on Channel setup, which is where the link goes. */
export function SyncIndicator({ className }: { className?: string }) {
  const status = useSyncStatus()
  const syncing = status === "syncing"

  return (
    <Link
      href="/channels"
      title={
        syncing
          ? "Pushing your change to every connected channel"
          : "Everything is pushed. Open Channel setup to manage distribution."
      }
      className={cn(
        "ease-occuply hidden h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium",
        "transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "lg:inline-flex",
        syncing ? "text-accent-brand" : "text-muted-foreground",
        className,
      )}
    >
      {syncing ? (
        <RefreshCwIcon className="size-3.5 animate-spin" strokeWidth={2.25} />
      ) : (
        <CheckIcon className="size-3.5 text-status-ok" strokeWidth={2.75} />
      )}
      {syncing ? "Syncing…" : "All changes synced"}
    </Link>
  )
}
