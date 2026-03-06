import { Card, HStack, Box, Text, LinkBox, LinkOverlay } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { t } from "i18next"
import NextLink from "next/link"
import { useMemo } from "react"
import { Trans } from "react-i18next"

import { AddressIcon } from "../AddressIcon"

export type LeaderboardRanking = {
  position: number
  address: string
  score: number
}
type LeaderboardRankingComponentProps = {
  ranking: LeaderboardRanking
  isYourRanking?: boolean
}
export const LeaderboardRankingComponent = ({ ranking, isYourRanking }: LeaderboardRankingComponentProps) => {
  const { data: vnsData } = useVechainDomain(ranking.address)
  const domain = vnsData?.domain
  const positionStyles = useMemo(() => {
    if (ranking.position === 1)
      return {
        text: "🥇",
        borderColor: "#FFD700",
        fontSize: "3xl",
        boxShadow: "none",
      }
    if (ranking.position === 2)
      return {
        text: "🥈",
        borderColor: "#C0C0C0",
        fontSize: "3xl",
        boxShadow: "none",
      }
    if (ranking.position === 3)
      return {
        text: "🥉",
        borderColor: "#CD7F32",
        fontSize: "3xl",
        boxShadow: "none",
      }
    return {
      text: `#${ranking.position}`,
      borderColor: "border.secondary",
      fontSize: "xl",
      boxShadow: "none",
    }
  }, [ranking.position])

  return (
    <LinkBox asChild>
      <Card.Root
        p="3"
        bg={{
          base: isYourRanking ? "actions.primary.default" : "bg.tertiary",
          _hover: isYourRanking ? "actions.primary.hover" : undefined,
        }}
        color={isYourRanking ? "white" : "text.default"}
        boxShadow={positionStyles.boxShadow}
        borderColor={positionStyles.borderColor}
        transition="all 0.2s ease-in-out">
        <Card.Body>
          <LinkOverlay asChild>
            <NextLink href={`/profile/${ranking.address}`}>
              <HStack w="full" justify="space-between">
                <HStack gap={2} zIndex={1}>
                  <AddressIcon address={ranking.address} boxSize={8} minW={8} minH={8} rounded={"full"} />

                  <Box>
                    <Text
                      textStyle="sm"
                      fontWeight={isYourRanking ? "bold" : "semibold"}
                      gap={1}
                      color={isYourRanking ? "white" : "text.default"}
                      lineClamp={1}
                      wordBreak="break-all"
                      overflow="hidden"
                      textOverflow="ellipsis">
                      {domain ? humanDomain(domain) : humanAddress(ranking.address, 6, 4) || ""}{" "}
                      {isYourRanking && ` (${t("You")})`}
                    </Text>

                    <Text textStyle="sm" color={isYourRanking ? "white" : "text.default"}>
                      <Trans i18nKey="{{value}} actions" values={{ value: ranking.score }} />
                    </Text>
                  </Box>
                </HStack>
                {ranking.position !== 0 && (
                  <Text
                    color={isYourRanking ? "white" : "text.default"}
                    textStyle={positionStyles.fontSize}
                    fontWeight="semibold"
                    zIndex={1}>
                    {positionStyles.text}
                  </Text>
                )}
              </HStack>
            </NextLink>
          </LinkOverlay>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
