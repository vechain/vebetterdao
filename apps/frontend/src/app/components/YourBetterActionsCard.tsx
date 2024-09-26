import { useSustainabilityActions } from "@/api"
import { UserSustainabilityOverviewStats } from "@/components"
import { BetterActionCard } from "@/components/Sustainability/BetterActionCard"
import { Card, CardBody, CardHeader, Heading, VStack, Text } from "@chakra-ui/react"
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
      <CardHeader>
        <Heading size="md">{t("Your better actions")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={12} align="stretch">
          <UserSustainabilityOverviewStats />
          <VStack spacing={4} align="stretch">
            <Heading size="md" fontWeight={400}>
              {t("Last actions")}
            </Heading>
            {lastActionsData.length > 0 ? (
              lastActionsData.map((action, index) => <BetterActionCard key={index} action={action} />)
            ) : (
              <Text>{t("No better actions found")}</Text>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
