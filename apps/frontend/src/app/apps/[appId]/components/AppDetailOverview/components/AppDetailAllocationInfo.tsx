import { Card, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"

import { useAppAllocations } from "@/api/contracts/governance/hooks/useAppAllocations"

const compactFormatter = getCompactFormatter(2)
export const AppDetailAllocationInfo = () => {
  const { appId } = useParams<{ appId: string }>()
  const { totalAllocationReceived, lastRoundAllocationReceived, averageAllocationReceived } = useAppAllocations(appId)
  const { t } = useTranslation()
  return (
    <Card.Root bg="card.subtle" h={"full"} rounded="8px" flex={1.5}>
      <Card.Body gap={6}>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="36px" w="36px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Text textStyle={"4xl"} fontWeight="bold">
              {compactFormatter.format(totalAllocationReceived)}
            </Text>
          </HStack>
          <Text color="text.subtle">{t("Total B3TR received in allocations")}</Text>
        </VStack>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="18px" w="18px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Text textStyle={"lg"} fontWeight="semibold">
              {compactFormatter.format(lastRoundAllocationReceived)}
            </Text>
          </HStack>
          <Text color="text.subtle" textStyle="sm">
            {t("Received in latest allocation")}
          </Text>
        </VStack>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="18px" w="18px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Text textStyle={"lg"} fontWeight="semibold">
              {compactFormatter.format(averageAllocationReceived)}
            </Text>
          </HStack>
          <Text color="text.subtle" textStyle="sm">
            {t("Average allocation distribution")}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
