import { useSustainabilityActions } from "@/api"
import { BaseModal } from "@/components/BaseModal"
import { BetterActionCard } from "@/components/TransactionCard/cards/BetterActionCard"
import { Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import dayjs from "dayjs"
import { useEffect } from "react"

type Props = {
  isOpen: boolean
  onClose: () => void
  date?: string
}

export const ActivityDayModal = ({ isOpen, onClose, date }: Props) => {
  const { account } = useWallet()

  //get unix timestamps for the start and end of the day
  const startOfDay = dayjs(date).startOf("day").unix()
  const endOfDay = dayjs(date).endOf("day").unix()

  const actionsOfDayQuery = useSustainabilityActions({ wallet: account ?? "", after: startOfDay, before: endOfDay })

  useEffect(() => {
    // Fetch until there are no more pages left
    const fetchAllPages = async () => {
      while (actionsOfDayQuery.hasNextPage && !actionsOfDayQuery.isFetchingNextPage) {
        await actionsOfDayQuery.fetchNextPage()
      }
    }

    fetchAllPages()
  }, [actionsOfDayQuery])

  const flatActions = actionsOfDayQuery.data?.pages.map(page => page.data).flat() ?? []

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={`ActivityDayModal for ${date}`}
      ariaDescription={`ActivityDayModal for ${date}`}>
      <VStack spacing={3} align="stretch">
        <Text fontWeight="600" color="#848484">
          {dayjs(date).format("MMMM D YYYY").toUpperCase()}
        </Text>
        {flatActions.map((action, index) => (
          <BetterActionCard key={index} action={action} />
        ))}
      </VStack>
    </BaseModal>
  )
}
