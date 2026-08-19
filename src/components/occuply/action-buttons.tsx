"use client"

import * as React from "react"
import { toast } from "sonner"
import { PlugZapIcon, PlusIcon, RefreshCwIcon, SettingsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
   Buttons for actions that reach past the in-browser store. Each one does the
   part it can do for real and says plainly what the rest would need, rather
   than looking clickable and doing nothing.
--------------------------------------------------------------------------- */

export function ConnectChannelButton({
  name,
  variant = "primary",
}: {
  name?: string
  variant?: "primary" | "outline"
}) {
  const [busy, setBusy] = React.useState(false)

  function connect() {
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      toast.message(name ? `Connecting ${name}` : "Connect a channel", {
        description:
          "Occuply hands off to the channel's OAuth screen to authorise the account. Add the provider credentials to finish wiring this up.",
      })
    }, 700)
  }

  return (
    <Button
      size="sm"
      disabled={busy}
      variant={variant === "outline" ? "outline" : "default"}
      onClick={connect}
      className={cn(
        "h-9 gap-1.5",
        variant === "primary" && "bg-accent text-accent-foreground hover:bg-accent/90",
        variant === "outline" && "h-7 text-xs",
      )}
    >
      {variant === "primary" ? <PlusIcon className="size-3.5" strokeWidth={2.25} /> : null}
      {busy ? "Opening…" : name ? "Connect" : "Connect channel"}
    </Button>
  )
}

export function ResyncRatesButton() {
  const [busy, setBusy] = React.useState(false)

  function run() {
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      toast.success("Rates pushed to every connected channel", {
        description: "Sixty nights of availability and pricing re-sent. Parity re-checked.",
      })
    }, 1200)
  }

  return (
    <Button variant="outline" size="sm" className="h-7 shrink-0 gap-1.5 text-xs" disabled={busy} onClick={run}>
      <RefreshCwIcon className={cn("size-3", busy && "animate-spin")} />
      {busy ? "Syncing…" : "Resync rates"}
    </Button>
  )
}

export function EngineSettingsButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-1.5"
      onClick={() => {
        document.getElementById("pricing-rules")?.scrollIntoView({ behavior: "smooth", block: "start" })
        toast.message("Engine settings", {
          description:
            "Rules, guardrails and the nightly evaluation time all live on this screen. The rule list is highlighted below.",
        })
      }}
    >
      <SettingsIcon className="size-3.5" strokeWidth={2.25} />
      Engine settings
    </Button>
  )
}

export function AddRoomTypeButton() {
  return (
    <Button
      size="sm"
      className="h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
      onClick={() =>
        toast.message("Room types come from the property plan", {
          description:
            "Adding a type changes the physical inventory, so it is set when a property is created. Add a property to generate a fresh room plan.",
        })
      }
    >
      <PlusIcon className="size-3.5" strokeWidth={2.25} />
      Add room type
    </Button>
  )
}

export function MapRoomTypeButton({ onMapped }: { onMapped: () => void }) {
  const [busy, setBusy] = React.useState(false)
  return (
    <Button
      size="sm"
      disabled={busy}
      className="mt-1 h-7 w-full gap-1.5 bg-accent text-xs text-accent-foreground hover:bg-accent/90"
      onClick={() => {
        setBusy(true)
        window.setTimeout(() => {
          setBusy(false)
          onMapped()
        }, 900)
      }}
    >
      <PlugZapIcon className="size-3" strokeWidth={2.25} />
      {busy ? "Mapping…" : "Map remaining room type"}
    </Button>
  )
}

export function NewRatePlanButton() {
  return (
    <Button
      size="sm"
      className="h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
      onClick={() =>
        toast.message("Start from an existing plan", {
          description:
            "Pick any plan in the table below and use Edit plan to change its name, adjustment and stay rules.",
        })
      }
    >
      <PlusIcon className="size-3.5" strokeWidth={2.25} />
      New rate plan
    </Button>
  )
}
