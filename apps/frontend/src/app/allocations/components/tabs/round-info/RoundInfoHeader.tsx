"use client"

import { Badge, Card, Flex, Grid, Heading, HStack, IconButton, Text, VStack, Mark } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet, useCallClause } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { NavArrowLeft, NavArrowRight } from "iconoir-react"
import { useRouter, useSearchParams, usePathname, redirect } from "next/navigation"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"

import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { blockNumberToDate } from "@/utils/date"

import type { AllocationRoundDetails } from "../../../lib/data"

import { ViewAllRoundsButton } from "./ViewAllRoundsButton"

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

const DATE_FORMAT = "MMM D"

interface RoundInfoHeaderProps {
  roundDetails: AllocationRoundDetails
}

export function RoundInfoHeader({ roundDetails }: RoundInfoHeaderProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCurrentRound = roundDetails.currentRoundId === roundDetails.id

  const { account } = useWallet()
  const pathname = usePathname()

  const handleRoundNavigation = (newRoundId: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("roundId", newRoundId.toString())
    router.push(`/allocations/round/?${params.toString()}`)
  }

  const { data: [deadlineBlock] = [] } = useCallClause({
    abi: xAllocationVotingAbi,
    address: xAllocationVotingAddress,
    method: "currentRoundDeadline" as const,
    args: [],
  })

  const { data: bestBlockCompressed } = useBestBlockCompressed()

  if (!account?.address && pathname === "/allocations") redirect("/allocations/round")

  return (
    <>
      <Heading w="full" size={{ base: "xl", md: "3xl" }}>
        {t("Allocation")}
      </Heading>
      {/* Mobile header */}
      <VStack mt="2" hideFrom="md" alignItems="stretch" gap="2" w="full" pb={4}>
        <HStack gap="2" justifyContent="space-between">
          <HStack gap="2">
            <Text textStyle="md" fontWeight="semibold">
              {t("Round")} {roundDetails.id}
            </Text>
            {isCurrentRound && <Badge variant="positive">{t("Active")}</Badge>}
          </HStack>
          <HStack gap="2">
            <IconButton
              variant="outline"
              size="lg"
              onClick={() => handleRoundNavigation(roundDetails.id - 1)}
              disabled={roundDetails.id <= 1}
              aria-label={t("Previous round")}>
              <NavArrowLeft />
            </IconButton>
            <IconButton
              variant="outline"
              size="lg"
              disabled={isCurrentRound}
              onClick={() => handleRoundNavigation(roundDetails.id + 1)}
              aria-label={t("Next round")}>
              <NavArrowRight />
            </IconButton>
          </HStack>
        </HStack>
        <HStack>
          <Text textStyle="sm" color="text.subtle">
            {dayjs(roundDetails.roundStart).format(DATE_FORMAT) +
              "-" +
              dayjs(roundDetails.roundEnd).format(DATE_FORMAT)}
          </Text>

          {isCurrentRound && (
            <HStack borderLeft={"1px solid"} borderColor={"border.secondary"} pl={2}>
              <Text textStyle="sm" color="text.subtle">
                {t("Time left")}
                {": "}
              </Text>
              {deadlineBlock && (
                <Countdown
                  now={() => Date.now()}
                  date={blockNumberToDate(deadlineBlock, bestBlockCompressed)}
                  renderer={({ days, hours, minutes }) => (
                    <Text textStyle={{ base: "sm", md: "xl" }}>
                      <Mark variant="text" fontWeight="semibold">
                        {days}
                      </Mark>
                      {"d "}
                      <Mark variant="text" fontWeight="semibold">
                        {hours}
                      </Mark>
                      {"h "}
                      <Mark variant="text" fontWeight="semibold">
                        {minutes}
                      </Mark>
                      {"m "}
                    </Text>
                  )}
                />
              )}
            </HStack>
          )}
        </HStack>
      </VStack>
      {/* Desktop header */}
      <Card.Root
        mt="2"
        hideBelow="md"
        p="6"
        alignItems="center"
        justifyContent="space-between"
        flexDirection="row"
        w="full">
        <Grid gridTemplateColumns="repeat(4,max-content)" divideX="1px" divideColor="border.secondary" columnGap="6">
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
            <VStack gap="1" pl="6" align="start">
              <Text textStyle="md" color="text.subtle">
                {t("Time left")}
              </Text>
              {deadlineBlock && (
                <Countdown
                  now={() => Date.now()}
                  date={blockNumberToDate(deadlineBlock, bestBlockCompressed)}
                  renderer={({ days, hours, minutes }) => (
                    <Text textStyle={{ base: "sm", md: "xl" }}>
                      <Mark variant="text" fontWeight="semibold">
                        {days}
                      </Mark>
                      {"d "}
                      <Mark variant="text" fontWeight="semibold">
                        {hours}
                      </Mark>
                      {"h "}
                      <Mark variant="text" fontWeight="semibold">
                        {minutes}
                      </Mark>
                      {"m "}
                    </Text>
                  )}
                />
              )}
            </VStack>
          )}
          {isCurrentRound && (
            <Flex pl={6} h="full" alignItems="flex-start" w="full">
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
    </>
  )
}
