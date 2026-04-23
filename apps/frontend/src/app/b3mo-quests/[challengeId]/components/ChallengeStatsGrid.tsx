import { Card, chakra, Flex, Grid, GridItem, HStack, Icon, Text } from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiInfo } from "react-icons/fi"
import { LuChevronRight, LuClock, LuLayoutGrid, LuScale } from "react-icons/lu"

import { ChallengeDetail, ChallengeKind, ChallengeType } from "@/api/challenges/types"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { AppImage } from "@/components/AppImage/AppImage"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import { Tooltip } from "@/components/ui/tooltip"

import { ChallengeAppsModal } from "./ChallengeAppsModal"

interface ChallengeStatsGridProps {
  challenge: ChallengeDetail
}

export const ChallengeStatsGrid = ({ challenge }: ChallengeStatsGridProps) => {
  const { t } = useTranslation()
  const { data: appsData } = useXApps()
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false)

  const appNames = useMemo(
    () => new Map((appsData?.allApps ?? []).map(app => [app.id.toLowerCase(), app.name])),
    [appsData?.allApps],
  )

  const isStake = challenge.kind === ChallengeKind.Stake
  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin
  const threshold = Number(challenge.threshold)
  const slotsLeft = Math.max(challenge.numWinners - challenge.winnersClaimed, 0)
  const perWinnerLabel = humanNumber(challenge.prizePerWinner, challenge.prizePerWinner, "B3TR")

  const { ruleLabel, ruleDetail, ruleTooltip } = useMemo(() => {
    if (isStake)
      return {
        ruleLabel: t("Winner takes all"),
        ruleDetail: t("Entry: {{amount}} B3TR", { amount: humanNumber(challenge.stakeAmount, challenge.stakeAmount) }),
        ruleTooltip: t("Each participant bets the same amount. Top scorer wins the entire prize pool."),
      }

    if (isSplitWin)
      return {
        ruleLabel: t("Split win"),
        ruleDetail: t("{{count}}+ actions to claim", { count: threshold }),
        ruleTooltip: t("Split win description"),
      }

    return {
      ruleLabel: t("Winner takes all"),
      ruleDetail: t("No entry fee"),
      ruleTooltip: t("Top scorer wins the entire prize pool"),
    }
  }, [isStake, isSplitWin, challenge.stakeAmount, perWinnerLabel, threshold, t])

  const roundsLabel =
    challenge.duration === 1
      ? t("Round #{{round}}", { round: challenge.startRound })
      : t("#{{from}} – #{{to}}", { from: challenge.startRound, to: challenge.endRound })

  const selectedApps = challenge.selectedApps
  const singleAppName = selectedApps.length === 1 ? appNames.get(selectedApps[0]?.toLowerCase() ?? "") : null
  const hasMultipleApps = !challenge.allApps && selectedApps.length > 1
  const maxVisibleIcons = 3
  const overflowCount = Math.max(selectedApps.length - maxVisibleIcons, 0)

  return (
    <>
      <Grid
        templateColumns={{ base: "repeat(2, 1fr)", md: isSplitWin ? "repeat(5, 1fr)" : "repeat(4, 1fr)" }}
        gap={{ base: 2, md: 3 }}
        w="full">
        {/* Prize Pool */}
        <GridItem>
          <Card.Root variant="outline" p={{ base: 2, md: 4 }} h="full">
            <Card.Body>
              <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
                  {t("Prize Pool")}
                </Text>
                <HStack gap={{ base: 2, md: 3 }}>
                  <HStack
                    justify="center"
                    align="center"
                    w={{ base: "7", md: "10" }}
                    h={{ base: "7", md: "10" }}
                    rounded="full"
                    bg="status.warning.subtle"
                    color="status.warning.primary"
                    flexShrink={0}>
                    <Icon as={B3trSvg} boxSize={{ base: 4, md: 5 }} />
                  </HStack>
                  <Flex direction="column">
                    <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold" color="brand.primary">
                      {humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
                    </Text>
                    {isSplitWin && (
                      <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
                        {perWinnerLabel} {t("per winner")}
                      </Text>
                    )}
                  </Flex>
                </HStack>
              </Flex>
            </Card.Body>
          </Card.Root>
        </GridItem>

        {isSplitWin && (
          <GridItem>
            <Card.Root variant="outline" p={{ base: 2, md: 4 }} h="full">
              <Card.Body>
                <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
                    {t("Winners")}
                  </Text>
                  <Flex direction="column">
                    <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                      {humanNumber(challenge.winnersClaimed)} {"/"} {humanNumber(challenge.numWinners)}
                    </Text>
                    <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
                      {t("{{remaining}} slots left", { remaining: slotsLeft })}
                    </Text>
                  </Flex>
                </Flex>
              </Card.Body>
            </Card.Root>
          </GridItem>
        )}

        {/* Rule */}
        <GridItem>
          <Card.Root variant="outline" p={{ base: 2, md: 4 }} h="full">
            <Card.Body>
              <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                <HStack gap={1} mb={2}>
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
                    {t("Rule")}
                  </Text>
                  <Tooltip content={ruleTooltip} contentProps={{ maxW: "xs" }} positioning={{ placement: "top" }}>
                    <chakra.button
                      type="button"
                      aria-label={ruleTooltip}
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      color="text.subtle"
                      flexShrink={0}
                      bg="transparent"
                      borderWidth="0"
                      p="0"
                      lineHeight="0">
                      <Icon as={FiInfo} boxSize={{ base: 3, md: 4 }} />
                    </chakra.button>
                  </Tooltip>
                </HStack>
                <HStack gap={{ base: 2, md: 3 }}>
                  <HStack
                    justify="center"
                    align="center"
                    w={{ base: "7", md: "10" }}
                    h={{ base: "7", md: "10" }}
                    rounded="full"
                    bg="status.positive.subtle"
                    color="status.positive.primary"
                    flexShrink={0}>
                    <Icon as={LuScale} boxSize={{ base: 4, md: 5 }} />
                  </HStack>
                  <Flex direction="column">
                    <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                      {ruleLabel}
                    </Text>
                    <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
                      {ruleDetail}
                    </Text>
                  </Flex>
                </HStack>
              </Flex>
            </Card.Body>
          </Card.Root>
        </GridItem>

        {/* Duration */}
        <GridItem>
          <Card.Root variant="outline" p={{ base: 2, md: 4 }} h="full">
            <Card.Body>
              <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
                  {t("Duration")}
                </Text>
                <HStack gap={{ base: 2, md: 3 }}>
                  <HStack
                    justify="center"
                    align="center"
                    w={{ base: "7", md: "10" }}
                    h={{ base: "7", md: "10" }}
                    rounded="full"
                    bg="status.info.subtle"
                    color="status.info.primary"
                    flexShrink={0}>
                    <Icon as={LuClock} boxSize={{ base: 4, md: 5 }} />
                  </HStack>
                  <Flex direction="column">
                    <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                      {challenge.duration} {challenge.duration === 1 ? t("Round") : t("Rounds")}
                    </Text>
                    <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
                      {roundsLabel}
                    </Text>
                  </Flex>
                </HStack>
              </Flex>
            </Card.Body>
          </Card.Root>
        </GridItem>

        {/* Apps */}
        <GridItem>
          <Card.Root
            variant="outline"
            p={{ base: 2, md: 4 }}
            h="full"
            flexDirection={hasMultipleApps ? "row" : undefined}
            alignItems={hasMultipleApps ? "center" : undefined}
            cursor={hasMultipleApps ? "pointer" : undefined}
            _hover={hasMultipleApps ? { borderColor: "border.emphasized" } : undefined}
            onClick={hasMultipleApps ? () => setIsAppsModalOpen(true) : undefined}>
            <Card.Body flex={1}>
              <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                <HStack gap={1} mb={2}>
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
                    {t("Eligible Apps")}
                  </Text>
                  <Tooltip
                    content={t(
                      "Use any of these apps to perform actions and earn points toward this challenge. Actions on apps not listed here will not count.",
                    )}
                    contentProps={{ maxW: "xs" }}
                    positioning={{ placement: "top" }}>
                    <chakra.button
                      type="button"
                      aria-label={t(
                        "Use any of these apps to perform actions and earn points toward this challenge. Actions on apps not listed here will not count.",
                      )}
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      color="text.subtle"
                      flexShrink={0}
                      bg="transparent"
                      borderWidth="0"
                      p="0"
                      lineHeight="0"
                      onClick={e => e.stopPropagation()}>
                      <Icon as={FiInfo} boxSize={{ base: 3, md: 4 }} />
                    </chakra.button>
                  </Tooltip>
                </HStack>
                <HStack gap={{ base: 2, md: 3 }}>
                  {challenge.allApps ? (
                    <>
                      <HStack
                        justify="center"
                        align="center"
                        w={{ base: "7", md: "10" }}
                        h={{ base: "7", md: "10" }}
                        rounded="full"
                        bg="status.positive.subtle"
                        color="status.positive.primary"
                        flexShrink={0}>
                        <Icon as={LuLayoutGrid} boxSize={{ base: 4, md: 5 }} />
                      </HStack>
                      <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                        {t("All apps")}
                      </Text>
                    </>
                  ) : selectedApps.length === 1 ? (
                    <>
                      <AppImage
                        appId={selectedApps[0] ?? ""}
                        boxSize={{ base: "7", md: "10" }}
                        borderRadius="full"
                        flexShrink={0}
                      />
                      <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold" truncate>
                        {singleAppName ?? humanNumber(1)}
                      </Text>
                    </>
                  ) : (
                    <HStack gap="0">
                      {selectedApps.slice(0, maxVisibleIcons).map((appId, i) => (
                        <AppImage
                          key={appId}
                          appId={appId}
                          boxSize={{ base: "7", md: "10" }}
                          borderRadius="full"
                          border="2px solid"
                          borderColor="bg.default"
                          ml={i > 0 ? "-2" : "0"}
                        />
                      ))}
                      {overflowCount > 0 && (
                        <HStack
                          justify="center"
                          align="center"
                          w={{ base: "7", md: "10" }}
                          h={{ base: "7", md: "10" }}
                          rounded="full"
                          bg="bg.muted"
                          color="text.default"
                          border="2px solid"
                          borderColor="bg.default"
                          ml="-2"
                          flexShrink={0}>
                          <Text textStyle={{ base: "xs", md: "sm" }} fontWeight="bold">
                            {`+${overflowCount}`}
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  )}
                </HStack>
              </Flex>
            </Card.Body>
            {hasMultipleApps && (
              <Icon boxSize={{ base: "4", md: "5" }} color="text.subtle" flexShrink={0}>
                <LuChevronRight />
              </Icon>
            )}
          </Card.Root>
        </GridItem>
      </Grid>

      <ChallengeAppsModal
        isOpen={isAppsModalOpen}
        onClose={() => setIsAppsModalOpen(false)}
        appIds={selectedApps}
        appNames={appNames}
      />
    </>
  )
}
