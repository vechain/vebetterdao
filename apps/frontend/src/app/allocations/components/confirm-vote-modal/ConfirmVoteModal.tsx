"use client"

import { Button, Dialog, Portal, CloseButton, VStack } from "@chakra-ui/react"
import { useCallback, useEffect, useMemo, useState } from "react"

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
  const [isCustomising, setIsCustomising] = useState(false)

  // Memoize appIds to prevent unnecessary recreations
  const appIds = useMemo(() => selectedApps.map(app => app.id), [selectedApps])

  const { allocations, setAllocation, setEqualAllocations, isValid } = useConfirmVoteModal(appIds)

  const canSubmit = isValid()

  // Reset allocations to equal distribution when modal opens
  useEffect(() => {
    if (isOpen) {
      setEqualAllocations()
      setIsCustomising(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleConfirm = useCallback(() => {
    // Always allow voting (validation checks total > 0 and <= 100)
    onConfirm(allocations)
    setIsCustomising(false)
    onClose()
  }, [onConfirm, allocations, onClose])

  const handleEqualVotes = useCallback(() => {
    setEqualAllocations()
  }, [setEqualAllocations])

  const handleCustomise = useCallback(() => {
    setIsCustomising(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsCustomising(false)
    onClose()
  }, [onClose])

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={details => {
        if (!details.open) {
          handleCloseModal()
        }
      }}
      size="lg"
      trapFocus={false}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content rounded="2xl" maxH="90vh" display="flex" flexDirection="column">
            {/* Header */}
            <Dialog.Header
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={8}
              py={6}
              position="relative"
              flexShrink={0}>
              <Dialog.Title textStyle="xl" fontWeight="bold">
                {"Confirm your vote"}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild position="absolute" right={6} top="50%" transform="translateY(-50%)">
                <CloseButton size="md" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            {/* Body */}
            <Dialog.Body px={8} pb={4} flex="1" overflowY="auto">
              <VStack gap={4} alignItems="stretch">
                <VotingPowerSection />

                {!isCustomising ? (
                  <>
                    <CustomiseAllocationButton onClick={handleCustomise} />
                    <SelectedAppsPreview apps={selectedApps} />
                  </>
                ) : (
                  <>
                    <EqualVotesButton onClick={handleEqualVotes} />
                    <SelectedAppsSection
                      apps={selectedApps}
                      allocations={allocations}
                      onAllocationChange={setAllocation}
                    />
                  </>
                )}
              </VStack>
            </Dialog.Body>

            {/* Footer */}
            <Dialog.Footer
              display="flex"
              gap={4}
              px={8}
              py={6}
              borderTopWidth="1px"
              borderColor="border.secondary"
              flexShrink={0}>
              <Button variant={"secondary"} onClick={handleCloseModal} flex={1}>
                {"Cancel"}
              </Button>
              <Button variant={"primary"} onClick={handleConfirm} disabled={!canSubmit} flex={1}>
                {"Vote"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
