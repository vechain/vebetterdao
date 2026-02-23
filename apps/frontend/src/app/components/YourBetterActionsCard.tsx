import { Card, Heading, VStack, Text, Link } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { useUsersB3trActions } from "../../api/indexer/actions/useUsersB3trActions"
import { UserSustainabilityOverviewStats } from "../../components/Sustainability/UserOverview/UserSustainabilityOverviewStats"
import { BetterActionCard } from "../../components/TransactionCard/cards/BetterActionCard/BetterActionCard"

import { NoAccountActionCard } from "./NoAccountActionCard"
import { NoActionsCard } from "./NoActionsCard"

type Props = {
  address: string
  renderActions?: boolean
  maxActions?: number
}
export const YourBetterActionsCard = ({ address, renderActions = true, maxActions = 3 }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const isConnectedUser = compareAddresses(account?.address ?? "", address)
  const { data } = useUsersB3trActions(address, { direction: "DESC" })
  const lastActions = data?.pages.map(page => page.data).flat() ?? []
  const lastActionsData = lastActions.slice(0, maxActions)

  if (!isConnectedUser) {
    return null
  }

  return (
    <Card.Root w={"full"} variant="primary">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <VStack gap={2} align="stretch">
            <VStack w="full" align={"flex-start"}>
              <Heading size="xl">{isConnectedUser ? t("Your better actions") : t("Better actions")}</Heading>
            </VStack>

            <Text textStyle="sm" color="text.subtle">
              {t("Use Apps to earn B3TR tokens through your Better Actions")}
            </Text>
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
                      <Link
                        mx="auto"
                        asChild
                        variant="plain"
                        color="actions.secondary.text-lighter"
                        fontWeight="semibold">
                        <NextLink href="/apps">{t("See all")}</NextLink>
                      </Link>
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
