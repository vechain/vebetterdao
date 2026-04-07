import { Card, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"

export const NavigatorDetailsCard = () => {
  const { t } = useTranslation()
  const { data: minStake } = useGetMinStake()

  return (
    <Card.Root variant="outline" borderRadius="xl">
      <Card.Body>
        <VStack gap={3} align="start">
          <Heading size="sm">{t("Details")}</Heading>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Min Stake")}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {minStake ? Number(minStake.scaled).toLocaleString() : "-"} {t("B3TR")}
            </Text>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Navigator Fee")}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {t("20%")}
            </Text>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Fee Lock Period")}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {t("4 rounds")}
            </Text>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Capacity Ratio")}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {t("10:1 (stake:delegation)")}
            </Text>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
