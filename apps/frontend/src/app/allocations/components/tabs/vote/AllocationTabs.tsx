"use client"

import { Box, Bleed, Button, Dialog, Presence, Tabs, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter, useSearchParams } from "next/navigation"
import { createContext, useRef, useState, useCallback, useMemo, useEffect } from "react"

import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { RoundEarnings } from "@/app/allocations/history/page"
import { useStickyState } from "@/hooks/useStickyState"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import type { AllocationCurrentRoundDetails, AppWithVotes } from "../../../page"
import { AutoVoteModal } from "../../AutoVoteModal"
import { ConfirmVoteModal } from "../../confirm-vote-modal/ConfirmVoteModal"
import { RoundInfoTab } from "../round-info/RoundInfoTab"

import { useAllocationVoting } from "./hooks/useAllocationVoting"
import { VoteTab } from "./VoteTab"

interface AllocationTabsContextType {
  roundId: number
  apps: AppWithVotes[]
  selectedAppIds: Set<string>
  onToggleApp: (appId: string) => void
  isStuck: boolean
  hasEnoughVotesAtSnapshot: boolean
}

export const AllocationTabsContext = createContext<AllocationTabsContextType | null>(null)

interface AllocationTabsProps {
  currentRoundDetails: AllocationCurrentRoundDetails
  onSelectedAppsChange?: (selectedIds: Set<string>) => void
  previous3RoundsEarnings: RoundEarnings[]
}

export function AllocationTabs({
  currentRoundDetails,
  onSelectedAppsChange,
  previous3RoundsEarnings,
}: AllocationTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set())
  const [isAutoVotingEnabled, setIsAutoVotingEnabled] = useState(false)
  const { account } = useWallet()
  const { data: delegateeAddress } = useGetDelegatee(account?.address)
  const { hasVotesAtSnapshot } = useCanUserVote(account?.address, delegateeAddress)
  const { open: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure()
  const { open: isAutoVoteModalOpen, onOpen: openAutoVoteModal, onClose: closeAutoVoteModal } = useDisclosure()
  const { onClose: closeTxModal } = useTransactionModal()

  const currentTab = searchParams.get("tab") || "vote"

  // @TODO: Add tracking so we don't show the modal to users who have already seen it
  useEffect(() => {
    // const hasSeenAutoVoteModal = localStorage.getItem("hasSeenAutoVoteModal")
    // if (hasVotesAtSnapshot && !hasSeenAutoVoteModal) {
    //   openAutoVoteModal()
    //   localStorage.setItem("hasSeenAutoVoteModal", "true")
    // }

    if (hasVotesAtSnapshot) {
      openAutoVoteModal()
    }
  }, [hasVotesAtSnapshot, openAutoVoteModal])

  // Handler for auto-vote modal
  const handleAutoVoteApply = useCallback(
    (enabled: boolean) => {
      setIsAutoVotingEnabled(enabled)
      closeAutoVoteModal()
    },
    [closeAutoVoteModal],
  )

  const selectedApps = useMemo(() => {
    return currentRoundDetails.apps.filter(app => selectedAppIds.has(app.id))
  }, [currentRoundDetails.apps, selectedAppIds])

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
    roundId: currentRoundDetails.id.toString(),
    onSuccess: onVoteSuccess,
    isAutoVotingEnabled,
  })

  const handleTabChange = (details: { value: string }) => {
    const params = new URLSearchParams(searchParams)
    params.set("tab", details.value)
    router.push(`?${params.toString()}`)
  }

  return (
    <AllocationTabsContext.Provider
      value={{
        roundId: currentRoundDetails.id,
        apps: currentRoundDetails.apps,
        selectedAppIds,
        onToggleApp: toggleApp,
        isStuck,
        hasEnoughVotesAtSnapshot: hasVotesAtSnapshot,
      }}>
      <Box ref={sentinelRef} height="1px" />

      <Tabs.Root
        value={currentTab}
        variant="line"
        size={{ base: "md", md: "lg" }}
        w="full"
        lazyMount
        onValueChange={handleTabChange}>
        <Bleed
          position={{ base: "sticky", md: "static" }}
          top="0"
          zIndex={2}
          inlineStart={{ base: "4", md: "0" }}
          inlineEnd={{ base: "4", md: "0" }}>
          <Tabs.List pt={isStuck ? "3" : undefined} px={{ base: "4", md: "0" }} bg={isStuck ? "bg.primary" : undefined}>
            <Tabs.Trigger flex={{ base: 1, md: "unset" }} justifyContent="center" value="vote">
              {"Vote for apps"}
            </Tabs.Trigger>
            <Tabs.Trigger flex={{ base: 1, md: "unset" }} justifyContent="center" value="round">
              {"Round info"}
            </Tabs.Trigger>
          </Tabs.List>
        </Bleed>
        <Tabs.Content value="vote" display="flex" flexDirection="column" gap="4">
          <VoteTab
            apps={currentRoundDetails.apps}
            selectedAppIds={selectedAppIds}
            onToggleApp={toggleApp}
            isStuck={isStuck}
            hasEnoughVotesAtSnapshot={hasVotesAtSnapshot}
            onVoteClick={openModal}
          />
        </Tabs.Content>
        <Tabs.Content value="round">
          <RoundInfoTab currentRoundDetails={currentRoundDetails} previous3RoundsEarnings={previous3RoundsEarnings} />
        </Tabs.Content>
      </Tabs.Root>

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

      <AutoVoteModal isOpen={isAutoVoteModalOpen} onClose={closeAutoVoteModal} onApply={handleAutoVoteApply} />
    </AllocationTabsContext.Provider>
  )
}
