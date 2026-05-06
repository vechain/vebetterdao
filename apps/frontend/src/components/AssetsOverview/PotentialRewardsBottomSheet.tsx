"use client"

import { Box, HStack, Icon, Text, VStack, Badge, useMediaQuery, Dialog, Portal, CloseButton } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import {
  Gift,
  Check,
  Xmark,
  StarSolid,
  Flash,
  RefreshDouble,
  InfoCircle,
  NavArrowRight,
  UserStar,
  Sparks,
} from "iconoir-react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { Transaction } from "@/api/indexer/transactions/useTransactions"
import { ActivityItemProps, ActivityList } from "@/components/AssetsOverview/ActivityList"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { timestampToTimeLeftCompact } from "@/utils/date"
import type { RewardCalculationResult } from "@/utils/rewardCalculation"

type Props = {
  isOpen: boolean
  onClose: () => void
  reward: RewardCalculationResult | null
  currentRoundId: bigint | undefined
  hasVoted: boolean
  hasGmNft: boolean
  hadAutoVotingEnabled: boolean
  relayerFeePercentage: bigint
  unvotedProposalCount: number
  totalProposalCount: number
  roundEndTimestamp: import("dayjs").Dayjs | null
  isDelegating: boolean
  navigatorFeePercentage: bigint
  freshnessLabel: string | null
}

const REWARDS_EVENT_NAMES = ["B3TR_CLAIM_REWARD"] as const
const compactFormatter = getCompactFormatter(2)

const CheckItem = ({ label, checked, extra }: { label: string; checked: boolean; extra?: React.ReactNode }) => (
  <HStack gap="2" p="2" rounded="md" bg="card.subtle">
    <Icon boxSize="4" color={checked ? "status.positive.strong" : "status.negative.strong"}>
      {checked ? <Check /> : <Xmark />}
    </Icon>
    <Text textStyle="sm" flex={1}>
      {label}
    </Text>
    {extra}
    <Badge variant={checked ? "positive" : "negative"} size="sm">
      {checked ? "Done" : "Missing"}
    </Badge>
  </HStack>
)

const RewardLine = ({ label, amount, variant }: { label: string; amount: string; variant?: "fee" }) => (
  <HStack justify="space-between" py="1">
    <Text textStyle="sm" color="text.subtle">
      {label}
    </Text>
    <Text textStyle="sm" fontWeight="semibold" color={variant === "fee" ? "status.negative.strong" : undefined}>
      {variant === "fee" ? "-" : ""}
      {amount}
      {" B3TR"}
    </Text>
  </HStack>
)

const RewardsContent = ({
  onClose,
  reward,
  currentRoundId,
  hasVoted,
  hasGmNft,
  hadAutoVotingEnabled,
  relayerFeePercentage,
  unvotedProposalCount,
  totalProposalCount,
  roundEndTimestamp,
  isDelegating,
  navigatorFeePercentage,
  freshnessLabel,
}: Omit<Props, "isOpen">) => {
  const { t } = useTranslation()
  const router = useRouter()

  const fmt = (val: bigint) => Number(formatEther(val)).toFixed(2)

  const getRewardsActivityProps = useCallback(
    (tx: Transaction): ActivityItemProps | null => {
      if (tx.eventName !== "B3TR_CLAIM_REWARD") return null
      return {
        label: tx.roundId ? t("Claimed reward for round {{round}}", { round: tx.roundId }) : t("Claimed rewards"),
        icon: <Gift />,
        iconBg: "status.positive.subtle",
        iconColor: "status.positive.strong",
        amount: tx.value ? compactFormatter.format(Number(formatEther(BigInt(tx.value)))) : "0",
        token: "B3TR",
        sign: "+",
        amountColor: "status.positive.strong",
      }
    },
    [t],
  )
  const hasProposals = totalProposalCount > 0
  const hasVotedOnAllProposals = hasProposals && unvotedProposalCount === 0
  const timeLeft = roundEndTimestamp ? timestampToTimeLeftCompact(roundEndTimestamp.valueOf()) : null

  return (
    <VStack gap="4" align="stretch">
      {reward && reward.netTotal > 0n && (
        <Box p="4" rounded="lg" bg="status.warning.subtle">
          <Text textStyle="xs" color="text.subtle" mb="1">
            {t("Estimated total")}
          </Text>
          <Text textStyle="2xl" fontWeight="bold">
            {fmt(reward.netTotal)}
            {" B3TR"}
          </Text>

          <Box mt="3" pt="3" borderTopWidth="1px" borderColor="border.primary">
            <RewardLine label={t("From voting")} amount={fmt(reward.netReward)} />
            {reward.netGmReward > 0n && (
              <RewardLine label={t("From Galaxy Member NFT")} amount={fmt(reward.netGmReward)} />
            )}
            {isDelegating && reward.navigatorFee > 0n && (
              <RewardLine label={t("Navigator fee")} amount={fmt(reward.navigatorFee)} variant="fee" />
            )}
            {!isDelegating && reward.fee > 0n && (
              <RewardLine label={t("Auto-voting fee")} amount={fmt(reward.fee)} variant="fee" />
            )}
          </Box>
        </Box>
      )}

      {reward && reward.netTotal === 0n && (
        <Box p="4" rounded="lg" bg="card.subtle" textAlign="center">
          <Icon boxSize="8" color="text.subtle" mx="auto" mb="2">
            <Gift />
          </Icon>
          <Text textStyle="sm" color="text.subtle">
            {t("Vote this round to start earning rewards.")}
          </Text>
        </Box>
      )}

      <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
        {t("Actions to maximize rewards")}
      </Text>

      <VStack gap="1.5" align="stretch">
        <CheckItem
          label={t("Voted this round")}
          checked={hasVoted}
          extra={
            freshnessLabel ? (
              <Badge variant={freshnessLabel === "x1" ? "warning" : "positive"} size="sm" gap="0.5">
                <Icon as={Sparks} boxSize="3" />
                {freshnessLabel}
              </Badge>
            ) : undefined
          }
        />
        {hasProposals && <CheckItem label={t("Voted on all proposals")} checked={hasVotedOnAllProposals} />}
        <CheckItem label={t("Own a Galaxy Member NFT")} checked={hasGmNft} />
      </VStack>

      <ActivityList eventNames={[...REWARDS_EVENT_NAMES]} getActivityProps={getRewardsActivityProps} />

      <Text textStyle="sm" fontWeight="semibold" color="text.subtle" mt="1">
        {t("How it works")}
      </Text>

      <VStack gap="2" align="stretch">
        <HStack
          gap="3"
          p="3"
          rounded="lg"
          bg="card.subtle"
          align="start"
          cursor="pointer"
          onClick={() => {
            onClose()
            router.push("/allocations")
          }}
          _hover={{ opacity: 0.85 }}>
          <Icon boxSize="5" color="text.subtle" mt="0.5">
            <Flash />
          </Icon>
          <VStack align="start" gap="0.5" flex={1}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("Proportional to your votes")}
            </Text>
            <Text textStyle="xs" color="text.subtle">
              {t(
                "Your share of the reward pool depends on your voting weight. The more people vote, the smaller each share.",
              )}
            </Text>
          </VStack>
          <Icon boxSize="4" color="text.subtle" mt="1">
            <NavArrowRight />
          </Icon>
        </HStack>

        <HStack
          gap="3"
          p="3"
          rounded="lg"
          bg="card.subtle"
          align="start"
          cursor="pointer"
          onClick={() => {
            onClose()
            router.push("/galaxy-member")
          }}
          _hover={{ opacity: 0.85 }}>
          <Icon boxSize="5" color="text.subtle" mt="0.5">
            <StarSolid />
          </Icon>
          <VStack align="start" gap="0.5" flex={1}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("Boost with Galaxy Member NFT")}
            </Text>
            <Text textStyle="xs" color="text.subtle">
              {t("Higher GM level means a bigger multiplier on your rewards from a separate pool.")}
            </Text>
          </VStack>
          <Icon boxSize="4" color="text.subtle" mt="1">
            <NavArrowRight />
          </Icon>
        </HStack>

        {hadAutoVotingEnabled && !isDelegating && (
          <HStack gap="3" p="3" rounded="lg" bg="card.subtle" align="start">
            <Icon boxSize="5" color="text.subtle" mt="0.5">
              <RefreshDouble />
            </Icon>
            <VStack align="start" gap="0.5" flex={1}>
              <Text textStyle="sm" fontWeight="semibold">
                {t("Auto-voting fee")}
              </Text>
              <Text textStyle="xs" color="text.subtle">
                {t("A {{fee}}% fee is deducted for the auto-voting service.", {
                  fee: relayerFeePercentage.toString(),
                })}
              </Text>
            </VStack>
          </HStack>
        )}

        {isDelegating && (
          <HStack gap="3" p="3" rounded="lg" bg="card.subtle" align="start">
            <Icon boxSize="5" color="text.subtle" mt="0.5">
              <UserStar />
            </Icon>
            <VStack align="start" gap="0.5" flex={1}>
              <Text textStyle="sm" fontWeight="semibold">
                {t("Navigator fee")}
              </Text>
              <Text textStyle="xs" color="text.subtle">
                {t("A {{fee}}% fee is deducted for the navigator service.", {
                  fee: (navigatorFeePercentage / 100n).toString(),
                })}
              </Text>
            </VStack>
          </HStack>
        )}

        <HStack gap="3" p="3" rounded="lg" bg="card.subtle" align="start">
          <Icon boxSize="5" color="text.subtle" mt="0.5">
            <InfoCircle />
          </Icon>
          <VStack align="start" gap="0.5" flex={1}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("When are rewards claimable?")}
            </Text>
            <Text textStyle="xs" color="text.subtle">
              {currentRoundId && timeLeft
                ? t("Rewards from round #{{round}} become claimable once the round ends, in approximately {{time}}.", {
                    round: currentRoundId.toString(),
                    time: timeLeft,
                  })
                : currentRoundId
                  ? t("Rewards from round #{{round}} become claimable once the round ends.", {
                      round: currentRoundId.toString(),
                    })
                  : t("Rewards become claimable after the round ends.")}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  )
}

export const PotentialRewardsBottomSheet = (props: Props) => {
  const { isOpen, onClose } = props
  const { t } = useTranslation()
  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])

  if (isDesktop) {
    return (
      <Dialog.Root
        open={isOpen}
        onOpenChange={details => {
          if (!details.open) onClose()
        }}
        size="lg"
        scrollBehavior="inside"
        trapFocus={false}
        unmountOnExit>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content rounded="2xl" maxH="80vh" overflowY="auto">
              <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
                <Dialog.Title fontWeight="bold" textStyle="xl">
                  {t("Your rewards")}
                </Dialog.Title>
                <Dialog.CloseTrigger asChild position="static">
                  <CloseButton size="md" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body py={4}>
                <RewardsContent {...props} />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    )
  }

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={t("Your rewards")}
      ariaDescription={t("Breakdown of your potential rewards")}
      title={t("Your rewards")}>
      <RewardsContent {...props} />
    </BaseBottomSheet>
  )
}
