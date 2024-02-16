import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts"
import { TokenBalance } from "@/api"
import { Box, useColorModeValue, useToken } from "@chakra-ui/react"
import React, { useMemo } from "react"
import { useTokenColors } from "@/hooks"

type Props = {
  b3trBalance?: TokenBalance
  vot3Balance?: TokenBalance
}
export const BalancePieChart: React.FC<Props> = ({ b3trBalance, vot3Balance }) => {
  const [gray500, gray200] = useToken("colors", ["gray.500", "gray.200"])
  const { b3trColor, vot3Color } = useTokenColors()
  const grayColor = useColorModeValue(gray500, gray200)

  const data = useMemo(() => {
    if (!b3trBalance || !vot3Balance) return [{ name: "EMPTY", value: 1, color: grayColor }]

    return [
      { name: "B3TR", value: Number(b3trBalance.scaled), color: b3trColor },
      { name: "VOT3", value: Number(vot3Balance.scaled), color: vot3Color },
    ]
  }, [b3trBalance, vot3Balance, b3trColor, vot3Color])

  const renderCustomizedLabel = ({ ...props }) => {
    const RADIAN = Math.PI / 180
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 25) * cos
    const my = cy + (outerRadius + 25) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 15
    const ey = my
    const textAnchor = cos >= 0 ? "start" : "end"

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={fill}>{`${payload.name}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={grayColor}>
          {`${Math.floor(percent * 100)}%`}
        </text>
      </g>
    )
  }

  return (
    <Box w="full" h="250">
      <ResponsiveContainer width={"100%"} height={"100%"}>
        <PieChart title="TVL breakdown" desc={`Balances`}>
          <Pie
            label={renderCustomizedLabel}
            data={data}
            innerRadius={40}
            outerRadius={60}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value">
            {data.map(entry => (
              <Cell key={`cell-${entry.name}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Box>
  )
}
