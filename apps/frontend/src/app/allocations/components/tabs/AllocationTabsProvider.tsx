"use client"

import { Box, Button, Dialog, HStack, Presence, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRef, createContext, useState, useCallback, useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useIsAutoVotingEnabled } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useUserVotingPreferences } from "@/api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { useUserVotesInRound } from "@/api/contracts/xApps/hooks/useUserVotesInRound"
import { useStickyState } from "@/hooks/useStickyState"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { AllocationRoundDetails, AppWithVotes } from "../../lib/data"
import { ConfirmVoteModal } from "../confirm-vote-modal/ConfirmVoteModal"

import { useAutoVoteEditMode } from "./hooks/useAutoVoteEditMode"
import { useAllocationVoting } from "./vote/hooks/useAllocationVoting"

interface AllocationTabsContextType {
  roundId: string
  roundDetails: AllocationRoundDetails
  apps: AppWithVotes[]
  selectedAppIds: Set<string>
  onToggleApp: (appId: string) => void
  isStuck: boolean
  hasEnoughVotesAtSnapshot: boolean
  onVoteClick: () => void
  isAutoVotingEnabled: boolean
  onToggleAutoVoting: (enabled: boolean) => void
  hasVoted: boolean
  hasVotedLoading: boolean
  isEditingAutoVote: boolean
  onEditAutoVote: () => void
  onCancelEditAutoVote: () => void
  onSaveAutoVote: () => void
  hasAutoVoteChanges: boolean
}

export const AllocationTabsContext = createContext<AllocationTabsContextType | null>(null)

interface AllocationTabsProviderProps {
  roundDetails: AllocationRoundDetails
  onSelectedAppsChange?: (selectedIds: Set<string>) => void
  children: React.ReactNode
}

export function AllocationTabsProvider({ roundDetails, onSelectedAppsChange, children }: AllocationTabsProviderProps) {
  const { t } = useTranslation()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set())
  const { account } = useWallet()
  const { data: delegateeAddress } = useGetDelegatee(account?.address)
  const { hasVotesAtSnapshot } = useCanUserVote(account?.address, delegateeAddress)
  const { open: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure()
  const { onClose: closeTxModal } = useTransactionModal()
  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(
    roundDetails.id.toString(),
    account?.address ?? undefined,
  )
  const { data: castVotesEvent } = useUserVotesInRound(roundDetails.id.toString(), account?.address ?? undefined)
  const { data: isAutoVotingEnabledOnChain } = useIsAutoVotingEnabled(account?.address)
  const { data: storedPreferences = [] } = useUserVotingPreferences(account?.address)

  // Initialize local state from chain data
  const [isAutoVotingEnabled, setIsAutoVotingEnabled] = useState(isAutoVotingEnabledOnChain ?? false)

  // Keep local state synced with chain state
  useEffect(() => {
    if (isAutoVotingEnabledOnChain !== undefined) {
      setIsAutoVotingEnabled(isAutoVotingEnabledOnChain)
    }
  }, [isAutoVotingEnabledOnChain])

  const {
    isEditingAutoVote,
    hasAutoVoteChanges,
    handleEditAutoVote,
    handleCancelEditAutoVote,
    handleSaveAutoVote,
    resetEditMode,
  } = useAutoVoteEditMode({
    storedPreferences,
    votedAppIds: castVotesEvent?.appsIds,
    selectedAppIds,
    setSelectedAppIds,
    onSelectedAppsChange,
    openModal,
  })

  const handleOpenModal = useCallback(() => {
    openModal()
  }, [openModal])

  const handleCloseModal = useCallback(() => {
    closeModal()
    // Reset local state to match chain state when modal is closed
    if (isAutoVotingEnabledOnChain !== undefined) {
      setIsAutoVotingEnabled(isAutoVotingEnabledOnChain)
    }
  }, [closeModal, isAutoVotingEnabledOnChain])

  const selectedApps = useMemo(() => {
    return roundDetails.apps.filter(app => selectedAppIds.has(app.id))
  }, [roundDetails.apps, selectedAppIds])

  const toggleApp = useCallback(
    (appId: string) => {
      setSelectedAppIds(prev => {
        const next = new Set(prev)
        next.has(appId) ? next.delete(appId) : next.add(appId)
        onSelectedAppsChange?.(next)
        return next
      })
    },
    [onSelectedAppsChange],
  )

  const onVoteSuccess = useCallback(() => {
    setSelectedAppIds(new Set())
    resetEditMode()
    handleCloseModal()
    closeTxModal()
  }, [closeTxModal, handleCloseModal, resetEditMode])

  const { handleConfirmVote } = useAllocationVoting({
    roundId: roundDetails.currentRoundId.toString(),
    isAutoVotingEnabled,
    isAutoVotingEnabledOnChain: isAutoVotingEnabledOnChain ?? false,
    onSuccess: onVoteSuccess,
  })

  useEffect(() => {
    if (hasVoted && castVotesEvent?.appsIds) {
      const votedAppIds = new Set(castVotesEvent.appsIds)
      setSelectedAppIds(votedAppIds)
      onSelectedAppsChange?.(votedAppIds)
    }
  }, [hasVoted, castVotesEvent, onSelectedAppsChange])

  // Determine if we should show auto-vote edit UI
  const showAutoVoteEditMode = (isAutoVotingEnabledOnChain ?? false) && (hasVoted ?? false)

  return (
    <AllocationTabsContext.Provider
      value={{
        roundId: roundDetails.id.toString(),
        roundDetails,
        apps: roundDetails.apps,
        selectedAppIds,
        onToggleApp: toggleApp,
        isStuck,
        hasEnoughVotesAtSnapshot: hasVotesAtSnapshot,
        onVoteClick: handleOpenModal,
        isAutoVotingEnabled: isAutoVotingEnabledOnChain ?? false,
        onToggleAutoVoting: setIsAutoVotingEnabled,
        hasVoted: hasVoted ?? false,
        hasVotedLoading,
        isEditingAutoVote,
        onEditAutoVote: handleEditAutoVote,
        onCancelEditAutoVote: handleCancelEditAutoVote,
        onSaveAutoVote: handleSaveAutoVote,
        hasAutoVoteChanges,
      }}>
      <Box ref={sentinelRef} height="1px" />

      {children}

      <Presence
        hideFrom="md"
        present={selectedAppIds.size > 0 || showAutoVoteEditMode}
        animationName={{
          _open: "slide-from-bottom",
          _closed: "slide-to-bottom, fade-out",
        }}
        animationDuration="fast"
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={50}>
        <Box p="4" bg="bg.primary" border="sm" borderColor="border.secondary">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              {showAutoVoteEditMode ? (
                isEditingAutoVote ? (
                  <HStack gap="3" w="full">
                    <Button flex={1} variant="secondary" onClick={handleCancelEditAutoVote}>
                      {t("Cancel Edit")}
                    </Button>
                    <Button
                      flex={1}
                      variant="primary"
                      disabled={!hasAutoVoteChanges || selectedAppIds.size === 0}
                      onClick={handleSaveAutoVote}>
                      {t("Save Auto-Vote")}
                    </Button>
                  </HStack>
                ) : (
                  <Button w="full" variant="primary" onClick={handleEditAutoVote}>
                    {t("Edit Auto-Vote")}
                  </Button>
                )
              ) : (
                <Button
                  w="full"
                  variant="primary"
                  disabled={!hasVotesAtSnapshot || selectedAppIds.size === 0}
                  onClick={handleOpenModal}>
                  {selectedAppIds.size > 1
                    ? t("Vote for {{count}} Apps", { count: selectedAppIds?.size })
                    : t("Vote for {{count}} App", { count: selectedAppIds?.size })}
                </Button>
              )}
            </Dialog.Trigger>
          </Dialog.Root>
        </Box>
      </Presence>

      {isModalOpen && (
        <ConfirmVoteModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedApps={selectedApps}
          onConfirm={handleConfirmVote}
          isAutoVotingEnabled={isAutoVotingEnabled}
          isAutoVotingEnabledOnChain={isAutoVotingEnabledOnChain ?? false}
          onToggleAutoVoting={setIsAutoVotingEnabled}
          nextRoundNumber={roundDetails.id + 1}
        />
      )}
    </AllocationTabsContext.Provider>
  )
}
