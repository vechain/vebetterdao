import { useB3trBalance, useB3trTokenDetails } from "@/api"
import { Box, Card, CardBody, CardHeader, HStack, Heading, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useMemo } from "react"
import BigNumber from "bignumber.js"
import { getConfig } from "@repo/config"
import { motion } from "framer-motion"
import { BaseTooltip } from "./BaseTooltip"
import { FiInfo } from "react-icons/fi"
import { useTranslation } from "react-i18next"

export const SupplyBreakdownCard = () => {
  const { t } = useTranslation()

  const { data: b3trTokenDetails } = useB3trTokenDetails()
  const { data: vot3ContractB3trBalance } = useB3trBalance(getConfig().vot3ContractAddress)

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
    <Card>
      <CardHeader>
        <HStack w="full" justify={"space-between"}>
          <Heading size="md">{t("Supply breakdown")}</Heading>
          <BaseTooltip
            text={`B3TR tokens are generated weekly and distributed to x2earn apps, the DAO Treasury and to the VotingRewards contract.`}>
            <span>
              <Icon as={FiInfo} color="rgba(0, 76, 252, 1)" position={"relative"} />
            </span>
          </BaseTooltip>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="flex-start">
          <HStack spacing={16}>
            <VStack spacing={1} align="flex-start">
              <Text size="sm" fontWeight="400">
                {t("B3TR in circulation")}
              </Text>
              <Skeleton isLoaded={!!data}>
                <Heading size="lg" color={"#004CFC"}>
                  {formattedB3trCirculatingSupply}
                </Heading>
              </Skeleton>
            </VStack>
            <VStack spacing={1} align="flex-start">
              <Text size="sm" fontWeight="400">
                {t("VOT3 in circulation")}
              </Text>
              <Skeleton isLoaded={!!data}>
                <Heading size="lg" color={"#3DBA67"}>
                  {formattedVot3CirculatingSupply}
                </Heading>
              </Skeleton>
            </VStack>
          </HStack>
          {!data ? (
            <Skeleton h={10} w="full" />
          ) : (
            <HStack spacing={1} w="full" h={5}>
              <Box
                as={motion.div}
                initial={{
                  width: 0,
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                  width: `${data.b3trCirculatingSupply.percentage}%`,
                  transition: {
                    duration: 0.25,
                  },
                }}
                zIndex={2}
                w={data.b3trCirculatingSupply.percentage}
                h={"full"}
                bg={" linear-gradient(to bottom, #004CFC , #447CFF)"}
                borderRadius={"md"}
              />
              <Box
                as={motion.div}
                initial={{
                  width: 0,
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                  width: `${data.vot3CirculatingSupply.percentage}%`,
                  transition: {
                    duration: 0.25,
                  },
                }}
                zIndex={1}
                w={data.vot3CirculatingSupply.percentage}
                h={"full"}
                bg={" linear-gradient(to bottom, #84E718 , #A0F04A)"}
                borderRadius={"md"}
              />
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
