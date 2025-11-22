"use client"
import { Box, VStack, Text, Heading, Button, useDisclosure, HStack, Skeleton, SimpleGrid } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"

import { ProposalCompactCard } from "@/app/proposals/components/ProposalCompactCard"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { useCanUserVote } from "../../api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegatee } from "../../api/contracts/vePassport/hooks/useGetDelegatee"
import { useAllocationAmount } from "../../api/contracts/xAllocations/hooks/useAllocationAmount"
import { useAllocationsRoundState } from "../../api/contracts/xAllocations/hooks/useAllocationsRoundState"
import { useCurrentAllocationsRoundId } from "../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useMostVotedAppsInRound } from "../../api/contracts/xApps/hooks/useMostVotedAppsInRound"
import { AllocationStateBadge } from "../../components/AllocationStateBadge/AllocationStateBadge"
import { B3TRIcon } from "../../components/Icons/B3TRIcon"
import { NoActiveProposalCard } from "../rounds/components/NoActiveProposalCard"
import { useRoundProposals } from "../rounds/hooks/useRoundProposals"

export const RoundInfoBottomSheet = () => {
  const { t } = useTranslation()
  const { open: isOpen, onOpen, onClose } = useDisclosure()
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
          bg="brand.secondary"
          color="white"
          py={5}
          px={4}
          borderTopRadius="20px"
          boxShadow="0px -5px 16px 0px #0000000F"
          cursor="pointer"
          zIndex={2}>
          <Box>
            <Skeleton loading={isCardLoading}>
              <Heading size={"xl"} color="black" fontWeight="normal">
                <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: allocationRound.roundId }} t={t} />
              </Heading>
            </Skeleton>
            <Skeleton loading={isCardLoading}>
              <Text textStyle={"sm"} color="black">
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
        <VStack gap={6} align="stretch" mx="auto">
          <HStack gap={4} justify="space-between" w="full">
            <Box>
              <Skeleton loading={roundLoading}>
                <Heading size={"xl"} fontWeight="normal" color="text.default">
                  <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: allocationRound.roundId }} t={t} />
                </Heading>
              </Skeleton>
              <Skeleton loading={isCardLoading}>
                <Text textStyle={"sm"} color="text.default">
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
          <VStack gap={4} w="full" align="flex-start">
            <VStack gap={2} w="full" align="flex-start">
              <Heading size="lg">{t("Allocations voting")}</Heading>
              <Text textStyle="xs" color="text.subtle">
                {t("Each week, you can vote for your favorite apps to help distribute resources among them!")}
              </Text>
            </VStack>
            <VStack
              w="full"
              border="sm"
              borderColor="border.secondary"
              align={"flex-start"}
              bg="bg.primary"
              p="12px"
              borderRadius={"xl"}
              gap={4}>
              <HStack w="full" justify="space-between">
                <VStack gap={2} align={"flex-start"}>
                  <AllocationStateBadge
                    roundId={allocationRound.roundId ?? ""}
                    data-testid={"round-#" + allocationRound.roundId + "-status"}
                  />
                  <Text textStyle="sm" fontWeight="semibold">
                    {t("#{{round}} allocation round", { round: allocationRound.roundId })}
                  </Text>
                </VStack>
                <VStack align={"flex-end"} gap={0}>
                  <HStack gap={1} align="center">
                    <B3TRIcon boxSize="16px" colorVariant="dark" />
                    <Skeleton loading={amountsLoading}>
                      <Heading size="md">{getCompactFormatter(2).format(totalAmount)}</Heading>
                    </Skeleton>
                  </HStack>
                  <Text textStyle="xxs" color="text.subtle">
                    {t("Total to distribute")}
                  </Text>
                </VStack>
              </HStack>
              <SimpleGrid w="full" columns={canVote ? 2 : 1} gap={4}>
                <Button asChild variant="secondary" rounded={"full"}>
                  <NextLink href={`/rounds/${allocationRound.roundId}`}>{t("See More")}</NextLink>
                </Button>
                {canVote && (
                  <Button asChild variant="primary" rounded={"full"}>
                    <NextLink href={`/rounds/${allocationRound.roundId}/vote`}>{t("Vote now")}</NextLink>
                  </Button>
                )}
              </SimpleGrid>
            </VStack>
          </VStack>
          <VStack gap={4} w="full" align="flex-start">
            <VStack gap={2} w="full" align="flex-start">
              <Heading size="lg" fontWeight="bold">
                {t("Proposals and Grants looking for support and approval")}
              </Heading>
              <Text textStyle="xxs" color="#6A6A6A">
                {t("Proposals shape the ecosystem. Vote on ideas and build our community together!")}
              </Text>
            </VStack>

            {!!sortedProposals.length ? (
              <VStack gap={4} w="full">
                {sortedProposals.map(proposal => (
                  <ProposalCompactCard
                    key={proposal.proposalId.toString()}
                    proposal={proposal}
                    proposalState={proposal.state}
                  />
                ))}
              </VStack>
            ) : (
              <NoActiveProposalCard />
            )}
          </VStack>
        </VStack>
      </BaseBottomSheet>
    </>
  )
}
