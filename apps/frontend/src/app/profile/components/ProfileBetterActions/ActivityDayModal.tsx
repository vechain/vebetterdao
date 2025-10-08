import { useUsersB3trActions } from "@/api"
import { BaseModal } from "@/components/BaseModal"
import { BetterActionCard } from "@/components/TransactionCard/cards/BetterActionCard"
import { Center, Spinner, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import InfiniteScroll from "react-infinite-scroll-component"

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
      modalBodyProps={{ maxH: "80vh", overflowY: "auto" }}>
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
        </InfiniteScroll>
      </VStack>
    </BaseModal>
  )
}
