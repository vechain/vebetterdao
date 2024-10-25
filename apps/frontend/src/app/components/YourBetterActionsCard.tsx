import { useSustainabilityActions } from "@/api"
import { UserSustainabilityOverviewStats } from "@/components"
import { Card, CardBody, Heading, VStack, Text, Button } from "@chakra-ui/react"

import { useTranslation } from "react-i18next"
import { NoActionsCard } from "./NoActionsCard"
import { useRouter } from "next/navigation"
import { BetterActionCard } from "@/components/TransactionCard/cards/BetterActionCard"
import { NoAccountActionCard } from "./NoAccountActionCard"

type Props = {
  address: string
  renderActions?: boolean
  maxActions?: number
}
export const YourBetterActionsCard = ({ address, renderActions = true, maxActions = 3 }: Props) => {
  const { t } = useTranslation()

  const router = useRouter()

  const { data } = useSustainabilityActions({
    wallet: address ?? undefined,
    direction: "desc",
  })

  const lastActions = data?.pages.map(page => page.data).flat() ?? []
  const lastActionsData = lastActions.slice(0, maxActions)

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
            {address && <UserSustainabilityOverviewStats address={address} />}
            {renderActions && (
              <VStack spacing={4} align="stretch">
                {address ? (
                  <>
                    <Heading size="sm" fontWeight={600}>
                      {t("Last actions")}
                    </Heading>
                    {lastActionsData.length > 0 ? (
                      lastActionsData.map((action, index) => <BetterActionCard key={index} action={action} />)
                    ) : (
                      <NoActionsCard />
                    )}

                    {lastActionsData.length > maxActions && (
                      <Button variant={"primaryLink"} size={"sm"} onClick={() => router.push("/profile")}>
                        {t("See all")}
                      </Button>
                    )}
                  </>
                ) : (
                  <NoAccountActionCard />
                )}
              </VStack>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
