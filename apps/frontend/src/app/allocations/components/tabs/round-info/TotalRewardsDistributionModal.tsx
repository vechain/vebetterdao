import { Box, VStack, HStack, Card, Text, Heading, Dialog, CloseButton, Icon } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { formatEther } from "viem"

import { AllocationRoundDetails } from "@/app/allocations/lib/data"
import B3TRIcon from "@/components/Icons/svg/b3tr.svg"
import { Modal } from "@/components/Modal"

import { TotalRewardDistributionProgress } from "./TotalRewardDistributionProgress"

const DataRow = ({
  label,
  amount,
  reward,
  showDot,
  dotColor,
  indent,
}: {
  label: string
  amount: string | number
  reward: string | number
  showDot?: boolean
  dotColor?: string
  indent?: boolean
}) => (
  <HStack justify="space-between" w="full" gap={3}>
    <HStack gap={2} flex={1}>
      {showDot && <Box w="1.5" h="1.5" bg={dotColor} borderRadius="full" />}
      <Text textStyle="xs" fontWeight="semibold" color="text.subtle" pl={indent ? 3.5 : 0}>
        {label}
      </Text>
    </HStack>
    <Text textStyle="sm" color="text.subtle" textAlign="right" minW="16">
      {amount}
    </Text>
    <Text textStyle="sm" color="text.subtle" textAlign="right" minW="24">
      {reward}
    </Text>
  </HStack>
)

export const TotalRewardsDistributionModal = ({
  roundDetails,
  isOpen,
  onClose,
}: {
  roundDetails: AllocationRoundDetails
  isOpen: boolean
  onClose: VoidFunction
}) => {
  const { apps, totalVoters, vote2EarnAmount, gmAmount, xAllocationsAmount, treasuryAmount } = roundDetails
  const votingRewardsTotal = vote2EarnAmount + gmAmount
  const rewardsTotal = votingRewardsTotal + xAllocationsAmount + treasuryAmount
  const percentages = {
    apps: Number((xAllocationsAmount * 100n) / rewardsTotal),
    voters: Number((votingRewardsTotal * 100n) / rewardsTotal),
    treasury: Number((treasuryAmount * 100n) / rewardsTotal),
  }

  const formattedVotingRewards = getCompactFormatter(2).format(Number(formatEther(vote2EarnAmount)))
  const formattedGmAmount = getCompactFormatter(2).format(Number(formatEther(gmAmount)))
  const formattedXAllocations = getCompactFormatter(2).format(Number(formatEther(xAllocationsAmount)))
  const formattedVotingRewardsTotal = getCompactFormatter(2).format(Number(formatEther(votingRewardsTotal)))
  const formattedTreasuryAmount = getCompactFormatter(2).format(Number(formatEther(treasuryAmount)))

  const dataList = [
    {
      label: "Apps",
      amount: apps.length || 0,
      reward: formattedXAllocations,
      showDot: true,
      dotColor: "status.positive.primary",
    },
    {
      label: "Voters",
      amount: totalVoters,
      reward: formattedVotingRewardsTotal,
      showDot: true,
      dotColor: "status.info.strong",
    },
    {
      label: "Voting rewards",
      amount: "—",
      reward: formattedVotingRewards,
      indent: true,
    },
    {
      label: "GM NFT Multiplier",
      amount: "—",
      reward: formattedGmAmount,
      indent: true,
    },
    {
      label: "VeBetter treasury",
      amount: "—",
      reward: formattedTreasuryAmount,
      showDot: true,
      dotColor: "status.warning.primary",
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} showCloseButton={false} modalProps={{ size: "sm" }}>
      <HStack justifyContent={{ base: "center", md: "space-between" }}>
        <Heading size="xl">{"Total rewards distributed"}</Heading>
        <Dialog.CloseTrigger hideBelow="md" position="static" asChild>
          <CloseButton />
        </Dialog.CloseTrigger>
      </HStack>

      <Card.Root variant="subtle" _hover={{ bg: "card.subtle" }} border="none" gap={4} my={5}>
        <HStack gap={2}>
          <Icon as={B3TRIcon} boxSize="5" />
          <Text textStyle="md" fontWeight="semibold">
            {getCompactFormatter(2).format(Number(formatEther(rewardsTotal)))} {"B3TR"}
          </Text>
        </HStack>
        <TotalRewardDistributionProgress apps={percentages.apps} voters={percentages.voters} />
        <VStack gap={3} align="stretch">
          <HStack justify="space-between" w="full" gap={3} pb={2} borderBottomWidth="1px">
            <Text textStyle="xs" fontWeight="semibold" color="text.subtle" flex={1}>
              {"To"}
            </Text>
            <Text textStyle="xs" fontWeight="semibold" color="text.subtle" textAlign="right" minW="16">
              {"Amount"}
            </Text>
            <Text textStyle="xs" fontWeight="semibold" color="text.subtle" textAlign="right" minW="24">
              {"Rewards"}
            </Text>
          </HStack>

          {dataList.map(item => (
            <DataRow key={item.label} {...item} />
          ))}

          <HStack justify="space-between" w="full" gap={3} pt={2} borderTopWidth="1px">
            <Text textStyle="xs" fontWeight="semibold" color="text.subtle" flex={1}>
              {"Total"}
            </Text>
            <Text textStyle="sm" fontWeight="semibold" color="text.subtle" textAlign="right" minW="16">
              {"—"}
            </Text>
            <Text textStyle="sm" fontWeight="semibold" color="text.subtle" textAlign="right" minW="24">
              {getCompactFormatter(2).format(Number(formatEther(rewardsTotal)))}
            </Text>
          </HStack>
        </VStack>
      </Card.Root>
    </Modal>
  )
}
