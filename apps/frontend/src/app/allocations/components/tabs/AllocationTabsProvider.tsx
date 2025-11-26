"use client"

import { Box, Button, HStack, Presence, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRef, createContext, useState, useCallback, useMemo, useEffect } from "react"

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
import { useVotingButtonConfig } from "./hooks/useVotingButtonConfig"
import { useAllocationVoting } from "./vote/hooks/useAllocationVoting"

export const MAX_SELECTED_APPS = 15

interface AllocationTabsContextType {
  roundId: string
  roundDetails: AllocationRoundDetails
  apps: AppWithVotes[]
  selectedAppIds: Set<string>
  selectionOrder: string[]
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
  isAtSelectionLimit: boolean
}

export const AllocationTabsContext = createContext<AllocationTabsContextType | null>(null)

interface AllocationTabsProviderProps {
  roundDetails: AllocationRoundDetails
  onSelectedAppsChange?: (selectedIds: Set<string>) => void
  children: React.ReactNode
}

export function AllocationTabsProvider({ roundDetails, onSelectedAppsChange, children }: AllocationTabsProviderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set())
  const [selectionOrder, setSelectionOrder] = useState<string[]>([])
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
      setSelectionOrder(castVotesEvent.appsIds)
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
    enterEditMode,
  } = useAutoVoteEditMode({
    storedPreferences,
    votedAppIds: castVotesEvent?.appsIds,
    selectedAppIds,
    setSelectedAppIds,
    setSelectionOrder,
    onSelectedAppsChange,
    openModal: handleOpenModal, // Use handleOpenModal to ensure toggle is set correctly
  })

  // Handler for "Edit selection" in modal - closes modal and enters edit mode
  // Uses enterEditMode instead of handleEditAutoVote to preserve current selections
  const handleEditSelection = useCallback(() => {
    closeModal()
    enterEditMode()
  }, [closeModal, enterEditMode])

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

  const isAtSelectionLimit = selectedAppIds.size >= MAX_SELECTED_APPS

  const toggleApp = useCallback(
    (appId: string) => {
      setSelectedAppIds(prev => {
        const next = new Set(prev)
        if (next.has(appId)) {
          next.delete(appId)
          // Remove from selection order
          setSelectionOrder(order => order.filter(id => id !== appId))
        } else {
          // Enforce 15 app limit
          if (next.size >= MAX_SELECTED_APPS) {
            return prev // Don't add if at limit
          }
          next.add(appId)
          // Append to selection order
          setSelectionOrder(order => [...order, appId])
        }
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
      setSelectionOrder(castVotesEvent.appsIds)
      onSelectedAppsChange?.(votedAppIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVoted, castVotesEvent?.appsIds])

  // Show when user has voted - either to edit existing preferences or enable auto-voting
  const showAutoVoteUI = hasVoted ?? false

  // Button configuration - single source of truth for button logic
  const buttonConfig = useVotingButtonConfig({
    hasVoted: hasVoted ?? false,
    isEditingAutoVote,
    isAutoVotingEnabled: isAutoVotingEnabledOnChain ?? false,
    hasExistingPreferences,
    hasAutoVoteChanges,
    selectedAppIds,
    hasEnoughVotesAtSnapshot: hasVotesAtSnapshot,
    onVoteClick: handleOpenModal,
    onEditAutoVote: handleEditAutoVote,
    onCancelEditAutoVote: handleCancelEditAutoVote,
    onSaveAutoVote: handleSaveAutoVote,
    onEnableAutoVoting: handleEnableAutoVoting,
  })

  return (
    <AllocationTabsContext.Provider
      value={{
        roundId: roundDetails.id.toString(),
        roundDetails,
        apps: roundDetails.apps,
        selectedAppIds,
        selectionOrder,
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
        isAtSelectionLimit,
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
          {buttonConfig.type === "editing" ? (
            <HStack gap="3" w="full">
              <Button flex={1} variant="secondary" onClick={buttonConfig.secondaryOnClick}>
                {buttonConfig.secondaryText}
              </Button>
              <Button
                flex={1}
                variant="primary"
                disabled={buttonConfig.primaryDisabled}
                onClick={buttonConfig.primaryOnClick}>
                {buttonConfig.primaryText}
              </Button>
            </HStack>
          ) : (
            <Button
              w="full"
              variant="primary"
              disabled={buttonConfig.primaryDisabled}
              onClick={buttonConfig.primaryOnClick}>
              {buttonConfig.primaryText}
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
