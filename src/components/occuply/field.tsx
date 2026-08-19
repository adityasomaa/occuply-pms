"use client"

import * as React from "react"
import { CalendarDaysIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
   Custom form controls. Nothing here is a native <select> or <input type=date>:
   the browser's own widgets cannot be themed, and their popups sit outside the
   design system entirely.
--------------------------------------------------------------------------- */

const FIELD_BASE =
  "ease-occuply flex w-full items-center gap-2 rounded-lg border border-border bg-card text-left text-sm " +
  "transition-colors duration-150 hover:bg-muted/60 " +
  "focus-visible:outline-none focus-visible:border-accent/50 focus-visible:ring-3 focus-visible:ring-accent-ring " +
  "aria-expanded:border-accent/50 aria-expanded:bg-card disabled:pointer-events-none disabled:opacity-50"

const SIZES = {
  sm: "h-9 px-3",
  md: "h-10 px-3.5",
} as const

export interface SelectOption {
  value: string
  label: string
  hint?: string
  swatch?: string
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  size = "md",
  className,
  triggerClassName,
  id,
  align = "start",
  disabled,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  size?: keyof typeof SIZES
  className?: string
  triggerClassName?: string
  id?: string
  align?: "start" | "end"
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const reactId = React.useId()
  const fieldId = id ?? reactId
  const selected = options.find((o) => o.value === value)

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={fieldId} className="text-xs font-medium">
          {label}
        </Label>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              id={fieldId}
              disabled={disabled}
              aria-haspopup="listbox"
              className={cn(FIELD_BASE, SIZES[size], triggerClassName)}
            />
          }
        >
          {selected?.swatch ? (
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selected.swatch }}
              aria-hidden
            />
          ) : null}
          {selected?.icon ? <selected.icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.9} /> : null}
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDownIcon
            className={cn(
              "ease-occuply size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            strokeWidth={2}
          />
        </PopoverTrigger>

        <PopoverContent
          align={align}
          sideOffset={6}
          className="max-h-72 w-(--anchor-width) min-w-52 overflow-y-auto p-1.5"
        >
          <ul role="listbox" aria-label={label ?? placeholder} className="flex flex-col gap-0.5">
            {options.map((o) => {
              const active = o.value === value
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "ease-occuply flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm",
                      "transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:bg-muted",
                      active && "bg-accent-soft",
                    )}
                  >
                    {o.swatch ? (
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: o.swatch }}
                        aria-hidden
                      />
                    ) : null}
                    {o.icon ? <o.icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.9} /> : null}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate", active && "font-medium")}>{o.label}</span>
                      {o.hint ? <span className="block truncate text-xs text-muted-foreground">{o.hint}</span> : null}
                    </span>
                    {active ? <CheckIcon className="size-4 shrink-0 text-accent-brand" strokeWidth={2.5} /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ---------------------------------- dates ---------------------------------- */

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
const FIELD_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

/** Month grid. Written by hand so the styling, the week start and the range
 *  highlighting all follow the brand rather than a library's defaults. */
export function MonthCalendar({
  value,
  onSelect,
  min,
  max,
  highlight,
  markers,
}: {
  value?: string
  onSelect: (iso: string) => void
  min?: string
  max?: string
  /** Optional second date to shade an inclusive range. */
  highlight?: { from: string; to: string }
  /** Dots under specific days. */
  markers?: Record<string, string>
}) {
  const initial = value ? parse(value) : new Date()
  const [cursor, setCursor] = React.useState(() => new Date(Date.UTC(initial.getUTCFullYear(), initial.getUTCMonth(), 1)))

  const year = cursor.getUTCFullYear()
  const month = cursor.getUTCMonth()
  const first = new Date(Date.UTC(year, month, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  // Monday-first offset.
  const lead = (first.getUTCDay() + 6) % 7

  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(Date.UTC(year, month, i + 1)))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayISO = toISO(new Date())

  return (
    <div className="w-[17.5rem] p-1">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(Date.UTC(year, month - 1, 1)))}
          className="ease-occuply flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeftIcon className="size-4" strokeWidth={2} />
        </button>
        <span className="text-sm font-semibold">{MONTH_FMT.format(first)}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor(new Date(Date.UTC(year, month + 1, 1)))}
          className="ease-occuply flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRightIcon className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 px-1 pb-1">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1 text-center text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
            {d}
          </span>
        ))}

        {cells.map((iso, i) => {
          if (!iso) return <span key={`pad-${i}`} />
          const disabled = (min && iso < min) || (max && iso > max)
          const selected = iso === value
          const inRange = highlight && iso >= highlight.from && iso <= highlight.to
          const marker = markers?.[iso]
          return (
            <button
              key={iso}
              type="button"
              disabled={!!disabled}
              onClick={() => onSelect(iso)}
              aria-current={iso === todayISO ? "date" : undefined}
              className={cn(
                "ease-occuply relative flex h-9 items-center justify-center rounded-lg text-sm transition-colors duration-150",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-30",
                inRange && !selected && "bg-accent-soft",
                selected && "bg-accent font-semibold text-accent-foreground hover:bg-accent",
                !selected && iso === todayISO && "font-semibold text-accent-brand",
              )}
            >
              {Number(iso.slice(8, 10))}
              {marker && !selected ? (
                <span
                  className="absolute bottom-1 size-1 rounded-full"
                  style={{ backgroundColor: marker }}
                  aria-hidden
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DateField({
  label,
  value,
  onChange,
  min,
  max,
  size = "md",
  className,
  triggerClassName,
  placeholder = "Pick a date",
  id,
  markers,
}: {
  label?: string
  value: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  size?: keyof typeof SIZES
  className?: string
  triggerClassName?: string
  placeholder?: string
  id?: string
  markers?: Record<string, string>
}) {
  const [open, setOpen] = React.useState(false)
  const reactId = React.useId()
  const fieldId = id ?? reactId

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={fieldId} className="text-xs font-medium">
          {label}
        </Label>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        {/* The whole field is the trigger, not just the icon. */}
        <PopoverTrigger
          render={
            <button
              type="button"
              id={fieldId}
              className={cn(FIELD_BASE, SIZES[size], triggerClassName)}
            />
          }
        >
          <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.9} />
          <span className={cn("min-w-0 flex-1 truncate", !value && "text-muted-foreground")}>
            {value ? FIELD_FMT.format(parse(value)) : placeholder}
          </span>
          <ChevronDownIcon
            className={cn(
              "ease-occuply size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            strokeWidth={2}
          />
        </PopoverTrigger>

        <PopoverContent align="start" sideOffset={6} className="w-auto p-2">
          <MonthCalendar
            value={value}
            min={min}
            max={max}
            markers={markers}
            onSelect={(iso) => {
              onChange(iso)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* --------------------------------- text ----------------------------------- */

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  id,
  help,
  min,
  max,
}: {
  label?: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  className?: string
  id?: string
  help?: string
  min?: number
  max?: number
}) {
  const reactId = React.useId()
  const fieldId = id ?? reactId
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={fieldId} className="text-xs font-medium">
          {label}
        </Label>
      ) : null}
      <input
        id={fieldId}
        type={type}
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD_BASE, SIZES.md, "px-3.5")}
      />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  )
}
