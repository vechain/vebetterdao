import { Button, Card, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LuShield } from "react-icons/lu"

import { useGetCitizenCount } from "@/api/contracts/navigatorRegistry/hooks/useGetCitizenCount"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useGetTotalDelegated } from "@/api/contracts/navigatorRegistry/hooks/useGetTotalDelegated"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"

const formatter = getCompactFormatter(2)

export const NavigatorMyStatusCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const address = account?.address ?? ""

  const { data: stake, isLoading: stakeLoading } = useGetStake(address)
  const { data: citizenCount, isLoading: citizensLoading } = useGetCitizenCount(address)
  const { data: totalDelegated, isLoading: delegatedLoading } = useGetTotalDelegated(address)

  return (
    <Card.Root variant="outline" borderColor="green.500" borderRadius="xl">
      <Card.Body>
        <VStack gap={3} align="start">
          <HStack gap={2}>
            <LuShield size={18} color="var(--chakra-colors-green-500)" />
            <Heading size="sm">{t("My Navigator")}</Heading>
          </HStack>

          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Staked")}
            </Text>
            <Skeleton loading={stakeLoading}>
              <HStack gap={1}>
                <Text textStyle="sm" fontWeight="semibold">
                  {stake ? formatter.format(Number(stake.scaled)) : "0"}
                </Text>
                <B3TRIcon boxSize={4} />
              </HStack>
            </Skeleton>
          </HStack>

          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Citizens")}
            </Text>
            <Skeleton loading={citizensLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {citizenCount ?? 0}
              </Text>
            </Skeleton>
          </HStack>

          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Total Delegated")}
            </Text>
            <Skeleton loading={delegatedLoading}>
              <HStack gap={1}>
                <Text textStyle="sm" fontWeight="semibold">
                  {totalDelegated ? formatter.format(Number(totalDelegated.scaled)) : "0"}
                </Text>
                <VOT3Icon boxSize={4} />
              </HStack>
            </Skeleton>
          </HStack>

          <Button w="full" variant="primary" size="sm" mt={1} onClick={() => router.push(`/navigators/${address}`)}>
            {t("View my page")}
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
