"use client"

import { Badge, Card, Flex, Grid, Heading, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { NavArrowLeft, NavArrowRight } from "iconoir-react"
import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useContext } from "react"
import { useTranslation } from "react-i18next"

import { useBreakpoints } from "@/hooks/useBreakpoints"

import type { AllocationRoundDetails } from "../../../lib/data"
import { RoundActiveAppsListCard } from "../../RoundActiveAppsListCard"
import { UserVotingActivityCard } from "../../UserVotingActivityCard"
import { AllocationTabsContext } from "../AllocationTabsProvider"

import { RoundDistributionCard } from "./RoundDistributionCard"
import { RoundHistoryCard } from "./RoundHistoryCard"
import { ViewAllRoundsButton } from "./ViewAllRoundsButton"

const DATE_FORMAT = "MMM D"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCurrentRound = roundDetails.currentRoundId === roundDetails.id

  const handleRoundNavigation = (newRoundId: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("roundId", newRoundId.toString())
    router.push(`/allocations/round/?${params.toString()}`)
  }

  return (
    <VStack alignItems="stretch" gap="5" w="full" mt="2">
      <VStack hideFrom="md" alignItems="stretch" gap="2">
        <HStack gap="2">
          <Text textStyle="md" fontWeight="semibold">
            {t("Round")} {roundDetails.id}
          </Text>
          {roundDetails.currentRoundId === roundDetails.id && <Badge variant="positive">{t("Active")}</Badge>}
        </HStack>
        <Text textStyle="sm" color="text.subtle">
          {dayjs(roundDetails.roundStart).format(DATE_FORMAT) + "-" + dayjs(roundDetails.roundEnd).format(DATE_FORMAT)}
        </Text>
      </VStack>
      <Card.Root hideBelow="md" p="6" alignItems="center" justifyContent="space-between" flexDirection="row">
        <Grid gridTemplateColumns="repeat(3,max-content)" divideX="1px" divideColor="border.secondary" columnGap="6">
          <VStack gap="1" align="start">
            <Text textStyle="md" color="text.subtle">
              {t("Round")}
            </Text>
            <Heading size="4xl">{roundDetails.id}</Heading>
          </VStack>
          <VStack gap="1" pl="6" align="start">
            <Text textStyle="md" color="text.subtle">
              {t("Round dates")}
            </Text>
            <Heading size="lg">
              {dayjs(roundDetails.roundStart).format(DATE_FORMAT) +
                "-" +
                dayjs(roundDetails.roundEnd).format(DATE_FORMAT)}
            </Heading>
          </VStack>
          {isCurrentRound && (
            <Flex h="full" pl="6" alignItems="flex-start">
              <Badge variant="positive">{t("Active")}</Badge>
            </Flex>
          )}
        </Grid>
        <Flex columnGap="4">
          <IconButton
            variant="outline"
            boxSize={"44px"}
            onClick={() => handleRoundNavigation(roundDetails.id - 1)}
            disabled={roundDetails.id <= 1}
            aria-label={t("Previous round")}>
            <NavArrowLeft />
          </IconButton>
          <IconButton
            disabled={isCurrentRound}
            variant="outline"
            boxSize={"44px"}
            onClick={() => handleRoundNavigation(roundDetails.id + 1)}
            aria-label={t("Next round")}>
            <NavArrowRight />
          </IconButton>
          <ViewAllRoundsButton currentRoundId={roundDetails.currentRoundId} />
        </Flex>
      </Card.Root>
      <RoundDistributionCard roundDetails={roundDetails} />
      {isMobile && (
        <RoundActiveAppsListCard
          currentRoundId={roundDetails.currentRoundId}
          roundId={roundDetails.id}
          apps={roundDetails.apps}
        />
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
