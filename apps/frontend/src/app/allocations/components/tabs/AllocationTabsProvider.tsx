"use client"

import { Box, Button, HStack, Presence, useDisclosure } from "@chakra-ui/react"
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
  hasExistingPreferences: boolean
  onEnableAutoVoting: () => void
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

  const handleOpenModal = useCallback(() => {
    setIsAutoVotingEnabled(true)
    openModal()
  }, [openModal])

  const handleEnableAutoVoting = useCallback(() => {
    if (castVotesEvent?.appsIds) {
      const votedApps = new Set(castVotesEvent.appsIds)
      setSelectedAppIds(votedApps)
      onSelectedAppsChange?.(votedApps)
    }
    handleOpenModal()
  }, [handleOpenModal, castVotesEvent?.appsIds, onSelectedAppsChange])

  // Auto-vote edit mode
  const {
    isEditingAutoVote,
    hasAutoVoteChanges,
    hasExistingPreferences,
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
    openModal: handleOpenModal, // Use handleOpenModal to ensure toggle is set correctly
  })

  // Handler for "Edit selection" in modal - closes modal and enters edit mode
  const handleEditSelection = useCallback(() => {
    closeModal()
    handleEditAutoVote()
  }, [closeModal, handleEditAutoVote])

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
    // Don't clear selectedAppIds - keep them so voted apps show as ticked
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
    // Initialise selectedAppIds from voted apps when data first loads
    // Condition check for !isEditingAutoVote prevents updates during editing
    if (hasVoted && castVotesEvent?.appsIds && !isEditingAutoVote) {
      const votedAppIds = new Set(castVotesEvent.appsIds)
      setSelectedAppIds(votedAppIds)
      onSelectedAppsChange?.(votedAppIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVoted, castVotesEvent?.appsIds])

  // Show when user has voted - either to edit existing preferences or enable auto-voting
  const showAutoVoteUI = hasVoted ?? false

  // Show edit mode only when auto-voting is already enabled on chain
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
        hasExistingPreferences,
        onEnableAutoVoting: handleEnableAutoVoting,
      }}>
      <Box ref={sentinelRef} height="1px" />

      {children}

      <Presence
        hideFrom="md"
        present={selectedAppIds.size > 0 || showAutoVoteUI}
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
          {showAutoVoteUI ? (
            isEditingAutoVote ? (
              // Edit mode: Cancel/Save buttons
              <HStack gap="3" w="full">
                <Button flex={1} variant="secondary" onClick={handleCancelEditAutoVote}>
                  {t("Cancel Edit")}
                </Button>
                <Button flex={1} variant="primary" disabled={!hasAutoVoteChanges} onClick={handleSaveAutoVote}>
                  {t("Save Auto-Vote")}
                </Button>
              </HStack>
            ) : showAutoVoteEditMode ? (
              <Button w="full" variant="primary" onClick={handleEditAutoVote}>
                {hasExistingPreferences ? t("Edit Auto-Vote") : t("Enable Auto-Voting & Claim")}
              </Button>
            ) : (
              <Button w="full" variant="primary" onClick={handleEnableAutoVoting}>
                {t("Enable Auto-Voting & Claim")}
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
          onEditSelection={handleEditSelection}
          hasVoted={hasVoted ?? false}
        />
      )}
    </AllocationTabsContext.Provider>
  )
}
