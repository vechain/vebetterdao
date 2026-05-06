import { Badge, Center, HStack, Icon, Skeleton, Spinner, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCoins } from "react-icons/lu"
import InfiniteScroll from "react-infinite-scroll-component"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useNavigatorFeeHistory } from "@/api/indexer/navigators/useNavigatorFeeHistory"
import { type FeeEntryStatus, getFeeEntryStatus } from "@/api/indexer/navigators/useNavigatorFeeStatus"
import { BaseModal } from "@/components/BaseModal"
import { EmptyState } from "@/components/ui/empty-state"

const formatter = getCompactFormatter(2)

type Props = {
  address: string
  isOpen: boolean
  onClose: () => void
}

const STATUS_COLORS: Record<FeeEntryStatus, "green" | "yellow" | "gray"> = {
  claimable: "green",
  locked: "yellow",
  claimed: "gray",
}

const STATUS_LABELS: Record<FeeEntryStatus, string> = {
  claimable: "Claimable",
  locked: "Locked",
  claimed: "Claimed",
}

const SCROLL_TARGET_ID = "fee-history-scroll"

export const NavigatorFeeHistoryModal = ({ address, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data, isLoading, fetchNextPage, hasNextPage } = useNavigatorFeeHistory(address)
  const { data: currentRoundStr } = useCurrentAllocationsRoundId()
  const currentRound = Number(currentRoundStr ?? 0)

  const entries = useMemo(() => data?.pages.flat() ?? [], [data])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Fee History")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <HStack gap={2}>
          <LuCoins size={18} />
          <Text textStyle="lg" fontWeight="semibold">
            {t("Fee History")}
          </Text>
          {entries.length > 0 && (
            <Text textStyle="sm" color="fg.muted">
              {t("{{count}} entries", { count: entries.length })}
            </Text>
          )}
        </HStack>

        {isLoading && (
          <VStack gap={3} align="stretch">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} h="60px" borderRadius="xl" />
            ))}
          </VStack>
        )}

        {!isLoading && entries.length === 0 && (
          <EmptyState
            title={t("No fee history")}
            description={t("No fees have been deposited yet.")}
            icon={
              <Icon boxSize={10} color="actions.secondary.text-lighter">
                <LuCoins />
              </Icon>
            }
          />
        )}

        {!isLoading && entries.length > 0 && (
          <VStack id={SCROLL_TARGET_ID} maxH="60vh" overflowY="auto" gap={0} align="stretch">
            <InfiniteScroll
              dataLength={entries.length}
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              scrollableTarget={SCROLL_TARGET_ID}
              loader={
                <Center py={4}>
                  <Spinner size="md" />
                </Center>
              }>
              {entries.map(entry => {
                const status = getFeeEntryStatus(entry, currentRound)
                return (
                  <HStack
                    key={entry.roundId}
                    justify="space-between"
                    py={3}
                    borderBottomWidth="1px"
                    borderColor="border.primary"
                    _last={{ borderBottomWidth: 0 }}
                    flexWrap="wrap"
                    gap={2}>
                    <VStack align="start" gap={0}>
                      <Text textStyle="sm" fontWeight="semibold">
                        {t("Round")}
                        {" #"}
                        {entry.roundId}
                      </Text>
                      <Text textStyle="xs" color="fg.muted">
                        {new Date(entry.depositedAt * 1000).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </VStack>
                    <HStack gap={3}>
                      <Text textStyle="sm" fontWeight="semibold">
                        {formatter.format(entry.totalDepositedFormatted)} {"B3TR"}
                      </Text>
                      <Badge colorPalette={STATUS_COLORS[status]} size="sm">
                        {t(STATUS_LABELS[status])}
                      </Badge>
                    </HStack>
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
