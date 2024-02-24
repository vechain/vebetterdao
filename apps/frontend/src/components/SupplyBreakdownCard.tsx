import { useB3trBalance, useB3trTokenDetails } from "@/api"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Heading,
  Skeleton,
  Text,
  VStack,
  color,
  useColorModeValue,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useMemo } from "react"
import BigNumber from "bignumber.js"
import { getConfig } from "@repo/config"

export const SupplyBreakdownCard = () => {
  const { data: b3trTokenDetails } = useB3trTokenDetails()

  const greenColor = useColorModeValue("green.500", "green.200")
  const primaryColor = useColorModeValue("primary.500", "primary.200")

  const grayColor = useColorModeValue("gray.500", "gray.200")

  const { data: vot3ContractB3trBalance } = useB3trBalance(getConfig().vot3ContractAddress)

  const data = useMemo(() => {
    if (!b3trTokenDetails) return undefined

    const circulatingSupply = new BigNumber(b3trTokenDetails.circulatingSupply).toNumber()
    const notInCirculationSupply = new BigNumber(b3trTokenDetails.totalSupply).minus(circulatingSupply).toNumber()

    const circulatingSupplyPercentage = new BigNumber(circulatingSupply)
      .dividedBy(b3trTokenDetails.totalSupply)
      .toNumber()
    const notInCirculationSupplyPercentage = new BigNumber(notInCirculationSupply)
      .dividedBy(b3trTokenDetails.totalSupply)
      .toNumber()

    const lockedB3tr = new BigNumber(vot3ContractB3trBalance?.scaled ?? 0).toNumber()
    const lockedB3trPercentage = new BigNumber(lockedB3tr).dividedBy(b3trTokenDetails.totalSupply).toNumber()

    const notLockedB3tr = new BigNumber(b3trTokenDetails.circulatingSupply).minus(lockedB3tr).toNumber()
    const notLockedB3trPercentage = new BigNumber(notLockedB3tr).dividedBy(b3trTokenDetails.totalSupply).toNumber()

    return {
      free: { name: "Free", value: notLockedB3tr, percentage: notLockedB3trPercentage, color: primaryColor },
      locked: { name: "Locked", value: lockedB3tr, percentage: lockedB3trPercentage, color: greenColor },
      notInCirculation: {
        name: "Not in circulation",
        value: notInCirculationSupply,
        percentage: notInCirculationSupplyPercentage,
        color: grayColor,
      },
      circulating: {
        name: "Circulating",
        value: circulatingSupply,
        percentage: circulatingSupplyPercentage,
        color: primaryColor,
      },
    }
  }, [b3trTokenDetails, vot3ContractB3trBalance, primaryColor, grayColor, greenColor])

  const tvlRatioPercentage = useMemo(() => {
    if (!data) return 0
    return new BigNumber(data.locked.value).dividedBy(data.circulating.value).toNumber() * 100
  }, [data])

  const formattedTotalSupply = useMemo(() => {
    if (!b3trTokenDetails) return 0

    return FormattingUtils.humanNumber(b3trTokenDetails.totalSupply)
  }, [b3trTokenDetails])

  const formattedTotalValueLocked = useMemo(() => {
    if (!data) return 0

    return FormattingUtils.humanNumber(data.locked.value)
  }, [data])

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Supply breakdown</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="flex-start">
          <VStack spacing={1} align="flex-start">
            <Text size="sm">Total supply</Text>
            <Heading size="xl" color={primaryColor}>
              {formattedTotalSupply}
            </Heading>
          </VStack>
          {!data ? (
            <Skeleton h={10} w="full" />
          ) : (
            <HStack spacing={1} w="full" h={5}>
              <Box w={data.free.percentage} h={"full"} bg={primaryColor} borderRadius={"lg"} />
              <Box w={data.locked.percentage} h={"full"} bg={greenColor} borderRadius={"lg"} />
              <Box w={data.notInCirculation.percentage} h={"full"} bg={grayColor} borderRadius={"lg"} />
            </HStack>
          )}

          <HStack spacing={16}>
            <VStack spacing={1} align="flex-start">
              <Text size="sm">Total Value Locked</Text>
              <Heading size="lg" color={greenColor}>
                {formattedTotalValueLocked}
              </Heading>
            </VStack>
            <VStack spacing={1} align="flex-start">
              <Text size="sm">TVL Ratio</Text>
              <Heading size="lg" color={greenColor}>
                {tvlRatioPercentage.toFixed(2)}%
              </Heading>
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
