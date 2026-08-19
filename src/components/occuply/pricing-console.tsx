"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  GripVerticalIcon,
  SparklesIcon,
  XIcon,
  ZapIcon,
} from "lucide-react"

import { EmptyState, Panel, StatusDot } from "@/components/occuply/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { money, moneyShort, shortDate, weekday } from "@/lib/format"
import type { Suggestion } from "@/lib/suggestions"
import type { PricingRule } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PricingConsole({
  rules,
  suggestions,
}: {
  rules: PricingRule[]
  suggestions: Suggestion[]
}) {
  const [engineOn, setEngineOn] = React.useState(true)
  const [ruleState, setRuleState] = React.useState(() =>
    Object.fromEntries(rules.map((r) => [r.id, r.active])),
  )
  const [decided, setDecided] = React.useState<Record<string, "accepted" | "dismissed">>({})

  const pending = suggestions.filter((s) => !decided[s.key])
  const accepted = suggestions.filter((s) => decided[s.key] === "accepted")
  const uplift = accepted.reduce((sum, s) => sum + (s.suggested - s.current) * Math.max(1, s.sold), 0)
  const potential = pending.reduce((sum, s) => sum + (s.suggested - s.current) * Math.max(1, s.sold), 0)

  function decide(s: Suggestion, choice: "accepted" | "dismissed") {
    setDecided((d) => ({ ...d, [s.key]: choice }))
    if (choice === "accepted") {
      toast.success(`${s.roomTypeName} repriced for ${shortDate(s.date)}`, {
        description: `${money(s.current)} to ${money(s.suggested)}, pushed to all connected channels.`,
      })
    }
  }

  function acceptAll() {
    if (pending.length === 0) return
    setDecided((d) => {
      const next = { ...d }
      pending.forEach((s) => (next[s.key] = "accepted"))
      return next
    })
    toast.success(`${pending.length} rate changes applied`, {
      description: `Projected uplift ${moneyShort(potential)} across the next fourteen nights.`,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "ease-occuply flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors duration-300 lg:px-5",
          engineOn ? "border-accent/35 bg-accent-soft/60" : "border-border bg-card",
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
            engineOn ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <ZapIcon className="size-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Pricing engine is {engineOn ? "running" : "paused"}
          </p>
          <p className="text-xs text-muted-foreground">
            {engineOn
              ? `${Object.values(ruleState).filter(Boolean).length} active rules evaluate every night at 03:00 local time.`
              : "Rates stay exactly where you set them until you switch the engine back on."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusDot tone={engineOn ? "ok" : "idle"} pulse={engineOn} />
          <Switch
            checked={engineOn}
            onCheckedChange={(v) => {
              setEngineOn(v)
              toast[v ? "success" : "message"](v ? "Pricing engine resumed" : "Pricing engine paused", {
                description: v
                  ? "The next evaluation runs tonight at 03:00."
                  : "No automatic rate changes will be pushed.",
              })
            }}
            aria-label="Toggle pricing engine"
          />
        </div>
      </div>

      <div id="pricing-rules" className="grid scroll-mt-6 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          className="scroll-mt-6"
          title="Pricing rules"
          description="Evaluated in priority order, first match wins"
          bodyClassName="divide-y divide-border"
        >
          {rules.map((r) => {
            const on = ruleState[r.id] && engineOn
            return (
              <div
                key={r.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 lg:px-5",
                  !on && "opacity-55",
                )}
              >
                <GripVerticalIcon className="size-3.5 shrink-0 cursor-grab text-muted-foreground" />
                <span className="num w-5 shrink-0 text-xs text-muted-foreground">{r.priority}</span>

                <div className="min-w-[180px] flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.trigger} · {r.condition}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "num shrink-0 gap-0.5",
                    r.adjustment > 0
                      ? "border-accent/35 bg-accent-soft text-accent-brand"
                      : "border-status-ok/30 bg-status-ok/10 text-status-ok",
                  )}
                >
                  {r.adjustment > 0 ? (
                    <ArrowUpRightIcon className="size-3" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownRightIcon className="size-3" strokeWidth={2.5} />
                  )}
                  {r.adjustment > 0 ? "+" : ""}
                  {r.adjustment}%
                </Badge>

                <div className="hidden w-24 shrink-0 text-right lg:block">
                  <p className="num text-xs font-medium">
                    {r.revenueImpact === 0 ? "—" : moneyShort(r.revenueImpact)}
                  </p>
                  <p className="num text-[0.6875rem] text-muted-foreground">
                    {r.appliedLast30d} fires · 30d
                  </p>
                </div>

                <Switch
                  checked={ruleState[r.id]}
                  disabled={!engineOn}
                  onCheckedChange={(v) => setRuleState((s) => ({ ...s, [r.id]: v }))}
                  aria-label={`${ruleState[r.id] ? "Disable" : "Enable"} ${r.name}`}
                />
              </div>
            )
          })}
        </Panel>

        <Panel
          title="Recommended rate changes"
          description={`${pending.length} awaiting a decision over the next fourteen nights`}
          action={
            <Button
              size="sm"
              className="h-7 gap-1.5 bg-accent text-xs text-accent-foreground hover:bg-accent/90"
              disabled={pending.length === 0 || !engineOn}
              onClick={acceptAll}
            >
              <SparklesIcon className="size-3" strokeWidth={2.25} />
              Accept all
            </Button>
          }
          bodyClassName="max-h-[520px] overflow-y-auto scroll-slim"
        >
          {pending.length === 0 ? (
            <EmptyState
              icon={SparklesIcon}
              title={accepted.length > 0 ? "Every suggestion handled" : "Rates already optimal"}
              description={
                accepted.length > 0
                  ? `You applied ${accepted.length} changes worth ${moneyShort(uplift)}. The engine re-evaluates tonight at 03:00.`
                  : "No room type is more than six percent away from its recommended rate over the next fourteen nights."
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((s) => {
                const up = s.suggested > s.current
                const pct = ((s.suggested - s.current) / s.current) * 100
                return (
                  <li key={s.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 lg:px-5">
                    <div className="w-14 shrink-0">
                      <p className="text-xs font-medium">{shortDate(s.date)}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">{weekday(s.date)}</p>
                    </div>

                    <div className="min-w-[150px] flex-1">
                      <p className="truncate text-sm font-medium">{s.roomTypeName}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.reason}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="num text-xs text-muted-foreground line-through">
                        {moneyShort(s.current)}
                      </p>
                      <p
                        className={cn(
                          "num text-sm font-semibold",
                          up ? "text-accent-brand" : "text-status-ok",
                        )}
                      >
                        {moneyShort(s.suggested)}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "num w-14 shrink-0 justify-center",
                        up
                          ? "border-accent/35 bg-accent-soft text-accent-brand"
                          : "border-status-ok/30 bg-status-ok/10 text-status-ok",
                      )}
                    >
                      {pct > 0 ? "+" : ""}
                      {pct.toFixed(0)}%
                    </Badge>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => decide(s, "dismissed")}
                        aria-label={`Dismiss suggestion for ${s.roomTypeName} on ${shortDate(s.date)}`}
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        className="size-7 bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={!engineOn}
                        onClick={() => decide(s, "accepted")}
                        aria-label={`Apply suggestion for ${s.roomTypeName} on ${shortDate(s.date)}`}
                      >
                        <CheckIcon className="size-3.5" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {(accepted.length > 0 || pending.length > 0) && (
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5 lg:px-5">
              <span className="label-brand">
                {accepted.length > 0 ? "Applied this session" : "If you accept everything"}
              </span>
              <span className="num text-sm font-semibold text-accent-brand">
                {accepted.length > 0 ? moneyShort(uplift) : moneyShort(potential)}
              </span>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
