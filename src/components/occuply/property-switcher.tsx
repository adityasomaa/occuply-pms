"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon, SettingsIcon } from "lucide-react"

import { SelectField, TextField } from "@/components/occuply/field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addProperty, switchProperty } from "@/app/actions"
import type { Property } from "@/lib/types"
import { cn } from "@/lib/utils"

const TYPES = [
  { value: "Villa Resort", label: "Villa Resort" },
  { value: "Boutique Hotel", label: "Boutique Hotel" },
  { value: "Serviced Residence", label: "Serviced Residence" },
]

const STARS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? "s" : ""}` }))

export function PropertySwitcher({
  properties,
  activeId,
}: {
  properties: Property[]
  activeId: string
}) {
  const [open, setOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [target, setTarget] = React.useState<string | null>(null)

  const active = properties.find((p) => p.id === activeId) ?? properties[0]

  function switchTo(id: string) {
    setOpen(false)
    if (id === activeId) return
    setTarget(id)
    startTransition(() => {
      void switchProperty(id)
    })
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "ease-occuply flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-card px-3 py-2.5 text-left",
                "transition-colors duration-150 hover:bg-sidebar-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "aria-expanded:border-accent/40 aria-expanded:bg-accent-soft",
              )}
            />
          }
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-brand">
            <BuildingIcon className="size-[1.05rem]" strokeWidth={1.9} />
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5 leading-tight">
            <span className="label-brand text-[0.5625rem] text-accent-brand">Property</span>
            <span className="truncate text-sm font-semibold">
              {isPending && target ? "Switching…" : active?.shortName}
            </span>
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        </PopoverTrigger>

        <PopoverContent align="start" sideOffset={6} className="w-(--anchor-width) min-w-72 p-1.5">
          <p className="label-brand px-2 py-1.5">Switch property</p>
          <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
            {properties.map((p) => {
              const selected = p.id === activeId
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => switchTo(p.id)}
                    className={cn(
                      "ease-occuply flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left",
                      "transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:bg-muted",
                      selected && "bg-accent-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "num flex size-8 shrink-0 items-center justify-center rounded-lg border text-[0.6875rem] font-semibold",
                        selected
                          ? "border-accent/40 bg-card text-accent-brand"
                          : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {p.totalUnits}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5 leading-tight">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {p.city} · {p.type}
                      </span>
                    </span>
                    {selected ? <CheckIcon className="size-4 shrink-0 text-accent-brand" strokeWidth={2.5} /> : null}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-1 border-t border-border pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setAddOpen(true)
              }}
              className="ease-occuply flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-accent-brand transition-colors duration-150 hover:bg-accent-soft"
            >
              <PlusIcon className="size-4" strokeWidth={2.25} />
              Add a property
            </button>
            <Link
              href="/properties"
              onClick={() => setOpen(false)}
              className="ease-occuply flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-muted"
            >
              <SettingsIcon className="size-4 text-muted-foreground" strokeWidth={1.9} />
              Manage properties
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <AddPropertyDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  )
}

export function AddPropertyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = React.useState("")
  const [city, setCity] = React.useState("")
  const [type, setType] = React.useState(TYPES[0].value)
  const [units, setUnits] = React.useState("12")
  const [stars, setStars] = React.useState("4")
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await addProperty({
        name,
        city,
        type: type as Property["type"],
        totalUnits: Number(units),
        starRating: Number(stars),
      })
      if (!result.ok) {
        setError(result.error ?? "Could not add the property.")
        return
      }
      toast.success(`${name} added`, {
        description: "A starter room plan and rate grid were generated. You are now managing it.",
      })
      setName("")
      setCity("")
      setUnits("12")
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a property</DialogTitle>
          <DialogDescription>
            Occuply generates a starter room plan, rate grid and calendar so the property is usable
            straight away. You can edit all of it afterwards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 py-1">
          <TextField
            label="Property name"
            value={name}
            onChange={setName}
            placeholder="Sanur Aruna Beach Resort"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="City" value={city} onChange={setCity} placeholder="Sanur" />
            <SelectField label="Property type" value={type} onChange={setType} options={TYPES} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Number of units"
              type="number"
              min={1}
              max={400}
              value={units}
              onChange={setUnits}
              help="Split across three starter room types."
            />
            <SelectField label="Star rating" value={stars} onChange={setStars} options={STARS} />
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter className="mt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <PlusIcon className="size-3.5" strokeWidth={2.25} />
              {isPending ? "Creating…" : "Create property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Standalone trigger used on the Properties screen. */
export function AddPropertyButton({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button
        size="sm"
        className={cn("h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90", className)}
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="size-3.5" strokeWidth={2.25} />
        Add property
      </Button>
      <AddPropertyDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
