import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts"
import { useB3trTokenDetails } from "@/api"
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  useToken,
} from "@chakra-ui/react"
import { useEffect, useMemo, useState } from "react"
import { FormattingUtils } from "@repo/utils"
import BigNumber from "bignumber.js"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { ActiveShape } from "recharts/types/util/types"

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

export const CirculatingSupplyPieChart = () => {
  const [selectedPieIndex, setSelectedPieIndex] = useState(0)

  const onPinEnter = (_: any, index: number) => {
    setSelectedPieIndex(index)
  }

  const [primary500, primary200, gray500, gray200] = useToken("colors", [
    "primary.500",
    "primary.200",
    "gray.500",
    "gray.200",
  ])
  const primaryColor = useColorModeValue(primary500, primary200)
  const grayColor = useColorModeValue(gray500, gray200)

  const { data: b3trTokenDetails } = useB3trTokenDetails()

  const data = useMemo(() => {
    if (!b3trTokenDetails) return []

    const circulatingSupply = new BigNumber(b3trTokenDetails.circulatingSupply).toNumber()
    const lockedSupply = new BigNumber(b3trTokenDetails.totalSupply).minus(circulatingSupply).toNumber()

    return [
      { name: "Circulating", value: circulatingSupply, color: primaryColor },
      { name: "Locked", value: lockedSupply, color: grayColor },
    ]
  }, [b3trTokenDetails, b3trTokenDetails, primaryColor, grayColor])

  const circulatingSupplyPercentage = useMemo(() => {
    if (!b3trTokenDetails) return 0

    const percentage = new BigNumber(b3trTokenDetails.circulatingSupply)
      .dividedBy(b3trTokenDetails.totalSupply)
      .multipliedBy(100)

    return percentage.toNumber()
  }, [b3trTokenDetails])

  const formattedTotalSupply = useMemo(() => {
    if (!b3trTokenDetails) return 0

    return FormattingUtils.humanNumber(b3trTokenDetails.totalSupply)
  }, [b3trTokenDetails])

  useEffect(() => {
    if (!b3trTokenDetails) return

    if (b3trTokenDetails.circulatingSupply === "0") return setSelectedPieIndex(1)

    return setSelectedPieIndex(0)
  }, [b3trTokenDetails])

  return (
    <Card w={"full"} h="full">
      <CardHeader>
        <HStack justify={"space-between"} align={"center"} w="full">
          <VStack spacing={0} justify={"flex-start"} align="flex-start">
            <Heading size="md">Supply breakdown</Heading>
            <Text fontSize="sm">How much B3TR is in circulation and how much is locked?</Text>
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody w="full">
        <Box w="full" h="250">
          <ResponsiveContainer width={"99%"} height={"100%"}>
            <PieChart title="B3TR/VOT3 breakdown" desc={`Current B3TR/VOT3 ratio is 1:${circulatingSupplyPercentage}`}>
              <Pie
                data={data}
                dataKey="value"
                activeIndex={selectedPieIndex}
                activeShape={RenderActiveShape}
                onMouseEnter={onPinEnter}
                // startAngle={180}
                // endAngle={0}
                paddingAngle={5}
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
        <Alert status="info" borderRadius={"lg"} mt={8}>
          <AlertIcon />
          <Box>
            <AlertTitle>The total supply of B3TR is {formattedTotalSupply}</AlertTitle>
            <AlertDescription>
              The circulating supply is the amount of B3TR that is currently in circulation. The locked supply is the
              amount of B3TR that is locked in the contract and is not in circulation.
            </AlertDescription>
          </Box>
        </Alert>
      </CardBody>
    </Card>
  )
}
