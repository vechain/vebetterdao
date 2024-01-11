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
import { config } from "@repo/config"
import { useMemo, useState } from "react"
import { FormattingUtils } from "@repo/utils"
import BigNumber from "bignumber.js"
import dayjs from "dayjs"
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
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill={fill}>{`${formattedValue} ${payload.name}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={grayColor}>
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  )
}

export const TokensBreakdownPieChart = () => {
  const [selectedPieIndex, setSelectedPieIndex] = useState(0)

  const onPinEnter = (_: any, index: number) => {
    setSelectedPieIndex(index)
  }

  const [primary500, primary200, secondary500, secondary200] = useToken("colors", [
    "primary.500",
    "primary.200",
    "secondary.500",
    "secondary.200",
  ])
  const primaryColor = useColorModeValue(primary500, primary200)
  const secondaryColor = useColorModeValue(secondary500, secondary200)

  const { data: b3trTokenDetails } = useB3trTokenDetails()
  const { data: vot3ContractB3trBalance } = useB3trBalance(config.vot3ContractAddress)

  const data = useMemo(() => {
    if (!b3trTokenDetails || !vot3ContractB3trBalance) return []

    const scaledVot3ContractB3trBalance = new BigNumber(
      FormattingUtils.scaleNumberDown(vot3ContractB3trBalance, b3trTokenDetails.decimals),
    ).toNumber()

    const notLockedB3tr = new BigNumber(b3trTokenDetails.circulatingSupply)
      .minus(scaledVot3ContractB3trBalance)
      .toNumber()

    return [
      { name: "B3TR", value: notLockedB3tr, color: primaryColor },
      { name: "VOT3", value: scaledVot3ContractB3trBalance, color: secondaryColor },
    ]
  }, [b3trTokenDetails, vot3ContractB3trBalance, b3trTokenDetails, primaryColor, secondaryColor])

  const { tvlRatio, formattedTvlRatio } = useMemo(() => {
    if (!b3trTokenDetails || !vot3ContractB3trBalance) return 0

    const scaledVot3ContractB3trBalance = new BigNumber(
      FormattingUtils.scaleNumberDown(vot3ContractB3trBalance, b3trTokenDetails.decimals),
    ).toNumber()

    const circulatingSupply = new BigNumber(b3trTokenDetails.circulatingSupply).toNumber()

    const ratio = circulatingSupply / scaledVot3ContractB3trBalance
    return { tvlRatio: ratio, formattedTvlRatio: FormattingUtils.humanNumber(ratio, ratio) }
  }, [b3trTokenDetails, vot3ContractB3trBalance])

  return (
    <Card w={["full", "full", "50%"]} h={550}>
      <CardHeader>
        <VStack spacing={0} justify={"flex-start"} align="flex-start">
          <Heading size="md">TVL breakdown</Heading>
          <Text fontSize="sm" color="gray">
            How much B3TR is locked in VOT3?
          </Text>
        </VStack>
      </CardHeader>
      <CardBody w="full">
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
        <Alert status="info" borderRadius={"lg"} mt={8}>
          <AlertIcon />
          <Box>
            <AlertTitle>The current TVL ratio is {formattedTvlRatio} </AlertTitle>
            <AlertDescription>
              This means that for every 1 B3TR in circulation, there are {(1 / tvlRatio).toFixed(2)} B3TR locked in
              VOT3.
            </AlertDescription>
          </Box>
        </Alert>
      </CardBody>
    </Card>
  )
}
