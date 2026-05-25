import { Box, useToken } from "@chakra-ui/react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"

export type DayBucket = {
  label: string
  date: string
  actions: number
}

type Props = {
  data: DayBucket[]
  onBarClick?: (bucket: DayBucket) => void
}

export const LastSevenDaysChart = ({ data, onBarClick }: Props) => {
  const [barColor, gridColor, axisColor] = useToken("colors", ["brand.secondary", "borders.secondary", "text.subtle"])

  return (
    <Box w="full" h="160px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: axisColor }}
            stroke={axisColor}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: axisColor }}
            stroke={axisColor}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={28}
            tickMargin={4}
          />
          <Bar
            dataKey="actions"
            fill={barColor}
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
            cursor={onBarClick ? "pointer" : undefined}
            onClick={(_, index) => {
              const payload = data[index]
              if (onBarClick && payload && payload.actions > 0) onBarClick(payload)
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
