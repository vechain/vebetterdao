"use client"

import { Box, Bleed, Button, Dialog, Presence, Tabs } from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { createContext, useRef, useState, useCallback } from "react"

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
      }}>
      <Box ref={sentinelRef} height="1px" />

      <Tabs.Root value={currentTab} variant="line" size="md" w="full" lazyMount onValueChange={handleTabChange}>
        <Bleed position="sticky" top="0" zIndex={2} inlineStart="4" inlineEnd="4">
          <Tabs.List pt={isStuck ? "3" : undefined} px="4" bg={isStuck ? "bg.primary" : undefined}>
            <Tabs.Trigger flex={1} justifyContent="center" value="vote">
              {"Vote for apps"}
            </Tabs.Trigger>
            <Tabs.Trigger flex={1} justifyContent="center" value="round">
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
              <Button w="full" variant="primary">
                {`Vote for ${selectedAppIds.size} App${selectedAppIds.size !== 1 ? "s" : ""}`}
              </Button>
            </Dialog.Trigger>
          </Dialog.Root>
        </Box>
      </Presence>
    </AllocationTabsContext.Provider>
  )
}
