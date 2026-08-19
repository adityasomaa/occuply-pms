"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { SelectField } from "@/components/occuply/field"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { money, moneyAxis, shortDate } from "@/lib/format"
import type { DailyMetric } from "@/lib/types"
import { cn } from "@/lib/utils"

const config = {
  revenue: { label: "Room revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

const RANGES = [
  { value: "30", label: "This month" },
  { value: "7", label: "This week" },
  { value: "90", label: "Last 3 months" },
]

/** Matches the reference: headline total on the left, range picker on the
 *  right, and a single orange area beneath. */
export function RevenueOverview({ metrics }: { metrics: DailyMetric[] }) {
  const [range, setRange] = React.useState("30")
  const days = Number(range)

  const data = React.useMemo(() => metrics.slice(-days), [metrics, days])
  const previous = React.useMemo(() => metrics.slice(-days * 2, -days), [metrics, days])

  const total = data.reduce((s, m) => s + m.revenue, 0)
  const prevTotal = previous.reduce((s, m) => s + m.revenue, 0)
  const delta = prevTotal === 0 ? 0 : ((total - prevTotal) / prevTotal) * 100
  const up = delta >= 0
  const Arrow = up ? TrendingUpIcon : TrendingDownIcon

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">Revenue Overview</h2>
        <SelectField
          value={range}
          onChange={setRange}
          options={RANGES}
          size="sm"
          align="end"
          className="w-40"
          triggerClassName="text-xs font-medium"
        />
      </header>

      <div className="mt-4">
        <p className="text-[0.8125rem] text-muted-foreground">Total Revenue</p>
        <p className="num mt-0.5 text-[1.75rem] font-bold leading-tight tracking-tight">{money(total)}</p>
        <p
          className={cn(
            "num mt-1 flex items-center gap-1 text-xs font-medium",
            up ? "text-status-ok" : "text-destructive",
          )}
        >
          <Arrow className="size-3.5" strokeWidth={2.25} />
          {Math.abs(delta).toFixed(0)}% from last period
        </p>
      </div>

      <ChartContainer config={config} className="mt-3 aspect-auto h-[230px] w-full">
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="occuplyRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" className="stroke-border" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            minTickGap={40}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => shortDate(v)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => moneyAxis(v)}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--accent)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                  <p className="text-xs text-muted-foreground">{shortDate(String(label))}</p>
                  <p className="num text-sm font-semibold">{money(Number(payload[0].value))}</p>
                </div>
              )
            }}
          />
          <Area
            dataKey="revenue"
            type="monotone"
            fill="url(#occuplyRevenueFill)"
            stroke="var(--color-revenue)"
            strokeWidth={2.4}
            activeDot={{ r: 5, strokeWidth: 2, className: "stroke-card fill-accent" }}
          />
        </AreaChart>
      </ChartContainer>
    </section>
  )
}
