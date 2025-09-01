import { useSustainabilityActions } from "@/api"
import { UserSustainabilityOverviewStats } from "@/components"
import { Card, Heading, VStack, Text, Button } from "@chakra-ui/react"

import { useTranslation } from "react-i18next"
import { NoActionsCard } from "./NoActionsCard"
import { useRouter } from "next/navigation"
import { BetterActionCard } from "@/components/TransactionCard/cards/BetterActionCard"
import { NoAccountActionCard } from "./NoAccountActionCard"
import { useWallet } from "@vechain/vechain-kit"
import { compareAddresses } from "@repo/utils/AddressUtils"

type Props = {
  address: string
  renderActions?: boolean
  maxActions?: number
}
export const YourBetterActionsCard = ({ address, renderActions = true, maxActions = 3 }: Props) => {
  const { t } = useTranslation()

  const router = useRouter()

  const { account } = useWallet()
  const isConnectedUser = compareAddresses(account?.address ?? "", address)

  const { data } = useSustainabilityActions({
    wallet: address ?? undefined,
    direction: "desc",
  })

  const lastActions = data?.pages.map(page => page.data).flat() ?? []
  const lastActionsData = lastActions.slice(0, maxActions)

  return (
    <Card.Root w={"full"} variant="primary">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <VStack gap={2} align="stretch">
            <VStack w="full" align={"flex-start"}>
              <Heading size="xl" color="text.strong">
                {isConnectedUser ? t("Your better actions") : t("Better actions")}
              </Heading>
            </VStack>
            {isConnectedUser && (
              <Text textStyle="sm" color="text.subtle">
                {t("Use Apps to earn B3TR tokens through your Better Actions")}
              </Text>
            )}
          </VStack>
          <VStack gap={6} align="stretch">
            {address && <UserSustainabilityOverviewStats address={address} />}

            {renderActions && (
              <VStack gap={4} align="stretch">
                {address ? (
                  <>
                    <Heading size="sm" fontWeight="semibold">
                      {t("Last actions")}
                    </Heading>
                    {lastActionsData.length > 0 ? (
                      lastActionsData.map(action => (
                        <BetterActionCard
                          key={`last-action-${action.appId}-${action.blockTimestamp}`}
                          amountB3tr={action.amount}
                          appId={action.appId}
                          blockNumber={action.blockNumber}
                          blockTimestamp={action.blockTimestamp}
                          proof={action.proof}
                        />
                      ))
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
      </Card.Body>
    </Card.Root>
  )
}
