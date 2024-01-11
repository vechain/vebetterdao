import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, TooltipProps } from "recharts"
import { useB3trTokenDetails } from "@/api"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Fade,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  useMediaQuery,
  useToken,
} from "@chakra-ui/react"
import { useMemo } from "react"
import { FormattingUtils } from "@repo/utils"
import BigNumber from "bignumber.js"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

const CustomTooltip = <TValue extends ValueType, TName extends NameType>({
  totalSupply,
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType> & { totalSupply: number }) => {
  const valuePercentage = useMemo(() => {
    if (!active || !payload || !payload[0] || !totalSupply) return 0
    const value = payload[0].value as number
    return (value / totalSupply) * 100
  }, [active, payload, totalSupply])
  if (!active) return null

  return (
    <Fade in={true}>
      <Box p={4} color="white" mt="4" bg="gray.500" rounded="md" shadow="md">
        {valuePercentage.toFixed(2)}%
      </Box>
    </Fade>
  )
}
export const CirculatingSupplyPieChart = () => {
  const [isDesktop] = useMediaQuery("(min-width: 800px)")

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
      { name: "Circulating supply", value: circulatingSupply, color: primaryColor },
      { name: "Locked supply", value: lockedSupply, color: grayColor },
    ]
  }, [b3trTokenDetails, b3trTokenDetails, primaryColor, grayColor])

  const circulatingSupplyPercentage = useMemo(() => {
    if (!b3trTokenDetails) return 0

    const percentage = new BigNumber(b3trTokenDetails.circulatingSupply)
      .dividedBy(b3trTokenDetails.totalSupply)
      .multipliedBy(100)

    return percentage.toNumber()
  }, [b3trTokenDetails])

  const totalSupply = useMemo(() => {
    if (!b3trTokenDetails) return 0

    return new BigNumber(b3trTokenDetails.totalSupply).toNumber()
  }, [b3trTokenDetails])

  return (
    <Card w={["full", "full", "50%"]} h={400}>
      <CardHeader>
        <VStack spacing={2} justify={"flex-start"} align="flex-start">
          <Heading size="md">Circulating supply</Heading>
        </VStack>
      </CardHeader>
      <CardBody w="full">
        <Box w="full" h="250">
          <ResponsiveContainer width={"99%"} height={"100%"}>
            <PieChart title="B3TR/VOT3 breakdown" desc={`Current B3TR/VOT3 ratio is 1:${circulatingSupplyPercentage}`}>
              <Pie
                data={data}
                dataKey="value"
                // startAngle={180}
                // endAngle={0}
                paddingAngle={5}
                // cx="50%"
                // cy="50%"
                outerRadius={"80%"}
                innerRadius={"60%"}
                fill="#8884d8"
                label={({ name, value }) => `${FormattingUtils.humanNumber(value, value)} ${name}`}>
                {data.map(entry => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={props => <CustomTooltip totalSupply={totalSupply} {...props} />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Text textAlign={"center"} size="sm">
          Current B3TR/VOT3 ratio is
          <b> 1:{circulatingSupplyPercentage}</b>
        </Text>
      </CardBody>
    </Card>
  )
}
