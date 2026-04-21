import { Button, Heading, HStack, Icon, Link, Stack, Tabs, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeKind } from "@/api/challenges/types"
import { useChallengesHub } from "@/api/challenges/useChallengesHub"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { mergeSectionsForTab, TabId } from "../utils/mergeSections"

import { ChallengeFilters, StatusFilter, TypeFilter } from "./ChallengeFilters"
import { ChallengesGrid } from "./ChallengesGrid"
import { ChallengeStepsCard } from "./ChallengeStepsCard"
import { CreateChallengeModal } from "./CreateChallengeModal"

const QUESTS_STEPS_CARD_DISMISSED_KEY = "vebetterdao:quests-steps-card-dismissed"

export const ChallengesPageContent = () => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: grouped } = useChallengesHub(viewerAddress)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  /** null = before first client read of localStorage */
  const [stepsOpen, setStepsOpen] = useState<boolean | null>(null)
  const open = stepsOpen !== null ? stepsOpen : !isMobile

  const onOpen = useCallback(() => setStepsOpen(true), [])
  const onClose = useCallback(() => {
    setStepsOpen(false)
    try {
      localStorage.setItem(QUESTS_STEPS_CARD_DISMISSED_KEY, "1")
    } catch {
      // ignore quota / private mode
    }
  }, [])

  const round = Number(currentRoundId ?? 0)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(QUESTS_STEPS_CARD_DISMISSED_KEY) === "1"
    } catch {
      // ignore
    }
    if (dismissed) {
      setStepsOpen(false)
    } else {
      setStepsOpen(!isMobile)
    }
  }, [isMobile])

  const [tab, setTab] = useState<TabId | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const currentTab: TabId = tab ?? (viewerAddress ? "active" : "explore")

  const tabSection = useMemo(() => mergeSectionsForTab(currentTab, grouped), [currentTab, grouped])

  const visibleItems = useMemo(
    () =>
      tabSection.items.filter(
        c => (typeFilter === "all" || c.kind === typeFilter) && (statusFilter === "all" || c.status === statusFilter),
      ),
    [tabSection.items, typeFilter, statusFilter],
  )

  return (
    <VStack align="stretch" w="full" gap="8">
      {/* Header */}
      <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap="4">
        <HStack alignItems="center" textAlign="center" justifyContent="flex-start">
          <Heading size={{ base: "2xl", lg: "3xl" }}>{t("Quests")}</Heading>
          {!open && (
            <Link
              display="inline-flex"
              alignItems="center"
              fontWeight={500}
              color="primary.500"
              px={0}
              textStyle={{ base: "xs", lg: "md" }}
              onClick={onOpen}>
              <Icon as={UilInfoCircle} boxSize={4} />
              {!isMobile && t("More info")}
            </Link>
          )}
        </HStack>
        {viewerAddress && (
          <CreateChallengeModal defaultKind={ChallengeKind.Stake} currentRound={round}>
            <Button variant="primary" size="sm">
              {t("Create Quest")}
            </Button>
          </CreateChallengeModal>
        )}
      </Stack>

      <ChallengeStepsCard isOpen={open} onClose={onClose} />

      {/* Tabs + Filters */}
      <Tabs.Root
        value={currentTab}
        onValueChange={d => setTab(d.value as TabId)}
        variant="line"
        size={{ base: "md", md: "lg" }}>
        <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap="3">
          <Tabs.List overflowX="auto" overflowY="hidden">
            {viewerAddress && <Tabs.Trigger value="active">{t("My Active Quests")}</Tabs.Trigger>}
            <Tabs.Trigger value="explore">{t("Explore")}</Tabs.Trigger>
            {viewerAddress && <Tabs.Trigger value="history">{t("History")}</Tabs.Trigger>}
          </Tabs.List>
          <ChallengeFilters
            type={typeFilter}
            status={statusFilter}
            onTypeChange={setTypeFilter}
            onStatusChange={setStatusFilter}
          />
        </Stack>
      </Tabs.Root>

      <ChallengesGrid items={visibleItems} section={tabSection} />
    </VStack>
  )
}
