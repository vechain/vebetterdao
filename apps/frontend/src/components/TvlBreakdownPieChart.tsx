import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts"
import { useB3trBalance, useB3trTokenDetails } from "@/api"
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  useToken,
} from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useEffect, useMemo, useState } from "react"
import { FormattingUtils } from "@repo/utils"
import BigNumber from "bignumber.js"
import { ActiveShape } from "recharts/types/util/types"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

const config = getConfig()

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

export const TvlBreakdownPieChart = () => {
  const [selectedPieIndex, setSelectedPieIndex] = useState(0)

  const onPinEnter = (_: any, index: number) => {
    setSelectedPieIndex(index)
  }

  const [primary500, primary200, secondary500, secondary200] = useToken("colors", [
    "green.500",
    "green.200",
    "orange.500",
    "orange.200",
  ])
  const primaryColor = useColorModeValue(primary500, primary200)
  const secondaryColor = useColorModeValue(secondary500, secondary200)

  const { data: b3trTokenDetails } = useB3trTokenDetails()
  const { data: vot3ContractB3trBalance } = useB3trBalance(config.vot3ContractAddress)

  const data = useMemo(() => {
    if (!b3trTokenDetails || !vot3ContractB3trBalance) return []

    const scaledVot3ContractB3trBalance = new BigNumber(vot3ContractB3trBalance.scaled).toNumber()

    const notLockedB3tr = new BigNumber(b3trTokenDetails.circulatingSupply)
      .minus(scaledVot3ContractB3trBalance)
      .toNumber()

    return [
      { name: "Locked", value: scaledVot3ContractB3trBalance, color: secondaryColor },
      { name: "Free", value: notLockedB3tr, color: primaryColor },
    ]
  }, [b3trTokenDetails, vot3ContractB3trBalance, b3trTokenDetails, primaryColor, secondaryColor])

  const { tvlRatio, formattedTvlRatio } = useMemo(() => {
    if (!b3trTokenDetails || !vot3ContractB3trBalance) return { tvlRatio: 0, formattedTvlRatio: "0" }

    const scaledVot3ContractB3trBalance = new BigNumber(vot3ContractB3trBalance.scaled).toNumber()

    const circulatingSupply = new BigNumber(b3trTokenDetails.circulatingSupply).toNumber()

    const ratio = circulatingSupply / scaledVot3ContractB3trBalance
    return { tvlRatio: ratio, formattedTvlRatio: FormattingUtils.humanNumber(ratio, ratio) }
  }, [b3trTokenDetails, vot3ContractB3trBalance])

  useEffect(() => {
    if (!vot3ContractB3trBalance) return

    if (vot3ContractB3trBalance.scaled === "0") return setSelectedPieIndex(1)

    return setSelectedPieIndex(0)
  }, [b3trTokenDetails])

  const noData = useMemo(() => data.every(d => d.value === 0), [data])

  return (
    <Card w={"full"} h="full">
      <CardHeader>
        <VStack spacing={0} justify={"flex-start"} align="flex-start">
          <Heading size="md">TVL breakdown</Heading>
          <Text fontSize="sm">How much B3TR is locked in VOT3?</Text>
        </VStack>
      </CardHeader>
      <CardBody w="full">
        {noData ? (
          <Box h={"250"}>
            <Alert status="warning" borderRadius={"lg"}>
              <AlertIcon />
              <Box>
                <AlertTitle>No B3TR or VOT3 in circulation</AlertTitle>
                <AlertDescription>Mint some tokens to get started.</AlertDescription>
              </Box>
            </Alert>
          </Box>
        ) : (
          <Box w="full" h="250">
            <ResponsiveContainer width={"99%"} height={"100%"}>
              <PieChart title="TVL breakdown" desc={`Current TVL ratio is ${formattedTvlRatio}`}>
                <Pie
                  activeIndex={selectedPieIndex}
                  onMouseEnter={onPinEnter}
                  activeShape={RenderActiveShape}
                  data={data}
                  dataKey="value"
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
        )}
        <Alert status="info" borderRadius={"lg"} mt={8}>
          <AlertIcon />
          <Box>
            <AlertTitle>
              The current TVL ratio is {formattedTvlRatio}
              <Text as="sup">*</Text>{" "}
            </AlertTitle>
            <AlertDescription>
              This means that for every 1 B3TR in circulation, there are {(1 / tvlRatio).toFixed(2)} B3TR locked in
              VOT3.
            </AlertDescription>
          </Box>
        </Alert>
        <Text fontSize="xs" mt={2}>
          <Text as="sup">*</Text> If B3TR was trading at $1
        </Text>
      </CardBody>
    </Card>
  )
}
