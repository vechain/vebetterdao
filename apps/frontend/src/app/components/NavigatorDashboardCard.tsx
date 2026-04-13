import { Badge, Card, Heading, HStack, IconButton, Image, Skeleton, Stat, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { useGetTotalDelegatedAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetTotalDelegatedAtTimepoint"
import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import {
  type NavigatorStatusValue,
  useNavigatorStatus,
} from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
import { useCurrentRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useCurrentRoundSnapshot"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"

const formatter = getCompactFormatter(2)

const statusColor: Record<NavigatorStatusValue, string> = {
  NONE: "gray",
  ACTIVE: "green",
  EXITING: "yellow",
  DEACTIVATED: "red",
}

export const NavigatorDashboardCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { data: isNavigator } = useIsNavigator()
  const { data: status } = useNavigatorStatus()
  const { data: nav, isLoading: navLoading } = useNavigatorByAddress(account?.address ?? "")
  const { data: snapshot } = useCurrentRoundSnapshot()
  const { data: delegatedAtSnapshot } = useGetTotalDelegatedAtTimepoint(account?.address ?? "", snapshot ?? undefined)

  const delegationChange = useMemo(() => {
    if (!nav || !delegatedAtSnapshot) return null
    const prev = Number(delegatedAtSnapshot.scaled)
    const curr = Number(nav.totalDelegatedFormatted)
    if (prev === 0) return curr > 0 ? 100 : null
    return ((curr - prev) / prev) * 100
  }, [nav, delegatedAtSnapshot])

  if (!isNavigator || !account?.address) return null

  const capacity = formatter.format(Number(nav?.stakeFormatted ?? 0) * 10)
  const delegated = formatter.format(Number(nav?.totalDelegatedFormatted ?? 0))
  const staked = formatter.format(Number(nav?.stakeFormatted ?? 0))
  const citizens = nav?.citizenCount ?? 0

  return (
    <Card.Root w="full" variant="primary">
      <Card.Body>
        <VStack gap="4" align="flex-start" w="full">
          <HStack justifyContent="space-between" w="full">
            <HStack gap={2}>
              <Heading size="xl">{t("Navigators")}</Heading>
              {(status === "EXITING" || status === "DEACTIVATED") && (
                <Badge colorPalette={statusColor[status]} size="sm">
                  {status}
                </Badge>
              )}
            </HStack>

            <IconButton
              rounded="full"
              variant="surface"
              aria-label="Go to Navigator"
              width="6"
              onClick={() => router.push(`/navigators/${account.address}`)}>
              <FiArrowUpRight />
            </IconButton>
          </HStack>

          <VStack gap="4" w="full" align="flex-start">
            <Skeleton loading={navLoading} w="full">
              <Stat.Root>
                <Stat.Label>{t("Total Staked")}</Stat.Label>
                <Stat.ValueText>
                  <HStack>
                    <Image aspectRatio="square" w="6" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
                    <Heading size="2xl" color="text.default">
                      {staked}
                    </Heading>
                  </HStack>
                </Stat.ValueText>
              </Stat.Root>
            </Skeleton>

            <Skeleton loading={navLoading} w="full">
              <Stat.Root>
                <Stat.Label>{t("Delegated")}</Stat.Label>
                <HStack alignItems="center" justifyContent="space-between">
                  <Stat.ValueText textStyle="md">
                    {`${delegated} ${t("VOT3")} (${t("cap")}: ${capacity})`}
                  </Stat.ValueText>
                  {delegationChange !== null && (
                    <Stat.HelpText
                      color={delegationChange >= 0 ? "status.positive.primary" : "status.negative.primary"}>
                      {delegationChange >= 0 ? "+" : ""}
                      {formatter.format(delegationChange)}
                      {"% than "}
                      {t("round start")}
                    </Stat.HelpText>
                  )}
                </HStack>
              </Stat.Root>
            </Skeleton>

            <Skeleton loading={navLoading} w="full">
              <Stat.Root>
                <Stat.Label>{t("Citizens")}</Stat.Label>
                <Stat.ValueText textStyle="md">{citizens}</Stat.ValueText>
              </Stat.Root>
            </Skeleton>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
