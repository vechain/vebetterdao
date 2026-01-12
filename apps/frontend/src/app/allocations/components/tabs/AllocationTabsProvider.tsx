"use client"

import { Box, Presence, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { usePathname } from "next/navigation"
import { useRef, createContext, useState, useCallback, useMemo, useEffect } from "react"

import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useIsAutoVotingEnabled } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useIsAutoVotingEnabledInCurrentRound } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabledInCurrentRound"
import { useUserVotingPreferences } from "@/api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { useUserVotesInRound } from "@/api/contracts/xApps/hooks/useUserVotesInRound"
import { useStickyState } from "@/hooks/useStickyState"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { AllocationRoundDetails, AppWithVotes } from "../../lib/data"
import { AutoVoteModal } from "../AutoVoteModal"
import { ConfirmVoteModal } from "../confirm-vote-modal/ConfirmVoteModal"

import { useAutoVoteEditMode } from "./hooks/useAutoVoteEditMode"
import { useAllocationVoting } from "./vote/hooks/useAllocationVoting"
import { VoteButtons } from "./vote/VoteButtons"

export const MAX_SELECTED_APPS = 15

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
  isAutoVotingEnabledInCurrentRound: boolean
  onToggleAutoVoting: (enabled: boolean) => void
  hasVoted: boolean
  hasVotedLoading: boolean
  isVoteDataLoading: boolean
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
  children: React.ReactNode
}

export function AllocationTabsProvider({ roundDetails, children }: AllocationTabsProviderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)
  const pathname = usePathname()
  const isVoteTab = pathname === "/allocations" || pathname === "/allocations/vote"
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
  const { data: castVotesEvent, isLoading: isCastVotesLoading } = useUserVotesInRound(
    roundDetails.id.toString(),
    account?.address ?? undefined,
  )
  const { data: isAutoVotingEnabledOnChain } = useIsAutoVotingEnabled()
  const { data: isAutoVotingEnabledInCurrentRound } = useIsAutoVotingEnabledInCurrentRound()
  const { data: storedPreferences = [] } = useUserVotingPreferences(account?.address)

  // Initialize local state from chain data
  const [isAutoVotingEnabled, setIsAutoVotingEnabled] = useState(isAutoVotingEnabledOnChain ?? false)

  // Auto-vote modal
  const { open: isAutoVoteModalOpen, onOpen: openAutoVoteModal, onClose: closeAutoVoteModal } = useDisclosure()
  const { preferences, updatePreferences } = useUserPreferences()

  // Show the AutoVoteModal once on first visit to vote tab if user has voting power
  useEffect(() => {
    if (isVoteTab && preferences?.SHOW_AUTOVOTING_MODAL !== false && hasVotesAtSnapshot) {
      openAutoVoteModal()
    }
  }, [isVoteTab, hasVotesAtSnapshot, openAutoVoteModal, preferences?.SHOW_AUTOVOTING_MODAL])

  // Keep local state synced with chain state
  useEffect(() => {
    if (isAutoVotingEnabledOnChain !== undefined) {
      setIsAutoVotingEnabled(isAutoVotingEnabledOnChain)
    }
  }, [isAutoVotingEnabledOnChain])

  // Handler for enabling auto-vote - forces toggle ON
  const handleOpenModalWithAutoVote = useCallback(() => {
    setIsAutoVotingEnabled(true)
    openModal()
  }, [openModal])

  // Handler for manual voting - respects on-chain state (toggle OFF)
  const handleVoteClick = useCallback(() => {
    openModal()
  }, [openModal])

  const handleEnableAutoVoting = useCallback(() => {
    if (castVotesEvent?.appsIds) {
      // Set maintains insertion order from appsIds array
      const votedApps = new Set(castVotesEvent.appsIds)
      setSelectedAppIds(votedApps)
    }
    handleOpenModalWithAutoVote()
  }, [handleOpenModalWithAutoVote, castVotesEvent?.appsIds])

  // Auto-vote edit mode
  const {
    isEditingAutoVote,
    hasAutoVoteChanges,
    hasExistingPreferences,
    handleCancelEditAutoVote,
    handleSaveAutoVote,
    resetEditMode,
    enterEditMode,
  } = useAutoVoteEditMode({
    storedPreferences,
    votedAppIds: castVotesEvent?.appsIds,
    hasVoted: hasVoted ?? false,
    selectedAppIds,
    setSelectedAppIds,
    openModal: handleOpenModalWithAutoVote, // Use handleOpenModalWithAutoVote to ensure toggle is set correctly
  })

  // Handler for "Edit selection" in modal - closes modal and enters edit mode
  // Uses enterEditMode instead of handleEditAutoVote to preserve current selections
  const handleEditSelection = useCallback(() => {
    closeModal()
    enterEditMode()
  }, [closeModal, enterEditMode])

  const handleCloseModal = useCallback(() => {
    closeModal()
    // Reset to read-only state if we were editing
    if (isEditingAutoVote) {
      handleCancelEditAutoVote()
    }
    // Reset local state to match chain state when modal is closed
    if (isAutoVotingEnabledOnChain !== undefined) {
      setIsAutoVotingEnabled(isAutoVotingEnabledOnChain)
    }
  }, [closeModal, isEditingAutoVote, handleCancelEditAutoVote, isAutoVotingEnabledOnChain])

  // Handler for editing auto-vote preferences
  const handleEditAutoVotePreferences = useCallback(() => {
    // Load stored preferences (priority) or voted apps
    if (storedPreferences.length > 0) {
      setSelectedAppIds(new Set(storedPreferences))
    } else if (castVotesEvent?.appsIds) {
      setSelectedAppIds(new Set(castVotesEvent.appsIds))
    }
    enterEditMode() // Mark as editing so sync effect doesn't override
    handleOpenModalWithAutoVote()
  }, [storedPreferences, castVotesEvent?.appsIds, handleOpenModalWithAutoVote, enterEditMode])

  const handleCloseAutoVoteModal = useCallback(() => {
    closeAutoVoteModal()
    updatePreferences({ SHOW_AUTOVOTING_MODAL: false })
  }, [closeAutoVoteModal, updatePreferences])

  const selectedApps = useMemo(() => {
    return roundDetails.apps.filter(app => selectedAppIds.has(app.id))
  }, [roundDetails.apps, selectedAppIds])

  const isAtSelectionLimit = selectedAppIds.size >= MAX_SELECTED_APPS

  const toggleApp = useCallback((appId: string) => {
    setSelectedAppIds(prev => {
      const next = new Set(prev)
      if (next.has(appId)) {
        // Remove - Set maintains order of remaining items
        next.delete(appId)
      } else {
        // Enforce 15 app limit
        if (next.size >= MAX_SELECTED_APPS) {
          return prev // Don't add if at limit
        }
        // Add - Set adds to end, maintaining insertion order
        next.add(appId)
      }
      return next
    })
  }, [])

  const onVoteSuccess = useCallback(() => {
    resetEditMode()
    handleCloseModal()
    closeTxModal()
  }, [closeTxModal, handleCloseModal, resetEditMode])

  const { handleConfirmVote } = useAllocationVoting({
    roundId: roundDetails.currentRoundId.toString(),
    isAutoVotingEnabled,
    isAutoVotingEnabledOnChain: isAutoVotingEnabledOnChain ?? false,
    isAutoVotingEnabledInCurrentRound: isAutoVotingEnabledInCurrentRound ?? false,
    onSuccess: onVoteSuccess,
  })

  useEffect(() => {
    // Don't update during editing mode or while modal is open (voting in progress)
    if (isEditingAutoVote || isModalOpen) return
    // Don't update while vote data is loading (query refetching)
    if (isCastVotesLoading) return

    // After modal closes, sync to read-only state based on vote status
    if (hasVoted && castVotesEvent?.appsIds) {
      // User has voted - show their voted apps
      const votedAppIds = new Set(castVotesEvent.appsIds)
      setSelectedAppIds(votedAppIds)
    }
  }, [hasVoted, castVotesEvent?.appsIds, isModalOpen, isEditingAutoVote, isCastVotesLoading])

  // Show when user has voted OR has auto-voting enabled (current status OR in current round)
  const showAutoVoteUI =
    (hasVoted ?? false) || (isAutoVotingEnabledOnChain ?? false) || (isAutoVotingEnabledInCurrentRound ?? false)

  // Loading state: user has voted but vote data hasn't loaded yet
  const isVoteDataLoading = (hasVoted ?? false) && isCastVotesLoading

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
        onVoteClick: handleVoteClick,
        isAutoVotingEnabled: isAutoVotingEnabledOnChain ?? false,
        isAutoVotingEnabledInCurrentRound: isAutoVotingEnabledInCurrentRound ?? false,
        onToggleAutoVoting: setIsAutoVotingEnabled,
        hasVoted: hasVoted ?? false,
        hasVotedLoading,
        isVoteDataLoading,
        isEditingAutoVote,
        onEditAutoVote: handleEditAutoVotePreferences,
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
        present={isVoteTab && (selectedAppIds.size > 0 || showAutoVoteUI)}
        animationName={{
          _open: "slide-from-bottom",
          _closed: "slide-to-bottom, fade-out",
        }}
        animationDuration="fast"
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={2}>
        <Box py="6" px="4" bg="bg.primary" border="sm" borderColor="border.secondary">
          <VoteButtons variant="mobile" />
        </Box>
      </Presence>

      <AutoVoteModal isOpen={isAutoVoteModalOpen} onClose={handleCloseAutoVoteModal} />

      <ConfirmVoteModal
        key={selectedApps.map(a => a.id).join(",")}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedApps={selectedApps}
        onConfirm={handleConfirmVote}
        isAutoVotingEnabled={isAutoVotingEnabled}
        isAutoVotingEnabledOnChain={isAutoVotingEnabledOnChain ?? false}
        isAutoVotingEnabledInCurrentRound={isAutoVotingEnabledInCurrentRound ?? false}
        onToggleAutoVoting={setIsAutoVotingEnabled}
        nextRoundNumber={roundDetails.id + 1}
        onEditSelection={handleEditSelection}
        hasVoted={hasVoted ?? false}
      />
    </AllocationTabsContext.Provider>
  )
}
