"use client"

import { Button, Card, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useContext } from "react"
import { useTranslation } from "react-i18next"

import { AllocationTabsContext } from "./tabs/AllocationTabsProvider"

export const NavigatorPromoCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const context = useContext(AllocationTabsContext)

  if (!context || context.isDelegatedToNavigator || context.isNavigator) return null

  return (
    <Card.Root variant="primary" p="8">
      <Card.Body gap="4">
        <VStack gap="2" alignItems="center" textAlign="center">
          <Image src="/assets/mascot/navigator-b3mo.png" alt="Navigator" boxSize="180px" />
          <Heading size="md">{t("Skip voting, not rewards")}</Heading>
          <Text textStyle="sm" color="text.subtle">
            {t(
              "Let a Navigator vote every round for you — keep your full freshness multiplier and follow a strategy you trust. Auto-voting, but smarter.",
            )}
          </Text>
        </VStack>
        <Button width="full" onClick={() => router.push("/navigators")}>
          {t("Find a Navigator")}
        </Button>
      </Card.Body>
    </Card.Root>
  )
}
