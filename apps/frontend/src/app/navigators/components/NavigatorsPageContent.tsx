import { Button, Heading, HStack, Icon, Link, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuCompass } from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { NavigatorEntityFormatted, NavigatorOrderBy, useNavigators } from "@/api/indexer/navigators/useNavigators"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { DelegationModal } from "../shared/DelegationModal"

import { BecomeNavigatorCTA } from "./BecomeNavigatorCTA"
import { DelegatingAlert } from "./DelegatingAlert"
import { NavigatingAlert } from "./NavigatingAlert"
import { NavigatorCard } from "./NavigatorCard"
import { NavigatorCardSkeleton } from "./NavigatorCardSkeleton"
import { NavigatorFilters, useNavigatorFilterValues } from "./NavigatorFilters"
import { NavigatorStepsCard } from "./NavigatorStepsCard"
import { NavigatorStatsCards } from "./stats/NavigatorStatsCards"

type StatusFilter = "all" | "ACTIVE" | "EXITING" | "DEACTIVATED"

export const NavigatorsPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { isMobile } = useBreakpoints()
  const { account } = useWallet()
  const { data: isNavigator } = useIsNavigator()
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)
  const { data: currentNavigatorAddr } = useGetNavigator(account?.address)
  const [delegateTarget, setDelegateTarget] = useState<NavigatorEntityFormatted | null>(null)

  const currentDelegatedNum = currentDelegation ? Number(currentDelegation.scaled) : 0
  const isDelegating = !!currentNavigatorAddr && currentDelegatedNum > 0

  const [searchTerm, setSearchTerm] = useState("")
  const [orderBy, setOrderBy] = useState<NavigatorOrderBy>("totalDelegated")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const hasActiveFilters = searchTerm !== "" || orderBy !== "totalDelegated" || statusFilter !== "all"
  const filterValues = useNavigatorFilterValues(searchTerm, orderBy, statusFilter)
  const { data: navigators, isLoading: navigatorsLoading } = useNavigators({
    ...filterValues,
    status: filterValues.status.length > 0 ? filterValues.status : undefined,
  })

  const STORAGE_KEY = "NAVIGATOR_STEPS_DISMISSED"
  const [open, setOpen] = useState(() => {
    if (isMobile) return false
    if (typeof window === "undefined") return true
    return localStorage.getItem(STORAGE_KEY) !== "true"
  })

  const onOpen = useCallback(() => setOpen(true), [])
  const onClose = useCallback(() => {
    setOpen(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }, [])

  return (
    <VStack w="full" gap={8} pb={8}>
      <HStack alignItems="center" textAlign="center" w="full" justifyContent="flex-start">
        <Heading size={{ base: "2xl", lg: "3xl" }}>{t("Navigators")}</Heading>
        {!open && (
          <Link
            display="inline-flex"
            alignItems="center"
            fontWeight={500}
            color="primary.500"
            px={0}
            textStyle={{ base: "xs", lg: "md" }}
            onClick={onOpen}>
            <Icon as={UilInfoCircle} boxSize={4} />
            {!isMobile && t("More info")}
          </Link>
        )}
      </HStack>

      <NavigatorStepsCard isOpen={open} onClose={onClose} />

      {isNavigator && <NavigatingAlert />}

      {isDelegating && currentNavigatorAddr && (
        <DelegatingAlert amount={currentDelegatedNum} navigatorAddress={currentNavigatorAddr} />
      )}

      <NavigatorStatsCards />

      <NavigatorFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        orderBy={orderBy}
        onOrderByChange={setOrderBy}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {navigatorsLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} w="full">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <NavigatorCardSkeleton key={i} />
          ))}
        </SimpleGrid>
      ) : !navigators || navigators.length === 0 ? (
        <VStack py={12} gap={3}>
          <LuCompass size={48} color="var(--chakra-colors-fg-muted)" />
          <Text textStyle="md" color="fg.muted" textAlign="center">
            {t("No navigators found.")}
          </Text>
          <Text textStyle="sm" color="fg.muted" textAlign="center">
            {t("Be the first to register as a navigator and start earning delegation fees.")}
          </Text>
          <Button
            size="sm"
            variant="outline"
            colorPalette="primary"
            mt={2}
            onClick={() => router.push("/navigators/become")}>
            {t("Become a Navigator")}
          </Button>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} w="full">
          {!hasActiveFilters && !isNavigator && <BecomeNavigatorCTA />}
          {navigators.map(nav => (
            <NavigatorCard key={nav.address} navigator={nav} onDelegate={setDelegateTarget} />
          ))}
        </SimpleGrid>
      )}

      {delegateTarget && (
        <DelegationModal isOpen={!!delegateTarget} onClose={() => setDelegateTarget(null)} navigator={delegateTarget} />
      )}
    </VStack>
  )
}
