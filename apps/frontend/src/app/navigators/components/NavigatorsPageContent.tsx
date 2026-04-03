import { Button, Grid, Heading, HStack, Spinner, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LuPlus, LuShield } from "react-icons/lu"

import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { NavigatorEntityFormatted, useNavigatorRegistrations } from "@/api/indexer/navigators/useNavigators"

import { DelegateModal } from "./DelegateModal"
import { NavigatorCard } from "./NavigatorCard"
import { NavigatorsSidebar } from "./NavigatorsSidebar"
import { NavigatorStatusBanner } from "./NavigatorStatusBanner"

export const NavigatorsPageContent = () => {
  const router = useRouter()
  const { account } = useWallet()
  const { data: isNavigator } = useIsNavigator()
  const { data: isDelegated } = useIsDelegated()
  const { data: navigators, isLoading: navigatorsLoading } = useNavigatorRegistrations()
  const [delegateTarget, setDelegateTarget] = useState<NavigatorEntityFormatted | null>(null)

  return (
    <VStack w="full" gap={6} align="stretch" px={{ base: 4, md: 0 }}>
      <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
        <VStack gap={1} align="start">
          <HStack gap={2}>
            <LuShield size={24} />
            <Heading size={{ base: "lg", md: "xl" }}>{"Navigators"}</Heading>
          </HStack>
          <Text textStyle="sm" color="fg.muted">
            {"Browse professional voting delegates and delegate your VOT3"}
          </Text>
        </VStack>

        {account?.address && !isNavigator && (
          <Button colorPalette="green" size="sm" onClick={() => router.push("/navigators/become")}>
            <LuPlus />
            {"Become a Navigator"}
          </Button>
        )}
      </HStack>

      {account?.address && <NavigatorStatusBanner isNavigator={isNavigator} isDelegated={isDelegated} />}

      <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={6} alignItems="start">
        <VStack gap={4} align="stretch">
          {navigatorsLoading ? (
            <VStack py={8}>
              <Spinner size="lg" />
            </VStack>
          ) : !navigators || navigators.length === 0 ? (
            <VStack py={12} gap={3}>
              <LuShield size={48} color="var(--chakra-colors-fg-muted)" />
              <Text textStyle="md" color="fg.muted" textAlign="center">
                {"No navigators registered yet."}
              </Text>
              <Text textStyle="sm" color="fg.muted" textAlign="center">
                {"Be the first to register as a navigator and start earning delegation fees."}
              </Text>
            </VStack>
          ) : (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              {navigators.map(nav => (
                <NavigatorCard key={nav.address} navigator={nav} onDelegate={() => setDelegateTarget(nav)} />
              ))}
            </Grid>
          )}
        </VStack>

        <NavigatorsSidebar />
      </Grid>

      {delegateTarget && (
        <DelegateModal isOpen={!!delegateTarget} onClose={() => setDelegateTarget(null)} navigator={delegateTarget} />
      )}
    </VStack>
  )
}
