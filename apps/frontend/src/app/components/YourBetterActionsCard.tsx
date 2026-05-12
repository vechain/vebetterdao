import { Box, Card, Heading, Link, Text, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { useUserActionOverview } from "../../api/indexer/actions/useUserActionOverview"
import { useUsersB3trActions } from "../../api/indexer/actions/useUsersB3trActions"
import { UserSustainabilityOverviewStats } from "../../components/Sustainability/UserOverview/UserSustainabilityOverviewStats"
import { BetterActionCard } from "../../components/TransactionCard/cards/BetterActionCard/BetterActionCard"

import { LastSevenDaysSection } from "./LastSevenDays/LastSevenDaysSection"
import { NoAccountActionCard } from "./NoAccountActionCard"

type Props = {
  address: string
  renderActions?: boolean
  maxActions?: number
}
export const YourBetterActionsCard = ({ address, renderActions = true, maxActions = 3 }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const isConnectedUser = compareAddresses(account?.address ?? "", address)

  const { data: actionsData } = useUsersB3trActions(address, { direction: "DESC" })
  const lastActions = actionsData?.pages.map(page => page.data).flat() ?? []
  const lastActionsData = lastActions.slice(0, maxActions)

  const { data: overviewData } = useUserActionOverview(address)
  const lifetimeActions = overviewData?.actionsRewarded ?? 0
  const isFirstTime = lifetimeActions === 0

  if (!isConnectedUser) {
    return null
  }

  return (
    <Card.Root w={"full"} variant="primary">
      <Card.Body>
        <VStack gap={4} align="stretch">
          <VStack gap={2} align="stretch">
            <Heading size="xl">{t("Your better actions")}</Heading>
            <Text textStyle="sm" color="text.subtle">
              {t("Use Apps to earn B3TR tokens through your Better Actions")}
            </Text>
          </VStack>

          <VStack gap={6} align="stretch">
            {address ? (
              <>
                <UserSustainabilityOverviewStats address={address} />

                <LastSevenDaysSection address={address} />

                {renderActions && !isFirstTime && (
                  <>
                    <Box h="1px" bg="borders.secondary" mx={-6} />
                    <VStack gap={4} align="stretch">
                      <Heading size="sm" fontWeight="semibold">
                        {t("Recent actions")}
                      </Heading>
                      {lastActionsData.map(action => (
                        <BetterActionCard
                          key={`last-action-${action.appId}-${action.blockTimestamp}`}
                          amountB3tr={action.amount}
                          appId={action.appId}
                          blockNumber={action.blockNumber}
                          blockTimestamp={action.blockTimestamp}
                          proof={action.proof}
                        />
                      ))}
                      {lastActions.length > maxActions && (
                        <Link
                          mx="auto"
                          asChild
                          variant="plain"
                          color="actions.secondary.text-lighter"
                          fontWeight="semibold">
                          <NextLink href="/profile?tab=better-actions">{t("See all")}</NextLink>
                        </Link>
                      )}
                    </VStack>
                  </>
                )}
              </>
            ) : (
              <NoAccountActionCard />
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
