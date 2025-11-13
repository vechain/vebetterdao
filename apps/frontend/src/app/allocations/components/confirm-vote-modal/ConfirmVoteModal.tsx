"use client"

import { Button, VStack, HStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useTotalVotesOnBlock } from "@/api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useAllocationRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useAllocationRoundSnapshot"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { Modal } from "@/components/Modal"

import type { AppWithVotes } from "../../page"

import { SelectedAppsPreview } from "./SelectedAppsPreview"
import { SelectedAppsSection } from "./SelectedAppsSection"
import { useConfirmVoteModal } from "./useConfirmVoteModal"
import { VotingPowerSection } from "./VotingPowerSection"

interface ConfirmVoteModalProps {
  isOpen: boolean
  onClose: () => void
  selectedApps: AppWithVotes[]
  onConfirm: (allocations: Map<string, number>) => void
}

export const ConfirmVoteModal = ({ isOpen, onClose, selectedApps, onConfirm }: ConfirmVoteModalProps) => {
  const { t } = useTranslation()
  const [isCustomising, setIsCustomising] = useState(false)

  const { account } = useWallet()

  // Get current round ID and its snapshot block
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: snapshotBlock } = useAllocationRoundSnapshot(currentRoundId ?? "")

  // Get VOT3 balance at snapshot block
  const { data: votesAtSnapshot, isLoading: isLoadingBalance } = useTotalVotesOnBlock(
    snapshotBlock ? Number(snapshotBlock) : undefined,
    account?.address,
  )

  // Format the balance for display
  const vot3Balance = useMemo(() => {
    if (!votesAtSnapshot?.totalVotesWithDeposits) return undefined
    const scaled = votesAtSnapshot.totalVotesWithDeposits
    const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)
    return {
      original: scaled,
      scaled,
      formatted,
    }
  }, [votesAtSnapshot])

  // Memoize appIds to prevent unnecessary recreations
  const appIds = useMemo(() => selectedApps.map(app => app.id), [selectedApps])

  const { allocations, setAllocation, setEqualAllocations, isValid } = useConfirmVoteModal(appIds)

  const canSubmit = isValid()

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={t("Confirm your vote")}
      showCloseButton={true}
      showLogo={false}
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
            {t("Vote")}
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
                <Button
                  variant="link"
                  onClick={() => setIsCustomising(true)}
                  w="full"
                  justifyContent="center"
                  textStyle="md"
                  fontWeight="semibold">
                  {t("Customise votes")}
                </Button>
              }
            />
            <SelectedAppsPreview apps={selectedApps} />
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
      </VStack>
    </Modal>
  )
}
