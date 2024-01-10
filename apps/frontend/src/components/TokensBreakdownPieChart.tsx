import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useB3trBalance, useB3trTokenDetails } from "@/api"
import { Card, CardBody, CardHeader, Heading, Text, VStack, useColorModeValue, useToken } from "@chakra-ui/react"
import { config } from "@repo/config"
import { useMemo } from "react"
import { FormattingUtils } from "@repo/utils"
import BigNumber from "bignumber.js"

export const TokensBreakdownPieChart = () => {
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

  const b3trVot3Ratio = useMemo(() => {
    if (!b3trTokenDetails || !vot3ContractB3trBalance) return 0

    const scaledVot3ContractB3trBalance = new BigNumber(
      FormattingUtils.scaleNumberDown(vot3ContractB3trBalance, b3trTokenDetails.decimals),
    ).toNumber()

    const notLockedB3tr = new BigNumber(b3trTokenDetails.circulatingSupply)
      .minus(scaledVot3ContractB3trBalance)
      .toNumber()

    const ratio = scaledVot3ContractB3trBalance / notLockedB3tr
    return FormattingUtils.humanNumber(ratio, ratio)
  }, [b3trTokenDetails, vot3ContractB3trBalance])

  return (
    <Card w="50%" h={600}>
      <CardHeader>
        <VStack spacing={2} justify={"flex-start"} align="flex-start">
          <Heading size="md">BT3R/VOT3 breakdown</Heading>
          <Text>Current B3TR/VOT3 ratio is 1:{b3trVot3Ratio}</Text>
        </VStack>
      </CardHeader>
      <CardBody w="full" h={600}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart width={400} height={400}>
            <Pie
              dataKey="value"
              startAngle={180}
              endAngle={0}
              paddingAngle={5}
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={60}
              fill="#8884d8"
              label>
              {data.map(entry => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  )
}
