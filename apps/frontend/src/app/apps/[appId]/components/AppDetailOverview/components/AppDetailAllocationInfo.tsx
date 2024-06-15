import { useAppAllocations } from "@/api/contracts/governance/hooks/useAppAllocations"
import { Flex, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

export const AppDetailAllocationInfo = () => {
  const { appId } = useParams<{ appId: string }>()
  const { totalAllocationReceived, lastRoundAllocationReceived, averageAllocationReceived } = useAppAllocations(appId)

  const { t } = useTranslation()
  return (
    <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" flex={1.5} borderWidth={1}>
      <VStack p="24px" alignItems={"stretch"} w="full" justify={"space-between"} gap={6}>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="36px" w="36px" src="/images/b3tr-token.png" alt="vot3-token" />
            <Text fontSize={"36px"} fontWeight={700}>
              {compactFormatter.format(totalAllocationReceived)}
            </Text>
          </HStack>
          <Text color="#6A6A6A">{t("Total B3TR received in allocations")}</Text>
        </VStack>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="18px" w="18px" src="/images/b3tr-token.png" alt="vot3-token" />
            <Text fontSize={"18px"} fontWeight={600}>
              {compactFormatter.format(lastRoundAllocationReceived)}
            </Text>
          </HStack>
          <Text color="#6A6A6A" fontSize="14px">
            {t("Received in latest allocation")}
          </Text>
        </VStack>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="18px" w="18px" src="/images/b3tr-token.png" alt="vot3-token" />
            <Text fontSize={"18px"} fontWeight={600}>
              {compactFormatter.format(averageAllocationReceived)}
            </Text>
          </HStack>
          <Text color="#6A6A6A" fontSize="14px">
            {t("Average allocation distribution")}
          </Text>
        </VStack>
      </VStack>
    </Flex>
  )
}
