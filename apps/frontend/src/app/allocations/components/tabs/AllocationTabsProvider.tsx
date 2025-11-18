"use client"

import { Box, Button, Dialog, Presence, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useRef, createContext, useState, useCallback, useMemo } from "react"

import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { useStickyState } from "@/hooks/useStickyState"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { AllocationRoundDetails, AppWithVotes } from "../../lib/data"
import { ConfirmVoteModal } from "../confirm-vote-modal/ConfirmVoteModal"

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
}

export const AllocationTabsContext = createContext<AllocationTabsContextType | null>(null)

interface AllocationTabsProviderProps {
  roundDetails: AllocationRoundDetails
  onSelectedAppsChange?: (selectedIds: Set<string>) => void
  children: React.ReactNode
}

export function AllocationTabsProvider({ roundDetails, onSelectedAppsChange, children }: AllocationTabsProviderProps) {
  const router = useRouter()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set())
  const { account } = useWallet()
  const { data: delegateeAddress } = useGetDelegatee(account?.address)
  const { hasVotesAtSnapshot } = useCanUserVote(account?.address, delegateeAddress)
  const { open: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure()
  const { onClose: closeTxModal } = useTransactionModal()

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
    closeModal()
    closeTxModal()
    router.push("/")
  }, [closeTxModal, closeModal, router])

  const { handleConfirmVote } = useAllocationVoting({
    roundId: roundDetails.currentRoundId.toString(),
    onSuccess: onVoteSuccess,
  })

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
        onVoteClick: openModal,
      }}>
      <Box ref={sentinelRef} height="1px" />

      {children}

      <Presence
        hideFrom="md"
        present={selectedAppIds.size > 0}
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
              <Button w="full" variant="primary" disabled={!hasVotesAtSnapshot} onClick={openModal}>
                {`Vote for ${selectedAppIds.size} App${selectedAppIds.size !== 1 ? "s" : ""}`}
              </Button>
            </Dialog.Trigger>
          </Dialog.Root>
        </Box>
      </Presence>

      {isModalOpen && (
        <ConfirmVoteModal
          isOpen={isModalOpen}
          onClose={closeModal}
          selectedApps={selectedApps}
          onConfirm={handleConfirmVote}
        />
      )}
    </AllocationTabsContext.Provider>
  )
}
