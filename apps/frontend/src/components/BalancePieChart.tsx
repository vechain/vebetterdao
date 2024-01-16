import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts"
import { TokenBalance } from "@/api"
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, useColorModeValue, useToken } from "@chakra-ui/react"
import React, { useMemo, useState } from "react"
import { FormattingUtils } from "@repo/utils"
import { ActiveShape } from "recharts/types/util/types"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

const RenderActiveShape: ActiveShape<PieSectorDataItem> = ({ ...props }) => {
  const RADIAN = Math.PI / 180
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 10) * cos
  const sy = cy + (outerRadius + 10) * sin
  const mx = cx + (outerRadius + 30) * cos
  const my = cy + (outerRadius + 30) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 22
  const ey = my
  const textAnchor = cos >= 0 ? "start" : "end"

  const [gray200, gray500] = useToken("colors", ["gray.500", "gray.200"])
  const grayColor = useColorModeValue(gray200, gray500)

  const formattedValue = FormattingUtils.humanNumber(value, value)

  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={8}
        textAnchor="middle"
        fill={fill}
        style={{
          fontSize: "16px",
          fontWeight: "bold",
        }}>
        {payload.name}
      </text>
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
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={fill}>{`${formattedValue}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={grayColor}>
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  )
}

type Props = {
  b3trBalance?: TokenBalance
  vot3Balance?: TokenBalance
}
export const BalancePieChart: React.FC<Props> = ({ b3trBalance, vot3Balance }) => {
  const [selectedPieIndex, setSelectedPieIndex] = useState(0)

  const onPinEnter = (_: any, index: number) => {
    setSelectedPieIndex(index)
  }

  const [primary500, primary200, secondary500, secondary200, gray500, gray200] = useToken("colors", [
    "primary.500",
    "primary.200",
    "secondary.500",
    "secondary.200",
    "gray.500",
    "gray.200",
  ])
  const primaryColor = useColorModeValue(primary500, primary200)
  const secondaryColor = useColorModeValue(secondary500, secondary200)
  const grayColor = useColorModeValue(gray500, gray200)

  const data = useMemo(() => {
    if (!b3trBalance || !vot3Balance) return []

    return [
      { name: "B3TR", value: Number(b3trBalance.scaled), color: primaryColor },
      { name: "VOT3", value: Number(vot3Balance.scaled), color: secondaryColor },
      { name: "hide", value: 1, color: grayColor },
    ]
  }, [b3trBalance, vot3Balance, primaryColor, secondaryColor])

  const hasNoBalance = useMemo(() => {
    return b3trBalance?.scaled === "0" && vot3Balance?.scaled === "0"
  }, [b3trBalance, vot3Balance])

  if (hasNoBalance)
    return (
      <Box h={"150"}>
        <Alert status="warning" borderRadius={"lg"}>
          <AlertIcon />
          <Box>
            <AlertTitle>You have no balance</AlertTitle>
            <AlertDescription>Mint some tokens to get started.</AlertDescription>
          </Box>
        </Alert>
      </Box>
    )

  return (
    <Box w="full" h="200">
      <ResponsiveContainer width={"99%"} height={"100%"}>
        <PieChart title="TVL breakdown" desc={`Balances`}>
          <Pie
            activeIndex={selectedPieIndex}
            onMouseEnter={onPinEnter}
            activeShape={RenderActiveShape}
            data={data}
            dataKey="value"
            // startAngle={180}
            // endAngle={0}
            // cx="50%"
            // cy="50%"
            outerRadius={"80%"}
            innerRadius={"60%"}
            fill="#8884d8">
            {data.map(entry => (
              <Cell key={`cell-${entry.name}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Box>
  )
}
