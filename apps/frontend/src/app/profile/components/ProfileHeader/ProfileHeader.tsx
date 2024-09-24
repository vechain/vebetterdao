import React from "react"
import { Text, Tag, VStack, HStack, Card, CardBody } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { useTranslation } from "react-i18next"
import { useProfile } from "../../hooks"

export const ProfileHeader = () => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const { tags, totalActions, totalB3trEarn, usedApps } = useProfile()

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <HStack gap={4}>
            <AddressIcon address={account || ""} rounded={"full"} h={12} />
            <VStack align="stretch" spacing={2} flex={1}>
              <Text fontSize="xl" fontWeight="bold">
                {humanAddress(account || "")}
              </Text>
              <HStack spacing={2}>
                {tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </HStack>
            </VStack>
          </HStack>
          <HStack gap={8} justify="space-between">
            <VStack align="flex-start" gap={0}>
              <Text fontSize="lg" fontWeight="bold">
                {totalActions}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {t("total actions")}
              </Text>
            </VStack>
            <VStack align="flex-start" gap={0}>
              <Text fontSize="lg" fontWeight="bold">
                {totalB3trEarn}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {t("total b3tr earn")}
              </Text>
            </VStack>
            <VStack align="flex-start" gap={0}>
              <Text fontSize="lg" fontWeight="bold">
                {usedApps}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {t("used apps")}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
