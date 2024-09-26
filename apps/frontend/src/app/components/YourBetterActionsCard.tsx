import { useSustainabilityActions } from "@/api"
import { UserSustainabilityOverviewStats } from "@/components"
import { BetterActionCard } from "@/components/Sustainability/BetterActionCard"
import { Card, CardBody, Heading, VStack, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useTranslation } from "react-i18next"

export const YourBetterActionsCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data } = useSustainabilityActions({
    wallet: account ?? undefined,
    direction: "desc",
  })

  const lastActions = data?.pages.map(page => page.data).flat() ?? []
  const lastActionsData = lastActions.slice(0, 3)
  return (
    <Card w={"full"} variant={"baseWithBorder"}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <VStack spacing={2} align="stretch">
            <Heading size="md">{t("Your better actions")}</Heading>
            <Text fontSize="sm" color="#6A6A6A" fontWeight={400}>
              {t("Use Apps to earn B3TR tokens through your Better Actions")}
            </Text>
          </VStack>
          <VStack spacing={6} align="stretch">
            <UserSustainabilityOverviewStats />
            <VStack spacing={4} align="stretch">
              <Heading size="sm" fontWeight={600}>
                {t("Last actions")}
              </Heading>
              {lastActionsData.length > 0 ? (
                lastActionsData.map((action, index) => <BetterActionCard key={index} action={action} />)
              ) : (
                <Text>{t("No better actions found")}</Text>
              )}
            </VStack>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
