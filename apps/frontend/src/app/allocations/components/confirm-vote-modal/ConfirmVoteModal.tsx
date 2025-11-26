"use client"

import { Button, VStack, HStack, Heading, CloseButton, Flex, useMediaQuery } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { Modal } from "@/components/Modal"

import type { AppWithVotes } from "../../lib/data"
import { AutomationToggleCard } from "../AutomationToggleCard"

import { SelectedAppsPreview } from "./SelectedAppsPreview"
import { SelectedAppsSection } from "./SelectedAppsSection"
import { useConfirmVoteModal } from "./useConfirmVoteModal"
import { VotingPowerSection } from "./VotingPowerSection"

interface ConfirmVoteModalProps {
  isOpen: boolean
  onClose: () => void
  selectedApps: AppWithVotes[]
  onConfirm: (allocations: Map<string, number>) => void
  isAutoVotingEnabled: boolean
  isAutoVotingEnabledOnChain: boolean
  onToggleAutoVoting: (enabled: boolean) => void
  nextRoundNumber?: number | string
  onEditSelection?: () => void
  hasVoted: boolean
}

export const ConfirmVoteModal = ({
  isOpen,
  onClose,
  selectedApps,
  onConfirm,
  isAutoVotingEnabled,
  isAutoVotingEnabledOnChain,
  onToggleAutoVoting,
  nextRoundNumber,
  onEditSelection,
  hasVoted,
}: ConfirmVoteModalProps) => {
  const { t } = useTranslation()
  const [isCustomising, setIsCustomising] = useState(false)
  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])

  // Get user's voting power at snapshot
  const { vot3Balance, isLoading: isLoadingBalance } = useVotingPowerAtSnapshot()

  // Memoize appIds to prevent unnecessary recreations
  const appIds = useMemo(() => selectedApps.map(app => app.id), [selectedApps])

  const { allocations, setAllocation, setEqualAllocations, isValid } = useConfirmVoteModal(appIds)

  // If user has voted, toggle is OFF, and auto-voting was never enabled, there's nothing to do
  const nothingToDo = hasVoted && !isAutoVotingEnabled && !isAutoVotingEnabledOnChain
  const canSubmit = isValid && !nothingToDo

  // Only allow customisation if user hasn't voted AND auto-voting is not enabled
  const shouldShowCustomisation = !isAutoVotingEnabledOnChain && !hasVoted

  const handleConfirm = useCallback(() => {
    // Always allow voting (validation checks total > 0 and <= 100)
    onConfirm(allocations)
    setIsCustomising(false)
    onClose()
  }, [onConfirm, allocations, onClose])

  const handleCloseModal = useCallback(() => {
    setIsCustomising(false)
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
            {hasVoted ? t("Save") : t("Vote")}
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
                shouldShowCustomisation ? (
                  <Button
                    variant="link"
                    onClick={() => setIsCustomising(true)}
                    w="full"
                    justifyContent="center"
                    textStyle="md"
                    fontWeight="semibold">
                    {t("Customise votes")}
                  </Button>
                ) : undefined
              }
            />
            <SelectedAppsPreview apps={selectedApps} onEditSelection={onEditSelection} />
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
            <SelectedAppsSection
              apps={selectedApps}
              allocations={allocations}
              onAllocationChange={setAllocation}
              vot3Balance={vot3Balance}
              isLoadingBalance={isLoadingBalance}
            />
          </>
        )}
        <AutomationToggleCard
          checked={isAutoVotingEnabled}
          onCheckedChange={onToggleAutoVoting}
          nextRoundNumber={nextRoundNumber}
        />
      </VStack>
    </Modal>
  )
}
