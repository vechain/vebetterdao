"use client"

import { Bleed, Icon, Input, InputGroup } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { Search } from "iconoir-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"

import type { AppWithVotes } from "../../../page"
import { AlertCard } from "../../AlertCard"
import { SearchAppsBottomSheet } from "../../SearchAppsBottomSheet"

import { AppCategoryTabs } from "./AppCategoryTabs"

interface VoteTabProps {
  apps: AppWithVotes[]
  selectedAppIds: Set<string>
  onToggleApp: (appId: string) => void
  isStuck: boolean
}

export function VoteTab({ apps, selectedAppIds, onToggleApp, isStuck }: VoteTabProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlSearchQuery = searchParams.get("search") || ""
  const selectedCategory = searchParams.get("category") || "all"
  const isSearchOpen = searchParams.has("search")
  const { t } = useTranslation()

  const { account } = useWallet()
  const { data: delegateeAddress } = useGetDelegatee(account?.address)
  const { hasVotesAtSnapshot } = useCanUserVote(account?.address, delegateeAddress)

  const handleSearchChange = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams)
      params.set("search", query)
      router.replace(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const handleViewAll = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.set("search", "")
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const handleCloseSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.delete("search")
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const handleCategoryChange = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams)
      if (category !== "all") {
        params.set("category", category)
      } else {
        params.delete("category")
      }
      router.push(`?${params.toString()}`)
    },
    [searchParams, router],
  )

  return (
    <>
      {selectedAppIds && selectedAppIds.size > 0 && !hasVotesAtSnapshot && (
        <AlertCard
          status="error"
          title={t("Not enough voting power to vote")}
          message={t("You need at least 1 voting power to participate. Power up your balance to gain voting power.")}
        />
      )}
      <InputGroup
        hideFrom="md"
        startElement={<Icon as={Search} boxSize="4" color="text.subtle" />}
        rounded="xl"
        borderColor="border.primary">
        <Input
          id="allocation-app-filter"
          placeholder="Search app"
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={handleViewAll}
        />
      </InputGroup>
      <Bleed inlineStart="4" inlineEnd="4">
        <AppCategoryTabs
          apps={apps}
          selectedAppIds={selectedAppIds}
          onToggleApp={onToggleApp}
          onViewAll={handleViewAll}
          initialCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={urlSearchQuery}
          hasEnoughVotesAtSnapshot={hasVotesAtSnapshot}
          tabsListProps={{
            position: "sticky",
            top: "52px",
            py: isStuck ? "3" : undefined,
            px: "4",
            bg: isStuck ? "bg.primary" : undefined,
            zIndex: 2,
          }}
          showPagination
        />
      </Bleed>

      <SearchAppsBottomSheet
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        searchQuery={urlSearchQuery}
        onSearchChange={handleSearchChange}
        apps={apps}
        selectedAppIds={selectedAppIds}
        onToggleApp={onToggleApp}
      />
    </>
  )
}
