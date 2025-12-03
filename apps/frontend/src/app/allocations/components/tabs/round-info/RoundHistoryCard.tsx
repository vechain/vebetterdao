"use client"

import { Card, Heading, HStack, Icon, LinkBox, LinkOverlay, Mark, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { RoundEarnings } from "@/app/allocations/history/page"
import B3TR from "@/components/Icons/svg/b3tr.svg"
import { useEvents } from "@/hooks/useEvents"

const abi = VoterRewards__factory.abi
const contractAddress = getConfig().voterRewardsContractAddress as `0x${string}`

export function RoundHistoryCard({ round }: { round: RoundEarnings }) {
  const { t } = useTranslation()
  const { roundId, vote2EarnAmount: totalReward, roundStart, roundEnd } = round
  const { account } = useWallet()
  const { data: rewardClaimed, isLoading: isRewardClaimedLoading } = useEvents({
    abi,
    contractAddress,
    eventName: "RewardClaimedV2",
    filterParams: {
      cycle: BigInt(round.roundId),
      voter: (account?.address ?? "") as `0x${string}`,
    },
    select: events =>
      events.map(({ decodedData }) => {
        const reward = decodedData.args.reward + decodedData.args.gmReward
        return (reward > 0n ? "+" : "") + getCompactFormatter(2).format(Number(formatEther(reward)))
      }),
    enabled: !!account?.address,
  })

  const total = getCompactFormatter(2).format(Number(formatEther(totalReward)))

  return (
    <LinkBox key={roundId}>
      <LinkOverlay asChild>
        <Card.Root p="4" variant="outline" border="sm" borderColor="border.secondary">
          <NextLink href={`/allocations/history/${roundId}`}>
            <HStack alignItems="center" justifyContent="space-between" gap="3">
              <VStack gap="2" alignItems="flex-start">
                <Heading size="md" fontWeight="semibold">
                  {roundId}
                </Heading>
                <Text textStyle="sm" color="text.subtle">
                  {[roundStart, roundEnd].map(date => dayjs(date).format("MMM D")).join(" - ")}
                </Text>
              </VStack>

              <VStack gap="0.5" alignItems="flex-end">
                <HStack gap="2">
                  <Icon as={B3TR} boxSize="5" />
                  <Heading size="sm" fontWeight="semibold">
                    <Skeleton loading={isRewardClaimedLoading}>
                      <Mark variant="text" color="status.positive.strong">
                        {rewardClaimed && rewardClaimed.length > 0 ? `${rewardClaimed[0]}` : "-"}
                      </Mark>
                      {` / ${total}`}
                    </Skeleton>
                  </Heading>
                </HStack>
                <Text textStyle="xs">{t("Your rewards / total")}</Text>
              </VStack>
            </HStack>
          </NextLink>
        </Card.Root>
      </LinkOverlay>
    </LinkBox>
  )
}
