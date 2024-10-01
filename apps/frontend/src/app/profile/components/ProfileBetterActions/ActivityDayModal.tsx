import { useSustainabilityActions } from "@/api"
import { BaseModal } from "@/components/BaseModal"
import { BetterActionCard } from "@/components/TransactionCard/cards/BetterActionCard"
import { Box, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import dayjs from "dayjs"

type Props = {
  isOpen: boolean
  onClose: () => void
  date?: string
}

export const ActivityDayModal = ({ isOpen, onClose, date }: Props) => {
  const { account } = useWallet()
  const { data } = useSustainabilityActions({ wallet: account ?? "" })

  const flatActions = data?.pages.map(page => page.data).flat() ?? []
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={`ActivityDayModal for ${date}`}
      ariaDescription={`ActivityDayModal for ${date}`}>
      <VStack spacing={3} align="stretch">
        <Box>
          <Text fontWeight="600" color="#848484">
            {dayjs(date).format("MMMM D YYYY").toUpperCase()}
          </Text>
          <Text fontSize="sm" color="#6A6A6A" fontWeight={400}>
            {"TODO: Need to implement actions per day"}
          </Text>
        </Box>
        {flatActions.map((action, index) => (
          <BetterActionCard key={index} action={action} />
        ))}
      </VStack>
    </BaseModal>
  )
}
