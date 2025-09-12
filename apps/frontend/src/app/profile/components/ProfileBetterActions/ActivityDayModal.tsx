import { useSustainabilityActions } from "@/api"
import { BaseModal } from "@/components/BaseModal"
import { BetterActionCard } from "@/components/TransactionCard/cards/BetterActionCard"
import { Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useEffect } from "react"

type Props = {
  isOpen: boolean
  onClose: () => void
  date?: string
  address: string
}

export const ActivityDayModal = ({ address, isOpen, onClose, date }: Props) => {
  //get unix timestamps for the start and end of the day
  const startOfDay = dayjs(date).startOf("day").unix()
  const endOfDay = dayjs(date).endOf("day").unix()

  const actionsOfDayQuery = useSustainabilityActions({
    wallet: address,
    after: startOfDay,
    before: endOfDay,
  })

  useEffect(() => {
    // Fetch until there are no more pages left
    const fetchAllPages = async () => {
      while (actionsOfDayQuery.hasNextPage && !actionsOfDayQuery.isFetchingNextPage) {
        await actionsOfDayQuery.fetchNextPage()
      }
    }

    fetchAllPages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOfDay, endOfDay])

  const flatActions = actionsOfDayQuery.data?.pages.map(page => page.data).flat() ?? []

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={`ActivityDayModal for ${date}`}
      ariaDescription={`ActivityDayModal for ${date}`}
      modalBodyProps={{ maxH: "80vh", overflowY: "auto" }}>
      <VStack gap={3} align="stretch">
        <Text fontWeight="600" color="#848484">
          {dayjs(date).format("MMMM D YYYY").toUpperCase()}
        </Text>
        {flatActions.map(action => (
          <BetterActionCard
            key={`action-day-${action.appId}-${action.blockTimestamp}`}
            amountB3tr={action.amount}
            appId={action.appId}
            blockNumber={action.blockNumber}
            blockTimestamp={action.blockTimestamp}
            proof={action.proof}
          />
        ))}
      </VStack>
    </BaseModal>
  )
}
