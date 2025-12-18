"use client"

import {
  Card,
  HStack,
  Heading,
  Icon,
  Badge,
  VStack,
  Button,
  Text,
  Collapsible,
  Mark,
  IconButton,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { NavArrowRight, SmartphoneDevice } from "iconoir-react"
import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useTotalXAppEarnings } from "@/api/contracts/dbaPool/hooks/useTotalXAppEarnings"
import { useXAppsShares } from "@/api/contracts/xApps/hooks/useXAppShares"
import { AppImage } from "@/components/AppImage/AppImage"
import { SearchField } from "@/components/SearchField/SearchField"

import { AppWithVotes } from "../lib/data"

import { ActiveAppDetailModal } from "./ActiveAppDetailModal"

const INITIAL_DISPLAY_COUNT = 4
const CARD_ID = "active-round-apps-card"

const RoundActiveAppCard = ({
  id,
  appLogo,
  name,
  votesReceived,
  earnings,
  roundId,
  percentage,
  onClick,
  isCurrentRound = false,
}: Pick<AppWithVotes, "id" | "name" | "votesReceived" | "earnings"> & {
  isCurrentRound?: boolean
  appLogo?: string
  onClick: (id: string) => void
  roundId: number
  percentage?: number
}) => {
  const { t } = useTranslation()
  const { data } = useTotalXAppEarnings(roundId.toString(), id, percentage ?? 0)
  return (
    <Button unstyled asChild onClick={() => onClick(id)}>
      <Card.Root
        variant="action"
        border="none"
        display="grid"
        gridTemplateColumns="auto 1fr auto"
        alignItems="center"
        p={{ base: "2", md: "3" }}
        px={{ base: "1", md: "3" }}
        columnGap="4">
        <AppImage appId={id || ""} appLogo={appLogo} boxSize="11" flexShrink={0} shape="square" borderRadius="lg" />
        <VStack gap="1" alignItems="start">
          <Text textStyle={{ base: "md", md: "lg" }} color="text.default" fontWeight="semibold">
            {name || "-"}
          </Text>
          <HStack w="full" gap="1" lineClamp={1}>
            {earnings && (
              <Text display="inline" textStyle={{ base: "xs", md: "md" }} gap="1">
                <Mark variant="text" fontWeight="semibold" color="text.subtle">
                  {isCurrentRound ? t("Potential: ") : t("Received: ")}
                </Mark>
                {getCompactFormatter(2).format(Number(data?.totalEarnings ?? earnings.totalAmount))} {" B3TR"}
                <Mark fontWeight="semibold">{" • "}</Mark>
              </Text>
            )}

            <Text display="inline" textStyle={{ base: "xs", md: "md" }}>
              {getCompactFormatter(2).format(Number(formatEther(votesReceived, "gwei")))} {" votes"}
            </Text>
          </HStack>
        </VStack>
        <IconButton variant="ghost" p="0" minWidth="unset">
          <Icon as={NavArrowRight} boxSize={5} color="icon.default" />
        </IconButton>
      </Card.Root>
    </Button>
  )
}

export const RoundActiveAppsListCard = ({
  apps,
  roundId,
  currentRoundId,
}: {
  apps: AppWithVotes[]
  roundId: number
  currentRoundId: number
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()
  const isCurrentRound = roundId === currentRoundId

  const [clickedApp, setClickedApp] = useState<string | undefined>()
  const { data } = useXAppsShares(apps?.map(app => app.id) ?? [], roundId.toString())
  const appsMap = new Map(apps.map(app => [app.id, app]))
  const appPercentageMap = new Map(data?.map(({ app, share }) => [app, share]))

  const filteredApps = useMemo(() => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return apps

    return apps.filter(app => app.name?.toLowerCase().includes(trimmedQuery.toLowerCase()))
  }, [apps, searchQuery])

  return (
    <>
      <Card.Root id={CARD_ID} p={{ base: "4", md: "6" }} gap="6" height="max-content">
        <Card.Header gap="6" p="0">
          <HStack justifyContent="space-between">
            <Heading as={HStack} size="lg" fontWeight="semibold">
              <Icon as={SmartphoneDevice} boxSize="5" color="icon.default" />
              {t("Active apps")}
            </Heading>
            <Badge variant="neutral" size="sm" rounded="sm">
              {`${filteredApps.length} ${filteredApps.length === 1 ? t("app") : t("apps")}`}
            </Badge>
          </HStack>
          <SearchField
            inputProps={{ size: { base: "md", md: "xl" } }}
            placeholder={t("Search by app name")}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </Card.Header>
        <Card.Body asChild maxHeight={{ base: "unset", md: "1000px" }} overflowY="auto">
          <Collapsible.Root
            open={isOpen}
            onOpenChange={details => setIsOpen(details.open)}
            onExitComplete={() => document.getElementById(CARD_ID)?.scrollIntoView({ block: "center" })}>
            <VStack gap="2" align="stretch">
              {filteredApps.slice(0, INITIAL_DISPLAY_COUNT).map(app => (
                <RoundActiveAppCard
                  key={app.id}
                  id={app.id}
                  roundId={roundId}
                  isCurrentRound={isCurrentRound}
                  percentage={appPercentageMap.get(app.id)}
                  name={app.name}
                  votesReceived={app.votesReceived}
                  earnings={app.earnings}
                  onClick={setClickedApp}
                />
              ))}

              {filteredApps.length > INITIAL_DISPLAY_COUNT && (
                <>
                  <Collapsible.Content>
                    <VStack gap="2" align="stretch">
                      {filteredApps.slice(INITIAL_DISPLAY_COUNT).map(app => (
                        <RoundActiveAppCard
                          key={app.id}
                          id={app.id}
                          isCurrentRound={isCurrentRound}
                          roundId={roundId}
                          percentage={appPercentageMap.get(app.id)}
                          name={app.name}
                          appLogo={app.metadata?.logo}
                          votesReceived={app.votesReceived}
                          earnings={app.earnings}
                          onClick={setClickedApp}
                        />
                      ))}
                    </VStack>
                  </Collapsible.Content>

                  <Collapsible.Trigger asChild>
                    <Button size={{ base: "sm", md: "md" }} variant="link" fontWeight="semibold">
                      <Collapsible.Context>{api => (api.open ? t("View less") : t("View all"))}</Collapsible.Context>
                    </Button>
                  </Collapsible.Trigger>
                </>
              )}
            </VStack>
          </Collapsible.Root>
        </Card.Body>
      </Card.Root>
      {clickedApp && (
        <ActiveAppDetailModal
          roundId={roundId}
          currentRoundId={currentRoundId}
          app={appsMap.get(clickedApp)!}
          percentage={appPercentageMap.get(clickedApp)!}
          isOpen={!!clickedApp}
          onClose={() => setClickedApp(undefined)}
        />
      )}
    </>
  )
}
