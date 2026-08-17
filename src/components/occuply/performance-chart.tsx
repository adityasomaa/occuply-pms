"use client"

import * as React from "react"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Panel } from "@/components/occuply/primitives"
import { moneyShort, shortDate } from "@/lib/format"
import type { DailyMetric } from "@/lib/types"

const config = {
  revenue: { label: "Room revenue", color: "var(--chart-1)" },
  occupancy: { label: "Occupancy", color: "var(--chart-3)" },
} satisfies ChartConfig

const RANGES = [
  { value: "90d", label: "90 days", days: 90 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "7d", label: "7 days", days: 7 },
]

export function PerformanceChart({ metrics }: { metrics: DailyMetric[] }) {
  const [range, setRange] = React.useState("30d")
  const days = RANGES.find((r) => r.value === range)?.days ?? 30
  const data = React.useMemo(() => metrics.slice(-days), [metrics, days])

  return (
    <Panel
      title="Revenue and occupancy"
      description="Room revenue against occupancy, net of cancellations"
      action={
        <ToggleGroup
          multiple={false}
          value={[range]}
          onValueChange={(v) => setRange(v[0] ?? "30d")}
          variant="outline"
          size="sm"
          className="*:data-[slot=toggle-group-item]:px-3!"
        >
          {RANGES.map((r) => (
            <ToggleGroupItem key={r.value} value={r.value} className="text-xs">
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
      bodyClassName="px-1 pb-2 pt-4 sm:px-3"
    >
      <ChartContainer config={config} className="aspect-auto h-[248px] w-full">
        <ComposedChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <defs>
            <linearGradient id="occuplyRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.42} />
              <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={28}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => shortDate(v)}
          />
          <YAxis
            yAxisId="revenue"
            tickLine={false}
            axisLine={false}
            width={54}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => moneyShort(v)}
          />
          <YAxis
            yAxisId="occupancy"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={38}
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(v) => shortDate(String(v))}
                formatter={(value, name) =>
                  name === "occupancy" ? (
                    <span className="num">{Number(value).toFixed(1)}% occupancy</span>
                  ) : (
                    <span className="num">{moneyShort(Number(value))} revenue</span>
                  )
                }
              />
            }
          />
          <Area
            yAxisId="revenue"
            dataKey="revenue"
            type="monotone"
            fill="url(#occuplyRevenueFill)"
            stroke="var(--color-revenue)"
            strokeWidth={2}
          />
          <Line
            yAxisId="occupancy"
            dataKey="occupancy"
            type="monotone"
            stroke="var(--color-occupancy)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
        </ComposedChart>
      </ChartContainer>
    </Panel>
  )
}
