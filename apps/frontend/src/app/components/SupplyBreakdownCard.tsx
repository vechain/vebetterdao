import { Box, Card, HStack, Heading, Icon, Skeleton, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import BigNumber from "bignumber.js"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiInfo } from "react-icons/fi"

import { useGetB3trBalance } from "../../hooks/useGetB3trBalance"
import { useB3trTokenDetails } from "../../api/contracts/b3tr/hooks/useB3trTokenDetails"

import { Tooltip } from "@/components/ui/tooltip"

export const SupplyBreakdownCard = () => {
  const { t } = useTranslation()
  const { data: b3trTokenDetails } = useB3trTokenDetails()
  const { data: vot3ContractB3trBalance } = useGetB3trBalance(getConfig().vot3ContractAddress)
  const data = useMemo(() => {
    if (!b3trTokenDetails || !vot3ContractB3trBalance) return undefined
    const b3trCirculatingSupply = new BigNumber(b3trTokenDetails.circulatingSupply)
      .minus(vot3ContractB3trBalance?.scaled ?? 0)
      .toNumber()
    const vot3CirculatingSupply = new BigNumber(vot3ContractB3trBalance?.scaled ?? 0).toNumber()
    const totalCirculatingSupply = new BigNumber(b3trTokenDetails.circulatingSupply).toNumber()
    const b3trCirculatingSupplyPercentage = new BigNumber(b3trCirculatingSupply)
      .dividedBy(totalCirculatingSupply)
      .multipliedBy(100)
      .toNumber()
    const vot3CirculatingSupplyPercentage = new BigNumber(vot3CirculatingSupply)
      .dividedBy(totalCirculatingSupply)
      .multipliedBy(100)
      .toNumber()
    return {
      b3trCirculatingSupply: {
        name: "B3TR in circulation",
        value: b3trCirculatingSupply,
        percentage: b3trCirculatingSupplyPercentage,
      },
      vot3CirculatingSupply: {
        name: "VOT3 in circulation",
        value: vot3CirculatingSupply,
        percentage: vot3CirculatingSupplyPercentage,
      },
    }
  }, [b3trTokenDetails, vot3ContractB3trBalance])

  const formattedB3trCirculatingSupply = useMemo(() => {
    return FormattingUtils.humanNumber(data?.b3trCirculatingSupply.value ?? 0)
  }, [data])

  const formattedVot3CirculatingSupply = useMemo(() => {
    return FormattingUtils.humanNumber(data?.vot3CirculatingSupply.value ?? 0)
  }, [data])

  return (
    <Card.Root variant="primary" w="full">
      <Card.Header>
        <HStack w="full" justify={"space-between"}>
          <Heading size="xl">{t("Supply breakdown")}</Heading>
          <Tooltip
            content={t(
              `B3TR tokens are generated weekly and distributed to x2earn apps, the DAO Treasury and to the VotingRewards contract.`,
            )}>
            <Icon as={FiInfo} color="actions.tertiary.default" position={"relative"} />
          </Tooltip>
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack gap={4} align="flex-start">
          <SimpleGrid templateColumns={["repeat(1, 2fr)", "repeat(1, 2fr)", "repeat(3, 1fr)"]} w="full" gap={4}>
            <VStack gap={1} align="flex-start">
              <Text textStyle="md">{t("B3TR in circulation")}</Text>
              <Skeleton loading={!data}>
                <Heading size={["2xl", "2xl", "xl"]} color="brand.primary">
                  {formattedB3trCirculatingSupply}
                </Heading>
              </Skeleton>
            </VStack>
            <VStack gap={1} align="flex-start">
              <Text textStyle="md">{t("VOT3 in circulation")}</Text>
              <Skeleton loading={!data}>
                <Heading size={["2xl", "2xl", "xl"]} color={"brand.secondary"}>
                  {formattedVot3CirculatingSupply}
                </Heading>
              </Skeleton>
            </VStack>
          </SimpleGrid>
          {!data ? (
            <Skeleton h={10} w="full" />
          ) : (
            <HStack gap={1} w="full" h={5}>
              <Box
                zIndex={2}
                w={`${data.b3trCirculatingSupply.percentage}%`}
                h={"full"}
                bg={" linear-gradient(to bottom, #004CFC , #447CFF)"}
                borderRadius={"md"}
              />
              <Box
                zIndex={1}
                w={`${data.vot3CirculatingSupply.percentage}%`}
                h={"full"}
                bg={" linear-gradient(to bottom, #84E718 , #A0F04A)"}
                borderRadius={"md"}
              />
            </HStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
