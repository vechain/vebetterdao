"use client"

import { Button, VStack, HStack, Heading, CloseButton, Flex, useMediaQuery } from "@chakra-ui/react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { Modal } from "@/components/Modal"

import type { AppWithVotes } from "../../lib/data"
import { AllocationAlertCard } from "../AllocationAlertCard"
import { AutomationToggleCard } from "../AutomationToggleCard"
import { PreferredRelayerSection } from "../PreferredRelayerSection"

import { FreshnessHint } from "./FreshnessHint"
import { SelectedAppsPreview } from "./SelectedAppsPreview"
import { SelectedAppsSection } from "./SelectedAppsSection"
import { useConfirmVoteModal } from "./useConfirmVoteModal"
import { useFreshnessPreview } from "./useFreshnessPreview"
import { VotingPowerSection } from "./VotingPowerSection"

interface ConfirmVoteModalProps {
  isOpen: boolean
  onClose: () => void
  selectedApps: AppWithVotes[]
  onConfirm: (allocations: Map<string, number>, selectedRelayer?: string) => void
  isAutoVotingEnabled: boolean
  isAutoVotingEnabledOnChain: boolean
  isAutoVotingEnabledInCurrentRound: boolean
  onToggleAutoVoting: (enabled: boolean) => void
  nextRoundNumber?: number | string
  onEditSelection?: () => void
  hasVoted: boolean
  roundId?: string
  snapshotBlock?: string
  isNavigator?: boolean
}

export const ConfirmVoteModal = ({
  isOpen,
  onClose,
  selectedApps,
  onConfirm,
  isAutoVotingEnabled,
  isAutoVotingEnabledOnChain,
  isAutoVotingEnabledInCurrentRound,
  onToggleAutoVoting,
  nextRoundNumber,
  onEditSelection,
  hasVoted,
  roundId,
  snapshotBlock,
  isNavigator = false,
}: ConfirmVoteModalProps) => {
  const { t } = useTranslation()
  const [isCustomising, setIsCustomising] = useState(false)
  const [selectedRelayer, setSelectedRelayer] = useState<string | undefined>(undefined)
  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])

  // Get user's voting power at snapshot
  const { vot3Balance, isLoading: isLoadingBalance } = useVotingPowerAtSnapshot()

  // Preview the freshness multiplier the user will receive
  const freshnessPreview = useFreshnessPreview(
    selectedApps.map(app => app.id),
    roundId || "0",
    snapshotBlock,
  )

  const { allocations, setAllocation, setEqualAllocations, getTotalPercentage, isValid } = useConfirmVoteModal(
    selectedApps.map(app => app.id),
  )

  // Check if total allocation is exactly 100%
  const totalPercentage = getTotalPercentage()
  const isNot100Percent = totalPercentage !== 100

  // If user has voted, toggle is OFF, and auto-voting was never enabled, there's nothing to do
  const nothingToDo = hasVoted && !isAutoVotingEnabled && !isAutoVotingEnabledOnChain
  const canSubmit = isValid && !nothingToDo

  // Show "Customise votes" only for first-time voters with toggle OFF
  const shouldShowCustomisation = !hasVoted && !isAutoVotingEnabled

  // Show "Edit selection" for users who have voted (enabling auto-vote or editing existing preferences)
  const showEditSelection = hasVoted

  const handleConfirm = useCallback(() => {
    // Always allow voting (validation checks total > 0 and <= 100)
    onConfirm(allocations, selectedRelayer)
    setIsCustomising(false)
    setSelectedRelayer(undefined)
    onClose()
  }, [onConfirm, allocations, selectedRelayer, onClose])

  const handleCloseModal = useCallback(() => {
    setIsCustomising(false)
    setSelectedRelayer(undefined)
    onClose()
  }, [onClose])

  const titleText = hasVoted ? t("Confirm your preferences") : t("Confirm your vote")

  const modalTitle = isDesktop ? (
    <Flex justify="space-between" align="center" w="full" pb={4}>
      <Heading size="xl" fontWeight="bold">
        {titleText}
      </Heading>
      <CloseButton onClick={handleCloseModal} />
    </Flex>
  ) : (
    titleText
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={modalTitle}
      showCloseButton={false}
      showLogo={false}
      showHeader={false}
      modalProps={{ unmountOnExit: false }}
      modalContentProps={{
        maxH: "90vh",
        display: "flex",
        flexDirection: "column",
      }}
      footer={
        <HStack gap={4} w="full">
          <Button variant="secondary" onClick={handleCloseModal} flex={1}>
            {t("Cancel")}
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!canSubmit} flex={1}>
            {hasVoted ? t("Confirm") : t("Vote")}
          </Button>
        </HStack>
      }>
      <VStack gap={4} alignItems="stretch">
        {!isCustomising ? (
          <>
            <VotingPowerSection
              vot3Balance={vot3Balance}
              isLoading={isLoadingBalance}
              button={
                shouldShowCustomisation && (
                  <Button
                    variant="link"
                    onClick={() => setIsCustomising(true)}
                    w="full"
                    justifyContent="center"
                    textStyle="md"
                    fontWeight="semibold">
                    {t("Customise votes")}
                  </Button>
                )
              }
            />
            <SelectedAppsPreview
              apps={selectedApps}
              onEditSelection={showEditSelection ? onEditSelection : undefined}
            />
            {!freshnessPreview.isLoading && (
              <FreshnessHint
                isUpdated={freshnessPreview.isUpdated}
                tierLabel={freshnessPreview.tierLabel}
                isFirstVote={freshnessPreview.isFirstVote}
              />
            )}
            {isNavigator && <AllocationAlertCard status="info" message={t("navigatorVotePropagation")} />}
          </>
        ) : (
          <>
            <VotingPowerSection
              vot3Balance={vot3Balance}
              isLoading={isLoadingBalance}
              button={
                <Button
                  variant="link"
                  onClick={setEqualAllocations}
                  w="full"
                  justifyContent="center"
                  textStyle="md"
                  fontWeight="semibold">
                  {t("Equal votes")}
                </Button>
              }
            />
            {!freshnessPreview.isLoading && (
              <FreshnessHint
                isUpdated={freshnessPreview.isUpdated}
                tierLabel={freshnessPreview.tierLabel}
                isFirstVote={freshnessPreview.isFirstVote}
              />
            )}
            {isNavigator && <AllocationAlertCard status="info" message={t("navigatorVotePropagation")} />}
            <SelectedAppsSection
              apps={selectedApps}
              allocations={allocations}
              onAllocationChange={setAllocation}
              vot3Balance={vot3Balance}
              isLoadingBalance={isLoadingBalance}
            />
            {isNot100Percent && (
              <AllocationAlertCard
                status="warning"
                message={t("Vote distribution must equal 100%. Current total: {{total}}%", { total: totalPercentage })}
              />
            )}
          </>
        )}

        {!isNavigator && (
          <>
            <AutomationToggleCard
              checked={isAutoVotingEnabled}
              onCheckedChange={onToggleAutoVoting}
              nextRoundNumber={nextRoundNumber}
              isEnabledOnChain={isAutoVotingEnabledOnChain}
              hasVoted={hasVoted}
              isActiveInCurrentRound={isAutoVotingEnabledInCurrentRound}
            />
            {isAutoVotingEnabled && (
              <PreferredRelayerSection selectedRelayer={selectedRelayer} onSelectRelayer={setSelectedRelayer} />
            )}
          </>
        )}
      </VStack>
    </Modal>
  )
}
