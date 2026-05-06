import { Center, HStack, Icon, Link, Skeleton, Spinner, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuArrowDownLeft, LuArrowRight, LuArrowUpRight, LuExternalLink } from "react-icons/lu"
import InfiniteScroll from "react-infinite-scroll-component"

import { DelegationEventFormatted, useNavigatorDelegations } from "@/api/indexer/navigators/useNavigatorDelegations"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture/AddressWithProfilePicture"
import { BaseModal } from "@/components/BaseModal"
import Vot3Svg from "@/components/Icons/svg/vot3-icon.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

const formatter = getCompactFormatter(2)

const getEventLabel = (eventType: DelegationEventFormatted["eventType"], isPositive: boolean) => {
  if (eventType === "B3TR_DelegationCreated") return "Created new delegation"
  if (eventType === "B3TR_DelegationRemoved") return "Exited delegation"
  return isPositive ? "Increased delegation" : "Decreased delegation"
}

type Props = {
  address?: string
  isOpen: boolean
  onClose: () => void
}

const SCROLL_TARGET_ID = "delegation-history-scroll"

export const NavigatorDelegationsModal = ({ address, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data, isLoading, fetchNextPage, hasNextPage } = useNavigatorDelegations(address ? { navigator: address } : {})

  const events = useMemo(() => data?.pages.flat() ?? [], [data])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Delegation History")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <Text textStyle="lg" fontWeight="semibold">
          {t("Delegation History")}
        </Text>

        {isLoading && (
          <VStack gap={3} align="stretch">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} h="60px" borderRadius="xl" />
            ))}
          </VStack>
        )}

        {!isLoading && events.length === 0 && (
          <EmptyState
            title={t("No delegation activity")}
            description={t("No delegation events found for this navigator.")}
            icon={
              <Icon boxSize={10} color="actions.secondary.text-lighter">
                <Vot3Svg />
              </Icon>
            }
          />
        )}

        {!isLoading && events.length > 0 && (
          <VStack
            id={SCROLL_TARGET_ID}
            maxH={{ base: "none", md: "60vh" }}
            overflowY={{ base: "visible", md: "auto" }}
            gap={0}
            align="stretch">
            <InfiniteScroll
              dataLength={events.length}
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              scrollableTarget={SCROLL_TARGET_ID}
              loader={
                <Center py={4}>
                  <Spinner size="md" />
                </Center>
              }>
              {events.map((event, i) => {
                const deltaNum = Number(event.deltaFormatted)
                const isPositive = event.eventType === "B3TR_DelegationRemoved" ? false : deltaNum >= 0
                const label = getEventLabel(event.eventType, isPositive)

                return (
                  <HStack
                    key={`${event.txId}-${i}`}
                    align="start"
                    py={3}
                    borderBottomWidth="1px"
                    borderColor="border.primary"
                    _last={{ borderBottomWidth: 0 }}
                    gap={3}>
                    <HStack
                      justify="center"
                      align="center"
                      w="8"
                      h="8"
                      rounded="full"
                      bg={isPositive ? "status.positive.subtle" : "status.negative.subtle"}
                      color={isPositive ? "status.positive.primary" : "status.negative.primary"}
                      flexShrink={0}>
                      {isPositive ? <LuArrowDownLeft size={16} /> : <LuArrowUpRight size={16} />}
                    </HStack>

                    <VStack gap={1} align="start" flex={1} minW={0}>
                      <HStack justify="space-between" w="full">
                        <Text textStyle="sm" fontWeight="semibold" truncate>
                          {t(label)}
                        </Text>
                        <Text
                          textStyle="sm"
                          fontWeight="semibold"
                          flexShrink={0}
                          color={isPositive ? "status.positive.primary" : "status.negative.primary"}>
                          {isPositive ? "+" : "-"}
                          {formatter.format(Math.abs(deltaNum))} {"VOT3"}
                        </Text>
                      </HStack>

                      <HStack justify="space-between" w="full">
                        <HStack gap={2} flexWrap="wrap" minW={0}>
                          <AddressWithProfilePicture address={event.citizen} />
                          {!address && (
                            <>
                              <LuArrowRight size={12} />
                              <AddressWithProfilePicture address={event.navigator} />
                            </>
                          )}
                          <Link href={getExplorerTxLink(event.txId)} target="_blank" rel="noopener noreferrer">
                            <LuExternalLink size={10} />
                          </Link>
                        </HStack>
                        <Text textStyle="xs" color="fg.muted" flexShrink={0}>
                          {new Date(event.blockTimestamp * 1000).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                )
              })}
            </InfiniteScroll>
          </VStack>
        )}
      </VStack>
    </BaseModal>
  )
}
