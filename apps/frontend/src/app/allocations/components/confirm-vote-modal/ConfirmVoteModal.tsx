"use client"

import { Button, VStack, HStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Modal } from "@/components/Modal"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

import type { AppWithVotes } from "../../page"

import { CustomiseAllocationButton } from "./CustomiseAllocationButton"
import { EqualVotesButton } from "./EqualVotesButton"
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
  const { data: vot3Balance, isLoading: isLoadingBalance } = useGetVot3Balance(account?.address)

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
              button={<CustomiseAllocationButton onClick={() => setIsCustomising(true)} />}
            />
            <SelectedAppsPreview apps={selectedApps} />
          </>
        ) : (
          <>
            <VotingPowerSection
              vot3Balance={vot3Balance}
              isLoading={isLoadingBalance}
              button={<EqualVotesButton onClick={setEqualAllocations} />}
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
