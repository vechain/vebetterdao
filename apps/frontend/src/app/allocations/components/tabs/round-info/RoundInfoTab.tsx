"use client"

import { Grid, Heading, HStack, IconButton, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { NavArrowRight } from "iconoir-react"
import NextLink from "next/link"
import { useContext } from "react"
import { useTranslation } from "react-i18next"

import { useBreakpoints } from "@/hooks/useBreakpoints"

import type { AllocationRoundDetails } from "../../../lib/data"
import { RoundActiveAppsListCard } from "../../RoundActiveAppsListCard"
import { UserVotingActivityCard } from "../../UserVotingActivityCard"
import { AllocationTabsContext } from "../AllocationTabsProvider"

import { RoundDistributionCard } from "./RoundDistributionCard"
import { RoundHistoryCard } from "./RoundHistoryCard"

interface RoundInfoTabProps {
  roundDetails?: AllocationRoundDetails
}

export function RoundInfoTab({ roundDetails: propRoundDetails }: RoundInfoTabProps) {
  const { account } = useWallet()
  const { t } = useTranslation()
  const context = useContext(AllocationTabsContext)
  const contextRoundDetails = context?.roundDetails
  const { isMobile } = useBreakpoints()

  const roundDetails = propRoundDetails || contextRoundDetails

  if (!roundDetails) {
    throw new Error("RoundInfoTab requires roundDetails prop or must be used within AllocationTabsProvider")
  }
  const previous3RoundsEarnings = roundDetails.previous3RoundsEarnings
  const isCurrentRound = roundDetails.currentRoundId === roundDetails.id

  return (
    <VStack alignItems="stretch" gap="5" w="full" mt="2">
      <RoundDistributionCard roundDetails={roundDetails} />
      {isMobile && (
        <>
          {!!account?.address && <UserVotingActivityCard roundDetails={roundDetails} />}
          <RoundActiveAppsListCard
            currentRoundId={roundDetails.currentRoundId}
            roundId={roundDetails.id}
            apps={roundDetails.apps}
          />
        </>
      )}
      <VStack hideFrom="md" gap="3" alignItems="stretch">
        <HStack justifyContent="space-between" w="full">
          <Heading size="lg" fontWeight="semibold">
            {t("Explore rounds history")}
          </Heading>
          <IconButton
            disabled={isCurrentRound}
            variant="link"
            p="0"
            minWidth="unset"
            boxSize="4"
            color="text.subtle"
            asChild>
            <NextLink href="/allocations/history">
              <NavArrowRight />
            </NextLink>
          </IconButton>
        </HStack>
        {previous3RoundsEarnings.map(round => (
          <RoundHistoryCard key={round.roundId} round={round} />
        ))}
      </VStack>
      <Grid hideBelow="md" gridTemplateColumns={!!account?.address ? "repeat(2,1fr)" : "1fr"} gap="6">
        {!!account?.address && <UserVotingActivityCard roundDetails={roundDetails} />}
        <RoundActiveAppsListCard
          currentRoundId={roundDetails.currentRoundId}
          roundId={roundDetails.id}
          apps={roundDetails.apps}
        />
      </Grid>
    </VStack>
  )
}
