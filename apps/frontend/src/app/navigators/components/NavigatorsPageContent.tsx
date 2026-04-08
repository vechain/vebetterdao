import { Button, Card, Heading, HStack, Icon, Link, SimpleGrid, Spinner, Stack, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuArrowRight, LuPlus, LuShield } from "react-icons/lu"

import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { NavigatorEntityFormatted, NavigatorOrderBy, useNavigators } from "@/api/indexer/navigators/useNavigators"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { DelegateModal } from "./DelegateModal"
import { NavigatorCard } from "./NavigatorCard"
import { NavigatorFilters, useNavigatorFilterValues } from "./NavigatorFilters"
import { NavigatorStatsCards } from "./NavigatorStatsCards"
import { NavigatorStepsCard } from "./NavigatorStepsCard"

type StatusFilter = "all" | "ACTIVE" | "EXITING" | "DEACTIVATED"

export const NavigatorsPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  const { data: isNavigator } = useIsNavigator()
  const [delegateTarget, setDelegateTarget] = useState<NavigatorEntityFormatted | null>(null)

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
      <Stack direction={{ base: "column", md: "row" }} w="full" justifyContent="space-between">
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
        {account?.address && !isNavigator && (
          <HStack w="full" justifyContent={{ base: "space-between", md: "flex-end" }}>
            <Button onClick={() => router.push("/navigators/become")} variant="primary" size="md">
              <LuPlus />
              {t("Become a Navigator")}
            </Button>
          </HStack>
        )}
      </Stack>

      <NavigatorStepsCard isOpen={open} onClose={onClose} />
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
        <VStack w="full" gap={12} py={12} justify="center">
          <Spinner size="lg" />
        </VStack>
      ) : !navigators || navigators.length === 0 ? (
        <VStack py={12} gap={3}>
          <LuShield size={48} color="var(--chakra-colors-fg-muted)" />
          <Text textStyle="md" color="fg.muted" textAlign="center">
            {t("No navigators found.")}
          </Text>
          <Text textStyle="sm" color="fg.muted" textAlign="center">
            {t("Be the first to register as a navigator and start earning delegation fees.")}
          </Text>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} w="full">
          {!hasActiveFilters && <BecomeNavigatorCTA />}
          {navigators.map(nav => (
            <NavigatorCard key={nav.address} navigator={nav} />
          ))}
        </SimpleGrid>
      )}

      {delegateTarget && (
        <DelegateModal isOpen={!!delegateTarget} onClose={() => setDelegateTarget(null)} navigator={delegateTarget} />
      )}
    </VStack>
  )
}

const BecomeNavigatorCTA = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Card.Root
      variant="outline"
      w="full"
      borderRadius="xl"
      borderStyle="dashed"
      cursor="pointer"
      _hover={{ borderColor: "primary.500", bg: "primary.500/5" }}
      onClick={() => router.push("/navigators/become")}>
      <Card.Body display="flex" justifyContent="center" alignItems="center">
        <VStack gap={3} align="center" textAlign="center" py={4}>
          <LuShield size={32} color="var(--chakra-colors-primary-500)" />
          <Text textStyle="sm" fontWeight="semibold">
            {t("Become a Navigator")}
          </Text>
          <Text textStyle="xs" color="fg.muted">
            {t("Stake B3TR, vote on behalf of citizens, and earn delegation fees.")}
          </Text>
          <Button size="xs" variant="outline" colorPalette="primary" mt={1}>
            {t("Get Started")}
            <LuArrowRight />
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
