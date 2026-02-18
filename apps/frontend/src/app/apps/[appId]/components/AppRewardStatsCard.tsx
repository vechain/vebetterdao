"use client"

import { Card, Heading, HStack, Icon, Link, Skeleton, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCoins, LuUsers, LuWallet, LuZap } from "react-icons/lu"

import { useAppAvailableFunds } from "@/api/contracts/x2EarnRewardsPool/hooks/getter/useAppAvailableFunds"
import { useAppRewardsBalance } from "@/api/contracts/x2EarnRewardsPool/hooks/getter/useAppRewardsBalance"
import { useAppActionOverview } from "@/api/indexer/actions/useAppActionOverview"

import { useXAppMetadata } from "../../../../api/contracts/xApps/hooks/useXAppMetadata"

import { DistributionStrategyModal } from "./AppDetailOverview/components/DistributionStrategyModal"

const compact = getCompactFormatter(1)

export const AppRewardStatsCard = () => {
  const { appId } = useParams<{ appId: string }>()
  const { t } = useTranslation()
  const { data: appOverview, isLoading: isOverviewLoading } = useAppActionOverview(appId ?? "")
  const { data: availableFunds, isLoading: isAvailableFundsLoading } = useAppAvailableFunds(appId ?? "")
  const { data: rewardsBalance, isLoading: isRewardsBalanceLoading } = useAppRewardsBalance(appId ?? "")
  const { data: appMetadata } = useXAppMetadata(appId ?? "")
  const { open: isModalOpen, onOpen: onOpenModal, onClose: onCloseModal } = useDisclosure()

  const totalAppBalance = useMemo(() => {
    return Number(availableFunds?.scaled ?? 0) + Number(rewardsBalance?.scaled ?? 0)
  }, [availableFunds, rewardsBalance])

  const isLoading = isOverviewLoading
  const isBalanceLoading = isAvailableFundsLoading || isRewardsBalanceLoading

  return (
    <>
      <Card.Root w="full" variant="primary" gap={4}>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center" w="full">
            <Heading size="xl">{t("Users rewards")}</Heading>
            <Link textStyle="md" fontWeight="semibold" color="actions.secondary.text-lighter" onClick={onOpenModal}>
              {t("More")}
              <UilArrowUpRight />
            </Link>
          </HStack>
        </Card.Header>

        <Card.Body>
          <VStack gap={4} align="stretch" w="full">
            <HStack gap={3} w="full" flexWrap="wrap">
              <StatItem
                icon={<LuWallet />}
                label={t("B3TR Balance")}
                value={compact.format(totalAppBalance)}
                isLoading={isBalanceLoading}
              />
              <StatItem
                icon={<LuCoins />}
                label={t("B3TR Distributed")}
                value={compact.format(appOverview?.totalRewardAmount ?? 0)}
                isLoading={isLoading}
                hasBorder
              />
            </HStack>
            <HStack gap={3} w="full" flexWrap="wrap">
              <StatItem
                icon={<LuZap />}
                label={t("Actions Rewarded")}
                value={compact.format(appOverview?.actionsRewarded ?? 0)}
                isLoading={isLoading}
              />
              <StatItem
                icon={<LuUsers />}
                label={t("Unique Users")}
                value={compact.format(appOverview?.totalUniqueUserInteractions ?? 0)}
                isLoading={isLoading}
                hasBorder
              />
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      <DistributionStrategyModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        distributionStrategy={appMetadata?.distribution_strategy ?? ""}
      />
    </>
  )
}

const StatItem = ({
  icon,
  label,
  value,
  isLoading,
  hasBorder,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isLoading: boolean
  hasBorder?: boolean
}) => (
  <HStack
    gap={2}
    align="center"
    flex="1"
    minW={0}
    {...(hasBorder ? { borderLeftWidth: "1px", borderColor: "border", pl: 3 } : {})}>
    <Icon boxSize={4} color="text.subtle" flexShrink={0}>
      {icon}
    </Icon>
    <VStack gap={0} align="flex-start" minW={0}>
      <Skeleton loading={isLoading}>
        <Text textStyle="sm" fontWeight="semibold" lineClamp={1}>
          {value}
        </Text>
      </Skeleton>
      <Text textStyle="xs" color="text.subtle" lineClamp={1}>
        {label}
      </Text>
    </VStack>
  </HStack>
)
