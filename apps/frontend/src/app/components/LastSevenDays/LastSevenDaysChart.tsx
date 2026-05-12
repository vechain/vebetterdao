import { Box, useToken } from "@chakra-ui/react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"

type DayBucket = {
  label: string
  actions: number
}

type Props = {
  data: DayBucket[]
}

export const LastSevenDaysChart = ({ data }: Props) => {
  const [barColor, gridColor, axisColor] = useToken("colors", [
    "brand.secondary-strong",
    "borders.secondary",
    "text.subtle",
  ])

  return (
    <Box w="full" h="160px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
            width={32}
          />
          <Bar dataKey="actions" fill={barColor} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
