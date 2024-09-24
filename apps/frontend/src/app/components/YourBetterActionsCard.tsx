import { useSustainabilityActions } from "@/api"
import { UserSustainabilityOverviewStats } from "@/components"
import { BetterActionCard } from "@/components/Sustainability/BetterActionCard"
import { Card, CardBody, CardHeader, Heading, VStack } from "@chakra-ui/react"
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
        <Heading size="lg">{t("Your better actions")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <UserSustainabilityOverviewStats />
          <Heading size="sm">{t("Last actions")}</Heading>
          {lastActionsData.map((action, index) => (
            <BetterActionCard key={index} action={action} />
          ))}
        </VStack>
      </CardBody>
    </Card>
  )
}
