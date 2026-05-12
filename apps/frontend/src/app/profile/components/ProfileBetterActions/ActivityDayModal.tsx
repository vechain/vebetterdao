import { Center, Spinner, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import InfiniteScroll from "react-infinite-scroll-component"

import { BaseModal } from "@/components/BaseModal"

import { useUsersB3trActions } from "../../../../api/indexer/actions/useUsersB3trActions"
import { BetterActionCard } from "../../../../components/TransactionCard/cards/BetterActionCard/BetterActionCard"

type Props = {
  isOpen: boolean
  onClose: () => void
  date?: string
  address: string
}
export const ActivityDayModal = ({ address, isOpen, onClose, date }: Props) => {
  //get unix timestamps for the start and end of the day
  const startOfDay = date ? dayjs(date).startOf("day").unix() : undefined
  const endOfDay = date ? dayjs(date).endOf("day").unix() : undefined
  const { data, fetchNextPage, hasNextPage } = useUsersB3trActions(address, {
    ...(startOfDay && { after: startOfDay }),
    ...(endOfDay && { before: endOfDay }),
  })
  const actions = data?.pages.map(page => page.data).flat() ?? []
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={`ActivityDayModal for ${date}`}
      ariaDescription={`ActivityDayModal for ${date}`}
      modalContentProps={{ maxH: "80vh" }}
      modalBodyProps={{
        overflowY: "auto",
        scrollbarWidth: "none",
        css: { "&::-webkit-scrollbar": { display: "none" } },
      }}>
      <VStack gap={3} align="stretch">
        <Text fontWeight="semibold" color="#848484">
          {dayjs(date).format("MMMM D YYYY").toUpperCase()}
        </Text>
        <InfiniteScroll
          dataLength={actions.length}
          next={fetchNextPage}
          hasMore={!!hasNextPage}
          style={{ overflow: "hidden" }}
          loader={
            <Center>
              <Spinner size="md" mt={4} alignSelf="center" />
            </Center>
          }>
          <VStack gap="4">
            {actions.map(action => (
              <BetterActionCard
                key={`action-day-${action.appId}-${action.blockTimestamp}-${action.blockNumber}`}
                amountB3tr={action.amount}
                appId={action.appId}
                blockNumber={action.blockNumber}
                blockTimestamp={action.blockTimestamp}
                proof={action.proof}
              />
            ))}
          </VStack>
        </InfiniteScroll>
      </VStack>
    </BaseModal>
  )
}
