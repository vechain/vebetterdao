"use client"

import { Box, Bleed, Button, Dialog, Presence, Tabs } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter, useSearchParams } from "next/navigation"
import { createContext, useRef, useState, useCallback } from "react"

import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { RoundEarnings } from "@/app/allocations/history/page"
import { useStickyState } from "@/hooks/useStickyState"

import type { AllocationCurrentRoundDetails, AppWithVotes } from "../../../page"
import { RoundInfoTab } from "../round-info/RoundInfoTab"

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
  const { account } = useWallet()
  const { data: delegateeAddress } = useGetDelegatee(account?.address)
  const { hasVotesAtSnapshot } = useCanUserVote(account?.address, delegateeAddress)

  const currentTab = searchParams.get("tab") || "vote"

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
              <Button w="full" variant="primary" disabled={!hasVotesAtSnapshot}>
                {`Vote for ${selectedAppIds.size} App${selectedAppIds.size !== 1 ? "s" : ""}`}
              </Button>
            </Dialog.Trigger>
          </Dialog.Root>
        </Box>
      </Presence>
    </AllocationTabsContext.Provider>
  )
}
