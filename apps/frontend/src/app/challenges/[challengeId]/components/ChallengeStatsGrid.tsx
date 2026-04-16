import { Card, Flex, Grid, GridItem, HStack, Icon, Text } from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuChevronRight, LuClock, LuLayoutGrid, LuUsers } from "react-icons/lu"

import { ChallengeDetail, ChallengeKind } from "@/api/challenges/types"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { AppImage } from "@/components/AppImage/AppImage"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"

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

  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const roundsLabel =
    challenge.duration === 1
      ? t("Round #{{round}}", { round: challenge.startRound })
      : t("#{{from}} – #{{to}}", { from: challenge.startRound, to: challenge.endRound })

  const selectedApps = challenge.selectedApps
  const singleAppName = selectedApps.length === 1 ? appNames.get(selectedApps[0].toLowerCase()) : null
  const hasMultipleApps = !challenge.allApps && selectedApps.length > 1
  const maxVisibleIcons = 3

  return (
    <>
      <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={{ base: 2, md: 3 }} w="full">
        {/* Prize — full width on mobile */}
        <GridItem>
          <Card.Root variant="outline" p={{ base: 2, md: 4 }} h="full">
            <Card.Body>
              <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
                  {t("Prize Pool")}
                  {!isSponsored && ` · ${t("Winner takes all")}`}
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
                  <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold" color="brand.primary">
                    {humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
                  </Text>
                </HStack>
              </Flex>
            </Card.Body>
          </Card.Root>
        </GridItem>

        {/* Participants */}
        <GridItem>
          <Card.Root variant="outline" p={{ base: 2, md: 4 }} h="full">
            <Card.Body>
              <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
                  {t("Participants")}
                </Text>
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
                    <Icon as={LuUsers} boxSize={{ base: 4, md: 5 }} />
                  </HStack>
                  <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                    {humanNumber(challenge.participantCount)}
                    <Text as="span" color="text.subtle" fontWeight="semibold">
                      {" / "}
                      {humanNumber(challenge.maxParticipants)}
                    </Text>
                  </Text>
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
                <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
                  {t("Eligible Apps")}
                </Text>
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
                    <>
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
                      </HStack>
                      <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                        {humanNumber(selectedApps.length)}
                      </Text>
                    </>
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
