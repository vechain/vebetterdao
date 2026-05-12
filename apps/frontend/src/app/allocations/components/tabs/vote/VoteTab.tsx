"use client"

import { Bleed } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { CantVoteCard } from "@/app/components/CantVoteCard/CantVoteCard"
import { OnboardingCard } from "@/app/components/OnboardingCard/OnboardingCard"
import { SearchField } from "@/components/SearchField/SearchField"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { VotingAlerts } from "../../VotingAlerts"
import { AllocationTabsContext } from "../AllocationTabsProvider"

import { AppCategoryTabs } from "./AppCategoryTabs"

export function VoteTab() {
  const { isMobile } = useBreakpoints()
  const { t } = useTranslation()
  const { account } = useWallet()

  const context = useContext(AllocationTabsContext)
  if (!context) throw new Error("VoteTab must be used within AllocationTabsProvider")

  const {
    apps,
    roundId,
    selectedAppIds,
    onToggleApp,
    isStuck,
    hasVoted,
    hasVotedLoading,
    hasEnoughVotesAtSnapshot,
    isEligibleToVote,
    isCanVoteLoading,
    isVoteDataLoading,
    isAutoVotingEnabled,
    isAutoVotingEnabledInCurrentRound,
    isEditingAutoVote,
    isAtSelectionLimit,
    isDelegatedToNavigator,
  } = context
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || "all"
  const shouldShowInsufficientPowerAlert = useMemo(
    () => !hasVotedLoading && !hasVoted && !hasEnoughVotesAtSnapshot,
    [hasVotedLoading, hasVoted, hasEnoughVotesAtSnapshot],
  )

  const shouldShowCantVoteCard = useMemo(
    () => !!account?.address && !isCanVoteLoading && !hasVoted && !isEligibleToVote,
    [account?.address, isCanVoteLoading, hasVoted, isEligibleToVote],
  )

  const [localSearchQuery, setLocalSearchQuery] = useState(searchParams.get("search") || "")

  const sortedApps = useMemo(() => {
    if (!hasVoted || isEditingAutoVote) return apps
    return [...apps].sort((a, b) => {
      const aVoted = selectedAppIds.has(a.id)
      const bVoted = selectedAppIds.has(b.id)
      if (aVoted && !bVoted) return -1
      if (!aVoted && bVoted) return 1
      return 0
    })
  }, [hasVoted, isEditingAutoVote, apps, selectedAppIds])

  const handleCategoryChange = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams)
      if (category !== "all") params.set("category", category)
      else params.delete("category")

      router.push(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router],
  )

  return (
    <>
      {isMobile && <VotingAlerts />}
      {shouldShowCantVoteCard && !isDelegatedToNavigator && <CantVoteCard />}
      {!isDelegatedToNavigator && <OnboardingCard />}
      <SearchField
        placeholder={t("Search app")}
        value={localSearchQuery}
        onChange={setLocalSearchQuery}
        inputWrapperProps={{ hideFrom: "md" }}
      />
      <Bleed inlineStart="4" inlineEnd="4">
        <AppCategoryTabs
          disabled={shouldShowInsufficientPowerAlert || shouldShowCantVoteCard || isDelegatedToNavigator}
          apps={sortedApps}
          selectedAppIds={selectedAppIds}
          onToggleApp={onToggleApp}
          initialCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={localSearchQuery}
          roundId={roundId}
          tabsListProps={{
            position: "sticky",
            top: "52px",
            py: isStuck ? "3" : undefined,
            px: "4",
            bg: isStuck ? "bg.primary" : undefined,
            zIndex: 2,
          }}
          hasVoted={hasVoted}
          isVoteDataLoading={isVoteDataLoading}
          isAutoVotingEnabled={isAutoVotingEnabled}
          isAutoVotingEnabledInCurrentRound={isAutoVotingEnabledInCurrentRound}
          isEditingAutoVote={isEditingAutoVote}
          isAtSelectionLimit={isAtSelectionLimit}
        />
      </Bleed>
    </>
  )
}
