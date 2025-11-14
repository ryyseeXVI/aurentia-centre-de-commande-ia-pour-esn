"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive bar chart"

export interface BarChartDataPoint {
  date: string
  [key: string]: string | number
}

interface ChartBarInteractiveProps {
  data: BarChartDataPoint[]
  title?: string
  description?: string
  config?: ChartConfig
  defaultActiveKey?: string
}

const defaultChartConfig = {
  views: {
    label: "Page Views",
  },
  desktop: {
    label: "Desktop",
    color: "var(--chart-2)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartBarInteractive({
  data = [],
  title = "Bar Chart - Interactive",
  description = "Showing data over time",
  config = defaultChartConfig,
  defaultActiveKey,
}: ChartBarInteractiveProps) {
  // Extract data keys (excluding 'date')
  const dataKeys = React.useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter(key => key !== 'date')
  }, [data])

  const firstKey = defaultActiveKey || dataKeys[0] || 'desktop'
  const [activeChart, setActiveChart] = React.useState<string>(firstKey)

  const total = React.useMemo(
    () => {
      const totals: Record<string, number> = {}
      dataKeys.forEach(key => {
        totals[key] = data.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0)
      })
      return totals
    },
    [data, dataKeys]
  )

  if (data.length === 0 || dataKeys.length === 0) {
    return (
      <Card className="py-0">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground text-sm">No data to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          {dataKeys.map((key) => {
            const chartItem = config[key as keyof typeof config]
            return (
              <button
                key={key}
                data-active={activeChart === key}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartItem?.label || key}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key]?.toLocaleString() || 0}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
