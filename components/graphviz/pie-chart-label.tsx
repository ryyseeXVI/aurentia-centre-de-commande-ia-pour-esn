"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A pie chart with a label"

export interface PieChartDataPoint {
  name: string
  value: number
  fill?: string
}

interface ChartPieLabelProps {
  data: PieChartDataPoint[]
  title?: string
  description?: string
  config?: ChartConfig
  valueKey?: string
  nameKey?: string
  footer?: {
    trend?: number
    text?: string
  }
}

const defaultChartConfig = {
  value: {
    label: "Value",
  },
} satisfies ChartConfig

export function ChartPieLabel({
  data = [],
  title = "Pie Chart",
  description,
  config = defaultChartConfig,
  valueKey = "value",
  nameKey = "name",
  footer,
}: ChartPieLabelProps) {
  // Add fill colors to data if not provided
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.fill || `var(--chart-${(index % 5) + 1})`,
  }))

  if (data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey={valueKey} label nameKey={nameKey} />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col gap-2 text-sm">
          {footer.trend !== undefined && (
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending {footer.trend > 0 ? 'up' : 'down'} by {Math.abs(footer.trend)}% this month{" "}
              <TrendingUp className="h-4 w-4" />
            </div>
          )}
          {footer.text && (
            <div className="text-muted-foreground leading-none">
              {footer.text}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
