"use client"

import { Badge, Card, Flex, Grid, Heading, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { NavArrowLeft, NavArrowRight } from "iconoir-react"
import { useRouter, useSearchParams, usePathname, redirect } from "next/navigation"
import { useTranslation } from "react-i18next"

import type { AllocationRoundDetails } from "../../../lib/data"

import { ViewAllRoundsButton } from "./ViewAllRoundsButton"

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

  if (!account?.address && pathname === "/allocations") redirect("/allocations/round")

  return (
    <>
      <Heading w="full" size={{ base: "xl", md: "3xl" }}>
        {t("Allocation")}
      </Heading>
      <VStack mt="2" hideFrom="md" alignItems="stretch" gap="2" w="full">
        <HStack gap="2">
          <Text textStyle="md" fontWeight="semibold">
            {t("Round")} {roundDetails.id}
          </Text>
          {isCurrentRound && <Badge variant="positive">{t("Active")}</Badge>}
        </HStack>
        <Text textStyle="sm" color="text.subtle">
          {dayjs(roundDetails.roundStart).format(DATE_FORMAT) + "-" + dayjs(roundDetails.roundEnd).format(DATE_FORMAT)}
        </Text>
      </VStack>
      <Card.Root
        mt="2"
        hideBelow="md"
        p="6"
        alignItems="center"
        justifyContent="space-between"
        flexDirection="row"
        w="full">
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
    </>
  )
}
