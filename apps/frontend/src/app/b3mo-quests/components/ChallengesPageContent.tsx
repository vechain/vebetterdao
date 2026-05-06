import { Button, Heading, HStack, Icon, Link, Stack, Tabs, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useQueryClient } from "@tanstack/react-query"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeKind } from "@/api/challenges/types"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { ChallengeStepsCard } from "./ChallengeStepsCard"
import { CreateChallengeModal } from "./CreateChallengeModal"
import { CurrentTab } from "./CurrentTab"
import { GuestActiveTab } from "./GuestActiveTab"
import { HistoryTab } from "./HistoryTab"

const QUESTS_STEPS_CARD_DISMISSED_KEY = "vebetterdao:quests-steps-card-dismissed"

type TabId = "current" | "history"

export const ChallengesPageContent = () => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const queryClient = useQueryClient()

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

  const [tab, setTab] = useState<TabId>("current")

  const handleTabChange = useCallback(
    (next: TabId) => {
      if (next === tab) return
      // Reset infinite-scroll pagination so the destination tab re-mounts at page 0.
      queryClient.removeQueries({ queryKey: ["challenges", "section"] })
      setTab(next)
    },
    [tab, queryClient],
  )

  return (
    <VStack align="stretch" w="full" gap="8">
      {/* Header */}
      <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap="4">
        <HStack alignItems="center" textAlign="center" justifyContent="flex-start">
          <Heading size={{ base: "2xl", lg: "3xl" }}>{t("B3MO Quests")}</Heading>
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
              {t("Create B3MO Quest")}
            </Button>
          </CreateChallengeModal>
        )}
      </Stack>

      <ChallengeStepsCard isOpen={open} onClose={onClose} />

      {viewerAddress ? (
        <Tabs.Root
          value={tab}
          onValueChange={d => handleTabChange(d.value as TabId)}
          variant="line"
          size={{ base: "md", md: "lg" }}
          lazyMount
          unmountOnExit>
          <Tabs.List overflowX="auto" overflowY="hidden">
            <Tabs.Trigger value="current">{t("Current")}</Tabs.Trigger>
            <Tabs.Trigger value="history">{t("History")}</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="current" pt="5">
            <CurrentTab viewerAddress={viewerAddress} />
          </Tabs.Content>
          <Tabs.Content value="history" pt="5">
            <HistoryTab viewerAddress={viewerAddress} />
          </Tabs.Content>
        </Tabs.Root>
      ) : (
        <GuestActiveTab />
      )}
    </VStack>
  )
}
