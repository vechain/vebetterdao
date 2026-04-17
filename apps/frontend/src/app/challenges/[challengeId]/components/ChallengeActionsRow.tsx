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
  showTrophy?: boolean
  tag?: string
  hideScore?: boolean
}

export const ChallengeActionsRow = ({
  position,
  address,
  score,
  isYou,
  showTrophy,
  tag,
  hideScore,
}: ChallengeActionsRowProps) => {
  const { data: vnsData } = useVechainDomain(address)
  const domain = vnsData?.domain

  const positionLabel = useMemo(() => {
    if (showTrophy && position === 1) return `🏆 #${position}`
    return `#${position}`
  }, [position, showTrophy])

  const borderColor = showTrophy && position === 1 ? "#FFD700" : "border.secondary"

  return (
    <LinkBox asChild>
      <Card.Root
        p="3"
        bg={{
          base: isYou ? "actions.primary.default" : "bg.tertiary",
          _hover: isYou ? "actions.primary.hover" : undefined,
        }}
        color={isYou ? "white" : "text.default"}
        borderColor={borderColor}
        transition="all 0.2s ease-in-out">
        <Card.Body>
          <LinkOverlay asChild>
            <NextLink href={`/profile/${address}`}>
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
                      {domain ? humanDomain(domain, 12, 6) : humanAddress(address, 6, 4) || ""}{" "}
                      {isYou && ` (${t("You")})`}
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
                    <Badge variant="outline" size="sm" rounded="full" fontWeight="semibold" colorPalette="yellow">
                      {tag}
                    </Badge>
                  )}
                  {position !== 0 && (
                    <Text color={isYou ? "white" : "text.default"} textStyle="xl" fontWeight="semibold">
                      {positionLabel}
                    </Text>
                  )}
                </HStack>
              </HStack>
            </NextLink>
          </LinkOverlay>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
