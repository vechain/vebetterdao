"use client"

import { Badge, Heading, HStack, IconButton, Link, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { LuArrowLeft, LuArrowRight } from "react-icons/lu"

import type { RoundAnalytics } from "@/lib/types"

interface RoundDetailHeaderProps {
  round: RoundAnalytics | null
  firstRound: number
  currentRound: number
}

export function RoundDetailHeader({ round, firstRound, currentRound }: RoundDetailHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roundIdParam = searchParams.get("roundId")
  const roundId = round?.roundId ?? (roundIdParam ? parseInt(roundIdParam, 10) : 0)

  const handleRoundNavigation = (newRoundId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("roundId", newRoundId.toString())
    router.push(`/round?${params.toString()}`)
  }

  const canGoPrev = roundId > 1 && roundId > firstRound
  const canGoNext = roundId < currentRound

  return (
    <VStack align="stretch" gap="2">
      <Link asChild color="text.subtle" textStyle="sm" _hover={{ color: "text.default" }}>
        <NextLink href="/">{"← Back to home"}</NextLink>
      </Link>

      <HStack justify="space-between" w="full">
        <HStack gap="3" align="center">
          <Heading size={{ base: "xl", md: "2xl" }}>
            {"Round #"}
            {roundId}
          </Heading>
          {round?.isRoundEnded ? (
            <Badge size="sm" variant="subtle" colorPalette="gray">
              {"Concluded"}
            </Badge>
          ) : (
            <Badge size="sm" variant="solid" colorPalette="blue">
              {"Active"}
            </Badge>
          )}
        </HStack>
        <HStack gap="2">
          <IconButton
            variant="outline"
            size="lg"
            onClick={() => handleRoundNavigation(roundId - 1)}
            disabled={!canGoPrev}
            aria-label="Previous round">
            <LuArrowLeft />
          </IconButton>
          <IconButton
            variant="outline"
            size="lg"
            disabled={!canGoNext}
            onClick={() => handleRoundNavigation(roundId + 1)}
            aria-label="Next round">
            <LuArrowRight />
          </IconButton>
        </HStack>
      </HStack>
    </VStack>
  )
}
