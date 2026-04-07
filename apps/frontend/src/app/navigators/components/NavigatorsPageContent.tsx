import { Button, Card, Grid, Heading, HStack, Icon, Link, Spinner, Stack, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuPlus, LuShield } from "react-icons/lu"

import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { NavigatorEntityFormatted, useNavigatorRegistrations } from "@/api/indexer/navigators/useNavigators"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { DelegateModal } from "./DelegateModal"
import { NavigatorCard } from "./NavigatorCard"
import { NavigatorsSidebar } from "./NavigatorsSidebar"
import { NavigatorStatsCards } from "./NavigatorStatsCards"
import { NavigatorStepsCard } from "./NavigatorStepsCard"

export const NavigatorsPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  const { data: isNavigator } = useIsNavigator()
  const { data: navigators, isLoading: navigatorsLoading } = useNavigatorRegistrations()
  const [delegateTarget, setDelegateTarget] = useState<NavigatorEntityFormatted | null>(null)

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

  if (navigatorsLoading) {
    return (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size="lg" />
      </VStack>
    )
  }

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

      <Grid alignItems="flex-start" w="full" gap={4} templateColumns={{ base: "1fr", md: "2fr 1fr" }}>
        <Card.Root unstyled>
          <Card.Body>
            <VStack alignSelf="flex-start" gap={4} w={{ base: "full", md: undefined }}>
              {!navigators || navigators.length === 0 ? (
                <VStack py={12} gap={3}>
                  <LuShield size={48} color="var(--chakra-colors-fg-muted)" />
                  <Text textStyle="md" color="fg.muted" textAlign="center">
                    {t("No navigators registered yet.")}
                  </Text>
                  <Text textStyle="sm" color="fg.muted" textAlign="center">
                    {t("Be the first to register as a navigator and start earning delegation fees.")}
                  </Text>
                </VStack>
              ) : (
                navigators.map(nav => (
                  <NavigatorCard key={nav.address} navigator={nav} onDelegate={() => setDelegateTarget(nav)} />
                ))
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        <VStack hideBelow="md" alignSelf="flex-start" gap={6} position="sticky" top={24}>
          <NavigatorsSidebar />
        </VStack>

        <VStack hideFrom="md" mt={2} w="full">
          <NavigatorsSidebar />
        </VStack>
      </Grid>

      {delegateTarget && (
        <DelegateModal isOpen={!!delegateTarget} onClose={() => setDelegateTarget(null)} navigator={delegateTarget} />
      )}
    </VStack>
  )
}
