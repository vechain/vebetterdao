import { Button, Card, Grid, Spinner, Text, VStack } from "@chakra-ui/react"
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

  if (navigatorsLoading) {
    return (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size="lg" />
      </VStack>
    )
  }

  return (
    <VStack w="full" gap={8} pb={8}>
      {account?.address && <NavigatorStatusBanner isNavigator={isNavigator} isDelegated={isDelegated} />}

      <Grid alignItems="flex-start" w="full" gap={4} templateColumns={{ base: "1fr", md: "2fr 1fr" }}>
        <Card.Root unstyled>
          <Card.Header
            w="full"
            display="flex"
            py="4"
            flexDirection="row"
            alignItems="flex-start"
            justifyContent="space-between">
            <Card.Title textStyle={{ base: "2xl", md: "3xl" }} fontWeight="bold">
              {"Navigators"}
            </Card.Title>

            {account?.address && !isNavigator && (
              <Button onClick={() => router.push("/navigators/become")} variant="primary">
                <LuPlus />
                {"Become a Navigator"}
              </Button>
            )}
          </Card.Header>
          <Card.Body>
            <VStack alignSelf="flex-start" gap={4} w={{ base: "full", md: undefined }}>
              {!navigators || navigators.length === 0 ? (
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
