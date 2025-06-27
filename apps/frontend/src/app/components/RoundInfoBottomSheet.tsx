"use client"

import { Box, VStack, Text, Heading, Button, useDisclosure, HStack, Skeleton } from "@chakra-ui/react"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"
import {
  ProposalState,
  useAllocationAmount,
  useAllocationsRoundState,
  useCanUserVote,
  useCurrentAllocationsRoundId,
  useGetDelegatee,
  useMostVotedAppsInRound,
} from "@/api"
import { useRoundProposals } from "../rounds/hooks/useRoundProposals"
import { Trans, useTranslation } from "react-i18next"
import { AllocationStateBadge, B3TRIcon, ProposalCompactCard } from "@/components"
import { useRouter } from "next/navigation"
import { NoActiveProposalCard } from "../rounds/components/NoActiveProposalCard"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

export const RoundInfoBottomSheet = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { account } = useWallet()

  const { data: currentRoundId, isLoading: currentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { allocationRound, roundLoading, proposalsToRender } = useRoundProposals(currentRoundId ?? "")
  // First active, then looking for support (pending + deposit not met)
  const sortedProposals = useMemo(() => {
    return proposalsToRender.sort((a, b) => {
      const getPriority = (proposal: (typeof proposalsToRender)[0]) => {
        if (proposal.state === ProposalState.Active) return 1
        return 2 // Everything else
      }

      return getPriority(a) - getPriority(b)
    })
  }, [proposalsToRender])

  const { data: amounts, isLoading: amountsLoading } = useAllocationAmount(currentRoundId)

  const mostVotedAppsQuery = useMostVotedAppsInRound(currentRoundId)

  const { data: state } = useAllocationsRoundState(currentRoundId)

  const isOthersOverlappedAppsColorActive = state !== undefined && state !== 0

  const { data: delegateeAddress } = useGetDelegatee(account?.address ?? "")
  const { data: canVote } = useCanUserVote(account?.address ?? "", delegateeAddress)

  const totalAmount =
    Number(amounts?.treasury ?? 0) + Number(amounts?.voteX2Earn ?? 0) + Number(amounts?.voteXAllocations ?? 0)

  const isCardLoading = roundLoading || currentRoundIdLoading

  return (
    <>
      {!isOpen && (
        <HStack
          w="full"
          justify={"space-between"}
          onClick={onOpen}
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="#B1F16C"
          color="#000000"
          py={5}
          px={4}
          borderTopRadius="20px"
          boxShadow="0px -5px 16px 0px #0000000F"
          cursor="pointer"
          zIndex={3}>
          <Box>
            <Skeleton isLoaded={!isCardLoading}>
              <Heading fontSize={"20px"} fontWeight={400}>
                <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: allocationRound.roundId }} t={t} />
              </Heading>
            </Skeleton>
            <Skeleton isLoaded={!isCardLoading}>
              <Text fontSize={"14px"} fontWeight={400}>
                {t("{{from}} to {{to}}", {
                  from: allocationRound.voteStartTimestamp?.format("MMM D"),
                  to: allocationRound.voteEndTimestamp?.format("MMM D"),
                })}
              </Text>
            </Skeleton>
          </Box>
          {currentRoundId && (
            <OverlappedAppsImages
              appsIds={mostVotedAppsQuery.data.map(a => a.id)}
              isLoading={mostVotedAppsQuery.isLoading}
              otherAppsActiveColor={isOthersOverlappedAppsColorActive}
              iconSize={36}
            />
          )}
        </HStack>
      )}

      <BaseBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        ariaTitle={t("Round #{{round}}", { round: allocationRound.roundId })}
        ariaDescription={t("Round #{{round}}", { round: allocationRound.roundId })}>
        <VStack spacing={6} align="stretch" mx="auto">
          <HStack spacing={4} justify="space-between" w="full">
            <Box>
              <Skeleton isLoaded={!roundLoading}>
                <Heading fontSize={"20px"} fontWeight={400} color="#252525">
                  <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: allocationRound.roundId }} t={t} />
                </Heading>
              </Skeleton>
              <Skeleton isLoaded={!isCardLoading}>
                <Text fontSize={"14px"} fontWeight={400}>
                  {t("{{from}} to {{to}}", {
                    from: allocationRound.voteStartTimestamp?.format("MMM D"),
                    to: allocationRound.voteEndTimestamp?.format("MMM D"),
                  })}
                </Text>
              </Skeleton>
            </Box>
            {currentRoundId && (
              <OverlappedAppsImages
                appsIds={mostVotedAppsQuery.data.map(a => a.id)}
                isLoading={mostVotedAppsQuery.isLoading}
                otherAppsActiveColor={isOthersOverlappedAppsColorActive}
                iconSize={36}
              />
            )}
          </HStack>
          <VStack spacing={4} w="full" align="flex-start">
            <VStack spacing={2} w="full" align="flex-start">
              <Heading fontSize="18px" fontWeight={700}>
                {t("Allocations voting")}
              </Heading>
              <Text fontSize="12px" fontWeight={400} color="#6A6A6A">
                {t("Each week, you can vote for your favorite apps to help distribute resources among them!")}
              </Text>
            </VStack>
            <VStack
              w="full"
              border="1px hover-contrast-bg solid"
              align={"flex-start"}
              bg="info-bg"
              p="12px"
              borderRadius={"md"}
              spacing={4}>
              <HStack w="full" justify="space-between">
                <VStack spacing={2} align={"flex-start"}>
                  <AllocationStateBadge
                    roundId={allocationRound.roundId ?? ""}
                    data-testid={"round-#" + allocationRound.roundId + "-status"}
                    renderBadge={false}
                    renderIcon={true}
                  />
                  <Text fontSize="14px" fontWeight={600}>
                    {t("#{{round}} allocation round", { round: allocationRound.roundId })}
                  </Text>
                </VStack>
                <VStack align={"flex-end"} spacing={0}>
                  <HStack spacing={1} align="center">
                    <B3TRIcon boxSize="16px" colorVariant="dark" />
                    <Skeleton isLoaded={!amountsLoading}>
                      <Heading fontSize="16x" fontWeight={700}>
                        {getCompactFormatter(2).format(totalAmount)}
                      </Heading>
                    </Skeleton>
                  </HStack>
                  <Text fontSize="10px" color="#6A6A6A">
                    {t("Total to distribute")}
                  </Text>
                </VStack>
              </HStack>
              <HStack w="full" justify="space-between">
                <Button
                  onClick={() => router.push(`/rounds/${allocationRound.roundId}`)}
                  variant="primarySubtle"
                  w="full"
                  rounded={"full"}>
                  {t("See More")}
                </Button>
                {canVote && (
                  <Button
                    onClick={() => router.push(`/rounds/${allocationRound.roundId}/vote`)}
                    colorScheme="primary"
                    w="full"
                    rounded={"full"}>
                    {t("Vote now")}
                  </Button>
                )}
              </HStack>
            </VStack>
          </VStack>
          <VStack spacing={4} w="full" align="flex-start">
            <VStack spacing={2} w="full" align="flex-start">
              <Heading fontSize="18px" fontWeight={700}>
                {t("Proposals in this round or looking for support")}
              </Heading>
              <Text fontSize="12px" fontWeight={400} color="#6A6A6A">
                {t("Proposals shape the ecosystem. Vote on ideas and build our community together!")}
              </Text>
            </VStack>

            {!!sortedProposals.length ? (
              <VStack spacing={4} w="full">
                {sortedProposals.map(proposal => (
                  <ProposalCompactCard key={proposal.proposalId} proposal={proposal} proposalState={proposal.state} />
                ))}
              </VStack>
            ) : (
              <NoActiveProposalCard />
            )}
          </VStack>
          <Button onClick={() => router.push("/proposals")} variant="link" colorScheme="primary">
            {t("View all proposals")}
          </Button>
        </VStack>
      </BaseBottomSheet>
    </>
  )
}
