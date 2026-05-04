import { Badge, Box, Card, HStack, LinkBox, LinkOverlay, Text } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { t } from "i18next"
import NextLink from "next/link"
import { useMemo } from "react"
import { Trans } from "react-i18next"

import { AddressIcon } from "@/components/AddressIcon"

interface ChallengeActionsRowProps {
  position: number
  address: string
  score: number
  isYou?: boolean
  isWinner?: boolean
  tag?: string
  hideScore?: boolean
  onClick?: () => void
}

export const ChallengeActionsRow = ({
  position,
  address,
  score,
  isYou,
  isWinner,
  tag,
  hideScore,
  onClick,
}: ChallengeActionsRowProps) => {
  const { data: vnsData } = useVechainDomain(address)
  const domain = vnsData?.domain

  const positionLabel = useMemo(() => {
    if (position === 0) return null
    return isWinner ? `🏆 #${position}` : `#${position}`
  }, [position, isWinner])

  const showTrophyOnly = isWinner && position === 0
  const borderColor = isWinner ? "#FFD700" : "border.secondary"

  const content = (
    <HStack w="full" justify="space-between">
      <HStack gap={2} zIndex={1}>
        <AddressIcon address={address} boxSize={8} minW={8} minH={8} rounded="full" />
        <Box>
          <Text
            textStyle="sm"
            fontWeight={isYou ? "bold" : "semibold"}
            color={isYou ? "white" : "text.default"}
            lineClamp={1}
            wordBreak="break-all"
            overflow="hidden"
            textOverflow="ellipsis">
            {domain ? humanDomain(domain, 12, 6) : humanAddress(address, 6, 4) || ""} {isYou && ` (${t("You")})`}
          </Text>
          {!hideScore && (
            <Text textStyle="sm" color={isYou ? "white" : "text.default"}>
              <Trans i18nKey="{{value}} actions" values={{ value: score }} />
            </Text>
          )}
        </Box>
      </HStack>
      <HStack gap={2} zIndex={1}>
        {tag && (
          <Badge
            variant="outline"
            size="sm"
            rounded="full"
            fontWeight="semibold"
            colorPalette={isYou ? undefined : "yellow"}
            color={isYou ? "white" : undefined}
            borderColor={isYou ? "transparency.700" : undefined}
            bg={isYou ? "transparency.200" : undefined}>
            {tag}
          </Badge>
        )}
        {showTrophyOnly && (
          <Text color={isYou ? "white" : "text.default"} textStyle="xl" fontWeight="semibold">
            {"🏆"}
          </Text>
        )}
        {positionLabel && (
          <Text color={isYou ? "white" : "text.default"} textStyle="xl" fontWeight="semibold">
            {positionLabel}
          </Text>
        )}
      </HStack>
    </HStack>
  )

  const cardProps = {
    p: "3" as const,
    bg: {
      base: isYou ? "actions.primary.default" : "bg.tertiary",
      _hover: isYou ? "actions.primary.hover" : undefined,
    },
    color: isYou ? "white" : "text.default",
    borderColor,
    transition: "all 0.2s ease-in-out",
  }

  if (onClick) {
    return (
      <Card.Root {...cardProps} cursor="pointer" onClick={onClick}>
        <Card.Body>{content}</Card.Body>
      </Card.Root>
    )
  }

  return (
    <LinkBox asChild>
      <Card.Root {...cardProps}>
        <Card.Body>
          <LinkOverlay asChild>
            <NextLink href={`/profile/${address}`}>{content}</NextLink>
          </LinkOverlay>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
